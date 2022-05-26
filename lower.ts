import * as AST from './ast';
import * as IR from './ir';
import * as ERRORS from './errors';
import { Type, Annotation } from './ast';
import { GlobalEnv } from './compiler';
import { NUM, STRING } from './utils';

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

export function lowerProgram(p : AST.Program<Annotation>, env : GlobalEnv) : IR.Program<Annotation> {
    var blocks : Array<IR.BasicBlock<Annotation>> = [];
    var firstBlock : IR.BasicBlock<Annotation> = {  a: p.a, label: generateName("$startProg"), stmts: [] }
    blocks.push(firstBlock);
    var inits:IR.VarInit<AST.Annotation>[] = flattenStmts(p.stmts, blocks, env);
    inits = [...inits, ...lowerVarInits(p.inits, env, blocks)];
    var classes:IR.Class<AST.Annotation>[] = lowerClasses(inits,p.classes, env,blocks)
    return {
        a: p.a,
        funs: lowerFunDefs(p.funs, env),
        inits: inits,
        classes: classes,
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
    return {...f, inits: [...bodyinits, ...lowerVarInits(f.inits, env,blocks)], body: blocks}
}

function lowerVarInits(inits: Array<AST.VarInit<Annotation>>, env: GlobalEnv,  blocks?: Array<IR.BasicBlock<Annotation>>) : Array<IR.VarInit<Annotation>> {
    return inits.map(i => lowerVarInit(i, env, blocks));
}

function lowerVarInit(init: AST.VarInit<Annotation>, env: GlobalEnv, blocks?: Array<IR.BasicBlock<Annotation>>) : IR.VarInit<Annotation> {
    if (init.value.tag == "str"){
      // new function here
      return lowerStringInits(init, blocks);
    }  

    return {
        ...init,
        value: literalToVal(init.value)
    }
}

function lowerStringInits(init: AST.VarInit<Annotation>,blocks: Array<IR.BasicBlock<Annotation>>):IR.VarInit<Annotation> {
  var lit = init.value;
  if (lit.tag == "str") {
    let v = lit;
    const strLength:number = v.value.length;
    const alloc_string : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: strLength + 1 } };
    var assigns_string : IR.Stmt<Annotation>[] = [];
    assigns_string.push({
      tag: "store",
      start: {tag: "id", name: init.name},
      offset: {tag:"wasmint", value: 0},
      value: {a:{...lit.a,type: NUM} , tag:"wasmint", value:strLength}
    });
    const strArr = parseString(v.value)
    for (var i=1; i<=strLength;i++){
      const ascii = strArr[i-1]
      assigns_string.push({
        tag: "store",
        start: {tag: "id", name: init.name},
        offset: {tag:"wasmint", value: i},
        value: {a:{...lit.a,type: NUM} , tag:"wasmint", value:ascii}
      });
    }
    var valinits: IR.VarInit<Annotation> = { name: init.name, type: init.a.type, value: { tag: "none" } }
    var valstmts:Array<IR.Stmt<Annotation>> = 
      [ { tag: "assign", name: init.name, value: alloc_string }, ...assigns_string,
      ];
    blocks[blocks.length - 1].stmts.unshift(...valstmts);
    return valinits;
  }


}

function lowerClassVarInits(inits: Array<AST.VarInit<Annotation>>, env: GlobalEnv) : Array<IR.VarInit<Annotation>> {

  return inits.map(i => lowerClassVarInit(i, env));
}

function lowerClassVarInit(init: AST.VarInit<Annotation>, env: GlobalEnv) : IR.VarInit<Annotation> {
  return {
    ...init,
    value: literalToVal(init.value)
}
}


function lowerClasses(inits:IR.VarInit<AST.Annotation>[],classes: Array<AST.Class<Annotation>>, env : GlobalEnv, blocks: Array<IR.BasicBlock<Annotation>>) : Array<IR.Class<Annotation>> {
    return classes.map(c => lowerClass(inits,c, env, blocks));
}

function lowerClass(inits:IR.VarInit<Annotation>[],cls: AST.Class<Annotation>, env : GlobalEnv,blocks:Array<IR.BasicBlock<Annotation>>) : IR.Class<Annotation> {

    return {
        ...cls,
        fields: lowerClassVarInits(cls.fields, env),
        methods: lowerFunDefs(cls.methods, env)
    }
}

