import { Program, Stmt, Expr, Value, Class, VarInit, FunDef } from "./ir"
import { BinOp, Type, UniOp } from "./ast"
import {BOOL, NONE, NUM, STR} from "./utils";

export type GlobalEnv = {
  strings: Map<string, string>;
  globals: Map<string, boolean>;
  classes: Map<string, [Map<string, [number, Value<Type>]>, Map<string, number>, string]>;
  locals: Set<string>;
  labels: Array<string>;
  offset: number;
  vtable: Array<string>;
  classRange: Map<string, [number, number]>; // start and end index of the slice in vtable
}

export const emptyEnv : GlobalEnv = {
  strings: new Map(),
  globals: new Map(),
  classes: new Map(),
  locals: new Set(),
  labels: [],
  offset: 0,
  vtable: [],
  classRange: new Map(),
};

type CompileResult = {
  globals: string[],
  functions: string,
  mainSource: string,
  newEnv: GlobalEnv,
  vtable: string,
};

export function makeLocals(locals: Set<string>) : Array<string> {
  const localDefines : Array<string> = [];
  locals.forEach(v => {
    localDefines.push(`(local $${v} i32)`);
  });
  return localDefines;
}

export function compile(ast: Program<Type>, env: GlobalEnv) : CompileResult {
  const withDefines = env;

  const definedVars : Set<string> = new Set(); //getLocals(ast);
  definedVars.add("$last");
  definedVars.add("$selector");
  definedVars.forEach(env.locals.add, env.locals);
  const localDefines = makeLocals(definedVars);
  const globalStrNames : Array<string> = Array.from(env.strings.values());
  const globalNames = ast.inits.map(init => init.name);
  console.log(ast.inits, globalNames);
  const funs : Array<string> = [];
  ast.funs.forEach(f => {
    funs.push(codeGenDef(f, withDefines).join("\n"));
  });
  const classes : Array<string> = ast.classes.map(cls => codeGenClass(cls, withDefines)).flat();
  const allFuns = funs.concat(classes).join("\n\n");
  // const stmts = ast.filter((stmt) => stmt.tag !== "fun");
  var stringInits = Array.from(env.strings.keys()).map(v => codeGenStringLiteral(env.strings, v));
  stringInits = [].concat(...stringInits);
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
  const allCommands = [...localDefines, ...stringInits, ...inits, bodyCommands];
  withDefines.locals.clear();

  const methods : Array<string> = ast.classes.map(cls => codeGenMethod(cls, withDefines)).flat();
  const vtable = `
  (table ${env.vtable.length} funcref)
  (elem (i32.const 0) ${env.vtable.join(" ")})
  ${methods.join("\n")}
  `
  return {
    globals: [...globalStrNames, ...globalNames],
    functions: allFuns,
    mainSource: allCommands.join("\n"),
    newEnv: withDefines,
    vtable,
  };
}

