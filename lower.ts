import * as AST from './ast';
import * as IR from './ir';
import * as ERRORS from './errors';
import { Type, Annotation } from './ast';
import { GlobalEnv } from './compiler';

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

// function lbl(a: Type, base: string) : [string, IR.Stmt<Annotation>] {
//   const name = generateName(base);
//   return [name, {tag: "label", a: a, name: name}];
// }

export function generateVtable(p : AST.Program<Annotation>, env : GlobalEnv) {
  var vtable : Array<string> = [];
  var classIndexes = new Map(); // stores the start and end index of the class in vtable
  var methodIndex = 0;
  p.classes.forEach(cls => {
    if (cls.super[0]!=="object") {
      const superClassIndexes = classIndexes.get(cls.super[0])
      var superClassVtable = vtable.slice(superClassIndexes[0], superClassIndexes[1])
      cls.methods.forEach(m => {
        const methodOffset = env.classes.get(cls.name)[1].get(m.name);
        if (methodOffset >= superClassVtable.length) {
          superClassVtable.push(`$${cls.name}$${m.name}`)
        } else {
          superClassVtable[methodOffset] = `$${cls.name}$${m.name}`;
        }
      })
      classIndexes.set(cls.name, [vtable.length, vtable.length +superClassVtable.length])
      vtable = [...vtable , ...superClassVtable]
    } else {
      // add methods directly and increment methodIndex
      classIndexes.set(cls.name, [vtable.length, vtable.length + cls.methods.length])
      cls.methods.forEach(m => {
        vtable.push(`$${cls.name}$${m.name}`)
      })
    }
  })
  // add classIndexes & vtable in env
  env.vtable = vtable;
  env.classIndexes = classIndexes;
}

export function lowerProgram(p : AST.Program<Annotation>, env : GlobalEnv) : IR.Program<Annotation> {
    generateVtable(p, env);
    var blocks : Array<IR.BasicBlock<Annotation>> = [];
    var firstBlock : IR.BasicBlock<Annotation> = {  a: p.a, label: generateName("$startProg"), stmts: [] }
    blocks.push(firstBlock);
    var inits = flattenStmts(p.stmts, blocks, env);
    return {
        a: p.a,
        funs: lowerFunDefs(p.funs, env),
        inits: [...inits, ...lowerVarInits(p.inits, env)],
        classes: lowerClasses(p.classes, env),
        body: blocks
    }
}

function lowerFunDefs(fs : Array<AST.FunDef<Annotation>>, env : GlobalEnv) : Array<IR.FunDef<Annotation>> {
    return fs.map(f => lowerFunDef(f, env)).flat();
}

function lowerFunDef(f : AST.FunDef<Annotation>, env : GlobalEnv) : IR.FunDef<Annotation> {
  var blocks : Array<IR.BasicBlock<Annotation>> = [];
  var firstBlock : IR.BasicBlock<Annotation> = {  a: f.a, label: generateName("$startFun"), stmts: [] }
  blocks.push(firstBlock);
  var bodyinits = flattenStmts(f.body, blocks, env);
    return {...f, inits: [...bodyinits, ...lowerVarInits(f.inits, env)], body: blocks}
}

function lowerVarInits(inits: Array<AST.VarInit<Annotation>>, env: GlobalEnv) : Array<IR.VarInit<Annotation>> {
    return inits.map(i => lowerVarInit(i, env));
}

function lowerVarInit(init: AST.VarInit<Annotation>, env: GlobalEnv) : IR.VarInit<Annotation> {
    return {
        ...init,
        value: literalToVal(init.value)
    }
}

function lowerClasses(classes: Array<AST.Class<Annotation>>, env : GlobalEnv) : Array<IR.Class<Annotation>> {
    return classes.map(c => lowerClass(c, env));
}

