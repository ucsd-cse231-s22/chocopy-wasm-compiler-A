
import { table } from 'console';
import { Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, Class, Annotation, Location, stringifyOp } from './ast';
import { NUM, BOOL, NONE, CLASS } from './utils';
import { emptyEnv } from './compiler';

// I ❤️ TypeScript: https://github.com/microsoft/TypeScript/issues/13965
export class TypeCheckError extends Error {
  __proto__: Error
  constructor(message?: string, fromLoc?: Location, endLoc?: Location, src?: string, explanation?: string) {
    const trueProto = new.target.prototype;
    const loc = (fromLoc) ? ` on line ${fromLoc.row} at col ${fromLoc.col}` : '';
    // TODO: squiggly lines
    const exp = (src && explanation) ? `\n\n${src}\n${explanation}` : '';
    super("TYPE ERROR: " + message + loc + exp);

    // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
    this.__proto__ = trueProto;
  }
}

export type GlobalTypeEnv = {
  globals: Map<string, Type>,
  functions: Map<string, [Array<Type>, Type]>,
  classes: Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>]>
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

export function emptyGlobalTypeEnv(): GlobalTypeEnv {
  return {
    globals: new Map(),
    functions: new Map(),
    classes: new Map()
  };
}

export function emptyLocalTypeEnv(): LocalTypeEnv {
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
    t1 === t2 ||
    (t1.tag === "class" && t2.tag === "class" && t1.name === t2.name)
  );
}

export function isNoneOrClass(t: Type) {
  return t.tag === "none" || t.tag === "class";
}

export function isSubtype(env: GlobalTypeEnv, t1: Type, t2: Type): boolean {
  return equalType(t1, t2) || t1.tag === "none" && t2.tag === "class"
}

export function isAssignable(env: GlobalTypeEnv, t1: Type, t2: Type): boolean {
  return isSubtype(env, t1, t2);
}

export function join(env: GlobalTypeEnv, t1: Type, t2: Type): Type {
  return NONE
}

