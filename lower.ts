import * as AST from './ast';
import * as IR from './ir';
import { Type } from './ast';
import { GlobalEnv } from './compiler';
import { CLASS, NONE, NUM, STR } from './utils';

export type NestedEnv = {
  nestedRefs: Map<string, string>;
  funArgs: Map<string, Array<string>>;
  nonlocalDecls: Set<string>;
  globalDecls: Set<string>;
}

export function duplicateNestedEnv(env: NestedEnv): NestedEnv {
  return {
    nestedRefs: new Map(env.nestedRefs),
    funArgs: new Map(env.funArgs),
    nonlocalDecls: new Set(),
    globalDecls: new Set(),
  };
}

export function emptyNestedEnv(): NestedEnv {
  return {
    nestedRefs: new Map(),
    funArgs: new Map(),
    nonlocalDecls: new Set(),
    globalDecls: new Set(),
  };
}

let nameCounters : Map<string, number> = new Map();
export function generateName(base : string) : string {
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

// function lbl(a: Type, base: string) : [string, IR.Stmt<Type>] {
//   const name = generateName(base);
//   return [name, {tag: "label", a: a, name: name}];
// }

let strVarInits: Array<IR.VarInit<Type>> = [];
let strVarStmts: Array<IR.Stmt<Type>> = [];

export function updateEnv(env: GlobalEnv, p: AST.Program<Type>) {
  const newClasses = new Map(env.classes);
  const fieldMap: Map<string,IR.VarInit<AST.Type>[]>  = new Map();
  p.classes.forEach(cls => {
    const classFields = new Map();
    let fields: IR.VarInit<AST.Type>[] = [];
    //TODO: instead of zero keep class idx
    fields = [lowerVarInit({ a: NUM, name: "$obj", type: NUM, value: {tag: "num", value: 0} }, env)];
    if (cls.name !== "object") {
      fields.push(...fieldMap.get(cls.superclass).splice(1));
    }
    fields.push(...lowerVarInits(cls.fields, env));
    fields.forEach((field, i) => classFields.set(field.name, [i, field.value]));
    newClasses.set(cls.name, classFields);
    fieldMap.set(cls.name, fields);
  });
  env.classes = newClasses;
}

export function lowerProgram(p : AST.Program<Type>, env : GlobalEnv) : IR.Program<Type> {
    var blocks : Array<IR.BasicBlock<Type>> = [];
    strVarInits = [];
    strVarStmts = [];
    nameCounters = new Map();
    updateEnv(env, p);
    var firstBlock : IR.BasicBlock<Type> = {  a: p.a, label: generateName("$startProg"), stmts: [] }
    blocks.push(firstBlock);
    var inits = flattenStmts(p.stmts, blocks, env);
    const program = {
        a: p.a,
        fundefs: lowerFunDefs(p.fundefs, env),
        inits: [...inits, ...lowerVarInits(p.inits, env)],
        classes: lowerClasses(p.classes, env),
        body: blocks
    };
    return {...program, strinits: strVarInits, strstmts: strVarStmts};
}

function lowerFunDefs(fs : Array<AST.FunDef<Type>>, env : GlobalEnv) : Array<IR.FunDef<Type>> {
    return fs.map(f => lowerFunDef(f, env)).flat();
}

function lowerFunDef(f : AST.FunDef<Type>, env : GlobalEnv) : IR.FunDef<Type> {
  var blocks : Array<IR.BasicBlock<Type>> = [];
  var firstBlock : IR.BasicBlock<Type> = {  a: f.a, label: generateName("$startFun"), stmts: [] }
  blocks.push(firstBlock);
  var nestedrefinits: IR.VarInit<AST.Type>[]  = [];
  var bodyinits = flattenStmts(f.body, blocks, env);
  var fundefs = lowerFunDefs(f.fundefs, env);
  return {...f, inits: [...bodyinits, ...lowerVarInits(f.inits, env), ...nestedrefinits], fundefs, body: blocks};
}

function lowerVarInits(inits: Array<AST.VarInit<Type>>, env: GlobalEnv) : Array<IR.VarInit<Type>> {
    return inits.map(i => lowerVarInit(i, env));
}

function lowerVarInit(init: AST.VarInit<Type>, env: GlobalEnv) : IR.VarInit<Type> {
    const [inits, stmts, val] = literalToVal(env, init.value);
    strVarInits.push(...inits);
    strVarStmts.push(...stmts);
    return {
        ...init,
        value: val,
    }
}

function lowerClasses(classes: Array<AST.Class<Type>>, env : GlobalEnv) : Array<IR.Class<Type>> {
    return classes.map(c => lowerClass(c, env));
}

function lowerClass(cls: AST.Class<Type>, env : GlobalEnv) : IR.Class<Type> {
    return {
        ...cls,
        fields: lowerVarInits(cls.fields, env),
        methods: lowerFunDefs(cls.methods, env)
    }
}

function literalToVal(env: GlobalEnv, lit: AST.Literal) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>] {
    switch(lit.tag) {
        case "num":
           return [[], [], { ...lit, value: BigInt(lit.value) } ];
        case "bool":
          return [[], [], {...lit} ];
        case "none":
          return [[], [], {...lit } ];
        case "list":
          const newName = generateName("newList");
          const alloc : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: lit.value.length + 1 } };

          const varinits :IR.VarInit<AST.Type>[] = [];
          const varstmts :IR.Stmt<AST.Type>[] = [];
          varstmts.push({
            tag: "store",
            start: { tag: "id", name: newName },
            offset: { tag: "wasmint", value: 0 },
            value: { tag: "num", value: BigInt(lit.value.length) }
          });
          for (let i = 0; i < lit.value.length; i++ ) {
            const f = lit.value[i];
            const [valinits, valstmts, valval] = flattenExprToVal(f, env);
            varinits.push(...valinits);
            varstmts.push(...valstmts);
            varstmts.push({
              tag: "store",
              start: { tag: "id", name: newName },
              offset: { tag: "wasmint", value: i+1 },
              value: valval
            });
          };

          return [
            [ { name: newName, type: lit.type, value: { tag: "none" } }, ...varinits],
            [ { tag: "assign", name: newName, value: alloc }, ...varstmts,
            ],
            { a: lit.type, tag: "id", name: newName }
          ];
        case "str":
          const newStrName = generateName("newStr");
          const allocStr : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: lit.value.length + 1 } };
          const varstmtsStr :IR.Stmt<AST.Type>[] = [];
          varstmtsStr.push({
            tag: "store",
            start: { tag: "id", name: newStrName },
            offset: { tag: "wasmint", value: 0 },
            value: { tag: "num", value: BigInt(lit.value.length) }
          });
          for (let i = 0; i < lit.value.length; i++ ) {
            varstmtsStr.push({
              tag: "store",
              start: { tag: "id", name: newStrName },
              offset: { tag: "wasmint", value: i+1 },
              value: {tag: "num", value: BigInt(lit.value.charCodeAt(i))}
            });
          };

          return [
            [ { name: newStrName, type: STR, value: { tag: "none" } } ],
            [ { tag: "assign", name: newStrName, value: allocStr }, ...varstmtsStr,
            ],
            { a: STR, tag: "id", name: newStrName }
          ];
    }
}