function lowerClass(cls: AST.Class<Annotation>, env : GlobalEnv) : IR.Class<Annotation> {
    return {
        ...cls,
        fields: lowerVarInits(cls.fields, env),
        methods: lowerFunDefs(cls.methods, env)
    }
}

function literalToVal(lit: AST.Literal<Annotation>) : IR.Value<Annotation> {
    switch(lit.tag) {
        case "num":
            return { ...lit, value: BigInt((lit.value).toLocaleString('fullwide', {useGrouping:false})) }
        case "bool":
            return lit
        case "none":
            return lit        
    }
}

function flattenStmts(s : Array<AST.Stmt<Annotation>>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : Array<IR.VarInit<Annotation>> {
  var inits: Array<IR.VarInit<Annotation>> = [];
  s.forEach(stmt => {
    inits.push(...flattenStmt(stmt, blocks, env));
  });
  return inits;
}

function flattenStmt(s : AST.Stmt<Annotation>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : Array<IR.VarInit<Annotation>> {
  switch(s.tag) {
    case "assign":
      var [valinits, valstmts, vale] = flattenExprToExpr(s.value, env);
      blocks[blocks.length - 1].stmts.push(...valstmts, { a: s.a, tag: "assign", name: s.name, value: vale});
      return valinits
      // return [valinits, [
      //   ...valstmts,
      //   { a: s.a, tag: "assign", name: s.name, value: vale}
      // ]];

    case "return":
    var [valinits, valstmts, val] = flattenExprToVal(s.value, env);
    blocks[blocks.length - 1].stmts.push(
         ...valstmts,
         {tag: "return", a: s.a, value: val}
    );
    return valinits;
    // return [valinits, [
    //     ...valstmts,
    //     {tag: "return", a: s.a, value: val}
    // ]];
  
    case "expr":
      var [inits, stmts, e] = flattenExprToExpr(s.expr, env);
      blocks[blocks.length - 1].stmts.push(
        ...stmts, {tag: "expr", a: s.a, expr: e }
      );
      return inits;
    //  return [inits, [ ...stmts, {tag: "expr", a: s.a, expr: e } ]];

    case "pass":
      return [];

    case "field-assign": {
      var [oinits, ostmts, oval] = flattenExprToVal(s.obj, env);
      var [ninits, nstmts, nval] = flattenExprToVal(s.value, env);
      if(s.obj.a.type.tag !== "class") { throw new Error("Compiler's cursed, go home."); }
      const classdata = env.classes.get(s.obj.a.type.name);
      const offset : IR.Value<Annotation> = { tag: "wasmint", value: getClassFieldOffet(s.obj.a.type.name, s.field, env) };
      pushStmtsToLastBlock(blocks,
        ...ostmts, ...nstmts, {
          tag: "store",
          a: s.a,
          start: oval,
          offset: offset,
          value: nval
        });
      return [...oinits, ...ninits];
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
      var endjmp : IR.Stmt<Annotation> = { tag: "jmp", lbl: endLbl };
      var [cinits, cstmts, cexpr] = flattenExprToVal(s.cond, env);
      var condjmp : IR.Stmt<Annotation> = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };
      pushStmtsToLastBlock(blocks, ...cstmts, condjmp);
      blocks.push({  a: s.a, label: thenLbl, stmts: [] })
      var theninits = flattenStmts(s.thn, blocks, env);
      pushStmtsToLastBlock(blocks, endjmp);
      blocks.push({  a: s.a, label: elseLbl, stmts: [] })
      var elseinits = flattenStmts(s.els, blocks, env);
      pushStmtsToLastBlock(blocks, endjmp);
      blocks.push({  a: s.a, label: endLbl, stmts: [] })
      return [...cinits, ...theninits, ...elseinits]

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
      var [cinits, cstmts, cexpr] = flattenExprToVal(s.cond, env);
      pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: whilebodyLbl, els: whileEndLbl });

      blocks.push({  a: s.a, label: whilebodyLbl, stmts: [] })
      var bodyinits = flattenStmts(s.body, blocks, env);
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl });

      blocks.push({  a: s.a, label: whileEndLbl, stmts: [] })

      return [...cinits, ...bodyinits]
  }
}

