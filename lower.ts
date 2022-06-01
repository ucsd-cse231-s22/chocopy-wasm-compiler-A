import * as AST from './ast';
import * as IR from './ir';
import { Type, UniOp, Annotation } from './ast';
import * as ERRORS from './errors';
import { GlobalEnv } from './compiler';
import { APPLY, CLASS, createMethodName, BOOL, NONE, NUM, SET_PARENT, defaultLiteral, CALLABLE } from './utils';

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
  env.ancestorMap.set(name, ancestors);

  var envCopy = { ...env, functionNames: new Map(env.functionNames) };
  f.children.forEach(c => envCopy.functionNames.set(c.name, closureName(c.name, [f, ...ancestors])));

  var defs = f.children.map(x => lowerFunDef(x, envCopy, [f, ...ancestors]));
  var assignStmt: AST.Stmt<Annotation> = {
    tag: "assign",
    destruct: { isSimple: true, vars: [{ target: { tag: "id", name: f.name }, ignorable: false, star: false }] },
    value: { a: { type }, tag: "construct", name }
  };
  var varInit: AST.VarInit<Annotation> = { name: f.name, type, value: { tag: "none" } };
  var fields: Array<AST.VarInit<Annotation>> = [
    ...f.parameters.map((param): AST.VarInit<Annotation> => ({
      name: param.name, type: param.type, value: defaultLiteral(param.type)
    })),
    ...f.inits,
    ...f.children.map((child): AST.VarInit<Annotation> => ({
      name: child.name, 
      type: CLASS(closureName(child.name, [f, ...ancestors])), 
      value: { tag: "none" }
    })),
    { name: f.name, type, value: { tag: "none" } },
    { name: "parent", type: NONE, value: { tag: "none" } }
  ];

  const scopedVars: Map<string, [string[], boolean, string]> = new Map();
  const ancestorNames = ancestors.map((ancestor, i) => 
    closureName(ancestor.name, ancestors.slice(i + 1, ancestors.length))
  );
  [f, ...ancestors].reverse().forEach((ancestor, i) => {
    var j = ancestors.length - i;
    let childAncestors = [f, ...ancestors].slice(j, ancestors.length + 1);
    [...ancestor.parameters, ...ancestor.inits].forEach(x => 
      scopedVars.set(x.name, [ancestorNames.slice(0, j), false, ""])
    );
    ancestor.children.forEach(child => 
      scopedVars.set(child.name, [ancestorNames.slice(0, j), true, closureName(child.name, childAncestors)])
    );
  });
  // setting by closure name
  env.nonlocalMap.set(name, scopedVars);

  const classFields = new Map();
  fields.forEach((field, i) => classFields.set(field.name, [i + 1, field.value]));
  env.classes.set(name, classFields);

  var assignFields = [...f.parameters, ...f.inits].map((x): AST.Stmt<Annotation> => ({ 
    tag: "field-assign",
    obj: { a: { type: CLASS(name) }, tag: "id", name: "self"},
    field: x.name, 
    value: { a: { type: x.type }, tag: "id", name: x.name, transform: false },
  }));
  var assignParent: AST.Stmt<Annotation> = {
    tag: "field-assign",
    obj: { a: { type: CLASS(name) }, tag: "id", name: "copy"},
    field: "parent",
    value: { tag: "id", name: "parent" }
  };

  var assignChildren: Array<AST.Stmt<Annotation>> = f.children.map((child): AST.Stmt<Annotation> => {
    let childClass = closureName(child.name, [f, ...ancestors]);
    return {
      tag: "field-assign",
      obj: { tag: "id", name: "copy", a: { type: CLASS(name) } },
      field: child.name,
      value: { a: { type: CLASS(childClass) }, tag: "construct", name: childClass}
    }
  });

  var methods: Array<AST.FunDef<Annotation>> = [
    {
      name: "__init__",
      parameters: [self],
      ret: type,
      inits: [],
      body: [],
      nonlocals: [],
      children: []
    },
    {
      name: APPLY,
      parameters: [self, ...f.parameters],
      ret: f.ret,
      inits: [...f.inits],
      body: [...assignFields, ...f.body],
      nonlocals: [],
      children: []
    },
    {
      name: SET_PARENT,
      parameters: [self, { name: "parent", type: NONE }],
      ret: type,
      inits: [{ name: "copy", type, value: { tag: "none" } }],  // here we copy self
      body: [
        {
          tag: "assign",
          destruct: { isSimple: true, vars: [{ target: { tag: "id", name: "copy" }, ignorable: false, star: false }] },
          value: { a: { type }, tag: "construct", name }
        },
        ...assignChildren,
        assignParent,
        { tag: "return", value: { tag: "id", name: "copy" } }
      ],
      nonlocals: [],
      children: []
    }
  ];
  return [
    [
      { name, fields, methods, typeParams: [] },
      ...defs.map(x => x[0]).flat()
    ],
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
  env.functionNames.set("$current", cls.name); // hack so we know what function we are in
  const [classes, methods] = lowerMethodDefs(cls.methods, env);
  env.functionNames.delete("$current");
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
  // console.log("list comp in ir", e, "----------------");
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
  var hasNextCall : AST.Expr<AST.Annotation> = {tag:"method-call", obj:e.iterable, method:"hasNext", arguments:[], a:{...e.a,tag:BOOL}};
  var [cinits, cstmts, cexpr, ceclass] = flattenExprToVal(hasNextCall, blocks, localenv);
  pushStmtsToLastBlock(blocks, ...cstmts, { tag: "ifjmp", cond: cexpr, thn: compbodyLbl, els: compEndLbl });
  // console.log(cinits, cstmts, cexpr);

  // body
  blocks.push({  a: e.a, label: compbodyLbl, stmts: [] })
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
  bodyinits.concat(body_init);
  // console.log("einits", einits, "estmts", estmts, "eexpr", eexpr);
  pushStmtsToLastBlock(blocks, ...bstmts, {tag:"jmp", lbl: compStartLbl});

  // end
  blocks.push({  a: e.a, label: compEndLbl, stmts: [] })
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
    return [[...cinits, ...bodyinits, ...body_init, ...binits]
      , [...cstmts, ...bstmts]
      , {
        a: e.a,
        tag: "value",
        value: {
          a: { ...e.a, type: NUM },
          tag: "id",
          name: elem
        },
      },[...ceclass, ...bodyclasses, ...body_class, ...beclass]]
}