function flattenStmts(s : Array<AST.Stmt<Type>>, blocks: Array<IR.BasicBlock<Type>>, env : GlobalEnv) : Array<IR.VarInit<Type>> {
  var inits: Array<IR.VarInit<Type>> = [];
  s.forEach(stmt => {
    inits.push(...flattenStmt(stmt, blocks, env));
  });
  return inits;
}

function flattenStmt(s : AST.Stmt<Type>, blocks: Array<IR.BasicBlock<Type>>, env : GlobalEnv) : Array<IR.VarInit<Type>> {
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
      var endjmp : IR.Stmt<Type> = { tag: "jmp", lbl: endLbl };
      var [cinits, cstmts, cexpr] = flattenExprToVal(s.cond, env);
      var condjmp : IR.Stmt<Type> = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };
      pushStmtsToLastBlock(blocks, ...cstmts, condjmp);
      blocks.push({  a: s.a, label: thenLbl, stmts: [] })
      var theninits = flattenStmts(s.thn, blocks, env);
      pushStmtsToLastBlock(blocks, endjmp);
      blocks.push({  a: s.a, label: elseLbl, stmts: [] })
      var elseinits :IR.VarInit<Type>[] = [];
      if (s.els) {
        if (Array.isArray(s.els)) {
          elseinits = flattenStmts(s.els, blocks, env);
        } else {
          elseinits = flattenStmt(s.els, blocks, env);
        }
      }
      
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
    case "for":
      var forStartLbl = generateName("$forstart");
      var forbodyLbl = generateName("$forbody");
      var forEndLbl = generateName("$forend");
      var forIteratorName = generateName("$foriterator");
      var forLength = generateName("$forlength");
      var [iterableInits, iterableStmts, iterableVal] = flattenExprToVal(s.iterable, env);
      var [forLengthInits, forLengthStmts, forLengthVal] = flattenIRExprToVal({tag: "builtin1", name: "len", arg: iterableVal}, env);

      var forIteratorStmt :IR.Stmt<AST.Type> = {tag: "assign", name: forIteratorName, value: {tag: "value", value: {tag: "num", value: BigInt(0)}}};
      var forLengthStmt :IR.Stmt<AST.Type> = {tag: "assign", name: forLength, value: {tag: "value", value: forLengthVal}};
      var condExpr :IR.Expr<AST.Type> = {tag: "binop", op: AST.BinOp.Lt, left: {tag: "id", name: forIteratorName}, right: forLengthVal};

      pushStmtsToLastBlock(blocks, ...iterableStmts, ...forLengthStmts, forIteratorStmt, forLengthStmt, { tag: "jmp", lbl: forStartLbl });
      blocks.push({  a: s.a, label: forStartLbl, stmts: [] })
      var [cinits, cstmts, cexpr] = flattenIRExprToVal(condExpr, env);
      pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: forbodyLbl, els: forEndLbl });

      blocks.push({  a: s.a, label: forbodyLbl, stmts: [] })
      pushStmtsToLastBlock(blocks, {tag: "assign", name: s.iterator, value: {tag: "list-load", start: iterableVal, offset: {tag: "id", name: forIteratorName}}});
      var bodyinits = flattenStmts(s.body, blocks, env);
      pushStmtsToLastBlock(blocks, {tag: "assign", name: forIteratorName, value: {tag: "binop", op: AST.BinOp.Plus, right: {tag: "num", value: BigInt(1)}, left: {tag: "id", name: forIteratorName}}});
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: forStartLbl });

      blocks.push({  a: s.a, label: forEndLbl, stmts: [] })

      return [
        {name: forIteratorName, type: NUM, value: {tag: "num", value: BigInt(0)} },
        {name: forLength, type: NUM, value: {tag: "num", value: BigInt(0)} },
        ...cinits, ...bodyinits, ...iterableInits, ...forLengthInits];
    case "for-str":
      var forStartLbl = generateName("$forstart");
      var forbodyLbl = generateName("$forbody");
      var forEndLbl = generateName("$forend");
      var forIteratorName = generateName("$foriterator");
      var forLength = generateName("$forlength");
      var [iterableInits, iterableStmts, iterableVal] = flattenExprToVal(s.iterable, env);
      var [forLengthInits, forLengthStmts, forLengthVal] = flattenIRExprToVal({tag: "builtin1", name: "len", arg: iterableVal}, env);
      
      var forIteratorStmt :IR.Stmt<AST.Type> = {tag: "assign", name: forIteratorName, value: {tag: "value", value: {tag: "num", value: BigInt(0)}}};
      var forLengthStmt :IR.Stmt<AST.Type> = {tag: "assign", name: forLength, value: {tag: "value", value: forLengthVal}};
      var condExpr :IR.Expr<AST.Type> = {tag: "binop", op: AST.BinOp.Lt, left: {tag: "id", name: forIteratorName}, right: forLengthVal};

      pushStmtsToLastBlock(blocks, ...iterableStmts, ...forLengthStmts, forIteratorStmt, forLengthStmt, { tag: "jmp", lbl: forStartLbl });
      blocks.push({  a: s.a, label: forStartLbl, stmts: [] })
      var [cinits, cstmts, cexpr] = flattenIRExprToVal(condExpr, env);
      pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: forbodyLbl, els: forEndLbl });

      blocks.push({  a: s.a, label: forbodyLbl, stmts: [] })
      pushStmtsToLastBlock(blocks, {tag: "assign", name: s.iterator, value: {tag: "str-load", start: iterableVal, offset: {tag: "id", name: forIteratorName}}});
      var bodyinits = flattenStmts(s.body, blocks, env);
      pushStmtsToLastBlock(blocks, {tag: "assign", name: forIteratorName, value: {tag: "binop", op: AST.BinOp.Plus, right: {tag: "num", value: BigInt(1)}, left: {tag: "id", name: forIteratorName}}});
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: forStartLbl });

      blocks.push({  a: s.a, label: forEndLbl, stmts: [] });

      return [
        {name: forIteratorName, type: NUM, value: {tag: "num", value: BigInt(0)} },
        {name: forLength, type: NUM, value: {tag: "num", value: BigInt(0)} },
        ...cinits, ...bodyinits, ...iterableInits, ...forLengthInits];
    case "index-assign": {
      var [oinits, ostmts, oval] = flattenExprToVal(s.obj, env);
      var [ninits, nstmts, nval] = flattenExprToVal(s.value, env);
      var [idxinits, idxstmts, idxval] = flattenExprToVal(s.index, env);
      if(s.obj.a.tag !== "list") { throw new Error("Compiler's cursed, go home."); }
      pushStmtsToLastBlock(blocks,
        ...ostmts, ...nstmts, ...idxstmts, {
          tag: "list-store",
          a: s.a,
          start: oval,
          offset: idxval,
          value: nval
        });
      return [...oinits, ...ninits, ...idxinits];
    }

  }
}

