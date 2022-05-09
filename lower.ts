import * as AST from './ast';
import * as IR from './ir';
import { Type } from './ast';
import { GlobalEnv } from './compiler';
import { APPLY, CLASS, createMethodName, NONE } from './utils';

const nameCounters : Map<string, number> = new Map();
function generateName(base : string) : string {
  if(nameCounters.has(base)) {
    var cur = nameCounters.get(base);
    nameCounters.set(base, cur + 1);
    return base + (cur + 1);
  }
  else {
    nameCounters.set(base, 1);
    return base + 1;
  }
}

export function closureName(f: string): string {
  return `${f}_$closure$`;
}

// function lbl(a: Type, base: string) : [string, IR.Stmt<Type>] {
//   const name = generateName(base);
//   return [name, {tag: "label", a: a, name: name}];
// }

export function lowerProgram(p : AST.Program<Type>, env : GlobalEnv) : IR.Program<Type> {
    var blocks : Array<IR.BasicBlock<Type>> = [];
    var firstBlock : IR.BasicBlock<Type> = {  a: p.a, label: generateName("$startProg"), stmts: [] }
    blocks.push(firstBlock);
    var [closures, closureinits] = lowerFunDefs(p.funs, blocks, env);
    var classes = lowerClasses([...closures, ...p.classes], env);
    var [inits, generatedClasses] = flattenStmts(p.stmts, blocks, env);
    return {
        a: p.a,
        funs: [],
        inits: [...inits, ...lowerVarInits(p.inits, env), ...closureinits],
        classes: [...classes, ...generatedClasses],
        body: blocks
    }
}

function lowerFunDefs(
  fs: Array<AST.FunDef<Type>>,
  blocks: Array<IR.BasicBlock<Type>>,
  env: GlobalEnv
): [Array<AST.Class<Type>>, Array<IR.VarInit<Type>>] {
  const loweredFuns = fs.map(f => lowerFunDef(f, blocks, env));
  return [loweredFuns.map(x => x[0]), loweredFuns.map(x => x[1]).flat()];
}

function lowerFunDef(
  f: AST.FunDef<Type>,
  blocks: Array<IR.BasicBlock<Type>>,
  env: GlobalEnv
): [AST.Class<Type>, Array<IR.VarInit<Type>>] {
  var type: Type = { tag: "class", name: closureName(f.name) };
  var fptrinit: AST.VarInit<Type> = { a: type, name: f.name, type, value: { tag: "none" } };
  var fptrassign: AST.Stmt<Type> = { tag: "assign", name: f.name, value: { tag: "construct", name: closureName(f.name) } };
  var [finits, _] = flattenStmt(fptrassign, blocks, env);

  // TODO(pashabou): children, populate fields and methods of closure class
  return [
    {
      name: closureName(f.name),
      fields: [],
      methods: [
        {
          name: "__init__",
          parameters: [{ name: "self", type }],
          ret: f.ret,
          inits: [],
          body: [],
          nonlocals: [],
          children: []
        },
        {
          ...f,
          name: APPLY,
          parameters: [{ name: "self", type }, ...f.parameters],
        }
      ]
    },
    [lowerVarInit(fptrinit, env), ...finits]
  ];
}

function lowerMethodDefs(fs : Array<AST.FunDef<Type>>, env : GlobalEnv) : Array<IR.FunDef<Type>> {
  return fs.map(f => lowerMethodDef(f, env)).flat();
}

function lowerMethodDef(f : AST.FunDef<Type>, env : GlobalEnv) : IR.FunDef<Type> {
  var blocks : Array<IR.BasicBlock<Type>> = [];
  var firstBlock : IR.BasicBlock<Type> = {  a: f.a, label: generateName("$startFun"), stmts: [] }
  blocks.push(firstBlock);
  var [bodyinits, _] = flattenStmts(f.body, blocks, env);
  return {...f, inits: [...bodyinits, ...lowerVarInits(f.inits, env)], body: blocks}
}

