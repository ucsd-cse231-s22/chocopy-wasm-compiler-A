import { Program, Stmt, Expr, Value, Class, VarInit, FunDef, Vtable } from "./ir"
import { BinOp, Type, UniOp } from "./ast"
import { BOOL, NONE, NUM, STR } from "./utils";

export type GlobalEnv = {
  globals: Map<string, boolean>;
  classes: Map<string, Map<string, [number, Value<Type>]>>;  
  locals: Set<string>;
  labels: Array<string>;
  offset: number;
}

export const emptyEnv : GlobalEnv = { 
  globals: new Map(), 
  classes: new Map(),
  locals: new Set(),
  labels: [],
  offset: 0 
};

type CompileResult = {
  globals: string[],
  functions: string,
  mainSource: string,
  newEnv: GlobalEnv,
  vTable: string
};

export function makeLocals(locals: Set<string>) : Array<string> {
  const localDefines : Array<string> = [];
  locals.forEach(v => {
    localDefines.push(`(local $${v} i32)`);
  });
  return localDefines;
}

let classesdata: Class<Type>[] = [];
let typedata: Map<number, string>;
let object_init_defined :boolean = false;

export function getTypeSignature(params: number): string {

  if(typedata.has(params)) {
    return `(type $return_args_${params})`
  }
  var typeParamsArr = [];
  for(let i = 0; i < params; i++) {
    typeParamsArr.push(`(param i32)`);
  }
  var typeParams = typeParamsArr.join(" ");
  typedata.set(params, `(type $return_args_${params} (func ${typeParams} (result i32)))`);
  return `(type $return_args_${params})`;
}

export function compile(ast: Program<Type>, env: GlobalEnv) : CompileResult {
  const withDefines = env;
  classesdata = ast.classes;
  typedata = new Map();
  object_init_defined = false;

  const definedVars : Set<string> = new Set(); //getLocals(ast);
  definedVars.add("$last");
  definedVars.add("$selector");
  definedVars.forEach(env.locals.add, env.locals);
  const localDefines = makeLocals(definedVars);
  const globalNames = ast.inits.map(init => init.name);
  ast.strinits.forEach(init => globalNames.push(init.name));
  globalNames.push("$strload");
  globalNames.push("$sz1");
  globalNames.push("$sz2");
  globalNames.push("$addr");
  globalNames.push("$index");
  globalNames.push("$index1");
  globalNames.push("$addr1");
  globalNames.push("$addr2");
  globalNames.push("$condReturn");
  console.log(ast.inits, globalNames);
  const funs : Array<string> = [];
  ast.fundefs.forEach(f => {
    funs.push(codeGenDef(f, withDefines).join("\n"));
  });
  const classes : Array<string> = ast.classes.map(cls => codeGenClass(cls, withDefines)).flat();
  var allFuns = funs.concat(classes).join("\n\n");
  // const stmts = ast.filter((stmt) => stmt.tag !== "fun");
  const inits = ast.inits.map(init => codeGenInit(init, withDefines)).flat();
  const strinits = ast.strinits.map(init => codeGenInit(init, withDefines)).flat();
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
  const allCommands = [...localDefines, 
    ...strinits,
    ast.strstmts.map(stmt => codeGenStmt(stmt, withDefines).join('\n')).join('\n'), 
    ...inits,
    bodyCommands];
  withDefines.locals.clear();
  const typedInfo: string[] = [];
  typedata.forEach((data) => {
    typedInfo.push(data);
  });
  allFuns += typedInfo.join("\n");
  allFuns += "\n";
  return {
    globals: globalNames,
    functions: allFuns,
    mainSource: allCommands.join("\n"),
    newEnv: withDefines,
    vTable: codeGenVTable(ast.vtable)
  };
}