function flattenExprToExpr(e : AST.Expr<Annotation>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Stmt<Annotation>>, IR.Expr<Annotation>] {
  switch(e.tag) {
    case "uniop":
      var [inits, stmts, val] = flattenExprToVal(e.expr, env);
      return [inits, stmts, {
        ...e,
        expr: val
      }];
    case "binop":
      var [linits, lstmts, lval] = flattenExprToVal(e.left, env);
      var [rinits, rstmts, rval] = flattenExprToVal(e.right, env);
      var checkDenom : Array<IR.Stmt<Annotation>> = [];
      if (e.op == AST.BinOp.IDiv || e.op == AST.BinOp.Mod) { // check division by zero
        checkDenom.push(ERRORS.flattenDivideByZero(e.a, rval));
      }
      return [[...linits, ...rinits], [...lstmts, ...rstmts, ...checkDenom], {
          ...e,
          left: lval,
          right: rval
        }];
    case "builtin1":
      var [inits, stmts, val] = flattenExprToVal(e.arg, env);
      return [inits, stmts, {tag: "builtin1", a: e.a, name: e.name, arg: val}];
    case "builtin2":
      var [linits, lstmts, lval] = flattenExprToVal(e.left, env);
      var [rinits, rstmts, rval] = flattenExprToVal(e.right, env);
      return [[...linits, ...rinits], [...lstmts, ...rstmts], {
          ...e,
          left: lval,
          right: rval
        }];
    case "call":
      const callpairs = e.arguments.map(a => flattenExprToVal(a, env));
      const callinits = callpairs.map(cp => cp[0]).flat();
      const callstmts = callpairs.map(cp => cp[1]).flat();
      const callvals = callpairs.map(cp => cp[2]).flat();
      return [ callinits, callstmts,
        {
          ...e,
          arguments: callvals
        }
      ];
    case "method-call": {
      // TODO: call indirect instead of call
      // {tag: "indirect_call", name: , class: , args: }
      const [objinits, objstmts, objval] = flattenExprToVal(e.obj, env);
      const argpairs = e.arguments.map(a => flattenExprToVal(a, env));
      const arginits = argpairs.map(cp => cp[0]).flat();
      const argstmts = argpairs.map(cp => cp[1]).flat();
      const argvals = argpairs.map(cp => cp[2]).flat();
      var objTyp = e.obj.a;
      if(objTyp.type.tag !== "class") { // I don't think this error can happen
        throw new Error("Report this as a bug to the compiler developer, this shouldn't happen " + objTyp.type.tag);
      }
      const className = getMethodClassName(objTyp.name, e.method, env);
      const zeroOffset: IR.Value<Type> = { tag: "wasmint", value: 0 };
      const methodOffset : IR.Value<Type> =  { tag: "num", value: BigInt(env.classes.get(className)[1].get(e.method)) }
      const checkObj : IR.Stmt<Type> = { tag: "expr", expr: { tag: "call", name: `assert_not_none`, arguments: [objval]}}
      const callMethod : IR.Expr<Type> = { tag: "call_indirect", fn: { tag: "load", start: objval, offset: zeroOffset}, arguments: [objval, ...argvals], name: `${className}$${e.method}`, methodOffset: methodOffset }
      return [
        [...objinits, ...arginits],
        [...objstmts, checkObj, ...argstmts],
        callMethod
      ];
    }
    case "lookup": {
      const [oinits, ostmts, oval] = flattenExprToVal(e.obj, env);
      if(e.obj.a.tag !== "class") { throw new Error("Compiler's cursed, go home"); }
      // TODO: add super class field support
      var className = e.obj.a.name;
      var offset = getClassFieldOffet(className, e.field, env);
      return [oinits, ostmts, {
        tag: "load",
        start: oval,
        offset: { tag: "wasmint", value: offset }}];
    }
    case "construct":
      const classdata = env.classes.get(e.name);
      const newName = generateName("newObj");
      var fields = [...classdata[0].entries()];
      var superClass = classdata[2];

      // TODO: add super class fields
      while(superClass[0] !== "object") {
        const superClassFields = [...env.classes.get(superClass[0])[0].entries()]
        superClass = [...env.classes.get(superClass[0])[2]]
        fields = [...superClassFields, ...fields]
      }
      // TOOD: add class method offset of vtable
      
      const assigns : IR.Stmt<Type>[] = fields.map(f => {
        const [_, [index, value]] = f;
        return {
          tag: "store",
          start: { tag: "id", name: newName },
          offset: { tag: "wasmint", value: index + 1 },
          value: value
        }
      });

      const alloc : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: fields.length + 1 } }; // + 1 to store class method index in vtable
      const callCons : IR.Expr<Type> = { 
        tag: "call_indirect", 
        fn: { tag: "value", value : { tag: "wasmint", value: env.classIndexes.get(e.name)[0] }}, 
        arguments: [{ a: e.a, tag: "id", name: newName }], 
        name: `${e.name}$__init__`, 
        methodOffset: { tag: "num", value: BigInt(env.classes.get(e.name)[1].get("__init__")) }
      };

      return [
        [ { name: newName, type: e.a, value: { tag: "none" } }],
        [ { tag: "assign", name: newName, value: alloc }, 
          {tag: "store",  start: { tag: "id", name: newName }, offset: { tag: "wasmint", value: 0 }, value: {tag: "num", value: BigInt(env.classIndexes.get(e.name)[0])}}, // store class method offset from vtable
          ...assigns,
          {tag: "expr", expr : callCons},
        ],
        { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: newName } }
      ];
    case "id":
      return [[], [], {a: e.a, tag: "value", value: { ...e }} ];
    case "literal":
      return [[], [], {a: e.a, tag: "value", value: literalToVal(e.value) } ];
  }
}