function lowerVarInits(inits: Array<AST.VarInit<Type>>, env: GlobalEnv) : Array<IR.VarInit<Type>> {
    return inits.map(i => lowerVarInit(i, env));
}

function lowerVarInit(init: AST.VarInit<Type>, env: GlobalEnv) : IR.VarInit<Type> {
    return {
        ...init,
        value: literalToVal(init.value)
    }
}

function lowerClasses(classes: Array<AST.Class<Type>>, env : GlobalEnv) : Array<IR.Class<Type>> {
    return classes.map(c => lowerClass(c, env));
}

function lowerClass(cls: AST.Class<Type>, env : GlobalEnv) : IR.Class<Type> {
    env.classIndices.set(cls.name, env.vtableMethods.length);
    // init not in vtable 
    // (we currently do no reordering, we leave that to inheritance team)
    env.vtableMethods.push(...cls.methods
      .filter(method => !method.name.includes("__init__"))
      .map((method): [string, number] => [createMethodName(cls.name, method.name), method.parameters.length]));
    return {
        ...cls,
        fields: lowerVarInits(cls.fields, env),
        methods: lowerMethodDefs(cls.methods, env)
    }
}

function literalToVal(lit: AST.Literal) : IR.Value<Type> {
    switch(lit.tag) {
        case "num":
            return { ...lit, value: BigInt(lit.value) }
        case "bool":
            return lit
        case "none":
            return lit        
    }
}

function flattenStmts(s : Array<AST.Stmt<Type>>, blocks: Array<IR.BasicBlock<Type>>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Class<Type>>] {
  var inits: Array<IR.VarInit<Type>> = [];
  var classes: Array<IR.Class<Type>> = [];
  s.forEach(stmt => {
    const res = flattenStmt(stmt, blocks, env);
    inits.push(...res[0]);
    classes.push(...res[1]);
  });
  return [inits, classes];
}

