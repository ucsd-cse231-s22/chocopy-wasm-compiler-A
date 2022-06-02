import * as AST from './ast';
import * as IR from './ir';
import { Type, UniOp, Annotation } from './ast';
import * as ERRORS from './errors';
import { GlobalEnv } from './compiler';
import { APPLY, CLASS, createMethodName, BOOL, NONE, NUM } from './utils';

let nameCounters : Map<string, number> = new Map();
export function resetNameCounters() {
  nameCounters = new Map();
}
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

export function closureName(f: string, ancestors: Array<AST.FunDef<Annotation>>): string {
  return `${[f, ...ancestors.map(f => f.name)].reverse().join("_$")}_$closure$`;
}

// function lbl(a: Type, base: string) : [string, IR.Stmt<Type>] {
//   const name = generateName(base);
//   return [name, {tag: "label", a: a, name: name}];
// }
var blocks : Array<IR.BasicBlock<Annotation>> = [];
export function lowerProgram(p : AST.Program<Annotation>, env : GlobalEnv) : IR.Program<Annotation> {
    blocks = [];
    var firstBlock : IR.BasicBlock<Annotation> = {  a: p.a, label: generateName("$startProg"), stmts: [] }
    blocks.push(firstBlock);
    p.funs.forEach(f => env.functionNames.set(f.name, closureName(f.name, [])));
    var [closures, cinits, cstmts] = lowerFunDefs(p.funs, env);
    [...closures, ...p.classes].forEach(cls => {
      env.classIndices.set(cls.name, env.vtableMethods.length)
      env.vtableMethods.push(...cls.methods
        .filter(method => !method.name.includes("__init__"))
        .map((method): [string, number] => [createMethodName(cls.name, method.name), method.parameters.length]));
    });

    var classes = lowerClasses([...closures, ...p.classes], env);
    var [inits, generatedClasses] = flattenStmts([...cstmts, ...p.stmts], blocks, env);
    return {
        a: p.a,
        funs: [],
        inits: [...inits, ...lowerVarInits([...cinits, ...p.inits], env)],
        classes: [...classes, ...generatedClasses],
        body: blocks
    }
}

function lowerFunDefs(
  fs: Array<AST.FunDef<Annotation>>,
  env: GlobalEnv
): [Array<AST.Class<Annotation>>, Array<AST.VarInit<Annotation>>, Array<AST.Stmt<Annotation>>] {
  const defs = fs.map(f => lowerFunDef(f, env, []));
  return [defs.map(x => x[0]).flat(), defs.map(x => x[1]), defs.map(x => x[2])];
}

function lowerFunDef(
  f: AST.FunDef<Annotation>,
  env: GlobalEnv,
  ancestors: Array<AST.FunDef<Annotation>>
): [Array<AST.Class<Annotation>>, AST.VarInit<Annotation>, AST.Stmt<Annotation>] {
  var name = closureName(f.name, ancestors);
  var type: Type = CLASS(name);
  var self: AST.Parameter<Annotation> = { name: "self", type };

  var envCopy = { ...env, functionNames: new Map(env.functionNames) };
  f.children.forEach(c => envCopy.functionNames.set(c.name, closureName(c.name, [f, ...ancestors])));

  var defs = f.children.map(x => lowerFunDef(x, envCopy, [f, ...ancestors]));
  var assignable : AST.Assignable<Annotation> = { tag: "id", name: f.name };
  var assignVar : AST.AssignVar<Annotation> = { target: assignable, ignorable: false, star: false };
  var destructureAss : AST.DestructuringAssignment<Annotation> = { isSimple: true, vars: [assignVar] };
  var assignStmt: AST.Stmt<Annotation> = { tag: "assign", destruct: destructureAss, value: { a: { type }, tag: "construct", name } }
  var varInit: AST.VarInit<Annotation> = { name: f.name, type, value: { tag: "none" } }
  // TODO(pashabou): children, populate fields and methods of closure class
  return [
    [{
      name,
      fields: [],
      methods: [
        {
          name: "__init__",
          parameters: [self],
          ret: f.ret,
          inits: [],
          body: [],
          nonlocals: [],
          children: []
        },
        {
          ...f,
          name: APPLY,
          parameters: [self, ...f.parameters],
          inits: [varInit, ...defs.map(x => x[1]), ...f.inits],
          body: [assignStmt, ...defs.map(x => x[2]), ...f.body]
        }
      ],
      typeParams: []
    }, ...defs.map(x => x[0]).flat()],
    varInit,
    assignStmt
  ];
}

function lowerMethodDefs(fs : Array<AST.FunDef<Annotation>>, env : GlobalEnv) : [Array<IR.Class<Annotation>>, Array<IR.FunDef<Annotation>>] {
  const defs = fs.map(f => lowerMethodDef(f, env));
  return [defs.map(x => x[0]).flat(), defs.map(x => x[1])];
}