function getClassFieldOffet(className: string, fieldName: string, env: GlobalEnv) : number {
  while (className !== "object") {
    const classdata = env.classes.get(className);
    if (classdata[0].has(fieldName)) {
      return classdata[0].get(fieldName)[0] + 1;  // + 1 to store class method index in vtable
    }
    className = classdata[2][0];
  }
}

// fetches class name of a method, including searching for method in super classes
function getMethodClassName(className: string, methodName: string, env: GlobalEnv) : string {
  if (env.classes.get(className)[1].has(methodName)) {
    return className
  } else {
    return getMethodClassName(env.classes.get(className)[2][0], methodName, env);
  }
}

function flattenExprToVal(e : AST.Expr<Annotation>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Stmt<Annotation>>, IR.Value<Annotation>] {
  var [binits, bstmts, bexpr] = flattenExprToExpr(e, env);
  if(bexpr.tag === "value") {
    return [binits, bstmts, bexpr.value];
  }
  else {
    var newName = generateName("valname");
    var setNewName : IR.Stmt<Annotation> = {
      tag: "assign",
      a: e.a,
      name: newName,
      value: bexpr 
    };
    // TODO: we have to add a new var init for the new variable we're creating here.
    // but what should the default value be?
    return [
      [...binits, { a: e.a, name: newName, type: e.a.type, value: { tag: "none" } }],
      [...bstmts, setNewName],  
      {tag: "id", name: newName, a: e.a}
    ];
  }
}

function pushStmtsToLastBlock(blocks: Array<IR.BasicBlock<Annotation>>, ...stmts: Array<IR.Stmt<Annotation>>) {
  blocks[blocks.length - 1].stmts.push(...stmts);
}

export function flattenWasmInt(val: number): IR.Value<Annotation>{
  return { tag: "wasmint", value: val }
}