function flattenStmt(s : AST.Stmt<Type>, blocks: Array<IR.BasicBlock<Type>>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Class<Type>>] {
  switch(s.tag) {
    case "assign":
      var [valinits, valstmts, vale, classes] = flattenExprToExpr(s.value, blocks, env);
      blocks[blocks.length - 1].stmts.push(...valstmts, { a: s.a, tag: "assign", name: s.name, value: vale});
      return [valinits, classes];
      // return [valinits, [
      //   ...valstmts,
      //   { a: s.a, tag: "assign", name: s.name, value: vale}
      // ]];

    case "return":
      var [valinits, valstmts, val, classes] = flattenExprToVal(s.value, blocks, env);
      blocks[blocks.length - 1].stmts.push(
          ...valstmts,
          {tag: "return", a: s.a, value: val}
      );
      return [valinits, classes];
      // return [valinits, [
      //     ...valstmts,
      //     {tag: "return", a: s.a, value: val}
      // ]];
  
    case "expr":
      var [inits, stmts, e, classes] = flattenExprToExpr(s.expr, blocks, env);
      blocks[blocks.length - 1].stmts.push(
        ...stmts, {tag: "expr", a: s.a, expr: e }
      );
      return [inits, classes];
    //  return [inits, [ ...stmts, {tag: "expr", a: s.a, expr: e } ]];

    case "pass":
      return [[], []];

    case "field-assign": {
      var [oinits, ostmts, oval, oclasses] = flattenExprToVal(s.obj, blocks, env);
      var [ninits, nstmts, nval, nclasses] = flattenExprToVal(s.value, blocks, env);
      if(s.obj.a.tag !== "class") { throw new Error("Compiler's cursed, go home."); }
      const classdata = env.classes.get(s.obj.a.name);
      const offset : IR.Value<Type> = { tag: "wasmint", value: classdata.get(s.field)[0] };
      pushStmtsToLastBlock(blocks,
        ...ostmts, ...nstmts, {
          tag: "store",
          a: s.a,
          start: oval,
          offset: offset,
          value: nval
        });
      return [[...oinits, ...ninits], oclasses.concat(nclasses)];
    }
      // return [[...oinits, ...ninits], [...ostmts, ...nstmts, {
      //   tag: "field-assign",
      //   a: s.a,
      //   obj: oval,
      //   field: s.field,
      //   value: nval
      // }]];

    case "if":
      var thenLbl = generateName("$then")
      var elseLbl = generateName("$else")
      var endLbl = generateName("$end")
      var endjmp : IR.Stmt<Type> = { tag: "jmp", lbl: endLbl };
      var [cinits, cstmts, cexpr, cclasses] = flattenExprToVal(s.cond, blocks, env);
      var condjmp : IR.Stmt<Type> = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };
      pushStmtsToLastBlock(blocks, ...cstmts, condjmp);
      blocks.push({  a: s.a, label: thenLbl, stmts: [] })
      var [theninits, thenclasses] = flattenStmts(s.thn, blocks, env);
      pushStmtsToLastBlock(blocks, endjmp);
      blocks.push({  a: s.a, label: elseLbl, stmts: [] })
      var [elseinits, elseclasses] = flattenStmts(s.els, blocks, env);
      pushStmtsToLastBlock(blocks, endjmp);
      blocks.push({  a: s.a, label: endLbl, stmts: [] })
      return [[...cinits, ...theninits, ...elseinits], [...cclasses, ...thenclasses, ...elseclasses]]

      // return [[...cinits, ...theninits, ...elseinits], [
      //   ...cstmts, 
      //   condjmp,
      //   startlbl,
      //   ...thenstmts,
      //   endjmp,
      //   elslbl,
      //   ...elsestmts,
      //   endjmp,
      //   endlbl,
      // ]];
    
    case "while":
      var whileStartLbl = generateName("$whilestart");
      var whilebodyLbl = generateName("$whilebody");
      var whileEndLbl = generateName("$whileend");

      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl })
      blocks.push({  a: s.a, label: whileStartLbl, stmts: [] })
      var [cinits, cstmts, cexpr, cclasses] = flattenExprToVal(s.cond, blocks, env);
      pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: whilebodyLbl, els: whileEndLbl });

      blocks.push({  a: s.a, label: whilebodyLbl, stmts: [] })
      var [bodyinits, bodyclasses] = flattenStmts(s.body, blocks, env);
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl });

      blocks.push({  a: s.a, label: whileEndLbl, stmts: [] })

      return [[...cinits, ...bodyinits], [...cclasses, ...bodyclasses]]
  }
}

