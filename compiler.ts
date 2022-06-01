import { Program, Stmt, Expr, Value, Class, VarInit, FunDef } from "./ir"
import { BinOp, ClassIndex, Type, UniOp } from "./ast"
import { BOOL, NONE, NUM, STR } from "./utils";

export type GlobalEnv = {
  globals: Map<string, boolean>;
  classes: Map<string, Map<string, [number, Value<Type>]>>;  
  locals: Set<string>;
  labels: Array<string>;
  offset: number;
  inheritanceTable: Array<ClassIndex<Type>>;
}

export const emptyEnv : GlobalEnv = { 
  globals: new Map(), 
  classes: new Map(),
  locals: new Set(),
  labels: [],
  offset: 0,
  inheritanceTable: []
};

type CompileResult = {
  globals: string[],
  functions: string,
  mainSource: string,
  newEnv: GlobalEnv
};

// var inheritanceTable: Array<ClassIndex<Type>> = [];

export function makeLocals(locals: Set<string>) : Array<string> {
  const localDefines : Array<string> = [];
  locals.forEach(v => {
    localDefines.push(`(local $${v} i32)`);
  });
  return localDefines;
}

function getTypeList(inheritance: Array<ClassIndex<Type>>, index: number) : Array<string> {
  let result: Array<string> = [];
  for (let i = 0; i < inheritance.length; i ++) {
    for (let j = index; j < inheritance[i].methods.length; j ++) {
      let newval = `(type ${inheritance[i].methodType[j]} (func`;
      let param = '';
      let ret = ' (result i32)';
      if (inheritance[i].methodParam[j][0] > 0) {
        param = ' (param ';
        for (let k = 0; k < inheritance[i].methodParam[j][0]; k ++) 
          param = param + 'i32 ';
        param = param + ')';
      }
      // }
      // if (inheritance[i].methodParam[j][1]) {
      //   ret = ' (result i32)';
      // }
      newval = newval + param + ret + '))';
      result.push(newval);
    }
    result = result.concat(getTypeList(inheritance[i].children, inheritance[i].methods.length));
  }

  return result;
}

function getFunList(tree: ClassIndex<Type>) : [Array<string>, number] {
  let result = tree.methods.map(methodname => `$${tree.methodClass[tree.methods.indexOf(methodname)]}$${methodname}`);
  let num = tree.methods.length;
  tree.children.forEach(child => {
    let [l, n] = getFunList(child);
    num += n;
    result = result.concat(l);
  })
  return [result, num];
}

function getTableList(inheritance: Array<ClassIndex<Type>>) : Array<string> {
  let result: Array<string> = [];
  let num = 0;
  let t = `(table `;
  let elem = [`(elem (i32.const 0) `];
  for (let i = 0; i < inheritance.length; i ++) {
    let [l, n] = getFunList(inheritance[i]);
    num += n;
    elem = elem.concat(l);
  }
  t += `${num} funcref)`;
  elem.push(')');
  result = [t, elem.join(" ")];
  return result;
}

export function compile(ast: Program<Type>, env: GlobalEnv) : CompileResult {
  const withDefines = env;

  const definedVars : Set<string> = new Set(); //getLocals(ast);
  definedVars.add("$last");
  definedVars.add("$selector");
  definedVars.forEach(env.locals.add, env.locals);
  const localDefines = makeLocals(definedVars);
  const globalNames = ast.inits.map(init => init.name);
  // console.log(ast.inits, globalNames);
  const funs : Array<string> = [];
  const typelist: Array<string> = getTypeList(ast.table, 0);
  const tablelist: Array<string> = getTableList(ast.table);
  if (ast.table.length != 0)
    env.inheritanceTable = ast.table;
  typelist.forEach(t => {
    funs.push(t);
  })
  tablelist.forEach(l => {
    funs.push(l);
  })
  ast.funs.forEach(f => {
    funs.push(codeGenDef(f, withDefines).join("\n"));
  });
  const classes : Array<string> = ast.classes.map(cls => codeGenClass(cls, withDefines)).flat();
  const allFuns = funs.concat(classes).join("\n\n");
  // const stmts = ast.filter((stmt) => stmt.tag !== "fun");
  const inits = ast.inits.map(init => codeGenInit(init, withDefines)).flat();
  withDefines.labels = ast.body.map(block => block.label);
  var bodyCommands = "(local.set $$selector (i32.const 0))\n"
  bodyCommands += "(loop $loop\n"

  var blockCommands = "(local.get $$selector)\n"
  blockCommands += `(br_table ${ast.body.map(block => block.label).join(" ")})`;
  ast.body.forEach(block => {
    blockCommands = `(block ${block.label}
              ${blockCommands}    
            ) ;; end ${block.label}
            ${block.stmts.map(stmt => codeGenStmt(stmt, withDefines).join('\n')).join('\n')}
            `
  })
  bodyCommands += blockCommands;
  bodyCommands += ") ;; end $loop"

  // const commandGroups = ast.stmts.map((stmt) => codeGenStmt(stmt, withDefines));
  const allCommands = [...localDefines, ...inits, bodyCommands];
  withDefines.locals.clear();
  return {
    globals: globalNames,
    functions: allFuns,
    mainSource: allCommands.join("\n"),
    newEnv: withDefines
  };
}