function flattenStmt(s : AST.Stmt<Annotation>, blocks: Array<IR.BasicBlock<Annotation>>, env : GlobalEnv) : [Array<IR.VarInit<Annotation>>, Array<IR.Class<Annotation>>] {
  switch(s.tag) {
    case "assign":
      if(s.destruct.isSimple === true) {
        var left = s.destruct.vars[0].target;
        if (left.tag !== "id") throw new Error("should not reach here");
        
        let currentFun = env.functionNames.get("$current");
        let nonlocals = env.nonlocalMap.get(currentFun);
        if (currentFun === undefined || !env.nonlocalMap.has(currentFun) || !nonlocals.has(left.name)) {
          let [valinits, valstmts, vale, classes] = flattenExprToExpr(s.value, blocks, env);
          blocks[blocks.length - 1].stmts.push(...valstmts, { a: s.a, tag: "assign", name: left.name, value: vale });
          return [valinits, classes];
        }

        // at least one level of function nesting
        let parent: AST.Expr<Annotation> = { a: { ...s.a, type: CLASS(currentFun) }, tag: "id", name: "self", transform: false };
        let ancestorNames = nonlocals.get(left.name)[0];
        ancestorNames.slice().reverse().forEach(ancestor => {
          parent = { a: {...s.a, type: CLASS(ancestor)}, tag: "lookup", obj: parent, field: "parent" }; // change
        });

        return flattenStmt({ tag: "field-assign", obj: parent, field: left.name, value: s.value }, blocks, env);
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
      var [rinits, rclasses] = flattenStmts(resetStmt, blocks, localenv); 
      
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
      
      var [ninits, nclasses] = flattenStmts(nextAssign, blocks, localenv); // to add wasm code for i = c.next(). has no inits 
      
      var [bodyinits, bodyclasses] = flattenStmts(s.body, blocks, localenv)
      pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: forStartLbl });
    
      blocks.push({  a: s.a, label: forEndLbl, stmts: [] })
    
      return [
        [...rinits, ...cinits, ...ninits, ...bodyinits],
        [...rclasses, ...nclasses, ...bodyclasses]
      ];
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
      if (e.obj.tag === "id" && env.classes.has(e.obj.name) && e.a.type.tag === "callable") {
        let names = e.a.type.params.map((_, i) => `tmp${i}`);
        let ids: Array<AST.Expr<Annotation>> = e.a.type.params.map((type, index) =>
          ({ tag: "id", name: names[index], a: { type } })
        );
        return flattenExprToExpr({
          a: { type: e.a.type },
          tag: "lambda",
          type: e.a.type,
          params: names,
          expr: {
            a: { type: e.a.type },
            tag: "method-call",
            obj: ids[0],
            method: e.field,
            arguments: ids.slice(1, ids.length),
          },
        }, blocks, env);
      }

      const [oinits, ostmts, oval, oclasses] = flattenExprToVal(e.obj, blocks, env);
      if (e.obj.a.type.tag !== "class") { throw new Error("Compiler's cursed, go home"); }
      const classdata = env.classes.get(e.obj.a.type.name);

      if (e.a.type.tag === "callable" && !classdata.has(e.field)) {
        let selfName = generateName("$boundSelf");
        let names = e.a.type.params.map((_, i) => `tmp${i}`);
        let ids: Array<AST.Expr<Annotation>> = e.a.type.params.map((type, index) =>
          ({ tag: "id", name: names[index], a: { type } })
        );
        let self: AST.Expr<Annotation> = { tag: "id", name: selfName, a: { ...e.obj.a } };
        let outerLambdaType: AST.Type = { tag: "callable", params: [e.obj.a.type], ret: e.a.type };
        let lambda: AST.Expr<Annotation> = {
          tag: "call",
          fn: {
            a: { type: outerLambdaType },
            tag: "lambda",
            type: outerLambdaType,
            params: [selfName],
            expr: {
              a: { type: e.a.type },
              tag: "lambda",
              type: e.a.type,
              params: names,
              expr: {
                a: { type: e.a.type },
                tag: "method-call",
                obj: self,
                method: e.field,
                arguments: [self, ...ids],
              },
            },
          },
          arguments: [e.obj]
        };

        return flattenExprToExpr(lambda, blocks, env);
      }

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
      const alloc : IR.Expr<Annotation> = { tag: "alloc", amount: { tag: "wasmint", value: fields.length + 1 } };
      const assigns : IR.Stmt<Annotation>[] = fields.map(f => {
        const [_, [index, value]] = f;
        return {
          tag: "store",
          start: { tag: "id", name: newName },
          offset: { tag: "wasmint", value: index},
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
      let localLower: ReturnType<typeof flattenExprToExpr> = [[], [], { tag: "value", value: { ...e } }, []];
      if (e.transform === false)
        return localLower;
      let currentFun = env.functionNames.get("$current");
      let nonlocals = env.nonlocalMap.get(currentFun);
      if (currentFun === undefined || !env.nonlocalMap.has(currentFun) || !nonlocals.has(e.name)) {
        if(env.functionNames.has(e.name) && e.a.type.tag === "callable") {
          let idExpr: AST.Expr<Annotation> = {  // call set_parent with none to copy
            tag: "method-call", 
            obj: { ...e, a: {...e.a, type: { tag: "class", name: closureName(e.name, []), params: [] }} }, 
            method: SET_PARENT, 
            arguments: [{ a: e.a, tag: "literal", value: { tag: "none" }}] 
          };
          return flattenExprToExpr(idExpr, blocks, env);
        }
        return localLower;
      }

      // at least one level of function nesting
      let [ancestorNames, isFunction, funName] = nonlocals.get(e.name);
      let parent: AST.Expr<Annotation> = { a: { ...e.a, type: CLASS(currentFun) }, tag: "id", name: "self" };

      ancestorNames.forEach(ancestor => {
        parent = { a: {...e.a, type: CLASS(ancestor)}, tag: "lookup", obj: parent, field: "parent" }; // change
      })
      let expr: AST.Expr<Annotation> = { a: e.a, tag: "lookup", obj: parent, field: e.name};

      if (isFunction && e.a.type.tag === "callable") {
        return flattenExprToExpr({
          tag: "method-call",
          obj: {...expr, a: {...e.a, type: CLASS(funName)}},
          method: SET_PARENT,
          arguments: [parent]
        }, blocks, env);
      }

      // if (ancestorNames.length === 0) { // if it is local to the current function
      //   return [[], [], { tag: "value", value: { ...e } }, []];
      // }
      return flattenExprToExpr(expr, blocks, env);
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
    case "lambda": {
      var name = generateName("$lambda");
      var funDef: AST.FunDef<Annotation> = {
        name,
        parameters: e.params.map((param, i) => ({
          name: param, 
          type: e.type.params[i]
        })),
        ret: e.type.ret,
        inits: [],
        body: [{ a: { type: e.type.ret }, tag: "return", value: e.expr }],
        nonlocals: [],
        children: []
      };

      let currentFun = env.functionNames.get("$current");
      var ancestors = [
        ...env.lambdaStack.reverse(),
        ...(env.ancestorMap.get(currentFun) ?? [])
      ];
      var astClasses = lowerFunDef(funDef, env, ancestors)[0];
      astClasses.forEach(cls => {
        env.classIndices.set(cls.name, env.vtableMethods.length);
        env.vtableMethods.push(...cls.methods
          .filter(method => !method.name.includes("__init__"))
          .map((method): [string, number] => [createMethodName(cls.name, method.name), method.parameters.length])
        );
      });

      let lambdaName = closureName(name, ancestors);
      var astExpr: AST.Expr<Annotation> = {
        tag: "method-call", 
        obj: { a: { type: CLASS(lambdaName) }, tag: "construct", name: lambdaName }, 
        method: SET_PARENT, 
        arguments: [
          currentFun
            ? { a: { ...e.a, type: CLASS(currentFun) }, tag: "id", name: "self" }
            : { a: e.a, tag: "literal", value: { tag: "none" }}
        ] 
      };

      env.lambdaStack.push(funDef);
      var classes = lowerClasses(astClasses, env);
      env.lambdaStack.pop();
      var [cinits, cstmts, cexpr, cclasses] = flattenExprToExpr(astExpr, blocks, env);
      return [cinits, cstmts, cexpr, [...classes, ...cclasses]];
    }
  }
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