function flattenExprToExpr(e : AST.Expr<Type>, blocks: Array<IR.BasicBlock<Type>>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Expr<Type>, Array<IR.Class<Type>>] {
  switch(e.tag) {
    case "uniop":
      var [inits, stmts, val, classes] = flattenExprToVal(e.expr, blocks, env);
      return [inits, stmts, {
        ...e,
        expr: val
      }, classes];
    case "binop":
      var [linits, lstmts, lval, lclasses] = flattenExprToVal(e.left, blocks, env);
      var [rinits, rstmts, rval, rclasses] = flattenExprToVal(e.right, blocks, env);
      return [[...linits, ...rinits], [...lstmts, ...rstmts], {
          ...e,
          left: lval,
          right: rval
        }, [...lclasses, ...rclasses]];
    case "builtin1":
      var [inits, stmts, val, classes] = flattenExprToVal(e.arg, blocks, env);
      return [inits, stmts, {tag: "builtin1", a: e.a, name: e.name, arg: val}, classes];
    case "builtin2":
      var [linits, lstmts, lval, lclasses] = flattenExprToVal(e.left, blocks, env);
      var [rinits, rstmts, rval, rclasses] = flattenExprToVal(e.right, blocks, env);
      return [[...linits, ...rinits], [...lstmts, ...rstmts], {
          ...e,
          left: lval,
          right: rval
        }, [...lclasses, ...rclasses]];
    case "call":
      const [finits, fstmts, fval, fclasses] = flattenExprToVal(e.fn, blocks, env);
      const callpairs = e.arguments.map(a => flattenExprToVal(a, blocks, env));
      const callinits = callpairs.map(cp => cp[0]).flat();
      const callstmts = callpairs.map(cp => cp[1]).flat();
      const callvals = callpairs.map(cp => cp[2]).flat();
      const callclasses = callpairs.map(cp => cp[3]).flat();
      return [
        [...finits, ...callinits],
        [...fstmts, ...callstmts],
        {
          ...e,
          tag: "call_indirect",
          fn: fval,
          arguments: [fval, ...callvals]
        },
        [...fclasses, ...callclasses]
      ];
    case "method-call": {
      const [objinits, objstmts, objval, objclasses] = flattenExprToVal(e.obj, blocks, env);
      const argpairs = e.arguments.map(a => flattenExprToVal(a, blocks, env));
      const arginits = argpairs.map(cp => cp[0]).flat();
      const argstmts = argpairs.map(cp => cp[1]).flat();
      const argvals = argpairs.map(cp => cp[2]).flat();
      const argclasses = argpairs.map(cp => cp[3]).flat();
      var objTyp = e.obj.a;
      if(objTyp.tag !== "class") { // I don't think this error can happen
        throw new Error("Report this as a bug to the compiler developer, this shouldn't happen " + objTyp.tag);
      }
      const className = objTyp.name;
      const checkObj : IR.Stmt<Type> = { tag: "expr", expr: { tag: "call", name: `assert_not_none`, arguments: [objval]}}
      const callMethod : IR.Expr<Type> = { tag: "call", name: `${className}$${e.method}`, arguments: [objval, ...argvals] }
      return [
        [...objinits, ...arginits],
        [...objstmts, checkObj, ...argstmts],
        callMethod,
        [...objclasses, ...argclasses]
      ];
    }
    case "lookup": {
      const [oinits, ostmts, oval, oclasses] = flattenExprToVal(e.obj, blocks, env);
      if(e.obj.a.tag !== "class") { throw new Error("Compiler's cursed, go home"); }
      const classdata = env.classes.get(e.obj.a.name);
      const [offset, _] = classdata.get(e.field);
      return [oinits, ostmts, {
        tag: "load",
        start: oval,
        offset: { tag: "wasmint", value: offset }}, oclasses];
    }
    case "construct":
      const classdata = env.classes.get(e.name);
      const fields = [...classdata.entries()];
      const newName = generateName("newObj");
      const alloc : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: fields.length + 1} };
      const assigns : IR.Stmt<Type>[] = fields.map(f => {
        const [_, [index, value]] = f;
        return {
          tag: "store",
          start: { tag: "id", name: newName },
          offset: { tag: "wasmint", value: index },
          value: value
        }
      });

      return [
        [ { name: newName, type: e.a, value: { tag: "none" } }],
        [ { tag: "assign", name: newName, value: alloc }, { // store class offset
            tag: "store",
            start: { tag: "id", name: newName },
            offset: { tag: "wasmint", value: 0 },
            value: { tag: "wasmint", value: env.classIndices.get(e.name) }
          }, ...assigns,
          { tag: "expr", expr: { tag: "call", name: `${e.name}$__init__`, arguments: [{ a: e.a, tag: "id", name: newName }] } }
        ],
        { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: newName } },
        []
      ];
    case "id":
      return [[], [], {tag: "value", value: { ...e }}, []];
    case "literal":
      return [[], [], {tag: "value", value: literalToVal(e.value) }, [] ];
    case "if-expr": {
      var thenLbl = generateName("$ifExprThen");
      var elseLbl = generateName("$ifExprElse");
      var endLbl = generateName("$ifExprEnd");
      var ifExprTmpVal = generateName("$ifExprTmp");

      var endjmp : IR.Stmt<Type> = { tag: "jmp", lbl: endLbl };
      let [cinits, cstmts, cexpr] = flattenExprToVal(e.cond, blocks, env);
      var condjmp : IR.Stmt<Type> = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };

      pushStmtsToLastBlock(blocks, ...cstmts, condjmp);

      blocks.push({ a: e.a, label: thenLbl, stmts: [] });
      var [thninits, thnstmts, thnexpr] = flattenExprToExpr(e.thn, blocks, env);
      pushStmtsToLastBlock(blocks, ...thnstmts, { a: e.a, tag: "assign", name: ifExprTmpVal, value: thnexpr}, endjmp);

      blocks.push({ a: e.a, label: elseLbl, stmts: [] });
      var [elsinits, elsstmts, elsexpr] = flattenExprToExpr(e.els, blocks, env);
      pushStmtsToLastBlock(blocks,...elsstmts, { a: e.a, tag: "assign", name: ifExprTmpVal, value: elsexpr}, endjmp);

      blocks.push({ a: e.a, label: endLbl, stmts: [] });
      var varDefForTmp: IR.VarInit<Type> = { a: e.a, name: ifExprTmpVal, type: e.a, value: { a: { tag: "none"}, tag: "none" } };

      return [
        [...cinits, ...elsinits, ...thninits, varDefForTmp],
        [],
        { a: e.a, tag:"value", value: { a: e.a, tag: "id", name: ifExprTmpVal } },
        []
      ];
    }
    case "lambda":
      var [classDef, constrExpr] = lambdaToClass(e);

      const classFields = new Map();
      classDef.fields.forEach((field, i) => classFields.set(field.name, [i, field.value]));
      env.classes.set(classDef.name, classFields);
      const irClass = lowerClass(classDef, env);
      irClass.a = e.a;

      const [cinits, cstmts, cval, cclasses] = flattenExprToExpr(constrExpr, blocks, env);

      return [cinits, cstmts, cval, [irClass, ...cclasses]]
  }
}

