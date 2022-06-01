
import { table } from 'console';
import { Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, Class } from './ast';
import { NUM, BOOL, NONE, CLASS, LIST, STR, EMPTY } from './utils';
import { emptyEnv, GlobalEnv } from './compiler';

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
  funscopevars: Map<string, Type>,
  globalDecls: Set<string>,
  nonLocalDecls: Set<string>,
  fundefs: Map<string, [Array<Type>, Type, string]>,
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
    classes: new Map(),
  };
}

export function checkIfSameSignature(env: GlobalTypeEnv, signature1: [Type[], Type], signature2: [Type[], Type]): boolean {
  const args1 = signature1[0];
  const args2 = signature2[0];
  if (!equalType(env, signature1[1], signature2[1])) {
    return false;
  }
  if (args1.length !== args2.length) return false;
  for (let i = 1; i < args1.length; i++) {
    if (!equalType(env, args1[i], args2[i])) {
      return false;
    }
  }
  return true;
}

export function hasMethod(env: GlobalTypeEnv, name: string, method: string) : [[Type[], Type]|undefined, boolean] {
  const [fields, methods, supername] = env.classes.get(name);
  if(methods.has(method)) return [methods.get(method), true];
  if (name === "object") return [undefined, false];
  return hasMethod(env, supername, method);
}

export function hasField(env: GlobalTypeEnv, name: string, obj: Expr<Type>, field: string) : [Type, boolean] {
  const [fields, methods, supername] = env.classes.get(name);
  if(fields.has(field)) return [fields.get(field), true];
  if (name === "object") return [NONE, false];
  return hasField(env, supername, obj, field);
}

export function emptyLocalTypeEnv() : LocalTypeEnv {
  return {
    vars: new Map(),
    fundefs: new Map(),
    funscopevars: new Map(),
    globalDecls: new Set(),
    nonLocalDecls: new Set(),
    expectedRet: NONE,
    actualRet: NONE,
    topLevel: true
  };
}

export function duplicateEnv(env: LocalTypeEnv) : LocalTypeEnv {
  return {
    vars: new Map(),
    funscopevars: new Map(env.funscopevars),
    fundefs: new Map(env.fundefs),
    globalDecls: new Set(),
    nonLocalDecls: new Set(),
    expectedRet: env.expectedRet,
    actualRet: NONE,
    topLevel: env.topLevel
  };
}

export type TypeError = {
  message: string
}

export function equalType(env: GlobalTypeEnv, t1: Type, t2: Type): boolean {
  return (
    t1 === t2 ||
    (t1.tag === "class" && t2.tag === "class" && t1.name === t2.name)
    || (t1.tag === "list" && t2.tag === "list" && equalType(env, t1.type, t2.type))
  );
}

export function isNoneOrClassorList(t: Type) {
  return t.tag === "none" || t.tag === "class" || t.tag === "list";
}

export function isDescendant(env: GlobalTypeEnv, rhs: string, lhs: string): boolean {
  if (rhs === "object") return false;
  const rhsClassData = env.classes.get(rhs);
  if (rhsClassData[2] === lhs) return true;
  return isDescendant(env, rhsClassData[2], lhs);
}