function flattenExprToExpr(e : AST.Expr<Type>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Expr<Type>] {
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
      return [[...linits, ...rinits], [...lstmts, ...rstmts], {
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
      const [objinits, objstmts, objval] = flattenExprToVal(e.obj, env);
      const argpairs = e.arguments.map(a => flattenExprToVal(a, env));
      const arginits = argpairs.map(cp => cp[0]).flat();
      const argstmts = argpairs.map(cp => cp[1]).flat();
      const argvals = argpairs.map(cp => cp[2]).flat();
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
        callMethod
      ];
    }
    case "lookup": {
      const [oinits, ostmts, oval] = flattenExprToVal(e.obj, env);
      if(e.obj.a.tag !== "class") { throw new Error("Compiler's cursed, go home"); }
      const classdata = env.classes.get(e.obj.a.name);
      const [offset, _] = classdata.get(e.field);
      return [oinits, ostmts, {
        tag: "load",
        start: oval,
        offset: { tag: "wasmint", value: offset }}];
    }
    case "index": {
      const [oinits, ostmts, oval] = flattenExprToVal(e.object, env);
      const [idxinits, idxstmts, idxval] = flattenExprToVal(e.index, env);
      if(e.object.a.tag !== "list") { throw new Error("Compiler's cursed, go home"); }
      return [[...idxinits, ...oinits], [...ostmts, ...idxstmts], {
        tag: "list-load",
        start: oval,
        offset: idxval}];
    }
    case "index-str": {
      const [oinits, ostmts, oval] = flattenExprToVal(e.object, env);
      const [idxinits, idxstmts, idxval] = flattenExprToVal(e.index, env);
      if(e.object.a.tag !== "str") { throw new Error("Compiler's cursed, go home"); }
      return [[...idxinits, ...oinits], [...ostmts, ...idxstmts], {
        tag: "str-load",
        start: oval,
        offset: idxval}];
    }
    case "construct":
      const classdata = env.classes.get(e.name);
      const fields = [...classdata.entries()];
      const newName = generateName("newObj");
      const alloc : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: fields.length } };
      const assigns : IR.Stmt<Type>[] = fields.map(f => {
        const [_, [index, value]] = f;
        return {
          tag: "store",
          start: { tag: "id", name: newName },
          offset: { tag: "wasmint", value: index },
          value: value
        }
      });
      const initMethodCall :AST.Expr<Type> = {
        tag: "method-call",
        obj: {tag: "id", name: newName, a: CLASS(e.name)},
        method: "__init__", 
        arguments: [],
        a: NONE
      }
      let [initvals, initstmts, initexpr] = flattenExprToExpr(initMethodCall, env);
      initstmts.push({a: NONE, tag: "expr", expr: initexpr});
      //Init not supported currently
      initvals = [];
      initstmts = [];
      return [
        [ { name: newName, type: e.a, value: { tag: "none" } }, ...initvals],
        [ { tag: "assign", name: newName, value: alloc }, ...assigns,
        ...initstmts
        ],
        { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: newName } }
      ];
    case "id":
      return [[], [], {tag: "value", value: { ...e }} ];
    case "literal":
      const [literalInits, literalStmts, literalVal] = literalToVal(env, e.value);
      return [literalInits, literalStmts, {tag: "value", value: {...literalVal}}];
    case "cond-expr":
      const [condInits, condStmts, condObj] = flattenExprToVal(e.cond, env);
      const [ifObjInits, ifObjStmts, ifObj] = flattenExprToVal(e.ifobj, env);
      const [elseObjInits, elseObjStmts, elseObj] = flattenExprToVal(e.elseobj, env);
      return [
        [...condInits, ...ifObjInits, ...elseObjInits],
        [...condStmts, ...ifObjStmts, ...elseObjStmts], {tag: "cond-expr", cond: condObj, ifobj: ifObj, elseobj: elseObj} ];
  }
}

function flattenIRExprToVal(e : IR.Expr<Type>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>] {
  if(e.tag === "value") {
    return [[], [], e.value];
  }
  else {
    var newName = generateName("valname");
    var setNewName : IR.Stmt<Type> = {
      tag: "assign",
      a: e.a,
      name: newName,
      value: e 
    };
    // TODO: we have to add a new var init for the new variable we're creating here.
    // but what should the default value be?
    return [
      [{ a: e.a, name: newName, type: e.a, value: { tag: "none" } }],
      [setNewName],
      {tag: "id", name: newName, a: e.a}
    ];
  }
}

function flattenExprToVal(e : AST.Expr<Type>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>] {
  var [binits, bstmts, bexpr] = flattenExprToExpr(e, env);
  if(bexpr.tag === "value") {
    return [binits, bstmts, bexpr.value];
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
      {tag: "id", name: newName, a: e.a}
    ];
  }
}

function pushStmtsToLastBlock(blocks: Array<IR.BasicBlock<Type>>, ...stmts: Array<IR.Stmt<Type>>) {
  blocks[blocks.length - 1].stmts.push(...stmts);
}