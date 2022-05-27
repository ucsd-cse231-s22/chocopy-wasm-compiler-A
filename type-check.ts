
import { Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, Class, ClassIndex } from './ast';
import { NUM, BOOL, NONE, STR, EMPTY, CLASS, LIST } from './utils';

// I ❤️ TypeScript: https://github.com/microsoft/TypeScript/issues/13965
export class TypeCheckError extends Error {
   __proto__: Error
   constructor(message?: string) {
    const trueProto = new.target.prototype;
    super("TYPE ERROR: " + message);

    // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
    this.__proto__ = trueProto;
  } 
}

export type GlobalTypeEnv = {
  globals: Map<string, Type>,
  functions: Map<string, [Array<Type>, Type]>,
  classes: Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>]>,
  inheritance: ClassIndex<null>
}

// export type Inheritance = {
//   classname: string,
//   fields: Array<string>,
//   methods: Array<[string, number, number]>,
//   children: Array<Inheritance>
// }

export type LocalTypeEnv = {
  vars: Map<string, Type>,
  expectedRet: Type,
  actualRet: Type,
  topLevel: Boolean
}

const defaultGlobalFunctions = new Map();
defaultGlobalFunctions.set("abs", [[NUM], NUM]);
defaultGlobalFunctions.set("max", [[NUM, NUM], NUM]);
defaultGlobalFunctions.set("min", [[NUM, NUM], NUM]);
defaultGlobalFunctions.set("pow", [[NUM, NUM], NUM]);
defaultGlobalFunctions.set("print", [[CLASS("object")], NUM]);

export const defaultTypeEnv = {
  globals: new Map(),
  functions: defaultGlobalFunctions,
  classes: new Map(),
  inheritance: emptyInheritance()
};

export function emptyInheritance() : ClassIndex<null> {
  return {
    classname: "object",
    fields: [],
    methods: [],
    methodType: [],
    methodClass: [],
    methodParam: [],
    children: []
  }
}

export function emptyGlobalTypeEnv() : GlobalTypeEnv {
  return {
    globals: new Map(),
    functions: new Map(),
    classes: new Map(),
    inheritance: emptyInheritance()
  };
}

export function emptyLocalTypeEnv() : LocalTypeEnv {
  return {
    vars: new Map(),
    expectedRet: NONE,
    actualRet: NONE,
    topLevel: true
  };
}

export type TypeError = {
  message: string
}

export function equalType(t1: Type, t2: Type) : boolean {
  return (
    t1 === t2 ||
    (t1.tag === "class" && t2.tag === "class" && t1.name === t2.name) ||
    (t1.tag === "list" && t2.tag === "list" && equalType(t1.elem, t2.elem)) ||
    (t1.tag === "list" && t2.tag === "empty") ||
    (t1.tag === "empty" && t2.tag === "list")
  );
}

export function isMemoryObject(t: Type) : boolean {
  return t.tag === "none" || t.tag === "class" || t.tag === "list" || t.tag === "empty";
}

export function isListObject(t: Type) : boolean {
  return t.tag === "list" || t.tag === "empty";
}

export function iterable(t: Type) : boolean {
  return isListObject(t) || t.tag === "str";
}

export function isSubtype(env: GlobalTypeEnv, t1: Type, t2: Type) : boolean {
  return (
    equalType(t1, t2) ||
    (t1.tag === "none" && (t2.tag === "class" || t2.tag === "list" )) ||
    (t1.tag === "class" && t2.tag === "class" && inheritanceHasChild(env.inheritance, t2.name, t1.name)) ||
    (t1.tag === "empty" && t2.tag === "list")
  );
}

export function isAssignable(env : GlobalTypeEnv, t1 : Type, t2 : Type) : boolean {
  return isSubtype(env, t1, t2);
}

export function join(env : GlobalTypeEnv, t1 : Type, t2 : Type) : Type {
  return NONE
}