function lowerMethodDef(f : AST.FunDef<Annotation>, env : GlobalEnv) : [Array<IR.Class<Annotation>>, IR.FunDef<Annotation>] {
  var blocks : Array<IR.BasicBlock<Annotation>> = [];
  var firstBlock : IR.BasicBlock<Annotation> = {  a: f.a, label: generateName("$startFun"), stmts: [] }
  blocks.push(firstBlock);
  var [bodyinits, classes] = flattenStmts(f.body, blocks, env);
  return [classes, { ...f, inits: [...bodyinits, ...lowerVarInits(f.inits, env)], body: blocks }];
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
    return classes.map(c => lowerClass(c, env)).flat();
}

function lowerClass(cls: AST.Class<Annotation>, env : GlobalEnv) : Array<IR.Class<Annotation>> {
  // init not in vtable 
  // (we currently do no reordering, we leave that to inheritance team)
  const [classes, methods] = lowerMethodDefs(cls.methods, env);
  return [
    ...classes,
    {
      ...cls,
      fields: lowerVarInits(cls.fields, env),
      methods
    }
  ];
}

function literalToVal(lit: AST.Literal<Annotation>) : IR.Value<Annotation> {
  switch(lit.tag) {
    case "num":
    case "bool":
    case "none":
        return lit
  }
}

function flattenStmts(s : Array<AST.Stmt<Annotation>>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Class<Annotation>>] {
  var inits: Array<IR.VarInit<Annotation>> = [];
  var classes: Array<IR.Class<Annotation>> = [];
  s.forEach(stmt => {
    const res = flattenStmt(stmt, blocks, env);
    inits.push(...res[0]);
    classes.push(...res[1]);
  });
  return [inits, classes];
}

