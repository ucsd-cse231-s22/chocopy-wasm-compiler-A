import * as AST from './ast';
import * as IR from './ir';
import {BinOp, Expr, Literal, Type} from './ast';
import { GlobalEnv } from './compiler';
import {BOOL, NONE, NUM, STR, PyInt, PyLiteralExpr, PyLiteralInt} from "./utils";

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

// function lbl(a: Type, base: string) : [string, IR.Stmt<Type>] {
//   const name = generateName(base);
//   return [name, {tag: "label", a: a, name: name}];
// }

export function lowerProgram(p : AST.Program<Type>, env : GlobalEnv) : IR.Program<Type> {
  var blocks : Array<IR.BasicBlock<Type>> = [];
  var firstBlock : IR.BasicBlock<Type> = {  a: p.a, label: generateName("$startProg"), stmts: [] }
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

function lowerFunDefs(fs : Array<AST.FunDef<Type>>, env : GlobalEnv) : Array<IR.FunDef<Type>> {
  return fs.map(f => lowerFunDef(f, env)).flat();
}

function lowerFunDef(f : AST.FunDef<Type>, env : GlobalEnv) : IR.FunDef<Type> {
  var blocks : Array<IR.BasicBlock<Type>> = [];
  var firstBlock : IR.BasicBlock<Type> = {  a: f.a, label: generateName("$startFun"), stmts: [] }
  blocks.push(firstBlock);
  var bodyinits = flattenStmts(f.body, blocks, env);
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
  return {
    ...cls,
    fields: lowerVarInits(cls.fields, env),
    methods: lowerFunDefs(cls.methods, env)
  }
}

function literalToVal(lit: AST.Literal) : IR.Value<Type> {
  switch(lit.tag) {
    case "num":
      return { ...lit, a: NUM, value: BigInt(lit.value) };
    case "bool":
      return { ...lit, a: BOOL };
    case "str":
      return { ...lit, a: STR };
    case "none":
      return { ...lit, a: NONE };
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
    case "index-assign":
      var [linits, lstmts, lval] = flattenExprToVal(s.list, env);
      var [idxinits, idxstmts, idxval]:any = flattenExprToVal(s.index, env);
      var [vinits, vstmts, vval] = flattenExprToVal(s.value, env);
      if(idxval.tag=="num"){
        idxval.value +=BigInt('1');
      }
      else if(idxval.tag == "id"){
        idxstmts.push({
          a:{tag: "number"},
          tag: "assign",
          name: idxval.name,
          value: {a: {tag: "number"}, tag: "binop", left: idxval, op: 0, right: {tag: "num", value: 1}}
        })
      }
      pushStmtsToLastBlock(blocks,
        ...lstmts, ...idxstmts, ...vstmts, {
          tag: "store",
          a: s.a,
          start: lval,
          offset: idxval,
          value: vval
        });
      return [...linits, ...idxinits, ...vinits];
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

    case "for":
      const idx = generateName("$foridx")
      var idxInit : AST.VarInit<Type> = { a: NONE, name: idx, type: NUM, value: PyLiteralInt(0) };
      var irIdx = lowerVarInit(idxInit, env);
      // if (s.iterable.tag !== "list-obj") throw new Error("Compiler is cursed, go home.")
      var curState : AST.Expr<Type> = {  a: NUM, tag: "list-lookup", list: s.iterable, index: {  a: NUM, tag: "id", name: idx }};
      var assignStmt : AST.Stmt<Type> = {  a: NONE, tag: "assign", name: s.name, value: curState };

      var stepExpr : AST.Expr<Type> = {  a: NUM, tag: "binop", op: BinOp.Plus, left: {  a: NUM, tag: "id", name: idx }, right: PyLiteralExpr(PyInt(1))};
      var stepStmt : AST.Stmt<Type> = {  a: NONE, tag: "assign", name: idx, value: stepExpr };

      var whileBody : Array<AST.Stmt<Type>> = [assignStmt, ...s.body, stepStmt];
      var lenExpr : AST.Expr<Type> = {  a: NUM, tag: "list-length", list: s.iterable}
      var condExpr : AST.Expr<Type> = {  a: BOOL, tag: "binop", op: BinOp.Lt, left: {  a: NUM, tag: "id", name: idx }, right: lenExpr};
      var whileStmt : AST.Stmt<Type> = {  a: NONE, tag: "while", cond: condExpr, body: whileBody };
      return [irIdx, ...flattenStmt(whileStmt, blocks, env)]
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
      
      if (lval.a.tag === "list" && rval.a.tag === "list"){
        var listconstruct:  IR.Stmt<Type>[] = [];
        var newlength = lval.a.listsize+rval.a.listsize
        var listalloc : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: newlength } };
        var listName = generateName("newList");
        var newlistinits:IR.VarInit<AST.Type>[] = [];
        listconstruct.push(  // first element of a list should be length
          {
            tag: "store",
            start: { tag: "id", name: listName },
            offset: { tag: "wasmint", value: 0 },
            value: {tag: "wasmint", value: newlength}
          }
        )
        for(var i=0; i<lval.a.listsize; i++){
          var entryname = generateName("e");
          newlistinits.push({name: entryname, type: (e.a as any).elementtype, value: { tag: "wasmint", value: 0 } })
          listconstruct.push(
            {tag: "assign", 
            name: entryname, 
            value: {tag: "load", start: lval, offset: { tag: "wasmint", value: i+1 }}}
          )
        }
        for(var i=0; i<rval.a.listsize; i++){
          var entryname = generateName("e");
          newlistinits.push({name: entryname, type: (e.a as any).elementtype, value: { tag: "wasmint", value: 0 } })
          listconstruct.push(
            {tag: "assign", 
            name: entryname, 
            value: {tag: "load", start: rval, offset: { tag: "wasmint", value: i+1 }}}
          )
        }
        for(var i=0; i<newlength; i++){
          listconstruct.push(
            {
              tag: "store",
              start: { tag: "id", name: listName },
              offset: { tag: "wasmint", value: i+1 },
              value: { tag: "id", name: (listconstruct[i+1] as any).name }
            }
          )
        }
        return[
          [...linits, ...rinits, ...newlistinits, {name: listName, type: e.a, value: { tag: "none" } }],
          [...lstmts, ...rstmts, { tag: "assign", name: listName, value: listalloc}, ...listconstruct],
          { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: listName } }
        ]
      }
      else{
        return [[...linits, ...rinits], [...lstmts, ...rstmts], {
          ...e,
          left: lval,
          right: rval
        }];
      }
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
      const [oinits, ostmts, oval] = flattenExprToVal(e.obj, env);
      if (e.obj.a !== STR) { throw new Error("Compiler's cursed, go home"); }
      const [iinits, istmts, ival] = flattenExprToVal(e.index, env);
      if (e.index.a !== NUM) { throw new Error("Compiler's cursed, go home"); }

      return [[...oinits, ...iinits], [...ostmts, ...istmts], {tag: "str-index", start: oval, offset: ival} ];
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

      return [
        [ { name: newName, type: e.a, value: { tag: "none" } }],
        [ { tag: "assign", name: newName, value: alloc }, ...assigns,
          { tag: "expr", expr: { tag: "call", name: `${e.name}$__init__`, arguments: [{ a: e.a, tag: "id", name: newName }] } }
        ],
        { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: newName } }
      ];
    case "id":
      return [[], [], {a: e.a, tag: "value", value: { ...e }} ];
    case "literal":
      return [[], [], {a: e.a, tag: "value", value: literalToVal(e.value) } ];
    case "list-obj":
      var flattenentries:[Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>][]= e.entries.map(e =>flattenExprToVal(e, env))
      var listName = generateName("newList");
      var listalloc : IR.Expr<Type> = { tag: "alloc", amount: { tag: "wasmint", value: e.length } };
      var listassign:  IR.Stmt<Type>[] = [];
      var entryinits: Array<IR.VarInit<Type>> = [];
      var entrystmts: Array<IR.Stmt<Type>> = [];
      listassign.push(  // first element of a list should be length
        {
          tag: "store",
          start: { tag: "id", name: listName },
          offset: { tag: "wasmint", value: 0 },
          value: {tag: "wasmint", value: e.length}
        }
      )
      for(var i=0; i<e.length; i++){
        entryinits = entryinits.concat(flattenentries[i][0]);
        entrystmts = entrystmts.concat(flattenentries[i][1]);
        listassign.push(
          {
            tag: "store",
            start: { tag: "id", name: listName },
            offset: { tag: "wasmint", value: i+1 },
            value: flattenentries[i][2]
          }
        )
      }
      return[
        [...entryinits, {name: listName, type: e.a, value: { tag: "none" } }],
        [...entrystmts, { tag: "assign", name: listName, value: listalloc}, ...listassign],
        { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: listName } }
      ]
    case "list-length":
      var [startinits, startstmts, startval] = flattenExprToVal(e.list, env);
      return[
        [...startinits],
        [...startstmts],
        {tag: "load",
          start: startval,
          offset: literalToVal(PyLiteralInt(0))}
      ]
    case "list-lookup":
      var [startinits, startstmts, startval] = flattenExprToVal(e.list, env);
      var [idxinits, idxstmts, idxval]:any = flattenExprToVal(e.index, env);
      if(idxval.tag=="num"){
        idxval.value +=BigInt('1');
        return[
          [...startinits, ...idxinits],
          [...startstmts, ...idxstmts],
          {tag: "load",
          start: startval,
          offset: idxval}
        ]
      }
      else if(idxval.tag == "id"){
        var offset = generateName("offset");
        idxinits.push({name: offset, type: {tag: "number"}, value: {tag:"num", value: 0}})
        idxstmts.push({
          a:{tag: "number"},
          tag: "assign",
          name: offset,
          value: {a: {tag: "number"}, tag: "binop", left: idxval, op: 0, right: {tag: "num", value: 1}}
        })
        return[
          [...startinits, ...idxinits],
          [...startstmts, ...idxstmts],
          {tag: "load",
          start: startval,
          offset: {tag: "id", name: offset}}
        ]
      }

  }
}

function flattenExprToVal(e : AST.Expr<Type>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>] {
  var [binits, bstmts, bexpr] = flattenExprToExpr(e, env);
  if(bexpr.tag === "value") {
    var typedvalue: any = {...bexpr.value, a:bexpr.a};
    return [binits, bstmts, typedvalue];
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