// export function inheritanceFlat(classes: ClassIndex<null>[]) : Array<ClassIndex<null>> {
//   var result : Array<ClassIndex<null>> = [];
//   classes.forEach(inClass => {
//     result.push({
//       classname: inClass.classname,
//       fields: inClass.fields,
//       methods: inClass.methods,
//       methodParam: inClass.methodParam,
//       children: inClass.children
//     });
//     result = result.concat(inheritanceFlat(inClass.children));
//   });
//   return result;
// }

export function inheritanceHas(tree: ClassIndex<null>, classname: string) : ClassIndex<null> {
  if (tree.classname === classname) {
    return tree;
  }

  var result = null;
  tree.children.forEach(child => {
    var t = inheritanceHas(child, classname);
    if (t !== null)
      result = t;
  })

  return result;
}

export function inheritanceHasChild(tree: ClassIndex<null>, parent: string, child: string) : boolean {
  var result = false;
  tree.children.forEach(inClass => {
    var tem = inheritanceHas(inClass, parent);
    if (tem !== null) {
      if (inheritanceHas(tem, child) !== null) {
        result = true;
      }
    }
  })
  return result;
}

export function inheritanceUpdate(originalNodes: Array<ClassIndex<null>>, newclass: Class<null>) : Array<ClassIndex<null>> {
  var result : Array<ClassIndex<null>> = [];
  originalNodes.forEach(parent => {
    if (parent.classname === newclass.parent) {
      var children = parent.children.map(x => x);
      var fields = parent.fields.map(x => x);
      var methods = parent.methods.map(x => x);
      var methodType = parent.methodType.map(x => x);
      var methodParam = parent.methodParam.map(x => x);
      var methodClass = parent.methodClass.map(x => x);
      newclass.fields.forEach(field => {
          fields.push(field.name);
      })
      newclass.methods.forEach(method => {
        if (!methods.includes(method.name)) {
          methods.push(method.name);
          methodClass.push(newclass.name);
          methodType.push(`$${newclass.name}$${method.name}$type`)
          methodParam.push([method.parameters.length, method.ret.tag !== "none"]);
        }
        else {
          methodClass[methods.indexOf(method.name)] = method.class;
        }
      })
      children.push({
        classname: newclass.name,
        fields,
        methods,
        methodClass,
        methodType,
        methodParam,
        children: []
      })
      result.push({
        classname: parent.classname,
        fields: parent.fields,
        methods: parent.methods,
        methodClass: parent.methodClass,
        methodType: parent.methodType,
        methodParam: parent.methodParam,
        children: children
      })
    } else {
      result.push({
        classname: parent.classname,
        fields: parent.fields,
        methods: parent.methods,
        methodClass: parent.methodClass,
        methodType: parent.methodType,
        methodParam: parent.methodParam,
        children: inheritanceUpdate(parent.children, newclass)
      })
    }
  })

  return result;
}