function flattenListComp(e: any, env : GlobalEnv, blocks: Array<IR.BasicBlock<Annotation>>) : [Array<IR.VarInit<Annotation>>, Array<IR.Stmt<Annotation>>, IR.Expr<Annotation>, Array<IR.Class<Annotation>>] {
  const newListName = generateName("newList");
  const newListIterator = generateName("newListIterator");
  const newListLen = generateName("newListLen");
  var lengthCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:e.iterable, method:"len", arguments:[], a:{ ...e.a, type: NUM }};
  var lengthassignable : AST.Assignable<AST.Annotation> = { tag: "id", name: newListLen };
  var lengthassignVar : AST.AssignVar<AST.Annotation> = { target: lengthassignable, ignorable: false, star: false };
  var lengthdestructureAss : AST.DestructuringAssignment<AST.Annotation> = { isSimple: true, vars: [lengthassignVar] };
  var lengthAssign : AST.Stmt<AST.Annotation>[] = [{tag:"assign", destruct: lengthdestructureAss, value: lengthCall,a:{ ...e.a, type: NONE }}];
  var [lengthinits,lengthclasses] = flattenStmts(lengthAssign, blocks, localenv);
  
  const listAlloc: IR.Expr<Annotation> = {
    tag: "alloc",
    amount: {tag:"id",name:newListLen},
  };
  var storeBigLength: IR.Stmt<Annotation> = {
    tag: "store",
    start: { tag: "id", name: newListName },
    offset: { tag: "wasmint", value: 0 },
    value: {tag:"id",name:newListLen},
  };
  var storeLength: IR.Stmt<Annotation> = {
    tag: "store",
    start: { tag: "id", name: newListName },
    offset: { tag: "wasmint", value: 1 },
    value: {tag:"id",name:newListLen}
  };
  pushStmtsToLastBlock(blocks, { tag: "assign", name: newListName, value: listAlloc });
  pushStmtsToLastBlock(blocks, storeBigLength);
  pushStmtsToLastBlock(blocks, storeLength);
  var compPreStartLbl = generateName("$compprestart");
  var compStartLbl = generateName("$compstart");
  var compbodyLbl = generateName("$compbody");
  var compEndLbl = generateName("$compend");
  var listAddLbl = generateName("$listadd");
  // var newListName = generateName("$newList");
  var localenv = env;
  localenv.labels.push(compStartLbl,compbodyLbl,compEndLbl,listAddLbl);

  // start
  blocks.push({  a: e.a, label: compStartLbl, stmts: [] })
  // a.hasNext() call
  var hasNextCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:e.iterable, method:"hasNext", arguments:[], a:{...e.a,type:BOOL}};
  var [cinits, cstmts, cexpr, ceclass] = flattenExprToVal(hasNextCall, blocks, localenv);
  pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: compbodyLbl, els: compEndLbl });
  // console.log(cinits, cstmts, cexpr);

  // body
  blocks.push({  a: e.a, label: compbodyLbl, stmts: [] })

  var iterCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:e.iterable, method:"iterator", arguments:[], a:{ ...e.a, type: NUM }};
  var iter_assignable : AST.Assignable<AST.Annotation> = { tag: "id", name: newListIterator };
  var iter_assignVar : AST.AssignVar<AST.Annotation> = { target: iter_assignable, ignorable: false, star: false };
  var iter_destructureAss : AST.DestructuringAssignment<AST.Annotation> = { isSimple: true, vars: [iter_assignVar] };
  var iter_tAssign : AST.Stmt<AST.Annotation>[] = [{tag:"assign", destruct: iter_destructureAss, value: iterCall,a:{ ...e.a, type: NONE }}];
  var [iterinits,iterclasses] = flattenStmts(iter_tAssign, blocks, localenv);
  
  // assign a.next() to elem
  var nextCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:e.iterable, method:"next", arguments:[], a:{ ...e.a, type: NUM }};
  var elem = "";
  if(e.elem.tag == "id")
    elem = e.elem.name;
  var assignable : AST.Assignable<AST.Annotation> = { tag: "id", name: elem };
  var assignVar : AST.AssignVar<AST.Annotation> = { target: assignable, ignorable: false, star: false };
  var destructureAss : AST.DestructuringAssignment<AST.Annotation> = { isSimple: true, vars: [assignVar] };
  var nextAssign : AST.Stmt<AST.Annotation>[] = [{tag:"assign", destruct: destructureAss, value: nextCall,a:{ ...e.a, type: NONE }}];
  var [bodyinits,bodyclasses] = flattenStmts(nextAssign, blocks, localenv);

  // cond
  if (e.cond){
    var [dinits, dstmts, dexpr, declass] = flattenExprToVal(e.cond, blocks, localenv);
    pushStmtsToLastBlock(blocks, ...dstmts, { tag: "ifjmp", cond: dexpr, thn: listAddLbl, els: compStartLbl });
    // console.log("dinits", dinits, "dstmts", dstmts, "dexpr", dexpr);
  } else {
    pushStmtsToLastBlock(blocks, {tag:"jmp", lbl: listAddLbl});
  }

  // list add
  blocks.push({  a: e.a, label: listAddLbl, stmts: [] })
  // do left expr
  var [binits, bstmts, bexpr, beclass] = flattenExprToVal(e.left, blocks, localenv);
  bodyinits.concat(binits);
  // console.log("binits", binits, "bstmts", bstmts, "bexpr", bexpr, "bodyinits", bodyinits);

  // display (NEED TO ADD TO ARRAY)
  var displayExpr : AST.Expr<AST.Annotation> = {tag:"builtin1", name:"print", arg:e.left, a:e.left.a};
  var disp: AST.Stmt<AST.Annotation> = {tag:"expr", expr: displayExpr, a:{ ...e.a, type: NONE }};
  // var [einits, estmts, eexpr] = flattenExprToVal(displayExpr, localenv);
  var [body_init, body_class] = flattenStmt(disp, blocks, localenv);
  console.log("disp",disp);
  var storeExpr : IR.Stmt<Annotation> = {
    tag: "store",
    start: { tag: "id", name: newListName },
    offset: {tag:"id",name: newListIterator},
    value: bexpr,
  };
  bodyinits.concat(body_init);
  // console.log("einits", einits, "estmts", estmts, "eexpr", eexpr);
  pushStmtsToLastBlock(blocks, ...bstmts, storeExpr, {tag:"jmp", lbl: compStartLbl});

  // end
  blocks.push({  a: e.a, label: compEndLbl, stmts: [] })
  var return_type_a = e.a;
  return_type_a.type = {tag:"list",itemType:{tag:"number"}};
  if (e.cond)
    return [[...cinits, ...bodyinits, ...body_init, ...dinits, ...binits]
      , [...cstmts, ...dstmts, ...bstmts]
      , {
        a: e.a,
        tag: "value",
        value: {
          a: { ...e.a, type: NUM },
          tag: "id",
          name: elem
        },
      },[...ceclass, ...bodyclasses, ...body_class, ...declass, ...beclass]]
  else
    return [[...iterinits,...lengthinits, ...cinits, ...bodyinits, ...body_init, ...binits,
      {
        name: newListName,
        type: e.a.type,
        value: { a: e.a, tag: "none" },
      },
      {
        name: newListLen,
        type: e.a.type,
        value: { a: e.a, tag: "none" }
      },
      {
        name: newListIterator,
        type: e.a.type,
        value: { a: e.a, tag: "none" }
      }]
      , [...cstmts, ...bstmts]
      , {
          a: return_type_a,
          tag: "value",
          value: {
            a: e.a,
            tag: "id",
            name: newListName
        },
      },[...iterclasses,...lengthclasses, ...ceclass, ...bodyclasses, ...body_class, ...beclass]]
}