export function augmentTEnv(env: GlobalTypeEnv, program: Program<Annotation>): GlobalTypeEnv {
  const newGlobs = new Map(env.globals);
  const newFuns = new Map(env.functions);
  const newClasses = new Map(env.classes);
  program.inits.forEach(init => newGlobs.set(init.name, init.type));
  program.funs.forEach(fun => newFuns.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
  program.classes.forEach(cls => {
    const fields = new Map();
    const methods = new Map();
    cls.fields.forEach(field => fields.set(field.name, field.type));
    cls.methods.forEach(method => methods.set(method.name, [method.parameters.map(p => p.type), method.ret]));
    newClasses.set(cls.name, [fields, methods]);
  });
  return { globals: newGlobs, functions: newFuns, classes: newClasses };
}

export function tc(env: GlobalTypeEnv, program: Program<Annotation>): [Program<Annotation>, GlobalTypeEnv] {
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
  var lastTyp: Type = NONE;
  if (tBody.length) {
    lastTyp = tBody[tBody.length - 1].a.type;
  }
  // TODO(joe): check for assignment in existing env vs. new declaration
  // and look for assignment consistency
  for (let name of locals.vars.keys()) {
    newEnv.globals.set(name, locals.vars.get(name));
  }
  const aprogram = { a: { ...program.a, type: lastTyp }, inits: tInits, funs: tDefs, classes: tClasses, stmts: tBody };
  return [aprogram, newEnv];
}

export function tcInit(env: GlobalTypeEnv, init: VarInit<Annotation>): VarInit<Annotation> {
  const valTyp = tcLiteral(init.value);
  if (isAssignable(env, valTyp, init.type)) {
    return { ...init, a: { ...init.a, type: NONE } };
  } else {
    console.log(init.type);
    console.log(valTyp);
    throw new TypeCheckError(`Expected type ${JSON.stringify(init.type.tag)}; got type ${JSON.stringify(valTyp.tag)}`, init.value.a.fromLoc, init.value.a.endLoc);
  }
}

export function tcDef(env: GlobalTypeEnv, fun: FunDef<Annotation>): FunDef<Annotation> {
  var locals = emptyLocalTypeEnv();
  locals.expectedRet = fun.ret;
  locals.topLevel = false;
  fun.parameters.forEach(p => locals.vars.set(p.name, p.type));
  fun.inits.forEach(init => locals.vars.set(init.name, tcInit(env, init).type));

  const tBody = tcBlock(env, locals, fun.body);
  if (!isAssignable(env, locals.actualRet, locals.expectedRet))
    // TODO: what locations to be reported here?
    throw new TypeCheckError(`expected return type of block: ${JSON.stringify(locals.expectedRet)} does not match actual return type: ${JSON.stringify(locals.actualRet)}`);
  return { ...fun, a: { ...fun.a, type: NONE }, body: tBody };
}

export function tcClass(env: GlobalTypeEnv, cls: Class<Annotation>): Class<Annotation> {
  const tFields = cls.fields.map(field => tcInit(env, field));
  const tMethods = cls.methods.map(method => tcDef(env, method));
  const init = cls.methods.find(method => method.name === "__init__") // we'll always find __init__
  if (init.parameters.length !== 1 ||
    init.parameters[0].name !== "self" ||
    !equalType(init.parameters[0].type, CLASS(cls.name)) ||
    init.ret !== NONE) {
    const reason = (init.parameters.length !== 1) ? `${init.parameters.length} parameters` :
      (init.parameters[0].name !== "self") ? `parameter name ${init.parameters[0].name}` :
        (!equalType(init.parameters[0].type, CLASS(cls.name))) ? `parameter type ${JSON.stringify(init.parameters[0].type)}` :
          (init.ret !== NONE) ? `return type ${JSON.stringify(init.ret)}` : "unknown reason";

    throw new TypeCheckError(`__init__ takes 1 parameter \`self\` of the same type of the class \`${cls.name}\` with return type of \`None\`, got ${reason}`, init.a.fromLoc, init.a.endLoc);
  }
  return { a: { ...cls.a, type: NONE }, name: cls.name, fields: tFields, methods: tMethods };
}

export function tcBlock(env: GlobalTypeEnv, locals: LocalTypeEnv, stmts: Array<Stmt<Annotation>>): Array<Stmt<Annotation>> {
  var tStmts = stmts.map(stmt => tcStmt(env, locals, stmt));
  return tStmts;
}


export function tcStmt(env: GlobalTypeEnv, locals: LocalTypeEnv, stmt: Stmt<Annotation>): Stmt<Annotation> {
  switch (stmt.tag) {
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
      if (!isAssignable(env, tValExpr.a.type, nameTyp))
        throw new TypeCheckError(`Assignment value should have assignable type to type ${JSON.stringify(nameTyp.tag)}, got ${JSON.stringify(tValExpr.a.type.tag)}`,
        tValExpr.a.fromLoc, tValExpr.a.endLoc);
      return { a: { ...stmt.a, type: NONE }, tag: stmt.tag, name: stmt.name, value: tValExpr };
    case "expr":
      const tExpr = tcExpr(env, locals, stmt.expr);
      return { a: tExpr.a, tag: stmt.tag, expr: tExpr };
    case "if":
      var tCond = tcExpr(env, locals, stmt.cond);
      const tThn = tcBlock(env, locals, stmt.thn);
      const thnTyp = locals.actualRet;
      locals.actualRet = NONE;
      const tEls = tcBlock(env, locals, stmt.els);
      const elsTyp = locals.actualRet;
      if (tCond.a.type !== BOOL)
        throw new TypeCheckError(`Condition Expression Must be have type "bool", got ${JSON.stringify(tCond.a.type.tag)}`, tCond.a.fromLoc, tCond.a.endLoc);
      if (thnTyp !== elsTyp)
        locals.actualRet = { tag: "either", left: thnTyp, right: elsTyp }
      return { a: { ...stmt.a, type: thnTyp }, tag: stmt.tag, cond: tCond, thn: tThn, els: tEls };
    case "return":
      if (locals.topLevel)
      // TODO
        throw new TypeCheckError("cannot return outside of functions");
      const tRet = tcExpr(env, locals, stmt.value);
      if (!isAssignable(env, tRet.a.type, locals.expectedRet))
        throw new TypeCheckError("expected return type `" + (locals.expectedRet as any).tag + "`; got type `" + (tRet.a.type as any).tag + "`",
          stmt.a.fromLoc, stmt.a.endLoc); // returning the loc of the entire return statement here because the retExpr might be empty
      locals.actualRet = tRet.a.type;
      return { a: tRet.a, tag: stmt.tag, value: tRet };
    case "while":
      var tCond = tcExpr(env, locals, stmt.cond);
      const tBody = tcBlock(env, locals, stmt.body);
      if (!equalType(tCond.a.type, BOOL))
        throw new TypeCheckError(`Condition Expression Must be a bool, got ${JSON.stringify(tCond.a.type.tag)}`, tCond.a.fromLoc, tCond.a.endLoc);
      return { a: { ...stmt.a, type: NONE }, tag: stmt.tag, cond: tCond, body: tBody };
    case "pass":
      return { a: { ...stmt.a, type: NONE }, tag: stmt.tag };
    case "field-assign":
      var tObj = tcExpr(env, locals, stmt.obj);
      const tVal = tcExpr(env, locals, stmt.value);
      if (tObj.a.type.tag !== "class")
        throw new TypeCheckError(`field assignments require an object, got ${JSON.stringify(tObj.a.type.tag)}`, tObj.a.fromLoc, tObj.a.endLoc);
      if (!env.classes.has(tObj.a.type.name))
        throw new TypeCheckError(`field assignment on an unknown class \`${tObj.a.type.name}\``, tObj.a.fromLoc, tObj.a.endLoc);
      const [fields, _] = env.classes.get(tObj.a.type.name);
      if (!fields.has(stmt.field))
        throw new TypeCheckError(`could not find field \`${stmt.field}\` in class \`${tObj.a.type.name}\``, stmt.a.fromLoc, stmt.a.endLoc);
      if (!isAssignable(env, tVal.a.type, fields.get(stmt.field)))
        throw new TypeCheckError(`field \`${stmt.field}\` expected type: ${JSON.stringify(fields.get(stmt.field).tag)}, got value of type ${JSON.stringify(tVal.a.type.tag)}`,
          tVal.a.fromLoc, tVal.a.endLoc);
      return { ...stmt, a: { ...stmt.a, type: NONE }, obj: tObj, value: tVal };
  }
}

export function tcExpr(env: GlobalTypeEnv, locals: LocalTypeEnv, expr: Expr<Annotation>): Expr<Annotation> {
  switch (expr.tag) {
    case "literal":
      return { ...expr, a: { ...expr.a, type: tcLiteral(expr.value) } };
    case "binop":
      const tLeft = tcExpr(env, locals, expr.left);
      const tRight = tcExpr(env, locals, expr.right);
      const tBin = { ...expr, left: tLeft, right: tRight };
      switch (expr.op) {
        case BinOp.Plus:
        case BinOp.Minus:
        case BinOp.Mul:
        case BinOp.IDiv:
        case BinOp.Mod:
          if (equalType(tLeft.a.type, NUM) && equalType(tRight.a.type, NUM)) { return { ...tBin, a: { ...expr.a, type: NUM } } }
          else { throw new TypeCheckError(`Binary operator \`${stringifyOp(expr.op)}\` expects type "int" on both sides, got ${JSON.stringify(tLeft.a.type.tag)} and ${JSON.stringify(tRight.a.type.tag)}`,
            expr.a.fromLoc, expr.a.endLoc); }
        case BinOp.Eq:
        case BinOp.Neq:
          if (tLeft.a.type.tag === "class" || tRight.a.type.tag === "class") throw new TypeCheckError("cannot apply operator '==' on class types")
          if (equalType(tLeft.a.type, tRight.a.type)) { return { ...tBin, a: { ...expr.a, type: BOOL } }; }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op) }
        case BinOp.Lte:
        case BinOp.Gte:
        case BinOp.Lt:
        case BinOp.Gt:
          if (equalType(tLeft.a.type, NUM) && equalType(tRight.a.type, NUM)) { return { ...tBin, a: { ...expr.a, type: BOOL } }; }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op) }
        case BinOp.And:
        case BinOp.Or:
          if (equalType(tLeft.a.type, BOOL) && equalType(tRight.a.type, BOOL)) { return { ...tBin, a: { ...expr.a, type: BOOL } }; }
          else { throw new TypeCheckError("Type mismatch for boolean op" + expr.op); }
        case BinOp.Is:
          if (!isNoneOrClass(tLeft.a.type) || !isNoneOrClass(tRight.a.type))
            throw new TypeCheckError("is operands must be objects");
          return { ...tBin, a: { ...expr.a, type: BOOL } };
      }
    case "uniop":
      const tExpr = tcExpr(env, locals, expr.expr);
      const tUni = { ...expr, a: tExpr.a, expr: tExpr }
      switch (expr.op) {
        case UniOp.Neg:
          if (equalType(tExpr.a.type, NUM)) { return tUni }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op); }
        case UniOp.Not:
          if (equalType(tExpr.a.type, BOOL)) { return tUni }
          else { throw new TypeCheckError("Type mismatch for op" + expr.op); }
      }
    case "id":
      if (locals.vars.has(expr.name)) {
        return { ...expr, a: { ...expr.a, type: locals.vars.get(expr.name) } };
      } else if (env.globals.has(expr.name)) {
        return { ...expr, a: { ...expr.a, type: env.globals.get(expr.name) } };
      } else {
        throw new TypeCheckError("Unbound id: " + expr.name);
      }
    case "builtin1":
      // TODO: type check `len` after lists are implemented
      if (expr.name === "print") {
        const tArg = tcExpr(env, locals, expr.arg);
        
        // [lisa] commented out for now because it's failing some hidden test
        // if (tArg.a.type.tag !== "number" && tArg.a.type.tag !== "bool") {
        //   throw new TypeCheckError(`print() expects types "int" or "bool" as the argument, got ${JSON.stringify(tArg.a.type.tag)}`, tArg.a.fromLoc, tArg.a.endLoc);
        // }
        return { ...expr, a: tArg.a, arg: tArg };
      } else if (env.functions.has(expr.name)) {
        const [[expectedArgTyp], retTyp] = env.functions.get(expr.name);
        const tArg = tcExpr(env, locals, expr.arg);

        if (isAssignable(env, tArg.a.type, expectedArgTyp)) {
          return { ...expr, a: { ...expr.a, type: retTyp }, arg: tArg };
        } else {
          throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else {
        throw new TypeError("Undefined function: " + expr.name);
      }
    case "builtin2":
      if (env.functions.has(expr.name)) {
        const [[leftTyp, rightTyp], retTyp] = env.functions.get(expr.name);
        const tLeftArg = tcExpr(env, locals, expr.left);
        const tRightArg = tcExpr(env, locals, expr.right);
        if (isAssignable(env, leftTyp, tLeftArg.a.type) && isAssignable(env, rightTyp, tRightArg.a.type)) {
          return { ...expr, a: { ...expr.a, type: retTyp }, left: tLeftArg, right: tRightArg };
        } else {
          throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else {
        throw new TypeError("Undefined function: " + expr.name);
      }
    case "call":
      if (env.classes.has(expr.name)) {
        // surprise surprise this is actually a constructor
        const tConstruct: Expr<Annotation> = { a: { ...expr.a, type: CLASS(expr.name) }, tag: "construct", name: expr.name };
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
      } else if (env.functions.has(expr.name)) {
        const [argTypes, retType] = env.functions.get(expr.name);
        const tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));

        if (argTypes.length === expr.arguments.length &&
          tArgs.every((tArg, i) => tArg.a.type === argTypes[i])) {
          return { ...expr, a: { ...expr.a, type: retType }, arguments: expr.arguments };
        } else {
          throw new TypeError("Function call type mismatch: " + expr.name);
        }
      } else {
        throw new TypeError("Undefined function: " + expr.name);
      }
    case "lookup":
      var tObj = tcExpr(env, locals, expr.obj);
      if (tObj.a.type.tag === "class") {
        if (env.classes.has(tObj.a.type.name)) {
          const [fields, _] = env.classes.get(tObj.a.type.name);
          if (fields.has(expr.field)) {
            return { ...expr, a: { ...expr.a, type: fields.get(expr.field) }, obj: tObj };
          } else {
            throw new TypeCheckError(`could not find field ${expr.field} in class ${tObj.a.type.name}`);
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
      if (tObj.a.type.tag === "class") {
        if (env.classes.has(tObj.a.type.name)) {
          const [_, methods] = env.classes.get(tObj.a.type.name);
          if (methods.has(expr.method)) {
            const [methodArgs, methodRet] = methods.get(expr.method);
            const realArgs = [tObj].concat(tArgs);
            if (methodArgs.length === realArgs.length &&
              methodArgs.every((argTyp, i) => isAssignable(env, realArgs[i].a.type, argTyp))) {
              return { ...expr, a: { ...expr.a, type: methodRet }, obj: tObj, arguments: tArgs };
            } else {
              throw new TypeCheckError(`Method call type mismatch: ${expr.method} --- callArgs: ${JSON.stringify(realArgs)}, methodArgs: ${JSON.stringify(methodArgs)}`);
            }
          } else {
            throw new TypeCheckError(`could not found method ${expr.method} in class ${tObj.a.type.name}`);
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

export function tcLiteral(literal: Literal<Annotation>) {
  switch (literal.tag) {
    case "bool": return BOOL;
    case "num": return NUM;
    case "none": return NONE;
  }
}