export function augmentTEnv(env : GlobalTypeEnv, program : Program<null>) : GlobalTypeEnv {
  const newGlobs = new Map(env.globals);
  const newFuns = new Map(env.functions);
  const newClasses = new Map(env.classes);
  const newInheritance = emptyInheritance();
  const temp = new Map();
  temp.set("object", [[], new Map(), new Map()]); // parents list, fields, method-class
  // fields: {key: field name, value: VarInit<A>}
  // method-class: {key: method name, value: class last defined}
  program.inits.forEach(init => newGlobs.set(init.name, init.type));
  program.funs.forEach(fun => newFuns.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
  // program.classes.forEach(cls => {
  //   const fields = new Map();
  //   const methods = new Map();
  //   cls.fields.forEach(field => fields.set(field.name, field.type));
  //   cls.methods.forEach(method => methods.set(method.name, [method.parameters.map(p => p.type), method.ret]));
  //   newClasses.set(cls.name, [fields, methods]);
  // });
  var classCount = 0;
  var iterCount = 0;
  var numClass = program.classes.length;
  var visitedClasses = new Map<string, string>();
  visitedClasses.set("object", '');
  while (true) {
    program.classes.forEach(cls => { // cls: new added class
      if (!visitedClasses.has(cls.name) && visitedClasses.has(cls.parent)) {
        visitedClasses.set(cls.name, cls.parent)
        var currFields = new Map();
        var currMethods = new Map();
        var methodClass = new Map(); // <method name, class name>
        var fieldexist = new Map(); // <field name, field>
        var parentFields = new Map();
        var parentMethods = new Map();
        if (cls.parent !== "object") {
          [parentFields, parentMethods] = newClasses.get(cls.parent);
        }
        cls.fields.forEach((field, index) => {
          currFields.set(field.name, field.type)
          fieldexist.set(field.name, [field, index + parentFields.size])
        });
        cls.methods.forEach(method => {
          currMethods.set(method.name, [method.parameters.map(p => p.type), method.ret]);
          methodClass.set(method.name, cls.name);
        });
        var [_, fieldCla, methodCla] = temp.get(cls.parent);
        var parFie = new Map();
        for (const [key, value] of parentFields) {
          if (currFields.has(key)) {
            throw new TypeCheckError("cannot redefine attribute:" + key);
          }
          var f, ind = fieldCla.get(key);
          parFie.set(ind, f);
          fieldexist.set(key, [f, ind]);
          currFields.set(key, value);
        }
        for (let i = parentFields.size; i > 0; i --) {
          cls.fields.splice(0, 0, parFie.get(i - 1));
        }

        for (const entry of parentMethods) {
          if (currMethods.has(entry[0])){
            if (!checkParams(currMethods.get(entry[0]), entry[1])) {
              throw new TypeCheckError("different param type of inherited method " + entry[0] + " in class " + cls.name)
            }
          } else {
            cls.methods.push({name: entry[0], parameters: [], ret: NONE, inits: [], body: [], class: methodCla.get(entry[0])})
            methodClass.set(entry[0], methodCla.get(entry[0]));
            currMethods.set(entry[0], entry[1]);
          }
        }
        newClasses.set(cls.name, [currFields, currMethods])
        temp.set(cls.name, [visitedClasses.get(cls.name), fieldexist, methodClass])
        classCount ++;
        if (cls.parent === "object") {
          newInheritance.children.push({
            classname: cls.name,
            fields: cls.fields.map(field => field.name),
            methods: cls.methods.map(method => method.name),
            methodClass: cls.methods.map(method => cls.name),
            methodType: cls.methods.map(method => `$${cls.name}$${method.name}$type`),
            methodParam: cls.methods.map(method => [method.parameters.length, method.ret.tag !== "none"]),
            children: []
          })
        } else {
          newInheritance.children = inheritanceUpdate(newInheritance.children, cls);
        }
      }
    })
    if (classCount === numClass)
      break;
    iterCount ++;
    if (iterCount > numClass)
      throw new TypeCheckError("there are classes inherited from unknown classes");
  }
  return { globals: newGlobs, functions: newFuns, classes: newClasses, inheritance: newInheritance };
}

export function checkParams(method : [Array<Type>, Type], parentMethod : [Array<Type>, Type]) : boolean {
  if (method[0].length !== parentMethod[0].length || !equalType(method[1], parentMethod[1]))
    return false;
  for (let i = 1; i < method[0].length; i ++) {
    if (!equalType(method[0][i], parentMethod[0][i]))
      return false;
  }
  return true;
}

export function tc(env : GlobalTypeEnv, program : Program<null>) : [Program<Type>, GlobalTypeEnv] {
  const locals = emptyLocalTypeEnv();
  const newEnv = augmentTEnv(env, program);
  const tInits = program.inits.map(init => tcInit(env, init));
  const tDefs = program.funs.map(fun => tcDef(newEnv, fun));
  const tClasses = program.classes.map(cls => tcClass(newEnv, cls));

  // program.inits.forEach(init => env.globals.set(init.name, tcInit(init)));
  // program.funs.forEach(fun => env.functions.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
  // program.funs.forEach(fun => tcDef(env, fun));
  // Strategy here is to allow tcBlock to populate the locals, then copy to the
  // global env afterwards (tcBlock changes locals)
  const tBody = tcBlock(newEnv, locals, program.stmts);
  var lastTyp : Type = NONE;
  if (tBody.length){
    lastTyp = tBody[tBody.length - 1].a;
  }
  // TODO(joe): check for assignment in existing env vs. new declaration
  // and look for assignment consistency
  for (let name of locals.vars.keys()) {
    newEnv.globals.set(name, locals.vars.get(name));
  }
  const table = newEnv.inheritance.children;

  const aprogram = {a: lastTyp, inits: tInits, funs: tDefs, classes: tClasses, stmts: tBody, table};
  return [aprogram, newEnv];
}

export function tcInit(env: GlobalTypeEnv, init : VarInit<null>) : VarInit<Type> {
  const valTyp = tcLiteral(init.value);
  if (isAssignable(env, valTyp, init.type)) {
    return {...init, a: NONE};
  } else {
    throw new TypeCheckError("Expected type `" + init.type.tag + "`; got type `" + valTyp.tag + "`");
  }
}

export function tcDef(env : GlobalTypeEnv, fun : FunDef<null>) : FunDef<Type> {
  var locals = emptyLocalTypeEnv();
  locals.expectedRet = fun.ret;
  locals.topLevel = false;
  fun.parameters.forEach(p => locals.vars.set(p.name, p.type));
  fun.inits.forEach(init => locals.vars.set(init.name, tcInit(env, init).type));
  
  const tBody = tcBlock(env, locals, fun.body);
  if (!isAssignable(env, locals.actualRet, locals.expectedRet))
    throw new TypeCheckError(`expected return type of block: ${JSON.stringify(locals.expectedRet)} does not match actual return type: ${JSON.stringify(locals.actualRet)}`)
  return {...fun, a: NONE, body: tBody};
}

export function tcClass(env: GlobalTypeEnv, cls : Class<null>) : Class<Type> {
  const tFields = cls.fields.map(field => tcInit(env, field));
  const tMethods = cls.methods.map(method => tcDef(env, method));
  const init = cls.methods.find(method => method.name === "__init__") // we'll always find __init__
  if (init.parameters.length !== 1 || 
    init.parameters[0].name !== "self" ||
    !equalType(init.parameters[0].type, CLASS(cls.name)) ||
    init.ret !== NONE)
    throw new TypeCheckError("Cannot override __init__ type signature");
  return {a: NONE, name: cls.name, fields: tFields, methods: tMethods, parent: cls.parent};
}

export function tcBlock(env : GlobalTypeEnv, locals : LocalTypeEnv, stmts : Array<Stmt<null>>) : Array<Stmt<Type>> {
  let tStmts : Array<Stmt<Type>> = [];
  let returnCheck : Boolean = false;
  stmts.forEach(stmt => {
    if (stmt.tag === "return")
      returnCheck = true;
    tStmts.push(tcStmt(env, locals, stmt));
  });
  if (!locals.topLevel) {
    if (!returnCheck && locals.expectedRet.tag !== "none") {
      // Check if there's conditional expression that returns for all paths
      let ifFlag = false;
      stmts.forEach(stmt => {
        if (stmt.tag === "if") {
          ifFlag = true;
          if (!tcIfReturn(stmt))
            throw new TypeCheckError("not all paths return");
        }
      });
      if (!ifFlag)
        throw new TypeCheckError("not all paths return");
    }
  }
  return tStmts;
}

function tcIfReturn(ifStmt : Stmt<Type>) : Boolean {
  /* Function that checks if a function is properly returned in an if
   * Input:
   * ifStmt - given if statements
   * Output:
   * ifReturn - true / false indicating if properly returned
   */
  // First check if return is existed in every branch
  if (ifStmt.tag === "if") {
    var ifCheck : Boolean = false;
    ifStmt.bodies.forEach(stmts => {
      stmts.forEach(stmt => {
        if (stmt.tag === "return")
          ifCheck = true;
      });
    });
    var elseCheck : Boolean = false;
    ifStmt.els.forEach(stmt => {
      if (stmt.tag === "return")
        elseCheck = true;
    });
    if (elseCheck && ifCheck) return true;

    // Not all exist return, check nested if
    if (!ifCheck) {
      ifStmt.bodies.forEach(stmts => {
        stmts.forEach(stmt => {
          if (stmt.tag === "if")
            ifCheck = tcIfReturn(stmt);
        })
      })
    }
    if (!elseCheck) {
      ifStmt.els.forEach(stmt => {
        if (stmt.tag === "if")
          elseCheck = tcIfReturn(stmt);
      });
    }
    return elseCheck && ifCheck;
  }
  return true;
}

export function tcStmt(env : GlobalTypeEnv, locals : LocalTypeEnv, stmt : Stmt<null>) : Stmt<Type> {
  switch(stmt.tag) {
    case "comment":
      return { a: NONE, tag: "comment" }
    case "assign":
      const tValExpr = tcExpr(env, locals, stmt.value);
      var nameTyp;
      if (locals.vars.has(stmt.name)) {
        nameTyp = locals.vars.get(stmt.name);
      } else if (env.globals.has(stmt.name)) {
        nameTyp = env.globals.get(stmt.name);
      } else {
        throw new TypeCheckError("Unbound id: " + stmt.name);
      }
      if(!isAssignable(env, tValExpr.a, nameTyp)) 
        throw new TypeCheckError("Non-assignable types");
      return {a: NONE, tag: stmt.tag, name: stmt.name, value: tValExpr};
    case "expr":
      const tExpr = tcExpr(env, locals, stmt.expr);
      return {a: tExpr.a, tag: stmt.tag, expr: tExpr};
    case "if":
      const tConds : Array<Expr<Type>> = [];
      let thnTyp : Type = NONE;
      stmt.conds.forEach(cond => {
        const tCond = tcExpr(env, locals, cond);
        if (tCond.a !== BOOL)
          throw new TypeCheckError("Condition Expression Must be a bool");
        tConds.push(tCond);
      });
      const tBodies : Array<Stmt<Type>[]> = [];
      stmt.bodies.forEach(stmts => {
        tBodies.push(tcBlock(env, locals, stmts))
        thnTyp = locals.actualRet;
        if (!isAssignable(env, locals.actualRet, locals.expectedRet)) 
          throw new TypeCheckError("expected return type `" + (locals.expectedRet as any).tag + "`; got type `" + (locals.actualRet as any).tag + "`");
      });
      const tEls = tcBlock(env, locals, stmt.els);
      if (!isAssignable(env, locals.actualRet, locals.expectedRet)) 
        throw new TypeCheckError("expected return type `" + (locals.expectedRet as any).tag + "`; got type `" + (locals.actualRet as any).tag + "`");
      // const elsTyp = locals.actualRet; // NOT FOR ChocoPy
      // if (thnTyp !== elsTyp)
      //   locals.actualRet = { tag: "either", left: thnTyp, right: elsTyp }
      return {a: thnTyp, tag: stmt.tag, conds: tConds, bodies: tBodies, els: tEls}
    case "return":
      if (locals.topLevel)
        throw new TypeCheckError("cannot return outside of functions");
      const tRet = tcExpr(env, locals, stmt.value);
      if (!isAssignable(env, tRet.a, locals.expectedRet)) 
        throw new TypeCheckError("expected return type `" + (locals.expectedRet as any).tag + "`; got type `" + (tRet.a as any).tag + "`");
      locals.actualRet = tRet.a;
      return {a: tRet.a, tag: stmt.tag, value:tRet};
    case "for":
      var tIterVar = tcExpr(env, locals, stmt.itvar);
      var tIterable = tcExpr(env, locals, stmt.iterable);
      if (!iterable(tIterable.a))
        throw new TypeCheckError(`not iterable type ${tIterable.a.tag}`);
      if (tIterable.a.tag === "str" && tIterVar.a.tag !== "str")
        throw new TypeCheckError(`iterative var should be str, get ${tIterVar.a.tag} instead`);
      if (tIterable.a.tag === "list" && !equalType(tIterable.a.elem, tIterVar.a))
        throw new TypeCheckError(`iterative var should be ${tIterable.a.elem.tag}, get ${tIterVar.a.tag} instead`);
      const tfBody = tcBlock(env, locals, stmt.body);
      return {...stmt, a: NONE, itvar: tIterVar, iterable: tIterable, body: tfBody};
    case "while":
      var tCond = tcExpr(env, locals, stmt.cond);
      const tBody = tcBlock(env, locals, stmt.body);
      if (!equalType(tCond.a, BOOL)) 
        throw new TypeCheckError("Condition Expression Must be a bool");
      return {a: NONE, tag:stmt.tag, cond: tCond, body: tBody};
    case "pass":
      return {a: NONE, tag: stmt.tag};
    case "field-assign":
      var tObj = tcExpr(env, locals, stmt.obj);
      const tVal = tcExpr(env, locals, stmt.value);
      if (tObj.a.tag !== "class") 
        throw new TypeCheckError("field assignments require an object");
      if (!env.classes.has(tObj.a.name)) 
        throw new TypeCheckError("field assignment on an unknown class");
      const [fields, _] = env.classes.get(tObj.a.name);
      if (!fields.has(stmt.field)) 
        throw new TypeCheckError(`could not find field ${stmt.field} in class ${tObj.a.name}`);
      if (!isAssignable(env, tVal.a, fields.get(stmt.field)))
        throw new TypeCheckError(`could not assign value of type: ${tVal.a}; field ${stmt.field} expected type: ${fields.get(stmt.field)}`);
      return {...stmt, a: NONE, obj: tObj, value: tVal};
  }
}

export function tcExpr(env : GlobalTypeEnv, locals : LocalTypeEnv, expr : Expr<null>) : Expr<Type> {
  switch(expr.tag) {
    case "literal": 
      return {...expr, a: tcLiteral(expr.value)};
    case "binop":
      const tLeft = tcExpr(env, locals, expr.left);
      const tRight = tcExpr(env, locals, expr.right);
      const tBin = {...expr, left: tLeft, right: tRight};
      switch(expr.op) {
        case BinOp.Plus:
          if(equalType(tLeft.a, NUM) && equalType(tRight.a, NUM)) { return {a: NUM, ...tBin}}
          else if (isListObject(tLeft.a) && equalType(tRight.a, tLeft.a)) {
            return {a: (tLeft.a.tag !== "empty") ? tLeft.a : tRight.a, ...tBin, op: BinOp.IterPlus};
          } else if (equalType(tLeft.a, STR) && equalType(tRight.a, STR)) { return {a: STR, ...tBin, op: BinOp.IterPlus}; }
          else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
        case BinOp.Minus:
        case BinOp.Mul:
        case BinOp.IDiv:
        case BinOp.Mod:
          if(equalType(tLeft.a, NUM) && equalType(tRight.a, NUM)) { return {a: NUM, ...tBin}}
          else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
        case BinOp.Eq:
        case BinOp.Neq:
          if(tLeft.a.tag === "class" || tRight.a.tag === "class" ||
            tLeft.a.tag === "list" || tRight.a.tag === "list") throw new TypeCheckError(`cannot apply operator '==' on class / list types`)
          if(equalType(tLeft.a, tRight.a)) { return {a: BOOL, ...tBin} ; }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op)}
        case BinOp.Lte:
        case BinOp.Gte:
        case BinOp.Lt:
        case BinOp.Gt:
          if(equalType(tLeft.a, NUM) && equalType(tRight.a, NUM)) { return {a: BOOL, ...tBin} ; }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op) }
        case BinOp.And:
        case BinOp.Or:
          if(equalType(tLeft.a, BOOL) && equalType(tRight.a, BOOL)) { return {a: BOOL, ...tBin} ; }
          else { throw new TypeCheckError("Type mismatch for boolean op" + expr.op); }
        case BinOp.Is:
          if(!isMemoryObject(tLeft.a) || !isMemoryObject(tRight.a))
            throw new TypeCheckError("is operands must be objects in memory");
          return {a: BOOL, ...tBin};
        default:
          throw new TypeCheckError(`Unknown Binary op ${expr.op}`)
      }
    case "uniop":
      const tExpr = tcExpr(env, locals, expr.expr);
      const tUni = {...expr, a: tExpr.a, expr: tExpr}
      switch(expr.op) {
        case UniOp.Neg:
          if(equalType(tExpr.a, NUM)) { return tUni }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op);}
        case UniOp.Not:
          if(equalType(tExpr.a, BOOL)) { return tUni }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op);}
      }
    case "id":
      if (locals.vars.has(expr.name)) {
        return {a: locals.vars.get(expr.name), ...expr};
      } else if (env.globals.has(expr.name)) {
        return {a: env.globals.get(expr.name), ...expr};
      } else {
        throw new TypeCheckError("Unbound id: " + expr.name);
      }
    case "builtin1":
      if (expr.name === "print") {
        const tArg = tcExpr(env, locals, expr.arg);
        return {...expr, a: tArg.a, arg: tArg};
      } else if (expr.name === "len") {
        const tArg = tcExpr(env, locals, expr.arg);
        if (iterable(tArg.a)) {
          return {...expr, a: NUM, arg: tArg}
        } else {
          throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else if(env.functions.has(expr.name)) {
        const [[expectedArgTyp], retTyp] = env.functions.get(expr.name);
        const tArg = tcExpr(env, locals, expr.arg);
        
        if(isAssignable(env, tArg.a, expectedArgTyp)) {
          return {...expr, a: retTyp, arg: tArg};
        } else {
          throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else {
        throw new TypeError("Undefined function: " + expr.name);
      }
    case "builtin2":
      if(env.functions.has(expr.name)) {
        const [[leftTyp, rightTyp], retTyp] = env.functions.get(expr.name);
        const tLeftArg = tcExpr(env, locals, expr.left);
        const tRightArg = tcExpr(env, locals, expr.right);
        if(isAssignable(env, leftTyp, tLeftArg.a) && isAssignable(env, rightTyp, tRightArg.a)) {
          return {...expr, a: retTyp, left: tLeftArg, right: tRightArg};
        } else {
          throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else {
        throw new TypeError("Undefined function: " + expr.name);
      }
    case "call":
      if(env.classes.has(expr.name)) {
        // surprise surprise this is actually a constructor
        const tConstruct : Expr<Type> = { a: CLASS(expr.name), tag: "construct", name: expr.name };
        const [_, methods] = env.classes.get(expr.name);
        if (methods.has("__init__")) {
          const [initArgs, initRet] = methods.get("__init__");
          if (expr.arguments.length !== initArgs.length - 1)
            throw new TypeCheckError("__init__ didn't receive the correct number of arguments from the constructor");
          if (initRet !== NONE) 
            throw new TypeCheckError("__init__  must have a void return type");
          return tConstruct;
        } else {
          return tConstruct;
        }
      } else if(env.functions.has(expr.name)) {
        const [argTypes, retType] = env.functions.get(expr.name);
        const tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));

        if(argTypes.length === expr.arguments.length &&
           tArgs.every((tArg, i) => tArg.a === argTypes[i])) {
             return {...expr, a: retType, arguments: expr.arguments};
           } else {
            throw new TypeError("Function call type mismatch: " + expr.name);
           }
      } else {
        throw new TypeError("Undefined function: " + expr.name);
      }
    case "lookup":
      var tObj = tcExpr(env, locals, expr.obj);
      if (tObj.a.tag === "class") {
        if (env.classes.has(tObj.a.name)) {
          const [fields, _] = env.classes.get(tObj.a.name);
          if (fields.has(expr.field)) {
            return {...expr, a: fields.get(expr.field), obj: tObj};
          } else {
            throw new TypeCheckError(`could not found field ${expr.field} in class ${tObj.a.name}`);
          }
        } else {
          throw new TypeCheckError("field lookup on an unknown class");
        }
      } else {
        throw new TypeCheckError("field lookups require an object");
      }
    case "access":
      var tObj = tcExpr(env, locals, expr.obj);
      if (isListObject(tObj.a)) {
        var tInd = tcExpr(env, locals, expr.ind);
        if (!equalType(tInd.a, NUM)) throw new TypeCheckError(`cannot access with index type ${tInd.a.tag}`);
        return {...expr, a: tObj.a.tag === "list" ? tObj.a.elem : EMPTY, obj: tObj, ind: tInd};
      } else if (tObj.a.tag === "str") {
        var tInd = tcExpr(env, locals, expr.ind);
        if (!equalType(tInd.a, NUM)) throw new TypeCheckError(`cannot access with index type ${tInd.a.tag}`);
        return {...expr, a: STR, obj: tObj, ind: tInd};
      } else {
        throw new TypeCheckError(`cannot access type ${tObj.a.tag}`);
      }
    case "array":
      if (expr.length === 0) {
        return {...expr, a: EMPTY};
      }
      const tElems : Array<Expr<Type>> = [];
      // Check the first element
      const tElem1 = tcExpr(env, locals, expr.elems[0]);
      const eType : Type = tElem1.a;
      // Typecheck
      expr.elems.forEach(elem => {
        const tElem = tcExpr(env, locals, elem);
        if (!equalType(tElem.a, eType)) throw new TypeCheckError(`unconsistent type in a list ${tElem.a.tag} and ${eType.tag}`);
        tElems.push(tElem);
      });
      return {...expr, a: LIST(eType), elems: tElems};
    case "method-call":
      var tObj = tcExpr(env, locals, expr.obj);
      var tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
      if (tObj.a.tag === "class") {
        if (env.classes.has(tObj.a.name)) {
          const [_, methods] = env.classes.get(tObj.a.name);
          if (methods.has(expr.method)) {
            const [methodArgs, methodRet] = methods.get(expr.method);
            const realArgs = [tObj].concat(tArgs);
            if(methodArgs.length === realArgs.length &&
              methodArgs.every((argTyp, i) => isAssignable(env, realArgs[i].a, argTyp))) {
                return {...expr, a: methodRet, obj: tObj, arguments: tArgs};
              } else {
               throw new TypeCheckError(`Method call type mismatch: ${expr.method} --- callArgs: ${JSON.stringify(realArgs)}, methodArgs: ${JSON.stringify(methodArgs)}` );
              }
          } else {
            throw new TypeCheckError(`could not found method ${expr.method} in class ${tObj.a.name}`);
          }
        } else {
          throw new TypeCheckError("method call on an unknown class");
        }
      } else {
        throw new TypeCheckError("method calls require an object");
      }
    default: throw new TypeCheckError(`unimplemented type checking for expr: ${expr}`);
  }
}

export function tcLiteral(literal : Literal) {
    switch(literal.tag) {
        case "bool": return BOOL;
        case "num": return NUM;
        case "none": return NONE;
        case "str": return STR;
    }
}