function flattenStmt(s : AST.Stmt<Annotation>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Class<Annotation>>] {
  switch(s.tag) {
    case "assign":
      if(s.destruct.isSimple === true) {
        var [valinits, valstmts, vale, classes] = flattenExprToExpr(s.value, blocks, env);
        var left = s.destruct.vars[0].target;
        switch(left.tag) {
          case "id":
            blocks[blocks.length - 1].stmts.push(...valstmts, { a: s.a, tag: "assign", name: left.name, value: vale});
            return [valinits, classes];
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
            var outputInits: Array<IR.VarInit<Annotation>> = [{ a: s.a, name: "_", type: {tag: "number"}, value: { tag: "none" } }];
            var outputClasses: Array<IR.Class<Annotation>> = [];
            var [valinits, valstmts, va, classes] = flattenExprToVal(s.value, blocks, env);
            outputInits = outputInits.concat(valinits);
            outputClasses = outputClasses.concat(classes);
            pushStmtsToLastBlock(blocks, ...valstmts);
            if(va.tag === "id") {
              const nextMethod : IR.Expr<Annotation> = { a: {type: {tag: "number"}}, tag: "call", name: `iterator$next`, arguments: [va] }
              const hasNextMethod : IR.Expr<Annotation> = { a: {type: {tag: "bool"}}, tag: "call", name: `iterator$hasNext`, arguments: [va] }
              s.destruct.vars.forEach(v => {
                var [inits, stmts, val, cls] = flattenIrExprToVal(hasNextMethod, env);
                outputInits = outputInits.concat(inits);
                outputClasses = outputClasses.concat(cls);
                const runtimeCheck : IR.Expr<Annotation> = { tag: "call", name: `destructure_check`, arguments: [] }
                runtimeCheck.arguments.push(val);
                pushStmtsToLastBlock(blocks, ...stmts, { tag: "expr", expr: runtimeCheck })
                switch(v.target.tag) {
                  case "id":
                    pushStmtsToLastBlock(blocks, { a: s.a, tag: "assign", name: v.target.name, value: nextMethod});
                    break;
                  case "lookup":
                    var [oinits, ostmts, oval, oclasses] = flattenExprToVal(v.target.obj, blocks, env);
                    var [ninits, nstmts, nval, nclasses] = flattenIrExprToVal(nextMethod, env);
                    if(v.target.obj.a.type.tag !== "class") { throw new Error("Compiler's cursed, go home."); }
                    const classdata = env.classes.get(v.target.obj.a.type.name);
                    const offset : IR.Value<Annotation> = { tag: "wasmint", value: classdata.get(v.target.field)[0] };
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
                    outputClasses = outputClasses.concat(oclasses);
                    outputClasses = outputClasses.concat(nclasses);
                    break;
                  default:
                    throw new Error("should not reach here");
                }
              });
              // check if iterator has remainning elements
              var [inits1, stmts1, val1, classes1] = flattenIrExprToVal(hasNextMethod, env);
              outputInits = outputInits.concat(inits1);
              outputClasses = outputClasses.concat(classes1);
              var remain : IR.Expr<Annotation> = { a: {type: {tag: "bool"}}, tag: "uniop", op: UniOp.Not, expr: val1 };
              var [inits2, stmts2, val2, classes2] = flattenIrExprToVal(remain, env);
              outputInits = outputInits.concat(inits2);
              outputClasses = outputClasses.concat(classes2);
              const runtimeCheck : IR.Expr<Annotation> = { tag: "call", name: `destructure_check`, arguments: [] }
              runtimeCheck.arguments.push(val2);
              pushStmtsToLastBlock(blocks, ...stmts1, ...stmts2, { tag: "expr", expr: runtimeCheck })
              // console.log(JSON.stringify(outputInits, null, 2));
              return [outputInits, outputClasses];
            } else {
              throw new Error("should not reach here");
            }
          case "array-expr":
            var outputInits: Array<IR.VarInit<Annotation>> = [{ a: s.a, name: "_", type: {tag: "number"}, value: { tag: "none" } }];
            var outputClasses: Array<IR.Class<Annotation>> = [];
            var valinits : IR.VarInit<AST.Annotation>[] = [];
            var valstmts : IR.Stmt<AST.Annotation>[] = [];
            var vales : IR.Expr<AST.Annotation>[] = [];
            for(var expr of s.value.elements) {
              var [exprinits, exprstmts, vale, classes] = flattenExprToExpr(expr, blocks, env);
              valinits = valinits.concat(exprinits);
              valstmts = valstmts.concat(exprstmts);
              vales.push(vale);
              outputClasses = outputClasses.concat(classes);
            }
            outputInits = outputInits.concat(valinits);
            pushStmtsToLastBlock(blocks, ...valstmts);
            s.destruct.vars.forEach((v, idx) => {
              switch(v.target.tag) {
                case "id":
                  pushStmtsToLastBlock(blocks, { a: s.a, tag: "assign", name: v.target.name, value: vales[idx]});
                  break;
                case "lookup":
                  var [oinits, ostmts, oval, oclasses] = flattenExprToVal(v.target.obj, blocks, env);
                  var [ninits, nstmts, nval, nclasses] = flattenIrExprToVal(vales[idx], env);
                  if(v.target.obj.a.type.tag !== "class") { throw new Error("Compiler's cursed, go home."); }
                  const classdata = env.classes.get(v.target.obj.a.type.name);
                  const offset : IR.Value<Annotation> = { tag: "wasmint", value: classdata.get(v.target.field)[0] };
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
                  outputClasses = outputClasses.concat(oclasses);
                  outputClasses = outputClasses.concat(nclasses);
                  break;
                default:
                  throw new Error("should not reach here");
              }
            });
            return [outputInits, outputClasses];
          default:
            throw new Error("should not reach here");
        }
      }

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
      return [[...oinits, ...ninits], oclasses.concat(nclasses)];
    }

    case "index-assign": {
      var [oinits, ostmts, oval, oclasses] = flattenExprToVal(s.obj, blocks, env);
      var [iinits, istmts, ival, _ignore_use_ix_below] = flattenExprToVal(s.index, blocks, env);
      var [ninits, nstmts, nval, nclasses] = flattenExprToVal(s.value, blocks, env);
      if (s.obj.a.type.tag !== "list") {
        throw new Error("Compiler's cursed, go home.");
      }

      var noneCheck: IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(s.a, oval);
      var lenVar = generateName("listLen");
      var lenStmt: IR.Stmt<Annotation> = {
        a: {...ival.a, type: {tag: "number"}},
        tag: "assign",
        name: lenVar,
        value: {
          a: {...ival.a, type: {tag: "number"}},
          tag: "load",
          start: oval,
          offset: {a: {...ival.a, type: {tag: "number"}}, tag: "wasmint", value: 1}
        }
      };
      var idxi32: IR.Expr<Annotation> = { a: {...ival.a, type: {tag: "number"}}, tag: "call", name: "$bignum_to_i32", arguments: [ival] } 
      var idxi32Name = generateName("valname");
      var setidxi32Name : IR.Stmt<Annotation> = {
        tag: "assign",
        a: ival.a,
        name: idxi32Name,
        value: idxi32
      };
      var boundsCheckStmt: IR.Stmt<Annotation> = ERRORS.flattenIndexOutOfBounds(s.a, {...ival.a, tag: "id", name: idxi32Name}, {a: {...ival.a, type: {tag: "number"}}, tag: "id", name: lenVar});

      pushStmtsToLastBlock(blocks, ...ostmts, noneCheck, ...istmts, ...nstmts, lenStmt, setidxi32Name, boundsCheckStmt);

      var indexAdd: AST.Expr<Annotation> = {
        a: {...ival.a, type: {tag: "number"}},
        tag: "binop",
        op: AST.BinOp.Plus,
        left: s.index,
        right: {a: {...ival.a, type: {tag: "number"}}, tag: "literal", value: {tag: "num", value: 2n}}
      };
      var [ixits, ixstmts, ixexpr, ixclasses] = flattenExprToVal(indexAdd, blocks, env);
      var idxi32Add: IR.Expr<Annotation> = { a: {...ixexpr.a, type: {tag: "number"}}, tag: "call", name: "$bignum_to_i32", arguments: [ixexpr] } 
      var idxi32AddName = generateName("valname");
      var setidxi32AddName : IR.Stmt<Annotation> = {
        tag: "assign",
        a: ixexpr.a,
        name: idxi32AddName,
        value: idxi32Add
      };
      var storeStmt: IR.Stmt<Annotation> = {
        tag: "store",
        a: {...nval.a, type: {tag: "none"}},
        start: oval,
        //@ts-ignore
        offset: {...ixexpr.a, tag: "id", name: idxi32AddName},
        value: nval,
      };
      pushStmtsToLastBlock(blocks, ...ixstmts, setidxi32AddName, storeStmt);

      return [[...oinits, ...iinits, ...ninits, { a: ival.a, name: idxi32Name, type: ival.a.type, value: { tag: "none" } }, { a: ixexpr.a, name: idxi32AddName, type: ixexpr.a.type, value: { tag: "none" } },
        {
          name: lenVar,
          type: {tag: "number"},
          value: { a: {...nval.a, type: {tag: "number"}}, tag: "none" },
        },
        ...ixits],
        [...oclasses, ...nclasses, ...ixclasses ]
      ];
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
      var [cinits, cstmts, cexpr, cclasses] = flattenExprToVal(s.cond, blocks, env);
      var condjmp : IR.Stmt<Annotation> = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };
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

      //pushing labels to utilize them for continue and break statements
      env.labels.push(whileStartLbl,whilebodyLbl,whileEndLbl)
      
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl })
      blocks.push({  a: s.a, label: whileStartLbl, stmts: [] })
      var [cinits, cstmts, cexpr, cclasses] = flattenExprToVal(s.cond, blocks, env);
      pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: whilebodyLbl, els: whileEndLbl });

      blocks.push({  a: s.a, label: whilebodyLbl, stmts: [] })
      var [bodyinits, bodyclasses] = flattenStmts(s.body, blocks, env);
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl });

      blocks.push({  a: s.a, label: whileEndLbl, stmts: [] })

      return [[...cinits, ...bodyinits], [...cclasses, ...bodyclasses]]
    case "continue":
      if(env.labels.length > 2)
        pushStmtsToLastBlock(blocks, { tag: "jmp", lbl:  env.labels[env.labels.length-3]})
      return [[], []]
    case "break":
      if(env.labels.length > 0)
        pushStmtsToLastBlock(blocks, { tag: "jmp", lbl:  env.labels[env.labels.length-1]})
      return [[], []]
    case "for":
      var forStartLbl = generateName("$forstart");
      var forbodyLbl = generateName("$forbody");
      var forEndLbl = generateName("$forend");
      var localenv = env

      localenv.labels.push(forStartLbl,forbodyLbl,forEndLbl)
      // reset the values class to the original state at the start of the loop - nested loops use case
      var resetCall : AST.Expr<AST.Annotation> =  {tag:"method-call", obj:s.values, method:"reset", arguments:[], a:{...s.a, type: NONE}};
      var resetStmt : AST.Stmt<AST.Annotation>[] = [{ tag: "expr", expr: resetCall , a:{ ...s.a, type: NONE }}];
      flattenStmts(resetStmt, blocks, localenv); 
      
      pushStmtsToLastBlock(blocks, {tag:"jmp", lbl: forStartLbl })
      blocks.push({  a: s.a, label: forStartLbl, stmts: [] })
      
      var hasnextCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:s.values, method:"hasnext", arguments:[], a:{...s.a, type: BOOL}}
      var nextCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:s.values, method:"next", arguments:[], a: s.a}
      
      var [cinits, cstmts, cexpr] = flattenExprToVal(hasnextCall, blocks, localenv); 
      pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: forbodyLbl, els: forEndLbl });
    
      blocks.push({  a: s.a, label: forbodyLbl, stmts: [] })
      var assignable : AST.Assignable<AST.Annotation> = { tag: "id", name: s.iterator };
      var assignVar : AST.AssignVar<AST.Annotation> = { target: assignable, ignorable: false, star: false };
      var destructureAss : AST.DestructuringAssignment<AST.Annotation> = { isSimple: true, vars: [assignVar] };
      var nextAssign : AST.Stmt<AST.Annotation>[] = [{tag:"assign", destruct: destructureAss, value: nextCall,a:s.a }]
      
      flattenStmts(nextAssign, blocks, localenv); // to add wasm code for i = c.next(). has no inits 
      
      var [bodyinits, bodyclasses] = flattenStmts(s.body, blocks, localenv)
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: forStartLbl });
    
      blocks.push({  a: s.a, label: forEndLbl, stmts: [] })
    
      return [[...cinits, ...bodyinits], [...bodyclasses]];
  }
}

