
import { table } from 'console';
import { Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, TypeVar, Class, Parameter } from './ast';
import { NUM, BOOL, NONE, CLASS, TYPEVAR } from './utils';
import { emptyEnv } from './compiler';

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
  classes: Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>, Array<string>]>,
  typevars: Map<string, [string]>
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
  typevars: new Map()
};

export function emptyGlobalTypeEnv() : GlobalTypeEnv {
  return {
    globals: new Map(),
    functions: new Map(),
    classes: new Map(),
    typevars: new Map()
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

// combine the elements of two arrays into an array of tuples.
// DANGER: throws an error if argument arrays don't have the same length.
function zip<A, B>(l1: Array<A>, l2: Array<B>) : Array<[A, B]> {
  if(l1.length !== l2.length) {
    throw new TypeCheckError(`Tried to zip two arrays of different length`);
  }
  return l1.map((el, i) => [el, l2[i]]); 
}

export function equalType(env: GlobalTypeEnv, t1: Type, t2: Type) {
  return (
    t1 === t2 ||
    (t1.tag === "class" && t2.tag === "class" && t1.name === t2.name && equalTypeParams(env, t1.params, t2.params)) ||
    (t1.tag === "typevar" && t2.tag === "typevar" && t1.name === t2.name)
  );
}

// Check if a list of type-parameters are equal.
export function equalTypeParams(env: GlobalTypeEnv, params1: Type[], params2: Type[]) : boolean {
  if(params1.length !== params2.length) {
    return false;
  }

  return zip(params1, params2).reduce((isEqual, [p1, p2]) => {
    return isEqual && equalType(env, p1, p2);
  }, true);
}

export function isNoneOrClass(env: GlobalTypeEnv, t: Type) {
  return t.tag === "none" || t.tag === "class";
}

export function isSubtype(env: GlobalTypeEnv, t1: Type, t2: Type): boolean {
  return equalType(env, t1, t2) || t1.tag === "none" && t2.tag === "class" 
}

export function isAssignable(env : GlobalTypeEnv, t1 : Type, t2 : Type) : boolean {
  return isSubtype(env, t1, t2);
}

export function join(env : GlobalTypeEnv, t1 : Type, t2 : Type) : Type {
  return NONE
}

// Test if a type is valid and does not have any undefined/non-existent
// classes and that all instantiated type-parameters are valid.
export function isValidType(env: GlobalTypeEnv, t: Type) : boolean {
  // primitive types are valid types.
  if(t.tag === "number" || t.tag === "bool" || t.tag === "none") {
    return true;
  }

  // TODO: haven't taken the time to understand what either is, 
  // but considering it always valid for now.
  if(t.tag === "either") {
    return true;
  }

  // TODO: type-variables always valid types in this context ?
  if(t.tag === "typevar") {
    return true; 
  }

  // TODO: handle all other newer non-class types here

  // At this point we know t is a CLASS
  if(!env.classes.has(t.name)) {
    return false;  
  }
  
  let [_fieldsTy, _methodsTy, typeparams] = env.classes.get(t.name);

  if(t.params.length !== typeparams.length) {
    return false; 
  }

  return zip(typeparams, t.params).reduce((isValid, [typevar, typeparam]) => {
    return isValid && isValidType(env, typeparam);
  }, true);
}

// Populate the instantiated type-parameters of the class type objTy in
// field type fieldTy. This replaces typevars in fieldTy with their concrete
// instantiations from objTy. Uninstantiated type-parameters are left as typevars.
export function specializeFieldType(env: GlobalTypeEnv, objTy: Type, fieldTy: Type) : Type {
  if(objTy.tag !== "class") {
    // TODO: should we throw an error here ?
    // Don't think this should ever happen unless
    // something is really wrong.
    return fieldTy;
  }

  if(objTy.params.length === 0) {
    // classes without type parameters
    // do not need and specialization.
    return fieldTy;
  }

  // get a list of type-parameters of the class.
  let [_fields, _methods, typeparams] = env.classes.get(objTy.name);

  // create a mapping from the type-parameter name to the corresponding instantiated type.
  let map = new Map(zip(typeparams, objTy.params)); //.filter(([_typevar, typeparam]) => typeparam.tag !== "typevar"));
  return specializeType(map, fieldTy);
}

// Populate the instantiated type-parameters of the class type objTy in
// the method type given by argTypes and retType.
export function specializeMethodType(env: GlobalTypeEnv, objTy: Type, [argTypes, retType]: [Type[], Type]) : [Type[], Type] {
  if(objTy.tag !== "class") {
    // TODO: should we throw an error here ?
    // Don't think this should ever happen unless
    // something is really wrong.
    return [argTypes, retType];
  }

  if(objTy.params.length === 0) {
    // classes without type parameters
    // do not need and specialization.
    return [argTypes, retType];
  }

  let [_fields, _methods, typeparams] = env.classes.get(objTy.name);
  let map = new Map(zip(typeparams, objTy.params));  //.filter(([_typevar, typeparam]) => typeparam.tag !== "typevar"));

  let specializedRetType = specializeType(map, retType);
  let specializedArgTypes = argTypes.map(argType => specializeType(map, argType));

  return [specializedArgTypes, specializedRetType];
}

// Replace typevars based on the environment mapping the typevars
// to their current instantiated types.
export function specializeType(env: Map<string, Type>, t: Type) : Type {
  // primitive types cannot be specialized any further.
  if(t.tag === "either" || t.tag === "none" || t.tag === "bool" || t.tag === "number") {
    return t;
  } 

  if(t.tag === "typevar") {
    if(!env.has(t.name)) {
      // Uninstantiated typevars are left as is.
      return t;
    }
    return env.get(t.name);
  }

  // at this point t has to be a class type
  let specializedParams = t.params.map(p => specializeType(env, p));
  return CLASS(t.name, specializedParams);
}

export function augmentTEnv(env : GlobalTypeEnv, program : Program<null>) : GlobalTypeEnv {
  const newGlobs = new Map(env.globals);
  const newFuns = new Map(env.functions);
  const newClasses = new Map(env.classes);
  const newTypevars = new Map(env.typevars);

  program.inits.forEach(init => newGlobs.set(init.name, init.type));
  program.funs.forEach(fun => newFuns.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
  program.classes.forEach(cls => {
    const fields = new Map();
    const methods = new Map();
    cls.fields.forEach(field => fields.set(field.name, field.type));
    cls.methods.forEach(method => methods.set(method.name, [method.parameters.map(p => p.type), method.ret]));
    const typeParams = cls.typeParams;
    newClasses.set(cls.name, [fields, methods, [...typeParams]]);
  });

  program.typeVarInits.forEach(tv => {
    if(newGlobs.has(tv.name) || newTypevars.has(tv.name) || newClasses.has(tv.name)) {
      throw new TypeCheckError(`Duplicate identifier '${tv.name}' for type-variable`);
    }
    newTypevars.set(tv.name, [tv.canonicalName]);
  });
  return { globals: newGlobs, functions: newFuns, classes: newClasses, typevars: newTypevars };
}

export function tc(env : GlobalTypeEnv, program : Program<null>) : [Program<Type>, GlobalTypeEnv] {
  const locals = emptyLocalTypeEnv();
  const newEnv = augmentTEnv(env, program);
  const tTypeVars = program.typeVarInits.map(tv => tcTypeVars(newEnv, tv));
  const tInits = program.inits.map(init => tcInit(newEnv, init));
  const tDefs = program.funs.map(fun => tcDef(newEnv, fun));
  const tClasses = program.classes.map(cls => {
    if(cls.typeParams.length === 0) {
      return tcClass(newEnv, cls);
    } else {
      let rCls = resolveClassTypeParams(newEnv, cls)
      return tcGenericClass(newEnv, rCls);
    }
  });

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

  const aprogram = {a: lastTyp, inits: tInits, funs: tDefs, classes: tClasses, stmts: tBody, typeVarInits: tTypeVars};
  return [aprogram, newEnv];
}

export function tcInit(env: GlobalTypeEnv, init : VarInit<null>) : VarInit<Type> {
  if(!isValidType(env, init.type)) {
    throw new TypeCheckError(`Invalid type annotation '${JSON.stringify(init.type)}' for '${init.name}'`);
  }

  if(init.type.tag === "typevar") {
    if(init.value.tag !== "zero") {
      throw new TypeCheckError(`Generic variables must be initialized with __ZERO__`);
    }

    return {...init, a: NONE};
  }

  const valTyp = tcLiteral(init.value);
  if (isAssignable(env, valTyp, init.type)) {
    return {...init, a: NONE};
  } else {
    throw new TypeCheckError("Expected type `" + init.type + "`; got type `" + valTyp + "`");
  }
}

export function tcDef(env : GlobalTypeEnv, fun : FunDef<null>) : FunDef<Type> {
  var locals = emptyLocalTypeEnv();
  locals.expectedRet = fun.ret;
  locals.topLevel = false;
  fun.parameters.forEach(p => {
    if(!isValidType(env, p.type)) {
      throw new TypeCheckError(`Invalid type annotation '${JSON.stringify(p.type)}' for parameter '${p.name}' in function '${fun.name}'`);
    }
    locals.vars.set(p.name, p.type)
  });
  fun.inits.forEach(init => locals.vars.set(init.name, tcInit(env, init).type));
  
  const tBody = tcBlock(env, locals, fun.body);
  if (!isAssignable(env, locals.actualRet, locals.expectedRet))
    throw new TypeCheckError(`expected return type of block: ${JSON.stringify(locals.expectedRet)} does not match actual return type: ${JSON.stringify(locals.actualRet)}`)
  return {...fun, a: NONE, body: tBody};
}

// Generic classes are type-checked by treating all typevars as completely unconstrained
// types that we do not know anything about.
export function tcGenericClass(env: GlobalTypeEnv, cls: Class<null>) : Class<Type> {
  // ensure all type parameters are defined as type variables
  cls.typeParams.forEach(param => {
    if(!env.typevars.has(param)) {
      throw new TypeCheckError(`undefined type variable ${param} used in definition of class ${cls.name}`);
    }
  });

  let tyCls = tcClass(env, cls);
  return {...tyCls, a: NONE};
}

export function resolveClassTypeParams(env: GlobalTypeEnv, cls: Class<null>) : Class<null> { 
  let [fieldsTy, methodsTy, typeparams] = env.classes.get(cls.name);

  let newFieldsTy = new Map(Array.from(fieldsTy.entries()).map(([name, type]) => {
    let [_, newType] = resolveTypeTypeParams(cls.typeParams, type);
    return [name, newType];
  }));

  let newMethodsTy: Map<string, [Type[], Type]> = new Map(Array.from(methodsTy.entries()).map(([name, [params, ret]]) => {
    let [_, newRet] = resolveTypeTypeParams(cls.typeParams, ret); 
    let newParams = params.map(p => {
      let [_, newP] = resolveTypeTypeParams(cls.typeParams, p);
      return newP;
    });

    return [name, [newParams, newRet]];
  }));

  env.classes.set(cls.name, [newFieldsTy, newMethodsTy, typeparams]);

  let newFields = cls.fields.map(field => resolveVarInitTypeParams(cls.typeParams, field));
  let newMethods = cls.methods.map(method => resolveFunDefTypeParams(cls.typeParams, method));

  return {...cls, fields: newFields, methods: newMethods};
}

export function resolveVarInitTypeParams(env: string[], init: VarInit<null>) : VarInit<null> {
  let [_, newType] = resolveTypeTypeParams(env, init.type);
  return {...init, type: newType};
}

export function resolveFunDefTypeParams(env: string[], fun: FunDef<null>) : FunDef<null> {
  let newParameters = fun.parameters.map(p => resolveParameterTypeParams(env, p));
  let [_, newRet] = resolveTypeTypeParams(env, fun.ret);
  let newInits = fun.inits.map(i => resolveVarInitTypeParams(env, i));

  return {...fun, ret: newRet, parameters: newParameters, inits: newInits};
}

export function resolveParameterTypeParams(env: string[], param: Parameter<null>) : Parameter<null> {
  let [_, newType] = resolveTypeTypeParams(env, param.type);
  return {...param, type: newType}
}

export function resolveTypeTypeParams(env: string[], type: Type) : [boolean, Type] {
  if(type.tag !== "class") {
    return [false, type];
  }

  if(env.indexOf(type.name) !== -1) {
    return [true, TYPEVAR(type.name)]
  }

  let newParams: Type[]= type.params.map((p) => {
    let [_, newType] = resolveTypeTypeParams(env, p);
    return newType;
  });

  return [true, {...type, params: newParams}];
}

export function tcClass(env: GlobalTypeEnv, cls : Class<null>) : Class<Type> {
  const tFields = cls.fields.map(field => tcInit(env, field));
  const tMethods = cls.methods.map(method => tcDef(env, method));
  const init = cls.methods.find(method => method.name === "__init__") // we'll always find __init__
  
  const tParams = cls.typeParams.map(TYPEVAR);
  if (init.parameters.length !== 1 || 
    init.parameters[0].name !== "self" ||
    !equalType(env, init.parameters[0].type, CLASS(cls.name, tParams)) ||
    init.ret !== NONE)
    throw new TypeCheckError("Cannot override __init__ type signature");

  return {a: NONE, name: cls.name, fields: tFields, methods: tMethods, typeParams: cls.typeParams};
}

export function tcTypeVars(env: GlobalTypeEnv, tv: TypeVar<null>) : TypeVar<Type> {
  return {...tv, a: NONE};
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
        nameTyp = locals.vars.get(stmt.name);
      } else if (env.globals.has(stmt.name)) {
        nameTyp = env.globals.get(stmt.name);
      } else {
        throw new TypeCheckError("Unbound id: " + stmt.name);
      }

      // TODO: this is an ugly temporary hack for generic constructor
      // calls until explicit annotations are supported.
      // Until then constructors for generic classes are properly checked only
      // when directly assigned to variables and will fail in unexpected ways otherwise.
      if(nameTyp.tag === 'class' && nameTyp.params.length !== 0 && tValExpr.a.tag === 'class' && tValExpr.a.name === nameTyp.name && tValExpr.tag === 'construct') {
        // it would have been impossible for the inner type-checking
        // code to properly infer and fill in the type parameters for
        // the constructor call. So we copy it from the type of the variable
        // we are assigning to.
        tValExpr.a.params = [...nameTyp.params]; 
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
      if (!equalType(env, tCond.a, BOOL)) 
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

      let fieldTy = specializeFieldType(env, tObj.a, fields.get(stmt.field));

      // TODO: this is an ugly temporary hack for generic constructor
      // calls until explicit annotations are supported.
      // Until then constructors for generic classes are properly checked only
      // when directly assigned to fields and will fail in unexpected ways otherwise.
      if(fieldTy.tag === "class" && fieldTy.params.length !== 0 && tVal.a.tag === 'class' && tVal.a.name === fieldTy.name && tVal.tag === 'construct') {
        // it would have been impossible for the inner type-checking
        // code to properly infer and fill in the type parameters for
        // the constructor call. So we copy it from the type of the field
        // we are assigning to.
        tVal.a.params = [...fieldTy.params]; 
      }

      if (!isAssignable(env, tVal.a, fieldTy))
        throw new TypeCheckError(`could not assign value of type: ${JSON.stringify(tVal.a)}; field ${stmt.field} expected type: ${JSON.stringify(fieldTy)}`);
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
        case BinOp.Minus:
        case BinOp.Mul:
        case BinOp.IDiv:
        case BinOp.Mod:
          if(equalType(env, tLeft.a, NUM) && equalType(env, tRight.a, NUM)) { return {a: NUM, ...tBin}}
          else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
        case BinOp.Eq:
        case BinOp.Neq:
          if(tLeft.a.tag === "class" || tRight.a.tag === "class") throw new TypeCheckError("cannot apply operator '==' on class types")
          if(tLeft.a.tag === "typevar" || tRight.a.tag === "typevar") throw new TypeCheckError("cannot apply operator '==' on unconstrained type parameters")
          if(equalType(env, tLeft.a, tRight.a)) { return {a: BOOL, ...tBin} ; }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op)}
        case BinOp.Lte:
        case BinOp.Gte:
        case BinOp.Lt:
        case BinOp.Gt:
          if(equalType(env, tLeft.a, NUM) && equalType(env, tRight.a, NUM)) { return {a: BOOL, ...tBin} ; }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op) }
        case BinOp.And:
        case BinOp.Or:
          if(equalType(env, tLeft.a, BOOL) && equalType(env, tRight.a, BOOL)) { return {a: BOOL, ...tBin} ; }
          else { throw new TypeCheckError("Type mismatch for boolean op" + expr.op); }
        case BinOp.Is:
          if(!isNoneOrClass(env, tLeft.a) || !isNoneOrClass(env, tRight.a))
            throw new TypeCheckError("is operands must be objects");
          return {a: BOOL, ...tBin};
      }
    case "uniop":
      const tExpr = tcExpr(env, locals, expr.expr);
      const tUni = {...expr, a: tExpr.a, expr: tExpr}
      switch(expr.op) {
        case UniOp.Neg:
          if(equalType(env, tExpr.a, NUM)) { return tUni }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op);}
        case UniOp.Not:
          if(equalType(env, tExpr.a, BOOL)) { return tUni }
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
            return {...expr, a: specializeFieldType(env, tObj.a, fields.get(expr.field)), obj: tObj};
          } else {
            throw new TypeCheckError(`could not found field ${expr.field} in class ${tObj.a.name}`);
          }
        } else {
          throw new TypeCheckError("field lookup on an unknown class");
        }
      } else {
        throw new TypeCheckError("field lookups require an object");
      }
    case "method-call":
      var tObj = tcExpr(env, locals, expr.obj);
      var tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
      if (tObj.a.tag === "class") {
        if (env.classes.has(tObj.a.name)) {
          const [_, methods] = env.classes.get(tObj.a.name);
          if (methods.has(expr.method)) {
            const [methodArgs, methodRet] = specializeMethodType(env, tObj.a, methods.get(expr.method));
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
    }
}
