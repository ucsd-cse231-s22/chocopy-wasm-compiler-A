import { Program, Stmt, Expr, Value, Class, VarInit, FunDef } from "./ir"
import { BinOp, Type, UniOp } from "./ast"
import { BOOL, NONE, ELLIPSIS, NUM, FLOAT } from "./utils";
import { errorMonitor } from "events";

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
  newEnv: GlobalEnv
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
  definedVars.add("$scratch");
  definedVars.forEach(env.locals.add, env.locals);
  const localDefines = makeLocals(definedVars);
  const globalNames : string[] = [];
  ast.inits.forEach(init => {
    globalNames.push(init.name);
  })
  console.log(ast.inits, globalNames);
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
      if (stmt.value.tag === "load" && stmt.a.tag === "float") {
        var ret: string[] = [];
        ret.push(`(i32.const 4)`);
        ret.push(`(call $alloc)`);
        ret.push(`(local.set $$scratch)`);
        ret.push(`(local.get $$scratch)`);
        ret.push(`(local.get $$scratch)`);
        ret.push(`(i32.const 0)`)

        ret = ret.concat(valStmts)

        ret.push(`(call $store_float)`);

    

        valStmts = ret
      }

    //     if (stmt.a.tag === "float") {
    //       var ret: string[] = [];
    //       if (env.locals.has(stmt.name)) {
    //         ret = ret.concat([`(local.get $${stmt.name})`]);
    //       } else {
    //         ret = ret.concat([`(global.get $${stmt.name})`]);
    //       }
    //       ret = ret.concat([`(i32.const 0)`]);
    //       ret = ret.concat(valStmts);
    //       ret = ret.concat([`(call $store_float)`]); 
    //     return ret
    //   }
    // }
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
      var lhsStmts = codeGenValue(expr.left, env);
      var rhsStmts = codeGenValue(expr.right, env);
      if (expr.left.a.tag === "float"){
        lhsStmts = lhsStmts.concat(`(i32.const 0)`)
        lhsStmts = lhsStmts.concat([`(call $load_float);; load left`]);
        rhsStmts = rhsStmts.concat(`(i32.const 0)`)
        rhsStmts = rhsStmts.concat([`(call $load_float);; load right`]);
        if (expr.a.tag === "float"){
          var ret : string[] = [];
          ret.push(`(i32.const 4)`);
          ret.push(`(call $alloc)`);
          ret.push(`(local.set $$scratch)`);
          ret.push(`(local.get $$scratch)`);
          ret.push(`(local.get $$scratch);; store new`);
          ret.push(`(i32.const 0)`)
          ret = ret.concat([...lhsStmts, ...rhsStmts, codeGenBinOp(expr.op, expr.left.a)]);
          ret.push(`(call $store_float)`);
          // ret.push(`(local.get $$scratch)`);

          return ret;
        }
      }
      return [...lhsStmts, ...rhsStmts, codeGenBinOp(expr.op, expr.left.a)] // Assume that expr.left.a===expr.right.a

    case "uniop":
      var exprStmts = codeGenValue(expr.expr, env);
      switch(expr.op){
        case UniOp.Neg:
          if(expr.expr.a.tag === "float"){
            exprStmts = exprStmts.concat(`(i32.const 0)`)
            exprStmts = exprStmts.concat([`(call $load_float)`])
            var ret: string[] = [];
            ret.push(`(i32.const 4)`);
            ret.push(`(call $alloc)`);
            ret.push(`(local.set $$scratch)`);
            ret.push(`(local.get $$scratch)`);
            ret.push(`(local.get $$scratch)`);
            ret.push(`(i32.const 0)`)
            ret = ret.concat([`(f32.const 0)`, ...exprStmts, `(f32.sub)`]);
            ret.push(`(call $store_float)`);
            // ret.push(`(local.get $$scratch)`);

            return ret;

          }
          return[`(i32.const 0)`, ...exprStmts, `(i32.sub)`];
        case UniOp.Not:
          return [`(i32.const 0)`, ...exprStmts, `(i32.eq)`];
      }

    case "builtin1":
      var argTyp = expr.a;
      const argStmts = codeGenValue(expr.arg, env);
      var callName = expr.name;
      // if (expr.name === "print" && argTyp === NUM) {
      //   callName = "print_num";
      // } else if (expr.name === "print" && argTyp === BOOL) {
      //   callName = "print_bool";
      // } else if (expr.name === "print" && argTyp === NONE) {
      //   callName = "print_none";
      // }
      // if (expr.name === "print" && argTyp === NUM) {
      //   callName = "print_num";
      // } else if (expr.name === "print" && argTyp === BOOL) {
      //   callName = "print_bool";
      // } else if (expr.name === "print" && argTyp === NONE) {
      //   callName = "print_none";
      // } else if (expr.name === "print" && argTyp === ELLIPSIS) {
      //   callName = "print_ellipsis";
      // }
      return argStmts.concat([`(call $${callName})`]);

    case "builtin2":
      const leftStmts = codeGenValue(expr.left, env);
      const rightStmts = codeGenValue(expr.right, env);
      return [...leftStmts, ...rightStmts, `(call $${expr.name})`]

    case "builtinarb":
      var argTyp = expr.a;
      var argsStmts:Array<string> = [";;call builtin function\n"]
      var callName = expr.name;
      
      
      if (expr.name === "print"){
        expr.args.forEach(arg => {
          argsStmts = argsStmts.concat(codeGenValue(arg, env));
          switch (arg.a) {
            case NUM:
              argsStmts = argsStmts.concat([`(call $print_num)`]);
              argsStmts = argsStmts.concat([`(drop)`]);
              break;
            case BOOL:
              argsStmts = argsStmts.concat([`(call $print_bool)`]);
              argsStmts = argsStmts.concat([`(drop)`]);
              break;
            case NONE:
              argsStmts = argsStmts.concat([`(call $print_none)`]);
              argsStmts = argsStmts.concat([`(drop)`]);
              break;
            case ELLIPSIS:
              argsStmts = argsStmts.concat([`(call $print_ellipsis)`]);
              argsStmts = argsStmts.concat([`(drop)`]);
              break;
            case FLOAT:
              argsStmts = argsStmts.concat(`(i32.const 0)`)
              argsStmts = argsStmts.concat([`(call $load_float)`]);
              argsStmts = argsStmts.concat([`(call $print_float)`]);
              argsStmts = argsStmts.concat([`(drop)`]);
              break;
            default:
              break;
          }
        });
        argsStmts = argsStmts.concat([`(i32.const 0)`]);
        callName = "print_newline"
        // argsStmts = argsStmts.concat([`(call $${callName})`]);
      }
      // return argsStmts

      return argsStmts.concat([`(call $${callName})`]);


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
      if(expr.start.a.tag === "float"){
        return [
          ...codeGenValue(expr.start, env),
          `call $assert_not_none`,
          ...codeGenValue(expr.offset, env),
          `call $load_float`
        ]
      }
      
      return [
        ...codeGenValue(expr.start, env),
        `call $assert_not_none`,
        ...codeGenValue(expr.offset, env),
        `call $load`
      ]
  }
}