function flattenExprToExpr(e : AST.Expr<Annotation>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Stmt<Annotation>>, IR.Expr<Annotation>, Array<IR.Class<Annotation>>] {
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
      var checkDenom : Array<IR.Stmt<Annotation>> = [];
      if (e.op == AST.BinOp.IDiv || e.op == AST.BinOp.Mod) { // check division by zero
        checkDenom.push(ERRORS.flattenDivideByZero(e.a, rval));
      }
      return [[...linits, ...rinits], [...lstmts, ...rstmts, ...checkDenom], {
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
      const checkObj: IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(e.a, fval);
      const zeroOffset: IR.Value<Annotation> = { tag: "wasmint", value: 0 };
      return [
        [...finits, ...callinits],
        [...fstmts, checkObj, ...callstmts],
        {
          ...e,
          tag: "call_indirect",
          fn: { tag: "load", start: fval, offset: zeroOffset },
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
      if(objTyp.type.tag !== "class") { // I don't think this error can happen
        throw new Error("Report this as a bug to the compiler developer, this shouldn't happen " + objTyp.type.tag);
      }
      const className = objTyp.type.name;
      const checkObj : IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(e.a, objval);
      const callMethod : IR.Expr<Annotation> = { tag: "call", name: `${className}$${e.method}`, arguments: [objval, ...argvals] }
      return [
        [...objinits, ...arginits],
        [...objstmts, checkObj, ...argstmts],
        callMethod,
        [...objclasses, ...argclasses]
      ];
    }
    case "lookup": {
      const [oinits, ostmts, oval, oclasses] = flattenExprToVal(e.obj, blocks, env);
      if(e.obj.a.type.tag !== "class") { throw new Error("Compiler's cursed, go home"); }
      const classdata = env.classes.get(e.obj.a.type.name);
      const [offset, _] = classdata.get(e.field);
      const checkObj : IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(e.a, oval);
      return [oinits, [...ostmts, checkObj], {
        tag: "load",
        start: oval,
        offset: { tag: "wasmint", value: offset }}, oclasses];
    }

    case "construct":
      const classdata = env.classes.get(e.name);
      const fields = [...classdata.entries()];
      const newName = generateName("newObj");
      const alloc : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: fields.length + 1} };
      const assigns : IR.Stmt<Annotation>[] = fields.map(f => {
        const [_, [index, value]] = f;
        return {
          tag: "store",
          start: { tag: "id", name: newName },
          offset: { tag: "wasmint", value: index },
          value: value
        }
      });

      return [
        [ { name: newName, type: e.a.type, value: { tag: "none" } }],
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
    case "list-comp":
      return flattenListComp(e, env, blocks);
    case "construct-list":
      const newListName = generateName("newList");
      const listAlloc: IR.Expr<Annotation> = {
        tag: "alloc",
        amount: { tag: "wasmint", value: e.items.length + 2 },
      };
      var inits: Array<IR.VarInit<Annotation>> = [];
      var stmts: Array<IR.Stmt<Annotation>> = [];
      var classes: Array<IR.Class<Annotation>> = [];
      var storeBigLength: IR.Stmt<Annotation> = {
        tag: "store",
        start: { tag: "id", name: newListName },
        offset: { tag: "wasmint", value: 0 },
        value: { a: null, tag: "num", value: BigInt(e.items.length) },
      };
      var storeLength: IR.Stmt<Annotation> = {
        tag: "store",
        start: { tag: "id", name: newListName },
        offset: { tag: "wasmint", value: 1 },
        value: { a: null, tag: "wasmint", value: e.items.length }
      };
      const assignsList: IR.Stmt<Annotation>[] = e.items.map((e, i) => {
        const [init, stmt, vale, eclass] = flattenExprToVal(e, blocks, env);
        inits = [...inits, ...init];
        stmts = [...stmts, ...stmt];
        classes = [...classes, ...eclass]
        return {
          tag: "store",
          start: { tag: "id", name: newListName },
          offset: { tag: "wasmint", value: i + 2 },
          value: vale,
        };
      });
      return [
        [
          {
            name: newListName,
            type: e.a.type,
            value: { a: e.a, tag: "none" },
          },
          ...inits,
        ],
        [
          { tag: "assign", name: newListName, value: listAlloc },
          ...stmts,
          storeBigLength,
          storeLength,
          ...assignsList,
        ],
        {
          a: e.a,
          tag: "value",
          value: {
            a: e.a,
            tag: "id",
            name: newListName
          },
        },
        classes
      ];
    case "index":
      var [objInit, objStmts, objExpr, objClasses] = flattenExprToVal(e.obj, blocks, env);
      var [idxInit, idxStmts, idxExpr, ___ignore_use_below] = flattenExprToVal(e.index, blocks, env);

      var noneCheck: IR.Stmt<Annotation> = ERRORS.flattenAssertNotNone(e.a, objExpr);

      // Bounds check code
      var lenVar = generateName("listLen");
      var lenStmt: IR.Stmt<Annotation> = {
        a: {...idxExpr.a, type: {tag: "number"}},
        tag: "assign",
        name: lenVar,
        value: {
          a: {...idxExpr.a, type: {tag: "number"}},
          tag: "load",
          start: objExpr,
          offset: {a: {...idxExpr.a, type: {tag: "number"}}, tag: "wasmint", value: 1}
        }
      };
      var idxi32: IR.Expr<Annotation> = { a: {...idxExpr.a, type: {tag: "number"}}, tag: "call", name: "$bignum_to_i32", arguments: [idxExpr] } 
      var idxi32Name = generateName("valname");
      var setidxi32Name : IR.Stmt<Annotation> = {
        tag: "assign",
        a: idxExpr.a,
        name: idxi32Name,
        value: idxi32
      };
      var checkBoundStmt: IR.Stmt<Annotation> = ERRORS.flattenIndexOutOfBounds(e.a, {...idxExpr.a, tag: "id", name: idxi32Name}, {a: {...idxExpr.a, type: {tag: "number"}}, tag: "id", name: lenVar});
      var indexAdd: AST.Expr<Annotation> = {
        a: {...idxExpr.a, type: {tag: "number"}},
        tag: "binop",
        op: AST.BinOp.Plus,
        left: e.index,
        right: {a: {...idxExpr.a, type: {tag: "number"}}, tag: "literal", value: {tag: "num", value: 2n}}
      };
      var [idxAddInit, idxAddStmts, idxAddExpr, idxClasses] = flattenExprToVal(indexAdd, blocks, env);
      var idxi32Add: IR.Expr<Annotation> = { a: {...idxAddExpr.a, type: {tag: "number"}}, tag: "call", name: "$bignum_to_i32", arguments: [idxAddExpr] } 
      var idxi32AddName = generateName("valname");
      var setidxi32AddName : IR.Stmt<Annotation> = {
        tag: "assign",
        a: idxExpr.a,
        name: idxi32AddName,
        value: idxi32Add
      };
      return [
        [...objInit, ...idxInit, { a: e.a, name: idxi32Name, type: e.a.type, value: { tag: "none" } }, { a: e.a, name: idxi32AddName, type: e.a.type, value: { tag: "none" } }, ...idxAddInit,
          {
            name: lenVar,
            type: {tag: "number"},
            value: { a: e.a, tag: "none" },
          }
        ],
        [...objStmts, noneCheck, ...idxStmts, lenStmt, setidxi32Name, checkBoundStmt, ...idxAddStmts, setidxi32AddName],
        {
          a: {...idxExpr.a, type: {tag: "number"}},
          tag: "load",
          start: objExpr,
          offset: {tag: "id", name: idxi32AddName},
        },
        [...objClasses, ...idxClasses]
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

      var endjmp : IR.Stmt<Annotation> = { tag: "jmp", lbl: endLbl };
      let [cinits, cstmts, cexpr, cclasses] = flattenExprToVal(e.cond, blocks, env);
      var condjmp : IR.Stmt<Annotation> = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };

      pushStmtsToLastBlock(blocks, ...cstmts, condjmp);

      blocks.push({ a: e.a, label: thenLbl, stmts: [] });
      var [thninits, thnstmts, thnexpr, thnclasses] = flattenExprToExpr(e.thn, blocks, env);
      pushStmtsToLastBlock(blocks, ...thnstmts, { a: e.a, tag: "assign", name: ifExprTmpVal, value: thnexpr}, endjmp);

      blocks.push({ a: e.a, label: elseLbl, stmts: [] });
      var [elsinits, elsstmts, elsexpr, elseclasses] = flattenExprToExpr(e.els, blocks, env);
      pushStmtsToLastBlock(blocks,...elsstmts, { a: e.a, tag: "assign", name: ifExprTmpVal, value: elsexpr}, endjmp);

      blocks.push({ a: e.a, label: endLbl, stmts: [] });
      var varDefForTmp: IR.VarInit<Annotation> = { a: e.a, name: ifExprTmpVal, type: e.a.type, value: { a: { type: { tag: "none"} }, tag: "none" } };

      return [
        [...cinits, ...elsinits, ...thninits, varDefForTmp],
        [],
        { a: e.a, tag:"value", value: { a: e.a, tag: "id", name: ifExprTmpVal } },
        [...cclasses, ...thnclasses, ...elseclasses]
      ];
    }
    case "lambda":
      var [classDef, constrExpr] = lambdaToClass(e);

      const classFields = new Map();
      classDef.fields.forEach((field, i) => classFields.set(field.name, [i, field.value]));
      env.classes.set(classDef.name, classFields);
      env.classIndices.set(classDef.name, env.vtableMethods.length);
      env.vtableMethods.push(...classDef.methods
        .filter(method => !method.name.includes("__init__"))
        .map((method): [string, number] => [
          createMethodName(classDef.name, method.name), method.parameters.length
        ])
      );
      const irClass = lowerClass(classDef, env);
      irClass[0].a = e.a;

      const [cinits, cstmts, cval, cclasses] = flattenExprToExpr(constrExpr, blocks, env);
      return [cinits, cstmts, cval, [...irClass, ...cclasses]];
  }
}

