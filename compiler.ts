import { Program, Stmt, Expr, Value, Class, VarInit, FunDef } from "./ir"
import { Annotation, BinOp, Type, UniOp } from "./ast"
import { APPLY, BOOL, createMethodName, makeWasmFunType, NONE, NUM } from "./utils";
import { equalType } from "./type-check";
import { getTypeInfo } from "./memory";
import exp from "constants";

export type GlobalEnv = {
  globals: Map<string, boolean>;
  classes: Map<string, Map<string, [number, Value<Annotation>]>>;  
  classIndices: Map<string, number>;
  functionNames: Map<string, string>;
  locals: Set<string>;
  labels: Array<string>;
  offset: number;
  vtableMethods: Array<[string, number]>;
}

export const emptyEnv : GlobalEnv = { 
  globals: new Map(), 
  classes: new Map(),
  classIndices: new Map(), 
  functionNames: new Map(),
  locals: new Set(),
  labels: [],
  offset: 0,
  vtableMethods: [] 
};

type CompileResult = {
  globals: string[],
  functions: string,
  mainSource: string,
  newEnv: GlobalEnv
};

export function makeLocals(locals: Set<string>) : Array<string> {
  const localDefines : Array<string> = [];
  locals.forEach(v => {
    localDefines.push(`(local $${v} i32)`);
  });
  return localDefines;
}

export function compile(ast: Program<Annotation>, env: GlobalEnv) : CompileResult {
  const withDefines = env;

  const definedVars : Set<string> = new Set(); //getLocals(ast);
  definedVars.add("$last");
  definedVars.add("$selector");
  definedVars.add("$scratch"); // for memory allocation
  definedVars.forEach(env.locals.add, env.locals);
  const localDefines = makeLocals(definedVars);
  const globalNames = ast.inits.map(init => init.name);
  const funs : Array<string> = [];
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
  ast.inits.forEach(x => withDefines.globals.set(x.name, true));
  return {
    globals: globalNames,
    functions: allFuns,
    mainSource: allCommands.join("\n"),
    newEnv: withDefines
  };
}