function lambdaToClass(lambda: AST.Lambda<Type>) : [AST.Class<Type>, AST.Expr<Type>] {
  var lambdaClassName = generateName("lambda");
  var params = lambda.params.map((param, i) => ({
    name: param, 
    type: lambda.type.params[i]
  }));
  return [
    {
      name: lambdaClassName,
      fields: [],
      methods: [
        { 
          name: "__init__", 
          parameters: [{ name: "self", type: CLASS(lambdaClassName) }], 
          ret: NONE, 
          inits: [], 
          body: [],
          nonlocals: [],
          children: []
        },
        { 
          name: APPLY, 
          parameters: [{ name: "self", type: CLASS(lambdaClassName) }, ...params], 
          ret: lambda.type.ret, 
          inits: [], 
          body: [{ a: lambda.type.ret, tag: "return", value: lambda.expr }],
          nonlocals: [],
          children: []
        }
      ]
    },
    { a: lambda.a, tag: "construct", name: lambdaClassName }
  ];
}

function flattenExprToVal(e : AST.Expr<Type>, blocks: Array<IR.BasicBlock<Type>>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>, Array<IR.Class<Type>>] {
  var [binits, bstmts, bexpr, bclasses] = flattenExprToExpr(e, blocks, env);
  if(bexpr.tag === "value") {
    return [binits, bstmts, bexpr.value, bclasses];
  }
  else {
    var newName = generateName("valname");
    var setNewName : IR.Stmt<Type> = {
      tag: "assign",
      a: e.a,
      name: newName,
      value: bexpr 
    };
    // TODO: we have to add a new var init for the new variable we're creating here.
    // but what should the default value be?
    return [
      [...binits, { a: e.a, name: newName, type: e.a, value: { tag: "none" } }],
      [...bstmts, setNewName],  
      {tag: "id", name: newName, a: e.a},
      bclasses
    ];
  }
}

function pushStmtsToLastBlock(blocks: Array<IR.BasicBlock<Type>>, ...stmts: Array<IR.Stmt<Type>>) {
  blocks[blocks.length - 1].stmts.push(...stmts);
}