function lambdaToClass(lambda: AST.Lambda<Annotation>) : [AST.Class<Annotation>, AST.Expr<Annotation>] {
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
          body: [{ a: { type: lambda.type.ret }, tag: "return", value: lambda.expr }],
          nonlocals: [],
          children: []
        }
      ],
      typeParams: [],
    },
    { a: lambda.a, tag: "construct", name: lambdaClassName }
  ];
}

function flattenExprToVal(e : AST.Expr<Annotation>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Stmt<Annotation>>, IR.Value<Annotation>, Array<IR.Class<Annotation>>] {
  var [binits, bstmts, bexpr, bclasses] = flattenExprToExpr(e, blocks, env);
  if(bexpr.tag === "value") {
    return [binits, bstmts, bexpr.value, bclasses];
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
      {tag: "id", name: newName, a: e.a},
      bclasses
    ];
  }
}

function flattenIrExprToVal(e : IR.Expr<Annotation>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Stmt<Annotation>>, IR.Value<Annotation>, Array<IR.Class<Annotation>>] {
  if(e.tag === "value") {
    return [[], [], e.value, []];
  }
  else {
    var newName = generateName("valname");
    var setNewName : IR.Stmt<Annotation> = {
      tag: "assign",
      a: e.a,
      name: newName,
      value: e 
    };
    // TODO: we have to add a new var init for the new variable we're creating here.
    // but what should the default value be?
    return [
      [{ a: e.a, name: newName, type: e.a.type, value: { tag: "none" } }],
      [setNewName],  
      {tag: "id", name: newName, a: e.a},
      []
    ];
  }
}

function pushStmtsToLastBlock(blocks: Array<IR.BasicBlock<Annotation>>, ...stmts: Array<IR.Stmt<Annotation>>) {
  blocks[blocks.length - 1].stmts.push(...stmts);
}

export function flattenWasmInt(val: number): IR.Value<Annotation>{
  return { tag: "wasmint", value: val }
}