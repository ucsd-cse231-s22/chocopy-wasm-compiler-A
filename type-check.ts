
import { table } from 'console';
import {Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, Class, Parameter} from './ast';
import {NUM, BOOL, NONE, CLASS, STR} from './utils';
import { emptyEnv } from './compiler';
import {equal} from "assert";
import {getNonLocalsInFunBody} from "./lambdalift";

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
  classes: Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>, string]>
}

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
};

export function emptyGlobalTypeEnv() : GlobalTypeEnv {
  return {
    globals: new Map(),
    functions: new Map(),
    classes: new Map()
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

export function equalType(t1: Type, t2: Type) {
  return (
    t1 === t2 
    || (t1.tag === "class" && t2.tag === "class" && t1.name === t2.name)
    || (t1.tag === "list" && t2.tag == "list" && t1.elementtype.tag === t2.elementtype.tag)
  );
}

export function isNoneOrClass(t: Type) {
  return t.tag === "none" || t.tag === "class";
}

export function isSubtype(env: GlobalTypeEnv, t1: Type, t2: Type): boolean {
  return equalType(t1, t2) 
  || t1.tag === "none" && t2.tag === "class" 
  || t1.tag === "none" && t2.tag === "list"
  || isSubclass(env, t1, t2)
}

function isSubclass(env: GlobalTypeEnv, t1: Type, t2: Type) : boolean {
  if(t1.tag !== "class" || t2.tag !== "class") return false
  const superclasses = findAllSuper(env, t1.name)
  return superclasses.includes(t2.name)
}

function findAllSuper(env: GlobalTypeEnv, cls: string) : Array<string> {
  if(cls === "object") return []
  const superclass = env.classes.get(cls)[2];
  if(superclass === "object") return []
  return [superclass, ...findAllSuper(env, superclass)]
}

function findAllSuperFields(env: GlobalTypeEnv, cls: string) : Map<string, Type> {
  var result = new Map<string, Type>();
  if(cls === "object") return result;
  const superclass = env.classes.get(cls)[2];
  if(superclass === "object") return result;
  const superFields = env.classes.get(superclass)[0];
  superFields.forEach((t, field) => {
    result.set(field, t);
  })
  return new Map([...result].concat([...findAllSuperFields(env, superclass)]))
}

function findAllSuperMethods(env: GlobalTypeEnv, cls: string) : Map<string, [Array<Type>, Type]> {
  var result = new Map<string, [Array<Type>, Type]>();
  if(cls === "object") return result
  const superclass = env.classes.get(cls)[2];
  if(superclass === "object") return result
  const superMethods = env.classes.get(superclass)[1];
  superMethods.forEach((v, m) => {
    result.set(m, v);
  })
  return new Map<string, [Array<Type>, Type]>([...result].concat([...findAllSuperMethods(env, superclass)]))
}

export function isAssignable(env : GlobalTypeEnv, t1 : Type, t2 : Type) : boolean {
  return isSubtype(env, t1, t2);
}

export function join(env : GlobalTypeEnv, t1 : Type, t2 : Type) : Type {
  return NONE
}

export function augmentTEnv(env : GlobalTypeEnv, program : Program<null>) : GlobalTypeEnv {
  const newGlobs = new Map(env.globals);
  const newFuns = new Map(env.functions);
  const newClasses = new Map(env.classes);
  const clsToSuper = new Map();
  program.inits.forEach(init => newGlobs.set(init.name, init.type));
  program.funs.forEach(fun => newFuns.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
  program.classes.forEach(cls => {
    const fields = new Map();
    const methods = new Map();
    cls.fields.forEach(field => fields.set(field.name, field.type));
    cls.methods.forEach(method => methods.set(method.name, [method.parameters.map(p => p.type), method.ret]));
    newClasses.set(cls.name, [fields, methods, null]);
    clsToSuper.set(cls.name, cls.superclass);
  });
  clsToSuper.forEach((supercls, cls) => {
    const clsdata = newClasses.get(cls);
    if (supercls === "object") {
      newClasses.set(cls, [clsdata[0], clsdata[1], "object"])
    } else {
      if (program.classes.find(cls => cls.name === supercls) === undefined)
        throw new TypeCheckError("Supper class "+supercls+" does not exist.");
      newClasses.set(cls, [clsdata[0], clsdata[1], supercls])
    }
  })
  return { globals: newGlobs, functions: newFuns, classes: newClasses };
}

export function tc(env : GlobalTypeEnv, program : Program<null>) : [Program<Type>, GlobalTypeEnv] {
  const locals = emptyLocalTypeEnv();
  const newEnv = augmentTEnv(env, program);
  const tInits = program.inits.map(init => tcInit(env, init));
  var defLocals : Array<LocalTypeEnv> = [];
  const tDefs = program.funs.map(fun => tcDef(newEnv, fun, defLocals));
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
  const aprogram = {a: lastTyp, inits: tInits, funs: tDefs, classes: tClasses, stmts: tBody};
  return [aprogram, newEnv];
}

export function tcInit(env: GlobalTypeEnv, init : VarInit<null>) : VarInit<Type> {
  const valTyp = tcLiteral(init.value);
  if (isAssignable(env, valTyp, init.type)) {
    return {...init, a: NONE};
  } else {
    throw new TypeCheckError("Expected type `" + init.type + "`; got type `" + valTyp + "`");
  }
}


export function tcDef(env : GlobalTypeEnv, fun : FunDef<null>, locals: Array<LocalTypeEnv>) : FunDef<Type> {
  var funs: Array<FunDef<Type>> = [];
  locals.push(emptyLocalTypeEnv());
  locals[locals.length - 1].expectedRet = fun.ret;
  locals[locals.length - 1].topLevel = false;
  fun.parameters.forEach(p => locals[locals.length - 1].vars.set(p.name, p.type));
  fun.inits.forEach(init => locals[locals.length - 1].vars.set(init.name, tcInit(env, init).type));
  fun.funs.forEach(f => {
    env.functions.set(f.name, [f.parameters.map(p => p.type), fun.ret])
  });
  fun.funs.forEach(f => {
    funs.push(tcDef(env, f, locals));
  });

  var newLocals : LocalTypeEnv = {
    vars: new Map(),
    expectedRet: locals[locals.length - 1].expectedRet,
    actualRet: locals[locals.length - 1].actualRet,
    topLevel: false
  };
  locals.forEach(l => {
    newLocals.vars = new Map([...Array.from(newLocals.vars.entries()), ...Array.from(l.vars.entries())]);
  });
  const tBody = tcBlock(env, newLocals, fun.body);
  if (!isAssignable(env, newLocals.actualRet, newLocals.expectedRet))
    throw new TypeCheckError(`expected return type of block: ${JSON.stringify(locals[locals.length - 1].expectedRet)} does not match actual return type: ${JSON.stringify(locals[locals.length - 1].actualRet)}`)
  locals.pop();
  return {...fun, a: NONE, body: tBody, funs: funs};
}

export function tcClass(env: GlobalTypeEnv, cls : Class<null>) : Class<Type> {
  const tFields = cls.fields.map(field => tcInit(env, field));
  // check fields redefined
  const superFields = findAllSuperFields(env, cls.name)
  cls.fields.forEach(field => {
    if (superFields.has(field.name))
      throw new TypeCheckError("Can not override field "+field.name);
  });

  var defLocals : Array<LocalTypeEnv> = [];
  const tMethods = cls.methods.map(method => tcDef(env, method, defLocals));
  const init = cls.methods.find(method => method.name === "__init__") // we'll always find __init__
  if (init.parameters.length !== 1 || 
    init.parameters[0].name !== "self" ||
    !equalType(init.parameters[0].type, CLASS(cls.name)) ||
    init.ret !== NONE)
    throw new TypeCheckError("Cannot override __init__ type signature");
  return {a: NONE, name: cls.name, fields: tFields, methods: tMethods, superclass: cls.superclass};
}

export function tcBlock(env : GlobalTypeEnv, locals : LocalTypeEnv, stmts : Array<Stmt<null>>) : Array<Stmt<Type>> {
  var tStmts = stmts.map(stmt => tcStmt(env, locals, stmt));
  return tStmts;
}

export function tcStmt(env : GlobalTypeEnv, locals : LocalTypeEnv, stmt : Stmt<null>) : Stmt<Type> {
  switch(stmt.tag) {
    case "assign":
      const tValExpr = tcExpr(env, locals, stmt.value);
      var nameTyp;
      if (locals.vars.has(stmt.name)) {
        if(tValExpr.a.tag === "list"){
          locals.vars.set(stmt.name, tValExpr.a);
        }
        nameTyp = locals.vars.get(stmt.name);
      } else if (env.globals.has(stmt.name)) {
        if(tValExpr.a.tag === "list"){
          env.globals.set(stmt.name, tValExpr.a);
        }
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
      var tCond = tcExpr(env, locals, stmt.cond);
      const tThn = tcBlock(env, locals, stmt.thn);
      const thnTyp = locals.actualRet;
      locals.actualRet = NONE;
      const tEls = tcBlock(env, locals, stmt.els);
      const elsTyp = locals.actualRet;
      if (tCond.a !== BOOL) 
        throw new TypeCheckError("Condition Expression Must be a bool");
      if (thnTyp !== elsTyp)
        locals.actualRet = { tag: "either", left: thnTyp, right: elsTyp }
      return {a: thnTyp, tag: stmt.tag, cond: tCond, thn: tThn, els: tEls};
    case "return":
      if (locals.topLevel)
        throw new TypeCheckError("cannot return outside of functions");
      const tRet = tcExpr(env, locals, stmt.value);
      if (!isAssignable(env, tRet.a, locals.expectedRet)) 
        throw new TypeCheckError("expected return type `" + (locals.expectedRet as any).tag + "`; got type `" + (tRet.a as any).tag + "`");
      locals.actualRet = tRet.a;
      return {a: tRet.a, tag: stmt.tag, value:tRet};
    case "while":
      var tCond = tcExpr(env, locals, stmt.cond);
      const tBody = tcBlock(env, locals, stmt.body);
      if (!equalType(tCond.a, BOOL)) 
        throw new TypeCheckError("Condition Expression Must be a bool");
      return {a: NONE, tag:stmt.tag, cond: tCond, body: tBody};
    case "for":
      const tListExpr = tcExpr(env, locals, stmt.iterable);
      if (tListExpr.a.tag !== "list" && tListExpr.a !== STR)
        throw new TypeCheckError("Cannot iterate over type of " + tListExpr.a.tag)
      var nameTyp;
      if (locals.vars.has(stmt.name)) {
        nameTyp = locals.vars.get(stmt.name);
      } else if (env.globals.has(stmt.name)) {
        nameTyp = env.globals.get(stmt.name);
      } else {
        throw new TypeCheckError("Not a variable: " + stmt.name);
      }
      if(tListExpr.a.tag === "list" && !isAssignable(env, tListExpr.a.elementtype, nameTyp))
        throw new TypeCheckError("Expected type "+nameTyp+"; got type "+tListExpr.a.elementtype);
      if(tListExpr.a === STR && !isAssignable(env, tListExpr.a, nameTyp))
        throw new TypeCheckError("Expected type "+nameTyp+"; got type "+tListExpr.a)
      const tForBody = tcBlock(env, locals, stmt.body);
      return {a: NONE, tag: stmt.tag, name: stmt.name, iterable: tListExpr, body: tForBody};
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
      const superFields = findAllSuperFields(env, tObj.a.name);
      if (!fields.has(stmt.field) && !superFields.has(stmt.field))
        throw new TypeCheckError(`could not find field ${stmt.field} in class ${tObj.a.name}`);
      if (!isAssignable(env, tVal.a, fields.get(stmt.field)) && !isAssignable(env, tVal.a, superFields.get(stmt.field)))
        throw new TypeCheckError(`could not assign value of type: ${tVal.a}; field ${stmt.field} expected type: ${superFields.get(stmt.field)}`);
      return {...stmt, a: NONE, obj: tObj, value: tVal};
    case "index-assign":
      var typedlist = tcExpr(env, locals, stmt.list);
      var typedvalue = tcExpr(env, locals, stmt.value);
      var typedindex = tcExpr(env, locals, stmt.index);
      return {
        ...stmt, a: NONE, list: typedlist, index: typedindex, value: typedvalue
      }
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
          else if(equalType(tLeft.a, tRight.a) && tLeft.a.tag === "list" && tRight.a.tag === "list" ){
            var a = {tag:"list", listsize: tLeft.a.listsize+tRight.a.listsize, elementtype: tLeft.a.elementtype};
            return {a: a as Type, ...tBin}
          }
          else if (equalType(tLeft.a, STR) && equalType(tRight.a, STR)) { return { a: STR, ...tBin } }
          else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
        case BinOp.Minus:
        case BinOp.Mul:
        case BinOp.IDiv:
        case BinOp.Mod:
          if(equalType(tLeft.a, NUM) && equalType(tRight.a, NUM)) { return {a: NUM, ...tBin}}
          else if (equalType(tLeft.a, STR) && equalType(tRight.a, STR)) { return { a: STR, ...tBin } }
          else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
        case BinOp.Eq:
        case BinOp.Neq:
          if(tLeft.a.tag === "class" || tRight.a.tag === "class") throw new TypeCheckError("cannot apply operator '==' on class types")
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
          if(!isNoneOrClass(tLeft.a) || !isNoneOrClass(tRight.a))
            throw new TypeCheckError("is operands must be objects");
          return {a: BOOL, ...tBin};
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
        return {...expr, a: NUM, arg: tArg};
      }else if(env.functions.has(expr.name)) {
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
             return {...expr, a: retType, arguments: tArgs};
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
          const superFields = findAllSuperFields(env, tObj.a.name);
          if (fields.has(expr.field)) {
            return {...expr, a: fields.get(expr.field), obj: tObj};
          } else if(superFields.has(expr.field)) {
            return {...expr, a: superFields.get(expr.field), obj: tObj};
          } else {
            throw new TypeCheckError(`could not found field ${expr.field} in class ${tObj.a.name}`);
          }
        } else {
          throw new TypeCheckError("field lookup on an unknown class");
        }
      } else {
        throw new TypeCheckError("field lookups require an object");
      }
    // case "index":
    //   var tObj = tcExpr(env, locals, expr.obj);
    //   if (tObj.a === STR) {
    //     var iObj = tcExpr(env, locals, expr.index);
    //     if (iObj.a !== NUM) {
    //       throw new TypeCheckError("index should be a number");
    //     }
    //     return { ...expr, a: STR, obj: tObj, index: iObj };
    //   } else {
    //     // TODO: support list
    //     throw new TypeCheckError("indexing requires a string");
    //   }
    case "method-call":
      var tObj = tcExpr(env, locals, expr.obj);
      var tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
      if (tObj.a.tag === "class") {
        if (env.classes.has(tObj.a.name)) {
          const [_, methods] = env.classes.get(tObj.a.name);
          const superMethods = findAllSuperMethods(env, tObj.a.name);
          if (methods.has(expr.method)) {
            const [methodArgs, methodRet] = methods.get(expr.method);
            const realArgs = [tObj].concat(tArgs);
            if(methodArgs.length === realArgs.length &&
              methodArgs.every((argTyp, i) => isAssignable(env, realArgs[i].a, argTyp))) {
                return {...expr, a: methodRet, obj: tObj, arguments: tArgs};
              } else {
               throw new TypeCheckError(`Method call type mismatch: ${expr.method} --- callArgs: ${JSON.stringify(realArgs)}, methodArgs: ${JSON.stringify(methodArgs)}` );
              }
          } else if(superMethods.has(expr.method)) {
            const [methodArgs, methodRet] = superMethods.get(expr.method);
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
    case "list-obj":
      // Note: [1,2,3, True, 4] is legal in Chocopy, but cannot be assigned to any var --- let's ignore it
      // we assume the only legal situation now is all the elements in the list are the same type
      var typedentries = expr.entries.map(entry => tcExpr(env, locals, entry));
      var flag = true;
      var a0 = typedentries[0].a;
      typedentries.forEach(typedentry =>{
        if(typedentry.a.tag!= a0.tag){
          flag = false;
        }
      })
      if(flag == true){ // if all entries have same type
        return {...expr, entries: typedentries, a: {tag: "list", listsize: expr.length, elementtype: a0}};
      }
      else{  //
        throw new TypeCheckError("not support different types in one list");;
      }
    case "index":
      var typedobj = tcExpr(env, locals, expr.obj);
      var typedindex = tcExpr(env, locals, expr.index);
      if(typedobj.a.tag !== "list" && typedobj.a.tag !== "str"){
        throw new TypeCheckError(`cannot index into this variable`);
      }
      if(typedindex.a.tag !== "number"){
        throw new TypeCheckError(`index is not a number`);
      }
      if(typedobj.a.tag == "list"){
        return {...expr, obj: typedobj, index: typedindex, a: typedobj.a.elementtype};
      }
      else if(typedobj.a.tag == "str"){
        return { ...expr, a: STR, obj: typedobj, index: typedindex };
      }
    default: throw new TypeCheckError(`unimplemented type checking for expr: ${expr}`);
  }
}

export function tcLiteral(literal : Literal) {
    switch(literal.tag) {
        case "bool": return BOOL;
        case "num": return NUM;
        case "str": return STR;
        case "none": return NONE;
    }
}