function codeGenVTable(vTable: Vtable) : string {
  let elems :string[] = [];
  let methodCnt = 0;
  vTable.forEach((methods, offset) => {
    elems.push(`(elem (i32.const ${offset}) ${methods.map((method) => `$${method[0]}$${method[1]}`).join(" ")})`);
    methodCnt += methods.length;
  });
  return [
    `(table ${methodCnt} funcref)`,
    ...elems,
  ].join("\n");
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
    case "list-store":
      return [
        ...codeGenValue(stmt.start, env),
        ...codeGenValue(stmt.offset, env),
        `(i32.const 1)`,
        `(i32.add)`,
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
    case "for":
      let iteratorStr = "";
      if (env.locals.has(stmt.iterator)) {
        iteratorStr =`(local.set $${stmt.iterator})`; 
      } else {
        iteratorStr = `(global.set $${stmt.iterator})`; 
      }
      const codeGenStmtStr = stmt.body.map(stmt => codeGenStmt(stmt, env).join("\n")).join("\n");
      return [
        ...codeGenValue(stmt.iterable, env),
        `(global.set $$addr)
        (global.get $$addr)
        (i32.const 0)
          (call $load)
          (global.set $$sz1)
          (i32.const 1)
          (global.set $$index)
          (
            loop $while
              (global.get $$index)
              (global.get $$sz1)
              (i32.le_s)
            (if
              (then
                  (global.get $$addr)
                  (global.get $$index)
                  (call $load)
                  ${iteratorStr}
                  ${codeGenStmtStr}
                  (global.get $$index)
                  (i32.const 1)
                  (i32.add)
                  (global.set $$index)
                br $while
              )
            )
          )`
      ];
  }
}