function codeGenStmt(stmt: Stmt<Annotation>, env: GlobalEnv): Array<string> {
  switch (stmt.tag) {
    case "store":
      let post =  [
        ...codeGenValue(stmt.start, env),
        `(i32.add)`,
        `call $ref_lookup`,
        ...codeGenValue(stmt.offset, env),
        ...codeGenValue(stmt.value, env),
        `call $store`
      ]
      let pre = [`(i32.const 0)`]
      if (stmt.value.a && stmt.value.a.type && (stmt.value.a.type.tag === "class" || stmt.value.a.type.tag === "none")) {
        pre = [
          ...codeGenValue(stmt.start, env),
          `call $ref_lookup`,
          ...codeGenValue(stmt.offset, env),
          `(call $load)`, // load the ref number referred to by argument ref no. and the offset
          `(i32.const 0)`,
          `(i32.const -1) (call $traverse_update)`,
          `(i32.mul (i32.const 0))`, // hack to take top value of stack
          ...codeGenValue(stmt.value, env),
          `(i32.add)`, // hack to take top value of stack
          ...codeGenValue(stmt.start, env),
          `(i32.const 1) (call $traverse_update)`,
          `(i32.mul (i32.const 0))`
        ]
      }
      return pre.concat(post);

    case "assign":
      var valStmts = codeGenExpr(stmt.value, env);
      if ((stmt.value.a?.type?.tag === "class" || stmt.value.tag === "value" && stmt.value.value.tag === "none") && (stmt.value.tag !== "alloc") || (stmt.value?.tag === "value" && stmt.value.value.tag === "num")) { // if the assignment is object assignment
        valStmts.push(`(i32.const 0)`, `(i32.const 1)`, `(call $traverse_update)`) // update the count of the object on the RHS
        if (env.locals.has(stmt.name)) {
          return [`(local.get $${stmt.name})`, // update the count of the object on the LHS
          `(i32.const 0)`,
          `(i32.const -1)`, 
          `(call $traverse_update)`,
          `(local.set $${stmt.name})`].concat(valStmts).concat([`(local.set $${stmt.name})`]); 
        } else {
          return [`(global.get $${stmt.name})`,
          `(i32.const 0)`,
          `(i32.const -1)`,
          `(call $traverse_update)`,
          `(global.set $${stmt.name})`].concat(valStmts).concat([`(global.set $${stmt.name})`]); 
        }
      }
       else {
        // if (stmt.value.tag === "value" && stmt.value.value.tag === "num"){ 
        //   valStmts.push(`(i32.const 0)`, `(i32.const 1)`, `(call $traverse_update)`) // update the count of the object on the RHS
        // }
        if (env.locals.has(stmt.name)) {
          return valStmts.concat([`(local.set $${stmt.name})`]); 
        } else {
          return valStmts.concat([`(global.set $${stmt.name})`]); 
        }
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

function codeGenExpr(expr: Expr<Annotation>, env: GlobalEnv): Array<string> {
  switch (expr.tag) {
    case "value":
      return codeGenValue(expr.value, env)

    case "binop":
      const lhsStmts = codeGenValue(expr.left, env);
      const rhsStmts = codeGenValue(expr.right, env);
      return [...lhsStmts, ...rhsStmts, codeGenBinOp(expr.op)];

    case "uniop":
      const exprStmts = codeGenValue(expr.expr, env);
      switch(expr.op){
        case UniOp.Neg:
          // negate bignum length to indicate sign change
          return [
            ...exprStmts,
            `(local.set $$scratch)`, // bignum addr
            `(local.get $$scratch)`, // store addr
            `(call $ref_lookup)`,
            `(i32.const 0)`, // store offset
            `(i32.const 0)`, // 0 - len
            `(local.get $$scratch)`, // load addr
            `(call $ref_lookup)`,
            `(i32.const 0)`, // load offset
            `(call $load)`, // load bignum len
            `(i32.sub)`, // store val
            `(call $store)`,
            `(local.get $$scratch)`
          ];
        case UniOp.Not:
          return [`(i32.const 0)`, ...exprStmts, `(i32.eq)`];
      }

    case "builtin1":
      const argTyp = expr.a.type;
      const argStmts = codeGenValue(expr.arg, env);
      var callName = expr.name;
      if (expr.name === "print" && equalType(argTyp, NUM)) {
        callName = "print_num";
      } else if (expr.name === "print" && equalType(argTyp, BOOL)) {
        callName = "print_bool";
      } else if (expr.name === "print" && equalType(argTyp, NONE)) {
        callName = "print_none";
      }
      return argStmts.concat([`(call $${callName})`]);

    case "builtin2":
      const leftStmts = codeGenValue(expr.left, env);
      const rightStmts = codeGenValue(expr.right, env);
      return [...leftStmts, ...rightStmts, `(call $${expr.name})`]

    case "call":
      var valStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat();
      valStmts.push(`(call $${expr.name})`);
      // Not sure if plugging in the scope calls here is the best way to do this
      return [
        `(call $add_scope)`,
        ...valStmts,
        `(call $remove_scope)`
      ];

    case "call_indirect":
      var valStmts = codeGenExpr(expr.fn, env);
      var fnStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat();
      return [`(call $add_scope)`, ...fnStmts, ...valStmts, `(call_indirect (type ${makeWasmFunType(expr.arguments.length)}))`, `(call $remove_scope)`];

    case "alloc":
      if (expr.fixed) {
        return [
        ...codeGenValue(expr.amount, env),
        `(i32.const ${parseInt(expr.fixed.map(b => b ? 1: 0).reverse().join(""), 2)})`, //parseInt(binArr.reverse().join(""), 2)
        `(i32.const ${expr.fixed.length})`,
        `call $alloc`
        ]
      }
      let fields = [...env.classes.get(expr.a && expr.a.type && expr.a.type.tag === "class" && expr.a.type.name).values()];
      return [
        ...codeGenValue(expr.amount, env),
        `(i32.const ${getTypeInfo(fields.map(f => f[1]))})`,
        `(i32.const ${fields.length})`,
        `call $alloc`
      ];
    case "load":
      return [
        ...codeGenValue(expr.start, env),
        `call $ref_lookup`,
        ...codeGenValue(expr.offset, env),
        `call $load`
      ]
  }
}

function codeGenValue(val: Value<Annotation>, env: GlobalEnv): Array<string> {
  switch (val.tag) {
    case "num":
      var x = BigInt(val.value) // for division
      if (x === BigInt(0))
        return ["(i32.const 0)"]
      var n = 0
      var digits : Number[] = []
      while(x != BigInt(0)) {
          if (x < 0) {
            x *= BigInt(-1)
          }
          digits.push(Number(x & BigInt(0x7fffffff)))
          x = x / BigInt(1 << 31) 
          n = n + 1
      }
      n = n + 1 // store (n+1) blocks (n: number of digits)

      var i = 0
      var return_val : string[] = []
      
      return_val.push(`(i32.const ${n})`);
      return_val.push(`(i32.const 0)`)
      return_val.push(`(i32.const 1)`);
      return_val.push(`(call $alloc)`);
      return_val.push(`(local.set $$scratch)`);
      
      // store the bignum in (n+1) blocks
      // store number of blocks in the first block
      return_val.push(`(local.get $$scratch)`);
      return_val.push(`(call $ref_lookup)`);
      return_val.push(`(i32.const ${i})`);
      return_val.push(`(i32.const ${n-1})`);
      return_val.push(`call $store`); 
      
      i = i + 1;
      // store the digits in the rest of blocks
      for (i; i < n; i++) {
        return_val.push(`(local.get $$scratch)`);
        return_val.push(`(call $ref_lookup)`);
        return_val.push(`(i32.const ${i})`);
        return_val.push(`(i32.const ${digits[i-1]})`);
        return_val.push(`call $store`);    
      }
      return_val.push(`(local.get $$scratch)`)
      return return_val;
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
      return "(call $$add)"
    case BinOp.Minus:
      return "(call $$sub)"
    case BinOp.Mul:
      return "(call $$mul)"
    case BinOp.IDiv:
      return "(call $$div)"
    case BinOp.Mod:
      return "(call $$mod)"
    case BinOp.Eq:
      return "(call $$eq)"
    case BinOp.Neq:
      return "(call $$neq)"
    case BinOp.Lte:
      return "(call $$lte)"
    case BinOp.Gte:
      return "(call $$gte)"
    case BinOp.Lt:
      return "(call $$lt)"
    case BinOp.Gt:
      return "(call $$gt)"
    case BinOp.Is:
      return "(i32.eq)";
    case BinOp.And:
      return "(i32.and)"
    case BinOp.Or:
      return "(i32.or)"
  }
}

function codeGenInit(init : VarInit<Annotation>, env : GlobalEnv) : Array<string> {
  const value = codeGenValue(init.value, env);
  if (env.locals.has(init.name)) {
    return [...value, `(local.set $${init.name})`]; 
  } else {
    return [...value, `(global.set $${init.name})`]; 
  }
}

function codeGenDef(def : FunDef<Annotation>, env : GlobalEnv) : Array<string> {
  var definedVars : Set<string> = new Set();
  def.inits.forEach(v => definedVars.add(v.name));
  definedVars.add("$last");
  definedVars.add("$selector");
  definedVars.add("$scratch");
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
  return [`
  (func $${def.name} ${params} (result i32)
    ${locals}
    ${inits}
    ${bodyCommands}
    (i32.const 0)
    (return))`];
}

function codeGenClass(cls : Class<Annotation>, env : GlobalEnv) : Array<string> {
  const methods = [...cls.methods];
  methods.forEach(method => method.name = createMethodName(cls.name, method.name));
  const result = methods.map(method => codeGenDef(method, env));
  return result.flat();
  }