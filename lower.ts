import * as AST from './ast';
import * as IR from './ir';
import { Type, UniOp } from './ast';
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
            return { ...lit, value: BigInt(lit.value) }
        case "bool":
            return lit
        case "none":
            return lit        
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
      if(s.destruct.isSimple === true) {
        var [valinits, valstmts, vale] = flattenExprToExpr(s.value, env);
        var left = s.destruct.vars[0].target;
        switch(left.tag) {
          case "id":
            blocks[blocks.length - 1].stmts.push(...valstmts, { a: s.a, tag: "assign", name: left.name, value: vale});
            return valinits
            // return [valinits, [
            //   ...valstmts,
            //   { a: s.a, tag: "assign", name: s.name, value: vale}
            // ]];
          case "lookup":
            throw new Error("should not reach here");
          default:
            throw new Error("should not reach here");
        }
      } else {
        // desturcturing assignment
        switch(s.value.tag) {
          case "call":
            var outputInits: Array<IR.VarInit<Type>> = [{ a: s.a, name: "_", type: {tag: "number"}, value: { tag: "none" } }];
            var [valinits, valstmts, va] = flattenExprToVal(s.value, env);
            outputInits = outputInits.concat(valinits);
            pushStmtsToLastBlock(blocks, ...valstmts);
            if(va.tag === "id") {
              const nextMethod : IR.Expr<Type> = { tag: "call", name: `iterator$next`, arguments: [va] }
              const hasNextMethod : IR.Expr<Type> = { tag: "call", name: `iterator$hasNext`, arguments: [va] }
              s.destruct.vars.forEach(v => {
                var [inits, stmts, val] = flattenIrExprToVal(hasNextMethod, env);
                outputInits = outputInits.concat(inits);
                const runtimeCheck : IR.Expr<Type> = { tag: "call", name: `destructure_check`, arguments: [] }
                runtimeCheck.arguments.push(val);
                pushStmtsToLastBlock(blocks, ...stmts, { tag: "expr", expr: runtimeCheck })
                switch(v.target.tag) {
                  case "id":
                    pushStmtsToLastBlock(blocks, { a: s.a, tag: "assign", name: v.target.name, value: nextMethod});
                    break;
                  case "lookup":
                    var [oinits, ostmts, oval] = flattenExprToVal(v.target.obj, env);
                    var [ninits, nstmts, nval] = flattenIrExprToVal(nextMethod, env);
                    if(v.target.obj.a.tag !== "class") { throw new Error("Compiler's cursed, go home."); }
                    const classdata = env.classes.get(v.target.obj.a.name);
                    const offset : IR.Value<Type> = { tag: "wasmint", value: classdata.get(v.target.field)[0] };
                    pushStmtsToLastBlock(blocks,
                      ...ostmts, ...nstmts, {
                        tag: "store",
                        a: s.a,
                        start: oval,
                        offset: offset,
                        value: nval
                      });
                    outputInits = outputInits.concat(oinits);
                    outputInits = outputInits.concat(ninits);
                  default:
                    throw new Error("should not reach here");
                }
              });
              // check if iterator has remainning elements
              var [inits1, stmts1, val1] = flattenIrExprToVal(hasNextMethod, env);
              outputInits = outputInits.concat(inits1);
              var remain : IR.Expr<Type> = { tag: "uniop", op: UniOp.Not, expr: val1 };
              var [inits2, stmts2, val2] = flattenIrExprToVal(remain, env);
              outputInits = outputInits.concat(inits2);
              const runtimeCheck : IR.Expr<Type> = { tag: "call", name: `destructure_check`, arguments: [] }
              runtimeCheck.arguments.push(val2);
              pushStmtsToLastBlock(blocks, ...stmts1, ...stmts2, { tag: "expr", expr: runtimeCheck })
              // console.log(JSON.stringify(outputInits, null, 2));
              return outputInits;
            } else {
              throw new Error("should not reach here");
            }
          case "array-expr":
            var outputInits: Array<IR.VarInit<Type>> = [{ a: s.a, name: "_", type: {tag: "number"}, value: { tag: "none" } }];
            var valinits : IR.VarInit<AST.Type>[] = [];
            var valstmts : IR.Stmt<AST.Type>[] = [];
            var vales : IR.Expr<AST.Type>[] = [];
            for(var expr of s.value.elements) {
              var [exprinits, exprstmts, vale] = flattenExprToExpr(expr, env);
              valinits = valinits.concat(exprinits);
              valstmts = valstmts.concat(exprstmts);
              vales.push(vale);
            }
            outputInits = outputInits.concat(valinits);
            pushStmtsToLastBlock(blocks, ...valstmts);
            s.destruct.vars.forEach((v, idx) => {
              switch(v.target.tag) {
                case "id":
                  pushStmtsToLastBlock(blocks, { a: s.a, tag: "assign", name: v.target.name, value: vales[idx]});
                  break;
                case "lookup":
                  var [oinits, ostmts, oval] = flattenExprToVal(v.target.obj, env);
                  var [ninits, nstmts, nval] = flattenIrExprToVal(vales[idx], env);
                  if(v.target.obj.a.tag !== "class") { throw new Error("Compiler's cursed, go home."); }
                  const classdata = env.classes.get(v.target.obj.a.name);
                  const offset : IR.Value<Type> = { tag: "wasmint", value: classdata.get(v.target.field)[0] };
                  pushStmtsToLastBlock(blocks,
                    ...ostmts, ...nstmts, {
                      tag: "store",
                      a: s.a,
                      start: oval,
                      offset: offset,
                      value: nval
                    });
                  outputInits = outputInits.concat(oinits);
                  outputInits = outputInits.concat(ninits);
                default:
                  throw new Error("should not reach here");
              }
            });
            return outputInits;
          default:
            throw new Error("should not reach here");
        }
      }

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
      return [[], [], {tag: "value", value: { ...e }} ];
    case "literal":
      return [[], [], {tag: "value", value: literalToVal(e.value) } ];
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

function flattenIrExprToVal(e : IR.Expr<Type>, env : GlobalEnv) : [Array<IR.VarInit<Type>>, Array<IR.Stmt<Type>>, IR.Value<Type>] {
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

function pushStmtsToLastBlock(blocks: Array<IR.BasicBlock<Type>>, ...stmts: Array<IR.Stmt<Type>>) {
  blocks[blocks.length - 1].stmts.push(...stmts);
}