function codeGenMethod(cls: Class<Type>, env: GlobalEnv) : Array<string> {
  const methods = [...cls.methods];
  const result = methods.filter(m => m.name!==`${cls.name}$__init__`).map(m => {
    var params = m.parameters.map(p => `(param $${p.name} i32)`).join(" ");
    return [...[`(type $type$${m.name} (func ${params} (result i32)))`], ...codeGenDef(m, env).flat()]
  });
  return result.flat()
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
      if (expr.left.a === STR) {
        return codeGenBinOpStr(expr.op, lhsStmts, rhsStmts);
      }
      else if(expr.left.a.tag === "list"){
        return codeGenConcatList(lhsStmts, rhsStmts);
      } 
      else {
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
      var argTyp = expr.arg.a;
      var argStmts = codeGenValue(expr.arg, env);
      var callName = expr.name;
      if (expr.name === "print" && argTyp === NUM) {
        callName = "print_num";
      } else if (expr.name === "print" && argTyp === BOOL) {
        callName = "print_bool";
      } else if (expr.name === "print" && argTyp === STR) {
        callName = "print_str";
      } else if (expr.name === "print" && argTyp === NONE) {
        callName = "print_none";
      } else if (expr.name === "len" && argTyp === STR) {
        callName = "len_str";
      } else if (expr.name === "len" && argTyp.tag === "list") {
        // argStmts = argStmts.concat([`(i32.const ${argTyp.listsize})`])  // this is the length of list
        callName = "len_list"
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

    case "alloc":
      return [
        ...codeGenValue(expr.amount, env),
        `call $alloc`
      ];
    case "load":
      if(expr.start.a.tag=="class"){
        return [
          ...codeGenValue(expr.start, env),
          `call $assert_not_none`,
          ...codeGenValue(expr.offset, env),
          `call $load`
        ]
      }
      else{
        return [
          ...codeGenValue(expr.start, env),
          ...codeGenValue(expr.start, env),
          `call $assert_not_none`,
          `(i32.const 0)`,
          `call $load`,
          ...codeGenValue(expr.offset, env),
          `call $assert_out_of_bound`,
          `call $load`
        ]
      }

    case "str-index":
      return [
        `(call $alloc (i32.const 2))`,
        `(local.set $$last)`,
        `(call $store (local.get $$last) (i32.const 0) (i32.const 1))`,
        `(local.get $$last)`,
        `(i32.const 1)`,
        ...codeGenValue(expr.start, env), // no alloc here
        ...codeGenValue(expr.offset, env),
        `(i32.add (i32.const 1))`,
        `(call $load)`,
        `(call $store)`,
        `(local.get $$last)`
      ];

    case "vtable":
      var valStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat();
      valStmts.push(`(call_indirect (type $type${env.vtable[expr.index]}) (i32.const ${expr.index}))`)
      return valStmts;
  }
}

function codeGenStringLiteral(strings : Map<string, string>, val : string) : Array<string> {
  let res = [
    `(call $alloc (i32.const ${val.length + 1}))`,
    `(global.set $${strings.get(val)})`,
    `(global.get $${strings.get(val)})`,
    `(i32.const 0)`,
    `(i32.const ${val.length})`,
    `(call $store)`
  ];
  for (let i = 1; i <= val.length; i++) {
    res = [
      ...res,
      `(global.get $${strings.get(val)})`,
      `(i32.const ${i})`,
      `(i32.const ${val.charCodeAt(i - 1)})`,
      `(call $store)`
    ]
  }
  return res;
}

function codeGenValue(val: Value<Type>, env: GlobalEnv): Array<string> {
  switch (val.tag) {
    case "num":
      return ["(i32.const " + val.value + ")"];
    case "wasmint":
      return ["(i32.const " + val.value + ")"];
    case "bool":
      return [`(i32.const ${Number(val.value)})`];
    case "str":
      if (env.strings.has(val.value)) {
        return [`(global.get $${env.strings.get(val.value)})`];
      } else {
        throw new Error("Compiler's cursed, go home");
      }
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

function GetStrLen(lhsStmts: string[]) : string[] {
  return [
    ...lhsStmts,
    `(i32.const 0)`,
    `(call $load)`
  ];
}

function AllocConcatStr(lhsStmts: string[], rhsStmts: string[]) : string[] {
  return [
    ...GetStrLen(lhsStmts),
    ...GetStrLen(rhsStmts),
    `(i32.add)`,
    `(i32.const 1)`,
    `(i32.add)`,
    `(call $alloc)`
  ];
}

function StoreConcatStr(lhsStmts: string[], rhsStmts: string[]) : string[] {
  return [
    `(local.get $$last)`,
    `(i32.const 0)`,
    ...GetStrLen(lhsStmts),
    ...GetStrLen(rhsStmts),
    `(i32.add)`,
    `(call $store)`,
    `(i32.add (local.get $$last) (i32.const 4))`,
    ...lhsStmts,
    ...GetStrLen(lhsStmts),
    `(call $copy)`,
    ...rhsStmts,
    ...GetStrLen(rhsStmts),
    `(call $copy)`,
    `(drop)`
  ];
}

function codeGenConcatList(lhsStmts: string[], rhsStmts: string[]): string[]{
  return [
    ...AllocConcatList(lhsStmts, rhsStmts),
    `(local.set $$last)`,
    ...StoreConcatList(lhsStmts, rhsStmts),
    `(local.get $$last)`
  ];
}

function AllocConcatList(lhsStmts: string[], rhsStmts: string[]) : string[] {
  return [
    ...GetListLen(lhsStmts),
    ...GetListLen(rhsStmts),
    `(i32.add)`,
    `(i32.const 1)`,
    `(i32.add)`,
    `(call $alloc)`
  ];
}

function GetListLen(Stmts: string[]): string[]{
  return [
    ...Stmts,
    `(i32.const 0)`,
    `(call $load)`
  ];
}

function StoreConcatList(lhsStmts: string[], rhsStmts: string[]) : string[] {
  return [
    `(local.get $$last)`,
    `(i32.const 0)`,
    ...GetListLen(lhsStmts),
    ...GetListLen(rhsStmts),
    `(i32.add)`,
    `(call $store)`,
    `(i32.add (local.get $$last) (i32.const 4))`,
    ...lhsStmts,
    ...GetListLen(lhsStmts),
    `(call $copy)`,
    ...rhsStmts,
    ...GetListLen(rhsStmts),
    `(call $copy)`,
    `(drop)`
  ];
}

function codeGenBinOpStr(op : BinOp, lhsStmts : string[], rhsStmts : string[]) : string[] {
  switch (op) {
    case BinOp.Plus:
      return [
        ...AllocConcatStr(lhsStmts, rhsStmts),
        `(local.set $$last)`,
        ...StoreConcatStr(lhsStmts, rhsStmts),
        `(local.get $$last)`
      ];
    case BinOp.Eq:
      return [...lhsStmts, ...rhsStmts, `(call $eq_str)`];
    case BinOp.Neq:
      return [...lhsStmts, ...rhsStmts, `(call $eq_str)`, `(i32.const 0)`, `(i32.eq)`];
    default:
      throw new Error(`Unsupported string operation: ${op}`);
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
  methods.forEach(method => method.name = `${cls.name}$${method.name}`);
  const result = methods.filter(m => m.name===`${cls.name}$__init__`).map(method => codeGenDef(method, env));
  return result.flat();
  }