function literalToVal(lit: AST.Literal<Annotation>) : IR.Value<Annotation> {
    switch(lit.tag) {
        case "num":
            return { ...lit, value: BigInt(lit.value) }
        case "bool":
            return lit
        case "str":
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
      const offset : IR.Value<Annotation> = { tag: "wasmint", value: classdata.get(s.field)[0] };
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
      if (lval.tag == "id") {
        if (lval.a.type == STRING && rval.a.type == STRING) {
          var str_op: IR.Value<null> = {tag: "wasmint", value: 0};
          if (e.op == AST.BinOp.Eq) {
            str_op = {...str_op, value: 1};
          }
          return [[...linits, ...rinits], [...lstmts, ...rstmts, ...checkDenom], {
            tag: "str_compare",
            op: str_op,
            left: lval,
            right: rval
          }];
        }
      }

      return [[...linits, ...rinits], [...lstmts, ...rstmts,...checkDenom], {
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
      if(objTyp.type.tag !== "class") { // I don't think this error can happen
        throw new Error("Report this as a bug to the compiler developer, this shouldn't happen " + objTyp.type.tag);
      }
      const className = objTyp.type.name;
      const checkObj : IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(e.a, objval);
      const callMethod : IR.Expr<Annotation> = { tag: "call", name: `${className}$${e.method}`, arguments: [objval, ...argvals] }
      return [
        [...objinits, ...arginits],
        [...objstmts, checkObj, ...argstmts],
        callMethod
      ];
    }
    case "lookup": {
      const [oinits, ostmts, oval] = flattenExprToVal(e.obj, env);
      if(e.obj.a.type.tag !== "class") { throw new Error("Compiler's cursed, go home"); }
      const classdata = env.classes.get(e.obj.a.type.name);
      const [offset, _] = classdata.get(e.field);
      const checkObj : IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(e.a, oval);
      return [oinits, [...ostmts, checkObj], {
        tag: "load",
        start: oval,
        offset: { tag: "wasmint", value: offset }}];
    }
    case "index": {
      if (e.a.type == STRING){
        var [indexoinits, indexostmts, indexoval] = flattenExprToVal(e.obj, env);
        const [_3, _4, indexval] = flattenExprToVal(e.index, env)
        var index_offset: number = 0;
        if (indexval.tag == "num") 
        index_offset = Number(indexval.value) + 1
        const loadStmt:IR.Expr<Annotation> = {
          tag: "load",
          start: indexoval,
          offset: { tag: "wasmint", value: index_offset }
        };
        const alloc_index_string : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: 2 } };
        var assigns_index_string : IR.Stmt<Annotation>[] = [];
        const newIndexStrName = generateName("newStr"); 
        const newIndexStrName2 = generateName("newStr"); 
        assigns_index_string.push({
          tag: "store",
          start: {tag: "id", name: newIndexStrName},
          offset: {tag:"wasmint", value: 0},
          value: {a:{...e.a,type:NUM} , tag:"wasmint", value:1}
        });
          assigns_index_string.push({
            tag: "store",
            start: {tag: "id", name: newIndexStrName},
            offset: {tag:"wasmint", value: 1},
            value: { a: {...e.a,type:NUM}, tag: "id", name: newIndexStrName2 }
          });
        
          indexoinits.push({ name: newIndexStrName, type: STRING, value: { tag: "none" } });
          indexoinits.push({ name: newIndexStrName2, type: NUM, value:{tag:"wasmint",value:0} });
        return [indexoinits, 
          [...indexostmts, { tag: "assign", name: newIndexStrName, value: alloc_index_string },{ tag: "assign", name: newIndexStrName2, value: loadStmt}, ...assigns_index_string,], 
          {  tag: "value", value: { a: e.a, tag: "id", name: newIndexStrName } }];
        }else{//This is for other group like lists/dictionary/sets/tuples
          return;
        }
    }
    case "construct":
      const classdata = env.classes.get(e.name);
      const fields = [...classdata.entries()];
      const newName = generateName("newObj");
      const alloc : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: fields.length } };
      const newassigns: IR.Stmt<Annotation>[] = [];
      var initsArray: Array<IR.VarInit<Annotation>> = [];
      initsArray.push({ name: newName, type: e.a.type, value: { tag: "none" } });
      fields.forEach( f=>{

        const [_, [index, value]] = f;
        if (value.tag != "str"){
          var storestmt:IR.Stmt<Annotation> = {
            tag: "store",
            start: { tag: "id", name: newName },
            offset: { tag: "wasmint", value: index },
            value: value
          };
          newassigns.push(storestmt);
        }else{//Now it is a string
          const addressVar = generateName("addressVar");
          const strLength = value.value.length;
          //newassigns.push({ tag: "assign", name: newName, value: str_alloc });
          //Push string address into the memory
          const get_address: IR.Expr<Annotation> = {tag: "alloc",amount: { tag: "wasmint", value: 0 }}

          let v = value;
          const alloc_string : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: strLength + 1 } };
          //var assigns_string : IR.Stmt<Type>[] = [];
          const newStrName1 = generateName("newStr"); 
          initsArray.push({ name: newStrName1, type: e.a.type, value: { tag: "none" } });
          initsArray.push({ name: addressVar, type: NUM, value: { tag: "wasmint", value: 0 } });
          newassigns.push({ tag: "assign", name: addressVar, value: get_address })
          newassigns.push({ tag: "assign", name: newStrName1, value: alloc_string })
          newassigns.push({
            tag: "store",
            start: {tag: "id", name: newName},
            offset: {tag:"wasmint", value: index},
            value: { a: {...e.a,type:NUM}, tag: "id", name: addressVar }
          });
          newassigns.push({
            tag: "store",
            start: {tag: "id", name: newStrName1},
            offset: {tag:"wasmint", value: 0},
            value: {a:{...e.a,type:NUM} , tag:"wasmint", value:strLength}
          });
          const strArr = parseString(v.value)
          for (var i=1; i<=strLength;i++){
            const ascii = strArr[i-1]
            newassigns.push({
              tag: "store",
              start: {tag: "id", name: newStrName1},
              offset: {tag:"wasmint", value: i},
              value: {a:{...e.a,type:NUM} , tag:"wasmint", value:ascii}
            });
          }
        }
        
      })


      return [
        initsArray,
        [ 
        { tag: "assign", name: newName, value: alloc }, ...newassigns,
          { tag: "expr", expr: { tag: "call", name: `${e.name}$__init__`, arguments: [{ a: e.a, tag: "id", name: newName }] } }
        ],
        { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: newName } }
      ];
    case "id":
      return [[], [], {a: e.a, tag: "value", value: { ...e }} ];
    case "literal":
      if (e.value.tag == "str") {
        let v = e.value;
        const strLength:number = v.value.length;
        const alloc_string : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: strLength + 1 } };
        var assigns_string : IR.Stmt<Annotation>[] = [];
        const newStrName = generateName("newStr"); 
        assigns_string.push({
          tag: "store",
          start: {tag: "id", name: newStrName},
          offset: {tag:"wasmint", value: 0},
          value: {a:{...e.a,type:NUM} , tag:"wasmint", value:strLength}
        });
        const strArr = parseString(v.value)
        for (var i=1; i<=strLength;i++){
          const ascii = strArr[i-1]
          assigns_string.push({
            tag: "store",
            start: {tag: "id", name: newStrName},
            offset: {tag:"wasmint", value: i},
            value: {a:{...e.a,type:NUM} , tag:"wasmint", value:ascii}
          });
        }
        return [
          [ { name: newStrName, type: e.a.type, value: { tag: "none" } }],
          [ { tag: "assign", name: newStrName, value: alloc_string }, ...assigns_string,
          ],
          {  tag: "value", value: { a: e.a, tag: "id", name: newStrName } }
        ];
      }

      return [[], [], {a: e.a, tag: "value", value: literalToVal(e.value) } ];
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

function parseString(strArr: string[]) : number[] {
  let res: number[] = []
  for(var i = 0; i < strArr.length; i++) {
    const curString = strArr[i]
    if (curString.length == 1) {
      res.push(curString.charCodeAt(0))
    }
    else {
      switch (curString){
        case "\\t":
          res.push(9)
          break
        case "\\n":
          res.push(10)
          break
        case "\\\\":
          res.push(92)
          break
        case '\\"':
          res.push(34)
          break
      }
    }
  }
  return res
}
export function flattenWasmInt(val: number): IR.Value<Annotation>{
  return { tag: "wasmint", value: val }
}