function codeGenStmt(stmt: Stmt<Type>, env: GlobalEnv): Array<string> {
  switch (stmt.tag) {
    case "store":
      return [
        ...codeGenValue(stmt.start, env),
        ...codeGenValue(stmt.offset, env),
        ...codeGenValue(stmt.value, env),
        `call $store`
      ]
    case "assign":
      var valStmts = codeGenExpr(stmt.value, env);
      if (env.locals.has(stmt.name)) {
        return valStmts.concat([`(local.set $${stmt.name})`]); 
      } else {
        return valStmts.concat([`(global.set $${stmt.name})`]); 
      }

    case "return":
      var valStmts = codeGenValue(stmt.value, env);
      valStmts.push("return");
      return valStmts;

    case "expr":
      var exprStmts = codeGenExpr(stmt.expr, env);
      return exprStmts.concat([`(local.set $$last)`]);

    case "pass":
      return []

    case "ifjmp":
      const thnIdx = env.labels.findIndex(e => e === stmt.thn);
      const elsIdx = env.labels.findIndex(e => e === stmt.els);

      return [...codeGenValue(stmt.cond, env), 
        `(if 
          (then
            (local.set $$selector (i32.const ${thnIdx}))
            (br $loop)
          ) 
          (else 
            (local.set $$selector (i32.const ${elsIdx}))
            (br $loop)
          )
         )`]

    case "jmp":
      const lblIdx = env.labels.findIndex(e => e === stmt.lbl);
      return [`(local.set $$selector (i32.const ${lblIdx}))`, `(br $loop)`]

  }
}

function codeGenExpr(expr: Expr<Type>, env: GlobalEnv): Array<string> {
  switch (expr.tag) {
    case "value":
      return codeGenValue(expr.value, env)

    case "binop":
      const lhsStmts = codeGenValue(expr.left, env);
      const rhsStmts = codeGenValue(expr.right, env);
      if (expr.left.a === STR && expr.right.a === STR &&
          (expr.op === BinOp.Eq || expr.op === BinOp.Neq)) {
        return [...lhsStmts, ...rhsStmts, `(call $iter_cmp)`,
          expr.op === BinOp.Neq ? `(i32.const 0)\n(i32.eq)` : ``]
      } else {
        return [...lhsStmts, ...rhsStmts, codeGenBinOp(expr.op)]
      }

    case "uniop":
      const exprStmts = codeGenValue(expr.expr, env);
      switch(expr.op){
        case UniOp.Neg:
          return [`(i32.const 0)`, ...exprStmts, `(i32.sub)`];
        case UniOp.Not:
          return [`(i32.const 0)`, ...exprStmts, `(i32.eq)`];
      }

    case "builtin1":
      const argTyp = expr.a;
      const argStmts = codeGenValue(expr.arg, env);
      var callName = expr.name;
      if (expr.name === "print") {
        switch (argTyp.tag) {
          case "number": {
            callName = "print_num";
            break;
          }
          case "bool": {
            callName = "print_bool";
            break;
          }
          case "str": {
            callName = "print_str";
            break;
          }
          case "none": {
            callName = "print_none";
            break;
          }
          default: {
            callName = "rte_printarg";
          }
        }
      }
      return argStmts.concat([`(call $${callName})`]);

    case "builtin2":
      const leftStmts = codeGenValue(expr.left, env);
      const rightStmts = codeGenValue(expr.right, env);
      return [...leftStmts, ...rightStmts, `(call $${expr.name})`]

    case "call":
      var valStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat();
      valStmts.push(`(call $${expr.name})`);
      return valStmts;

    case "methodcall":
      var valStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat();
      valStmts = valStmts.concat(codeGenValue(expr.arguments[0], env));
      valStmts.push(`i32.load`);
      valStmts.push(`(i32.add (i32.const ${getIndex(expr.name, expr.class, env.inheritanceTable)}))`);
      valStmts.push(`(call_indirect (type ${getType(expr.name, expr.class, env.inheritanceTable)}))`);
      return valStmts;
    case "alloc":
      return [
        ...codeGenValue(expr.amount, env),
        `call $alloc`
      ];
    case "load":
      if (!expr.list) {
        return [
          ...codeGenValue(expr.start, env),
          `call $assert_not_none`,
          ...codeGenValue(expr.offset, env),
          `call $load`
        ]
      } else {
        return [
          ...codeGenValue(expr.start, env),
          `call $assert_not_none`,
          `call $dup`,
          `call $len`,
          ...codeGenValue(expr.offset, env),
          `call $assert_valid_access`,
          `(i32.const 1)`,
          `(i32.add)`,
          `call $load`
        ]
      }
  }
}