export function isSubtype(env: GlobalTypeEnv, t1: Type, t2: Type): boolean {
  return equalType(env, t1, t2) || (t1.tag === "none" && t2.tag === "class")
   || (t1.tag === "emptyList")
   || (t1.tag === "none" && t2.tag === "list")
   || (t2.tag === "class" && t2.name === "object")
   || (t1.tag === "class" && t2.tag === "class" && isDescendant(env, t1.name, t2.name))
   || (t1.tag === "either" && isAssignable(env, t1.left, t2) && isAssignable(env, t1.right, t2))
   || (t1.tag === "list" && t2.tag === "list" && isAssignable(env, t1.type, t2.type));
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
  program.inits.forEach(init => newGlobs.set(init.name, init.type));
  program.fundefs.forEach(fun => newFuns.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
  program.classes.forEach(cls => {
    // if (!newClasses.has(cls.superclass) && cls.name !== "object") {
    //   //TODO:
    //   throw new TypeCheckError("Super class not defined before the class");
    // }
    // if (newClasses.has(cls.name)) {
    //   //TODO:
    //   throw new TypeCheckError("Class redefinition not allowed");
    // }
    const fields = new Map();
    const methods = new Map();
    cls.fields.forEach(field => fields.set(field.name, field.type));
    cls.methods.forEach(method => methods.set(method.name, [method.parameters.map(p => p.type), method.ret]));

    if (cls.name !== "object") {
      const [superFields, superMethods] = newClasses.get(cls.superclass);
      fields.forEach((value, fieldName) => {
        if (superFields.has(fieldName) && fieldName !== "super") {
          throw new TypeCheckError(`Superclass ${cls.superclass} and class ${cls.name} cannot have common fields`);
        }
      });
      methods.forEach((signature, methodName) => {
        if (superMethods.has(methodName)) {
          const superSignature = superMethods.get(methodName);
          if (!checkIfSameSignature(env, signature, superSignature)) {
            throw new TypeCheckError(`Superclass ${cls.superclass} and class ${cls.name} cannot have same method with different signature`);
          }
        }
      });
    }

    // methods.forEach((signature, methodName) => {
    //   if (signature[0].length === 0 || !equalType(env, signature[0][0], CLASS(cls.name))) {
    //     //TODO:
    //     throw new TypeCheckError("First argument must be reference to the object");
    //   }
    // });

    newClasses.set(cls.name, [fields, methods, cls.superclass]);
  });
  return { globals: newGlobs, functions: newFuns, classes: newClasses };
}

export function tc(env : GlobalTypeEnv, program : Program<null>) : [Program<Type>, GlobalTypeEnv] {
  const locals = emptyLocalTypeEnv();
  const newEnv = augmentTEnv(env, program);
  const tInits = program.inits.map(init => tcInit(newEnv, locals, init));
  const tDefs = program.fundefs.map(fun => tcDef(newEnv, emptyLocalTypeEnv(), fun));
  const tClasses = program.classes.map(cls => tcClass(newEnv, locals, cls));

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
  const aprogram = {a: lastTyp, inits: tInits, fundefs: tDefs, classes: tClasses, stmts: tBody};
  return [aprogram, newEnv];
}

export function tcList(env: GlobalTypeEnv, init : VarInit<null>) : VarInit<null> {
  //@ts-ignore
  switch (init.type.type.tag) {
    case "class":
      //@ts-ignore
      if (!env.classes.has(init.type.type.name)) {
        //@ts-ignore
        throw new TypeCheckError(`Undefined class name: ${init.type.type.name}`);
      }
      return init;
    case "none":
      throw new TypeCheckError("NONE type does not exist");
  }
  return init;
}

export function tcInit(env: GlobalTypeEnv, locals: LocalTypeEnv, init : VarInit<null>) : VarInit<Type> {
  const valTyp = tcLiteral(env, locals, init.value);
  if (isAssignable(env, valTyp, init.type)) {
    if (init.type.tag === "list") {
      tcList(env, init);
    }
    return {...init, a: NONE};
  } else {
    throw new TypeCheckError("Expected type `" + init.type + "`; got type `" + valTyp + "`");
  }
}

export function tcDef(env : GlobalTypeEnv, local: LocalTypeEnv, fun : FunDef<null>) : FunDef<Type> {
  var locals = duplicateEnv(local);
  var nameSet :Set<string> = new Set();
  locals.expectedRet = fun.ret;
  locals.topLevel = false;

  fun.parameters.forEach(p => {
    if (nameSet.has(p.name)) {
      throw new TypeCheckError(`Duplicate param ${p.name} in function ${fun.name}`);
    }
    nameSet.add(p.name);
    locals.vars.set(p.name, p.type);
    locals.funscopevars.set(p.name, p.type);
  });
  fun.inits.forEach(init => {
    if (nameSet.has(init.name)) {
      throw new TypeCheckError(`Duplicate var init ${init.name} in function ${fun.name}`);
    }
    nameSet.add(init.name);
    const type = tcInit(env, locals, init).type;
    locals.vars.set(init.name, type)
    locals.funscopevars.set(init.name, type);
  });
  fun.fundefs.forEach(funp => {
    if (nameSet.has(funp.name)) {
      throw new TypeCheckError(`Duplicate function definition of ${funp.name} in function ${fun.name}`);
    }
    nameSet.add(funp.name);
    locals.fundefs.set(funp.name, [funp.parameters.map(p => p.type), funp.ret, fun.name+"$"+funp.name])
  });
  fun.fundefs.forEach(funp => {
    funp.name = fun.name + "$" + funp.name;
  });
  fun.globaldecls.forEach((globalDecl) => {
    if (nameSet.has(globalDecl.name)) {
      throw new TypeCheckError(`Duplicate variable declaration ${globalDecl.name} in fundef`);
    }
    nameSet.add(globalDecl.name);
    if (env.globals.has(globalDecl.name)) {
      locals.globalDecls.add(globalDecl.name);
    } else {
      throw new TypeCheckError(`Unbound global id ${globalDecl.name}`);
    }
  });
  fun.nonlocaldecls.forEach((nonLocalDecl) => {
    if (nameSet.has(nonLocalDecl.name)) {
      throw new TypeCheckError(`Duplicate variable declaration ${nonLocalDecl.name} in function ${fun.name}`);
    }
    nameSet.add(nonLocalDecl.name);
    if (locals.funscopevars.has(nonLocalDecl.name)) {
      locals.nonLocalDecls.add(nonLocalDecl.name);
    } else {
      throw new TypeCheckError(`Unbound local id ${nonLocalDecl.name}`);
    }
  });
  const tFunDefs = fun.fundefs.map(fun => tcDef(env, locals, fun));
  
  const tBody = tcBlock(env, locals, fun.body, true);
  if (!isAssignable(env, locals.actualRet, locals.expectedRet))
    throw new TypeCheckError(`expected return type of block: ${JSON.stringify(locals.expectedRet)} does not match actual return type: ${JSON.stringify(locals.actualRet)}`)
  return {...fun, a: NONE, body: tBody, fundefs: tFunDefs};
}

export function tcClass(env: GlobalTypeEnv, locals: LocalTypeEnv, cls : Class<null>) : Class<Type> {
  const tFields = cls.fields.map(field => tcInit(env, locals, field));
  const tMethods = cls.methods.map(method => tcDef(env, locals, method));
  const init = tMethods.find(method => method.name === "__init__") // we'll always find __init__
  
  if (init !== undefined && (init.parameters.length !== 1 || 
    // init.parameters[0].name !== "self" ||
    !equalType(env, init.parameters[0].type, CLASS(cls.name)) ||
    init.ret !== NONE))
    throw new TypeCheckError("Cannot override __init__ type signature");
  return {a: NONE, name: cls.name, fields: tFields, methods: tMethods, superclass: cls.superclass};
}

export function tcBlock(env : GlobalTypeEnv, locals : LocalTypeEnv, stmts : Array<Stmt<null>>, isFunc: boolean = false) : Array<Stmt<Type>> {
  var tStmts = stmts.map(stmt => tcStmt(env, locals, stmt, isFunc));
  return tStmts;
}

export function tcStmt(env : GlobalTypeEnv, locals : LocalTypeEnv, stmt : Stmt<null>, inFunc: boolean = false) : Stmt<Type> {
  switch(stmt.tag) {
    case "assign":
      const tValExpr = tcExpr(env, locals, stmt.value);
      var nameTyp;
      if (locals.vars.has(stmt.name)) {
        nameTyp = locals.vars.get(stmt.name);
      } else if (locals.nonLocalDecls.has(stmt.name)) {
        nameTyp = locals.funscopevars.get(stmt.name);
      } else if (env.globals.has(stmt.name)) {
        if (inFunc && !locals.globalDecls.has(stmt.name)) {
          throw new TypeCheckError("Can't assign to global val: " + stmt.name);
        }
        nameTyp = env.globals.get(stmt.name);
      } else {
        throw new TypeCheckError("Unbound id: " + stmt.name);
      }
      if(!isAssignable(env, tValExpr.a, nameTyp)) {
        throw new TypeCheckError("Non-assignable types");
      }
      return {a: NONE, tag: stmt.tag, name: stmt.name, value: tValExpr};
    case "expr":
      const tExpr = tcExpr(env, locals, stmt.expr);
      return {a: tExpr.a, tag: stmt.tag, expr: tExpr};
    case "if":
      var tCond = tcExpr(env, locals, stmt.cond);
      const tThn = tcBlock(env, locals, stmt.thn);
      const thnTyp = locals.actualRet;
      locals.actualRet = NONE;
      let tEls = undefined; 
      let elsTyp = undefined; 
      if (stmt.els) {
        if (Array.isArray(stmt.els)) {
          tEls = tcBlock(env, locals, stmt.els);
          elsTyp = locals.actualRet;
        } else {
          tEls = tcStmt(env, locals, stmt.els, inFunc);
          elsTyp = locals.actualRet;
        }
      }
      if (tCond.a !== BOOL) 
        throw new TypeCheckError("Condition Expression Must be a bool");
      if (thnTyp !== elsTyp && stmt.els)
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
    case "for":
      var itNameTyp;
      if (stmt.iterator.tag !== "id") {
        throw new TypeCheckError("Iterator must be an id");
      }
      if (locals.vars.has(stmt.iterator.name)) {
        itNameTyp = locals.vars.get(stmt.iterator.name);
      }  else if (locals.nonLocalDecls.has(stmt.iterator.name)) {
        itNameTyp = locals.funscopevars.get(stmt.iterator.name);
      } else if (env.globals.has(stmt.iterator.name)) {
        if (inFunc && !locals.globalDecls.has(stmt.iterator.name)) {
          throw new TypeCheckError("Can't assign to global val: " + stmt.iterator.name);
        }
        itNameTyp = env.globals.get(stmt.iterator.name);
      } else {
        throw new TypeCheckError("Unbound id: " + stmt.iterator.name);
      }
      const tcIterable = tcExpr(env, locals, stmt.iterable);
      switch (tcIterable.a.tag) {
        case "list":
          if (!isAssignable(env, tcIterable.a.type, itNameTyp)) {
            //TODO
            throw new TypeCheckError("For loop type mismatch");
          }
          break;
        case "str":
          if (!equalType(env, tcIterable.a, itNameTyp)) {
            //TODO
            throw new TypeCheckError("For loop type mismatch");
          }
          break;
        default: {
          //TODO
          throw new TypeCheckError("Invalid iterable type");
        }
      }
      const itBody = tcBlock(env, locals, stmt.body);
      if (tcIterable.a.tag === "str") {
        return {a: NONE, ...stmt, iterable: tcIterable, body: itBody, tag: "for-str"};
      }
      return {a: NONE, ...stmt, iterable: tcIterable, body: itBody};
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
      // if (!fields.has(stmt.field)) 
      const [type, flag] = hasField(env, tObj.a.name, tObj, stmt.field);
      if (!flag)
        throw new TypeCheckError(`could not find field ${stmt.field} in class ${tObj.a.name}`);
      if (!isAssignable(env, tVal.a, type))
        throw new TypeCheckError(`could not assign value of type: ${tVal.a}; field ${stmt.field} expected type: ${fields.get(stmt.field)}`);
      return {...stmt, a: NONE, obj: tObj, value: tVal};
    case "index-assign":
      var iObj = tcExpr(env, locals, stmt.obj);
      var iVal = tcExpr(env, locals, stmt.value);
      var index = tcExpr(env, locals, stmt.index);
      if (!isAssignable(env, index.a, NUM)) {
        throw new TypeCheckError(`list index must be of type int`);
      }
      switch (iObj.a.tag) {
        case "list":
          if (!isAssignable(env, iVal.a, iObj.a.type)) {
            throw new TypeCheckError(`index invalid assignment, expected: ${iObj.a.type}, got ${iVal.a}`);
          }
          break;
        default:
          throw new TypeCheckError(`index assignment is only allowed for type list`);
      }
      return {...stmt, a: NONE, obj: iObj, index, value: iVal };
  }
}

export function tcExpr(env : GlobalTypeEnv, locals : LocalTypeEnv, expr : Expr<null>) : Expr<Type> {
  switch(expr.tag) {
    case "literal": 
      return {...expr, a: tcLiteral(env, locals, expr.value)};
    case "binop":
      const tLeft = tcExpr(env, locals, expr.left);
      const tRight = tcExpr(env, locals, expr.right);
      const tBin = {...expr, left: tLeft, right: tRight};
      switch(expr.op) {
        case BinOp.Plus:
          if (tLeft.a.tag === "list" && tRight.a.tag === "list") {
            // if(isAssignable(env, tLeft.a, tRight.a)) { return {a: tRight.a, ...tBin}}
            // else if(isAssignable(env, tRight.a, tLeft.a)) { return {a: tLeft.a, ...tBin}}
            // else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
            return {a: {tag: "list", type: {tag: "either", left: tLeft.a.type, right: tRight.a.type}}, ...tBin};
          }
          if (tLeft.a.tag === "str" && tRight.a.tag === "str") {
            return {a: STR, ...tBin};
          }
          
        case BinOp.Minus:
        case BinOp.Mul:
        case BinOp.IDiv:
        case BinOp.Mod:
          if(equalType(env, tLeft.a, NUM) && equalType(env, tRight.a, NUM)) { return {a: NUM, ...tBin}}
          else { throw new TypeCheckError("Type mismatch for numeric op" + expr.op); }
        case BinOp.Eq:
        case BinOp.Neq:
          if(tLeft.a.tag === "class" || tRight.a.tag === "class") throw new TypeCheckError("cannot apply operator '==' on class types")
          if(tLeft.a === NONE || tRight.a === NONE) throw new TypeCheckError("cannot apply operator '==' on None types")
          if(tLeft.a.tag === "list" || tRight.a.tag === "list") throw new TypeCheckError("cannot apply operator '==' on list types")
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
          if(!isNoneOrClassorList(tLeft.a) || !isNoneOrClassorList(tRight.a))
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
      } else if(locals.funscopevars.has(expr.name)) {
        return {a: locals.funscopevars.get(expr.name), ...expr};
      }
      else if (env.globals.has(expr.name)) {
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
        if (tArg.a.tag !== "list" && tArg.a.tag !== "str") {
          throw new TypeError(`Len only takes type list/str as input, got: ${tArg.a.tag}`);
        }
        return {...expr, a: NUM, arg: tArg};
      } 
      else if(env.functions.has(expr.name)) {
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
        if (expr.arguments.length !== 0)
            throw new TypeCheckError("__init__ didn't receive the correct number of arguments from the constructor");
        return tConstruct;
      } else if (locals.fundefs.has(expr.name)) {
        const [argTypes, retType, funName] = locals.fundefs.get(expr.name);
        const tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
        if(argTypes.length === expr.arguments.length &&
           tArgs.every((tArg, i) => isAssignable(env, tArg.a, argTypes[i]))) {
             return {...expr, a: retType, arguments: expr.arguments, name: funName};
        } else {
        throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else if(env.functions.has(expr.name)) {
        const [argTypes, retType] = env.functions.get(expr.name);
        const tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
        if(argTypes.length === expr.arguments.length &&
           tArgs.every((tArg, i) => isAssignable(env, tArg.a, argTypes[i]))) {
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
          const [type, flag] = hasField(env, tObj.a.name, tObj, expr.field);
          if (flag) {
            return {...expr, a: type, obj: tObj};
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
          // if (methods.has(expr.method)) {
          const [classMethod, flag] = hasMethod(env, tObj.a.name, expr.method);
          if (flag) {
            const [methodArgs, methodRet] = classMethod;
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
    case "index":
      var tObj = tcExpr(env, locals, expr.object);
      var index = tcExpr(env, locals, expr.index);
      if (!isAssignable(env, index.a, NUM)) {
        throw new TypeCheckError(`index must be of type int`);
      }
      switch (tObj.a.tag) {
        case "list":
          return {...expr, a: tObj.a.type, index, object: tObj };
        case "str":
          return {...expr, a: STR, index, object: tObj, tag: "index-str" };
        default:
          throw new TypeCheckError(`indexing is only allowed for type list/str`);
      }
    case "cond-expr":
      var ifobj = tcExpr(env, locals, expr.ifobj);
      var elseobj = tcExpr(env, locals, expr.elseobj);
      var condObj = tcExpr(env, locals, expr.cond);
      var type :Type = { tag: "either", left: ifobj.a, right: elseobj.a };
      if (condObj.a !== BOOL) {
        throw new TypeCheckError(`expected boolean type in condition, got: ${condObj.a}`);
      }
      if (equalType(env, ifobj.a, elseobj.a)) {
        type = ifobj.a;
      }
      return {...expr, cond: condObj, ifobj, elseobj, a: type};
    default: throw new TypeCheckError(`unimplemented type checking for expr: ${expr}`);
  }
}

export function tcLiteral(env: GlobalTypeEnv, locals: LocalTypeEnv, literal : Literal) {
    switch(literal.tag) {
        case "bool": return BOOL;
        case "num": return NUM;
        case "none": return NONE;
        case "str": return STR;
        case "list": 
          const value: Expr<Type>[] = [];
          for(let i = 0; i < literal.value.length; i++) {
            value.push(tcExpr(env, locals, literal.value[i] as Expr<null>));
          }
          const type = findListType(value, 0);
          literal.value = value;
          literal.type = LIST(type);
          return LIST(type);
    }
}

export function findListType(value: Expr<Type>[], idx:number): Type {
  if (value.length === 0) {
    return EMPTY;
  }
  if (idx === value.length - 1) {
    return value[idx].a;
  }
  const rightType = findListType(value, idx+1);
  return {tag: "either", left: value[idx].a, right: rightType};
}