function codeGenValue(val: Value<Type>, env: GlobalEnv): Array<string> {
  switch (val.tag) {
    case "num":
      return ["(i32.const " + val.value + ")"];
    case "wasmint":
      return ["(i32.const " + val.value + ")"];
    case "float":
      const returnVal : string[] = [];
      returnVal.push(`(i32.const 4)`);
      returnVal.push(`(call $alloc)`);
      returnVal.push(`(local.set $$scratch)`);
      if (val.value === Infinity){
        returnVal.push(`(local.get $$scratch)`);
        returnVal.push(`(i32.const 0)`)
        returnVal.push(`(f32.const inf)`);
        returnVal.push(`(call $store_float)`);
        // returnVal.push(`(f32.const inf)`);
      }
      else if (val.value === NaN){
        returnVal.push(`(local.get $$scratch)`);
        returnVal.push(`(i32.const 0)`)
        returnVal.push(`(f32.const nan)`);
        returnVal.push(`(call $store_float)`);
        // returnVal.push(`(f32.const nan)`);
      }
      else {
        returnVal.push(`(local.get $$scratch)`);
        returnVal.push(`(i32.const 0)`)
        returnVal.push("(f32.const " + val.value + ")");
        returnVal.push(`(call $store_float)`);
        // returnVal.push("(f32.const " + val.value + ")");
      }
      returnVal.push(`(local.get $$scratch)`);
      return returnVal;
    //   return ["(f32.const " + val.value + ")"];
    case "bool":
      return [`(i32.const ${Number(val.value)})`];
    case "none":
      return [`(i32.const 0)`];
    case "...":
      return [`(i32.const 0)`];
    case "id":
      if (env.locals.has(val.name)) {
        return [`(local.get $${val.name})`];
      } else {
        return [`(global.get $${val.name})`];
      }
  }
}

function codeGenBinOp(op : BinOp, tp:Type) : string {
  switch(op) {
    case BinOp.Plus:
      return tp.tag !== "float" ? "(i32.add)" : "(f32.add)"
    case BinOp.Minus:
      return tp.tag !== "float" ? "(i32.sub)" : "(f32.sub)"
    case BinOp.Mul:
      return tp.tag !== "float" ? "(i32.mul)" : "(f32.mul)"
    case BinOp.IDiv:
      return tp.tag !== "float" ? "(i32.div_s)" : "(f32.div)"
    case BinOp.Mod:
      return "(i32.rem_s)"
    case BinOp.Eq:
      return "(i32.eq)"
    case BinOp.Neq:
      return tp.tag !== "float" ? "(i32.ne)" : "(f32.ne)"
    case BinOp.Lte:
      return tp.tag !== "float" ? "(i32.le_s)" : "(f32.le)"
    case BinOp.Gte:
      return tp.tag !== "float" ? "(i32.ge_s)" : "(f32.ge)"
    case BinOp.Lt:
      return tp.tag !== "float" ? "(i32.lt_s)" : "(f32.lt)"
    case BinOp.Gt:
      return tp.tag !== "float" ? "(i32.gt_s)" : "(f32.gt)"
    case BinOp.Is:
      return tp.tag !== "float" ? "(i32.eq)": "(f32.eq)"
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
  definedVars.add("$scratch"); // for memory allocation
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
  const result = methods.map(method => codeGenDef(method, env));
  return result.flat();
  }