function codeGenExpr(expr: Expr<Type>, env: GlobalEnv): Array<string> {
  switch (expr.tag) {
    case "value":
      return codeGenValue(expr.value, env)

    case "binop":
      const lhsStmts = codeGenValue(expr.left, env);
      const rhsStmts = codeGenValue(expr.right, env);
      try {
      if ((expr.left.a.tag === "list" || expr.left.a.tag === "str") && expr.op === BinOp.Plus) {
        return [
          ...lhsStmts,
          `(global.set $$addr1)`,
          ...rhsStmts,
          `(global.set $$addr2)
          (global.get $$addr1)
          (i32.const 0)
          (call $load)
          (global.set $$sz1)
          (global.get $$addr2)
          (i32.const 0)
          (call $load)
          (global.set $$sz2)
          (global.get $$sz1)
          (i32.const 1)
          (i32.add)
          (global.get $$sz2)
          (i32.add)
          (call $alloc)
          (global.set $$addr)
          (i32.const 1)
          (global.set $$index)
          (
            loop $while
              (global.get $$index)
              (global.get $$sz1)
              (i32.le_s)
            (if
              (then
                  (global.get $$addr)
                  (global.get $$index)
                  (global.get $$addr1)
                  (global.get $$index)
                  (call $load)
                  (call $store)
                  (global.get $$index)
                  (i32.const 1)
                  (i32.add)
                  (global.set $$index)
                br $while
              )
            )
          )
          (global.get $$index)
          (global.set $$index1)
          (i32.const 1)
          (global.set $$index)
          (
            loop $while
              (global.get $$index)
              (global.get $$sz2)
              (i32.le_s)
            (if
              (then
                  (global.get $$addr)
                  (global.get $$index1)
                  (global.get $$addr2)
                  (global.get $$index)
                  (call $load)
                  (call $store)
                  (global.get $$index)
                  (i32.const 1)
                  (i32.add)
                  (global.set $$index)
                  (global.get $$index1)
                  (i32.const 1)
                  (i32.add)
                  (global.set $$index1)
                br $while
              )
            )
          )
          (global.get $$addr)
          (global.get $$addr)
          (i32.const 0)
          (global.get $$sz1)
          (global.get $$sz2)
          (i32.add)
          (call $store)`
        ];
      }
      }
      catch {
      }
      try {
        if ((expr.left.a.tag === "str") && expr.op === BinOp.Eq) {
          return [
            ...lhsStmts,
            ...rhsStmts,
            `(call $check_equal_str)`,
          ]
        }
      } catch {}
      try {
        if ((expr.left.a.tag === "str") && expr.op === BinOp.Neq) {
          return [
            `(i32.const 1)`,
            ...lhsStmts,
            ...rhsStmts,
            `(call $check_equal_str)`,
            `(i32.sub)`
          ]
        }
      } catch {}
      return [...lhsStmts, ...rhsStmts, codeGenBinOp(expr.op)]

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
      if (expr.name === "print" && argTyp === NUM) {
        callName = "print_num";
      } else if (expr.name === "print" && argTyp === BOOL) {
        callName = "print_bool";
      } else if (expr.name === "print" && argTyp === NONE) {
        callName = "print_none";
      } else if (expr.name === "print" && argTyp === STR) {
        callName = "print_str";
      } else if (expr.name === "len") {
        return argStmts.concat([
          `call $assert_not_none`,
          `(i32.const 0)`,
          `(call $load)`
        ]);
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

    case "call-indirect":
      var valStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat();
      if (expr.arguments.length -1 === 2) {
        console.log("HAHA CALL INDIRECT");
      } 
      valStmts.push(`(call_indirect ${getTypeSignature(expr.arguments.length-1)})`);
      return valStmts;

    case "alloc":
      return [
        ...codeGenValue(expr.amount, env),
        `call $alloc`
      ];
    case "load":
      return [
        ...codeGenValue(expr.start, env),
        `call $assert_not_none`,
        ...codeGenValue(expr.offset, env),
        `call $load`
      ]
    case "list-load":
      return [
        ...codeGenValue(expr.start, env),
        ...codeGenValue(expr.start, env),
        `call $assert_not_none`,
        ...codeGenValue({ tag: "wasmint", value: 0 }, env),
        `call $load`,
        ...codeGenValue(expr.offset, env),
        `call $assert_check_bounds`,
        ...codeGenValue(expr.offset, env),// add 1
        `(i32.const 1)`,
        `(i32.add)`,
        `call $load`
      ];
    case "str-load":
      return [
        ...codeGenValue(expr.start, env),
        `call $assert_not_none`,
        ...codeGenValue({ tag: "wasmint", value: 0 }, env),
        `call $load`,
        ...codeGenValue(expr.offset, env),
        `call $assert_check_bounds`,
        `(i32.const 2)`,
        `call $alloc`,
        `global.set $$strload`,
        `global.get $$strload`,
        `global.get $$strload`,
        `global.get $$strload`,
        `(i32.const 0)`,
        `(i32.const 1)`,
        `call $store`,
        `(i32.const 1)`,
        ...codeGenValue(expr.start, env),
        ...codeGenValue(expr.offset, env),// add 1
        `(i32.const 1)`,
        `(i32.add)`,
        `call $load`,
        `call $store`
      ];
    case "cond-expr":
      // return [...codeGenValue(expr.cond, env),
      // return [ 
      //   `(if 
      //     (then
      //       (i32.const 1)
      //       (call $print_num)
      //     ) 
      //     (else 
      //       (i32.const 2)
      //       (call $print_num)
      //     )
      // )`];
      return [...codeGenValue(expr.cond, env),
        `(if 
          (then
            ${codeGenValue(expr.ifobj, env).join("\n")}
            (global.set $$condReturn)
          ) 
          (else 
            ${codeGenValue(expr.elseobj, env).join("\n")}
            (global.set $$condReturn)
          )
      )
      (global.get $$condReturn)`];
  }
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
  if (def.name === "object$__init__" && object_init_defined) {
    return [];
  } else if (def.name === "object$__init__") {
    object_init_defined = true;
  }
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
  var typeParams = def.parameters.map(p => `(param i32)`).join(" ");
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
  return [
    `(func $${def.name} ${params} (result i32)
    ${locals}
    ${inits}
    ${bodyCommands}
    (i32.const 0)
    (return))`, def.fundefs.map(fun => codeGenDef(fun, env).join("\n")).join("\n")];
}

function codeGenClass(cls : Class<Type>, env : GlobalEnv) : Array<string> {
  const methods = [...cls.methods];
  methods.forEach(method => method.name = `${cls.name}$${method.name}`);
  const result = methods.map(method => codeGenDef(method, env));
  return result.flat();
  }