function getIndex(methodname: string, classname: string, tree: Array<ClassIndex<Type>>) : number {
  for (let i = 0; i < tree.length; i ++) {
    if (tree[i].classname === classname) {
      return tree[i].methods.indexOf(methodname);
    }
    let x = getIndex(methodname, classname, tree[i].children);
    if (x !== -1)
      return x;
  }
  return -1;
}

function getType(methodname: string, classname: string, tree: Array<ClassIndex<Type>>) : string {
  for (let i = 0; i < tree.length; i ++) {
    if (tree[i].classname === classname) {
      return tree[i].methodType[tree[i].methods.indexOf(methodname)];
    }
    let x = getType(methodname, classname, tree[i].children);
    if (x !== "NOT FOUND")
      return x;
  }
  return "NOT FOUND";
}

function codeGenValue(val: Value<Type>, env: GlobalEnv): Array<string> {
  switch (val.tag) {
    case "num":
      return ["(i32.const " + val.value + ")"];
    case "wasmint":
      return ["(i32.const " + val.value + ")"];
    case "bool":
      return [`(i32.const ${Number(val.value)})`];
    case "none":
      return [`(i32.const 0)`];
    case "str":
      const strVal : Array<string> = [`(i32.const ${val.value.length + 1})`, `call $alloc`,
        `call $dup`, `(i32.const 0)`, `(i32.const ${val.value.length})`, `call $store`];
      for (let i = 0; i < val.value.length; i++) {
        strVal.push(`call $dup`, `(i32.const ${i + 1})`, `i32.const ${val.value.charCodeAt(i)}`, `call $store`);
      }
      return strVal;
    case "id":
      if (env.locals.has(val.name)) {
        return [`(local.get $${val.name})`];
      } else {
        return [`(global.get $${val.name})`];
      }
  }
}

function codeGenBinOp(op : BinOp) : string {
  switch(op) {
    case BinOp.Plus:
      return "(i32.add)"
    case BinOp.IterPlus:
      return "call $concat"
    case BinOp.Minus:
      return "(i32.sub)"
    case BinOp.Mul:
      return "(i32.mul)"
    case BinOp.IDiv:
      return "(i32.div_s)"
    case BinOp.Mod:
      return "(i32.rem_s)"
    case BinOp.Eq:
      return "(i32.eq)"
    case BinOp.Neq:
      return "(i32.ne)"
    case BinOp.Lte:
      return "(i32.le_s)"
    case BinOp.Gte:
      return "(i32.ge_s)"
    case BinOp.Lt:
      return "(i32.lt_s)"
    case BinOp.Gt:
      return "(i32.gt_s)"
    case BinOp.Is:
      return "(i32.eq)";
    case BinOp.And:
      return "(i32.and)"
    case BinOp.Or:
      return "(i32.or)"
  }
}

function codeGenInit(init : VarInit<Type>, env : GlobalEnv) : Array<string> {
  const value = codeGenValue(init.value, env);
  if (env.locals.has(init.name)) {
    return [...value, `(local.set $${init.name})`]; 
  } else {
    return [...value, `(global.set $${init.name})`]; 
  }
}

function codeGenDef(def : FunDef<Type>, env : GlobalEnv) : Array<string> {
  var definedVars : Set<string> = new Set();
  def.inits.forEach(v => definedVars.add(v.name));
  definedVars.add("$last");
  definedVars.add("$selector");
  // def.parameters.forEach(p => definedVars.delete(p.name));
  definedVars.forEach(env.locals.add, env.locals);
  def.parameters.forEach(p => env.locals.add(p.name));
  env.labels = def.body.map(block => block.label);
  const localDefines = makeLocals(definedVars);
  const locals = localDefines.join("\n");
  const inits = def.inits.map(init => codeGenInit(init, env)).flat().join("\n");
  var params = def.parameters.map(p => `(param $${p.name} i32)`).join(" ");
  var bodyCommands = "(local.set $$selector (i32.const 0))\n"
  bodyCommands += "(loop $loop\n"

  var blockCommands = "(local.get $$selector)\n"
  blockCommands += `(br_table ${def.body.map(block => block.label).join(" ")})`;
  def.body.forEach(block => {
    blockCommands = `(block ${block.label}
              ${blockCommands}    
            ) ;; end ${block.label}
            ${block.stmts.map(stmt => codeGenStmt(stmt, env).join('\n')).join('\n')}
            `
  })
  bodyCommands += blockCommands;
  bodyCommands += ") ;; end $loop"
  env.locals.clear();
  return [`(func $${def.name} ${params} (result i32)
    ${locals}
    ${inits}
    ${bodyCommands}
    (i32.const 0)
    (return))`];
}

function codeGenClass(cls : Class<Type>, env : GlobalEnv) : Array<string> {
  const methods = [...cls.methods];
  methods.forEach(method => {
    method.name = `${cls.name}$${method.name}`;
  });
  const result = methods.map(method => method.nest || method.class === cls.name ? codeGenDef(method, env) : []);
  return result.flat();
}
