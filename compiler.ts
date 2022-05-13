import { Program, Stmt, Expr, Value, Class, VarInit, FunDef } from "./ir"
import { BinOp, Type, UniOp } from "./ast"
import { BOOL, NONE, NUM } from "./utils";

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
  definedVars.forEach(env.locals.add, env.locals);
  const localDefines = makeLocals(definedVars);
  const globalNames = ast.inits.map(init => init.name);
  console.log(ast.inits, globalNames);
  const funs : Array<string> = [];
  ast.funs.forEach(f => {
    funs.push(codeGenDef(f, withDefines).join("\n"));
  });
  const classes : Array<string> = ast.classes.map(cls => codeGenClass(cls, withDefines)).flat();
  const setFUns : Array<string> = classes.concat(setUtilFuns());
  const allFuns = funs.concat(setFUns).join("\n\n");
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
    case "set":
      return [`
      (i32.const 10)
      (call $alloc)`];
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
  const result = methods.map(method => codeGenDef(method, env));
  return result.flat();
  }


  function setUtilFuns(): Array<string> {
    let setFunStmts: Array<string> = [];
  
    setFunStmts.push(
      ...[
        // Clear all set entries using a for loop
        // Set counter i to 0 and stop the loop when i equals 10 (hash size)
        "(func $set$clear (param $baseAddr i32) (result i32)",
        "(local $i i32)",
        "(loop $my_loop",

        // Find the address of the ith entry
        "(local.get $baseAddr)",
        "(local.get $i)",
        "(i32.mul (i32.const 4))",
        "(i32.add)",

        // Clear the entry
        "(i32.const 0)",
        "(i32.store)", 

        // Update counter i and check if need to stop the loop
        "(local.get $i)",
        "(i32.const 1)",
        "(i32.add)",
        "(local.set $i)",
        "(local.get $i)",
        "(i32.const 10)",
        "(i32.lt_s)",
        "(br_if $my_loop)",
        ")",

        // Return a dump value
        "(i32.const 0)",
        "(return))",
        "",
      ]
    );

    setFunStmts.push(
    ...[
      // Basic idea is to iterate through all set entries and aggregate the number of elements followed by each entry
      "(func $set$size (param $baseAddr i32) (result i32)",
      "(local $i i32)",
      "(local $size i32)",
      "(local $nodePtr i32)", 

      // Use a for loop (i from 0 to 10)
      "(loop $my_loop",

      // Find the address of the entry
      "(local.get $baseAddr)",
      "(local.get $i)",
      "(i32.mul (i32.const 4))",
      "(i32.add)",

      // Check if there is a follwing linkedlist
      "(i32.load)",
      "(i32.const 0)",
      "(i32.eq)",
      // If there's no follwing element, do nothing
      "(if",
      "(then", 
      ")",
      // Else, iterate the list
      "(else", // Opening else
        // There is an element, size++
        "(local.get $size)",
        "(i32.const 1)",
        "(i32.add)",
        "(local.set $size)",
        "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
        "(local.get $i)",
        "(i32.mul (i32.const 4))",
        "(i32.add)", //Recomputed bucketAddress
        "(i32.load)", //Loading head of linkedList
        "(i32.const 4)",
        "(i32.add)", // Next pointer
        "(local.set $nodePtr)",
        "(block",
        // While loop till we find a node whose next is None
        "(loop", 
          "(local.get $nodePtr)",
          "(i32.load)", // Traversing to head of next node
          "(i32.const 0)", //None
          "(i32.ne)", // If nodePtr not None
          "(if",
          "(then",
            // There is an element, size++
            "(local.get $size)",
            "(i32.const 1)",
            "(i32.add)",
            "(local.set $size)",
            "(local.get $nodePtr)",
            "(i32.load)", //Loading head of linkedList
            "(i32.const 4)",
            "(i32.add)", // Next pointer
            "(local.set $nodePtr)",
          ")", // Closing then
          ")", // Closing if
        "(br_if 0", // Opening br_if
          "(local.get $nodePtr)",
          "(i32.load)", // Traversing to head of next node
          "(i32.const 0)", //None
          "(i32.ne)", // If nodePtr not None
        ")", // Closing br_if
        "(br 1)",
        ")", // Closing loop
        ")", // Closing Block
      ")", // Closing else
      ")", // Closing if

      // Update the counter and go to the next entry
      "(local.get $i)",
      "(i32.const 1)",
      "(i32.add)",
      "(local.set $i)",
      "(local.get $i)",
      "(i32.const 10)",
      "(i32.lt_s)",
      "(br_if $my_loop)",
      ")",

      // Return the $size
      "(local.get $size)",
      "(return))",
      "",
    ]
  );
  
    setFunStmts.push(
      ...[
        "(func $set$CreateEntry (param $val i32) (result i32)",
        "(local $$allocPointer i32)",

        // Allocate a node at the end of the heap
        // Need 2, 1 for value and 1 for pointer
        "(i32.const 2)   ;; size in bytes",
        "(call $alloc)",
        "(local.tee $$allocPointer)",

        // Store the value
        "(local.get $val)",
        "(i32.store)", 

        // Store the pointer to 0 (None) because it is the last element
        "(local.get $$allocPointer)",
        "(i32.const 4)",
        "(i32.add)",
        "(i32.const 0)", 
        "(i32.store)", 
        "(local.get $$allocPointer)",
        "(return))",
        "",
      ]
    );

    setFunStmts.push(
      ...[
        // Iterate through all hash entries and check if the specified element is in the set
        "(func $set$has (param $baseAddr i32) (param $val i32) (result i32)",
        "(local $nodePtr i32)", // Local variable to store the address of nodes in linkedList
        "(local $tagHitFlag i32)", // Local bool variable to indicate whether tag is hit
        "(local $$allocPointer i32)",

        "(i32.const 0)",
        "(local.set $tagHitFlag)", // Initialize tagHitFlag to False
        "(local.get $baseAddr)",
        "(local.get $val)",
        "(i32.const 10)",
        "(i32.rem_u)", //Compute hash
        "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
        "(i32.add)", //Reaching the proper bucket. Call this bucketAddress
        "(i32.load)",
        "(i32.const 0)", //None
        "(i32.eq)",
        "(if",
        "(then", // if the literal in bucketAddress is None
          // Do Nothing
        ")", // Closing then

        "(else", // Opening else
          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.load)", //Loading the value of head
          "(local.get $val)",
          "(i32.eq)",
          "(if", // if value is same as the provided one
          "(then",
            "(i32.const 1)",
            "(local.set $tagHitFlag)", // Set tagHitFlag to True
          ")", // closing then
          ")", // closing if

          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.const 4)",
          "(i32.add)", // Next pointer
          "(local.set $nodePtr)",
          "(block",
          "(loop", // While loop till we find a node whose next is None
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
            "(if",
            "(then",
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.load)", //Loading the value of head
              "(local.get $val)",
              "(i32.eq)", // if value is same as the provided one
              "(if",
              "(then",
                "(i32.const 1)",
                "(local.set $tagHitFlag)", // Set tagHitFlag to True
              ")", // closing then
              ")", // closing if
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.const 4)",
              "(i32.add)", // Next pointer
              "(local.set $nodePtr)",
            ")", // Closing then
            ")", // Closing if
          "(br_if 0", // Opening br_if
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
          ")", // Closing br_if
          "(br 1)",
          ")", // Closing loop
          ")", // Closing Block
        ")", // Closing else
        ")", // Closing if

        // Return tagHitFlag
        "(local.get $tagHitFlag)",
        "(return))", //
        ""
      ]
    );

    setFunStmts.push(
      ...[
        "(func $set$add (param $baseAddr i32) (param $val i32) (result i32)",
        "(local $nodePtr i32)", // Local variable to store the address of nodes in linkedList
        "(local $tagHitFlag i32)", // Local bool variable to indicate whether value is hit
        "(local $$allocPointer i32)",

        "(i32.const 0)",
        "(local.set $tagHitFlag)", // Initialize tagHitFlag to False
        "(local.get $baseAddr)",
        "(local.get $val)",
        "(i32.const 10)",
        "(i32.rem_u)", //Compute hash
        "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
        "(i32.add)", //Reaching the proper bucket. Call this bucketAddress
        "(i32.load)",
        "(i32.const 0)", //None
        "(i32.eq)",
        "(if",
        "(then", // if the literal in bucketAddress is None, add value to the address
          "(local.get $val)",
          "(call $set$CreateEntry)", //create node
          "(local.set $$allocPointer)",
          "(local.get $baseAddr)", // Recomputing the bucketAddress to update it.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(local.get $$allocPointer)",
          "(i32.store)", //Updated the bucketAddress pointing towards first element.
        ")", // Closing then

        "(else", // Opening else
          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.load)", //Loading the value of head
          "(local.get $val)",
          "(i32.eq)",
          "(if", // if value is same as the provided one
          "(then",
            "(i32.const 1)",
            "(local.set $tagHitFlag)", // Set tagHitFlag to True and no need to create a new entry
          ")", // closing then
          ")", // closing if

          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.const 4)",
          "(i32.add)", // Next pointer
          "(local.set $nodePtr)",
          "(block",
          "(loop", // While loop till we find a node whose next is None
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
            "(if",
            "(then",
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.load)", //Loading the value of head
              "(local.get $val)",
              "(i32.eq)", // if value is same as the provided one
              "(if",
              "(then",
                "(i32.const 1)",
                "(local.set $tagHitFlag)", // Set tagHitFlag to True and no need to create a new entry
              ")", // closing then
              ")", // closing if
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.const 4)",
              "(i32.add)", // Next pointer
              "(local.set $nodePtr)",
            ")", // Closing then
            ")", // Closing if
          "(br_if 0", // Opening br_if
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
          ")", // Closing br_if
          "(br 1)",
          ")", // Closing loop
          ")", // Closing Block
        "(local.get $tagHitFlag)",
        "(i32.const 0)",
        "(i32.eq)", // Add a new node only if value hit is false.
        "(if",
        "(then",
          "(local.get $val)",
          "(call $set$CreateEntry)", //create node
          "(local.set $$allocPointer)",
          "(local.get $nodePtr)", // Get the address of "next" block in node, whose next is None.
          "(local.get $$allocPointer)",
          "(i32.store)", // Updated the next pointing towards first element of new node.
        ")", // Closing then inside else
        ")", // Closing if inside else
        ")", // Closing else
        ")", // Closing if

        // Return a dump value
        "(i32.const 0)",
        "(return))", //
      ]
    );

    setFunStmts.push(
      ...[
        // Remove a specified element from the set
        "(func $set$remove (param $baseAddr i32) (param $val i32) (result i32)",
        "(local $prePtr i32)",
        "(local $dump i32)",
        "(local $nodePtr i32)", // Local variable to store the address of nodes in linkedList
        "(local $tagHitFlag i32)", // Local bool variable to indicate whether tag is hit
        "(local $$allocPointer i32)",

        "(i32.const 0)",
        "(local.set $tagHitFlag)", // Initialize tagHitFlag to False
        "(local.get $baseAddr)",
        "(local.get $val)",
        "(i32.const 10)",
        "(i32.rem_u)", //Compute hash
        "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
        "(i32.add)", //Reaching the proper bucket. Call this bucketAddress
        "(i32.load)",
        "(i32.const 0)", //None
        "(i32.eq)",
        "(if",
        "(then", 
          // Specified element not in the set and do nothing
        ")", // Closing then

        "(else", // Opening else
          "(local.get $baseAddr)",
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", 
          "(i32.mul (i32.const 4))", 
          "(i32.add)", 
          "(local.set $prePtr)", // Set pre pointer

          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.load)", //Loading the tag of head
          "(local.get $val)",
          "(i32.eq)",
          "(if", // if tag is same as the provided one
          "(then",
            "(i32.const 1)",
            "(local.set $tagHitFlag)", // Set tagHitFlag to True

            // Make the prePtr point to the next address of current pointer
            "(local.get $prePtr)",
            "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
            "(local.get $val)",
            "(i32.const 10)",
            "(i32.rem_u)", //Compute hash
            "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
            "(i32.add)", //Recomputed bucketAddress
            "(i32.load)", //Loading head of linkedList
            "(i32.const 4)",
            "(i32.add)",
            "(i32.load)",
            "(i32.store)",
          ")", // closing then
          ")", // closing if

          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $val)",
          "(i32.const 10)",
          "(i32.rem_u)", //Compute hash
          "(i32.mul (i32.const 4))", //Multiply by 4 for memory offset
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.const 4)",
          "(i32.add)", // Next pointer
          "(local.set $nodePtr)",
          "(block",
          "(loop", // While loop till we find a node whose next is None
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
            "(if",
            "(then",
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.load)", //Loading the value of head
              "(local.get $val)",
              "(i32.eq)", // if value is same as the provided one
              "(if",
              "(then",
                "(i32.const 1)",
                "(local.set $tagHitFlag)", // Set tagHitFlag to True

                // Let the nodePtr points to the next address
                "(local.get $nodePtr)",
                "(local.get $nodePtr)", 
                "(i32.load)", 
                "(i32.const 4)",
                "(i32.add)",
                "(i32.load)",
                "(i32.store)",

              ")", // closing then
              ")", // closing if
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.const 4)",
              "(i32.add)", // Next pointer
              "(local.set $nodePtr)",
            ")", // Closing then
            ")", // Closing if
          "(br_if 0", // Opening br_if
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
          ")", // Closing br_if
          "(br 1)",
          ")", // Closing loop
          ")", // Closing Block
        ")", // Closing else
        ")", // Closing if

        // Check if the remove is success or not, if not, throw an error from $ele_not_found
        "(local.get $tagHitFlag)",
        "(call $ele_not_found)",


        "(local.get $tagHitFlag)",
        "(return))", //
        ""
      ]
    );

    setFunStmts.push(
      ...[
        // Given a set A and set B, add all elements in B to A
        "(func $set$update (param $baseAddr$new i32) (param $baseAddr i32) (result i32)",
        "(local $i i32)",
        "(local $nodePtr i32)", 
        "(local $dump i32)", 
  
        // Iterate all elements in set B
        "(loop $my_loop",
  
        "(local.get $baseAddr)",
        "(local.get $i)",
        "(i32.mul (i32.const 4))",
        "(i32.add)",

        "(i32.load)",
        "(i32.const 0)",
        "(i32.eq)",
        "(if",
        "(then", 
        // No element under current entry, do nothing
        ")",
        "(else", // Opening else

          // Add the element found in set B to set A
          "(local.get $baseAddr$new)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $baseAddr)",
          "(local.get $i)",
          "(i32.mul (i32.const 4))",
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)",
          "(i32.load)",
          "(call $set$add)",
          "(local.set $dump)",

          // Move to next element
          "(local.get $baseAddr)", // Recomputing the bucketAddress to follow the linkedList.
          "(local.get $i)",
          "(i32.mul (i32.const 4))",
          "(i32.add)", //Recomputed bucketAddress
          "(i32.load)", //Loading head of linkedList
          "(i32.const 4)",
          "(i32.add)", // Next pointer
          "(local.set $nodePtr)",
          "(block",
          "(loop", // While loop till we find a node whose next is None
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
            "(if",
            "(then",

              // Add the found element in set B to set A
              "(local.get $baseAddr$new)", // Recomputing the bucketAddress to follow the linkedList.
              "(local.get $nodePtr)",
              "(i32.load)",
              "(i32.load)",
              "(call $set$add)",
              "(local.set $dump)",

              // Move to next node
              "(local.get $nodePtr)",
              "(i32.load)", //Loading head of linkedList
              "(i32.const 4)",
              "(i32.add)", // Next pointer
              "(local.set $nodePtr)",
            ")", // Closing then
            ")", // Closing if
          "(br_if 0", // Opening br_if
            "(local.get $nodePtr)",
            "(i32.load)", // Traversing to head of next node
            "(i32.const 0)", //None
            "(i32.ne)", // If nodePtr not None
          ")", // Closing br_if
          "(br 1)",
          ")", // Closing loop
          ")", // Closing Block
        ")", // Closing else
        ")", // Closing if
  
        // Check if all entries are visited
        "(local.get $i)",
        "(i32.const 1)",
        "(i32.add)",
        "(local.set $i)",
        "(local.get $i)",
        "(i32.const 10)",
        "(i32.lt_s)",
        "(br_if $my_loop)",
        ")",
  
        // Return a dump value
        "(local.get $dump)",
        "(return))",
        "",
      ]
    );

    return setFunStmts;
  }
  

