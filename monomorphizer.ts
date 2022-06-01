import { Annotation, Class, Expr, Literal, Parameter, Program, Stmt, Type, VarInit, Callable, FunDef } from './ast';
import { BOOL, CALLABLE, CLASS, LIST, NONE, NUM, TYPEVAR } from './utils';

export type GlobalMorphEnv = {
    classesInx: Map<string, number>,
    funcsInx: Map<string, number>,
    typeVars: Map<string, Type>,
    morphedClasses: Set<string>,
    morphedFuncs: Set<string>,
    genericFuncs: Set<string>
}

export function concretizeGenericTypes(type: Type, genv: GlobalMorphEnv) : Type {
    switch(type.tag) {
        case "typevar":
            return genv.typeVars.get(type.name);
        case "class":
            const cparams = type.params.map(p => concretizeGenericTypes(p, genv));
            return {...type, params: cparams};
        case "callable":
            const callableRet = concretizeGenericTypes(type.ret, genv);
            const callableParams = type.params.map(p => concretizeGenericTypes(p, genv));
            return {...type, params: callableParams, ret: callableRet};
        default:
            return type;
    }
}

export function resolveZero(type: Type, a: Annotation) : Literal<Annotation> {
    switch (type.tag) {
        case "number":
            return { a: { ...a, type: NUM}, tag: "num", value: 0n };
        case "bool":
            return { a: { ...a, type: BOOL}, tag: "bool", value: false };
        case "empty":
        case "list":
            return { a: { ...a, type: NONE}, tag: "none" };
        // TODO: should the annotation type preserve the original class/callable type ?
        case "class":
            return { a: { ...a, type: NONE}, tag: "none" };
        case "callable":
            return { a: {...a, type: NONE}, tag: "none" };
    }
}

export function isTypeGeneric(type: Type) : Boolean {
    if (type.tag === "typevar") {
        return true;
    }

    if (type.tag === "class") {
        return type.params.some(p => isTypeGeneric(p));
    }

    if (type.tag === "callable") {
        return type.params.some(p => isTypeGeneric(p));
    }

    return false;
}

export function isGenericFunc(func: FunDef<Annotation>) {
    return func.parameters.some(p => isTypeGeneric(p.type));
}

export function inferGenericFuncParamTypes(env: Map<string, Type>, pType: Type, argType: Type) {
    if (pType.tag === "typevar") {
        env.set(pType.name, argType);
    }
  
    if (pType.tag === "class" && pType.params.length > 0) {
      if (argType.tag !== "class" || argType.params.length !== pType.params.length) {
        throw new Error();
      }
      pType.params.forEach((p, i) => inferGenericFuncParamTypes(env, p, argType.params[i]));
    }
  
    if (pType.tag === "callable") {
      if (argType.tag !== "callable") {
        throw new Error();
      }
      pType.params.forEach((p, i) => inferGenericFuncParamTypes(env, p, argType.params[i]));
      inferGenericFuncParamTypes(env, pType.ret, argType.ret);
    }
}

export function processFuncCall(genv: GlobalMorphEnv, expr: Expr<Annotation>, prog: Program<Annotation>) : FunDef<Annotation>  {
    const funcs = prog.funs;
    if (expr.tag === "call" && expr.fn.tag === "id") {
        let func = funcs[genv.funcsInx.get(expr.fn.name)];
        let env : Map<string, Type> = new Map();
        expr.arguments.forEach((arg, i) => {
            inferGenericFuncParamTypes(env, func.parameters[i].type, arg.a.type);
        });
        let suf : string = "";
        env.forEach((v, _) => suf += getCanonicalTypeName(v) + "$");
        const canonicalFuncName = expr.fn.name + "$" + suf;
        if (!genv.morphedFuncs.has(canonicalFuncName)) {
            genv.morphedFuncs.add(canonicalFuncName);
            env.forEach((v, k) => genv.typeVars.set(k, v));
            const mParameters = func.parameters.map(p => {
                const ptype = concretizeGenericTypes(p.type, genv);
                return { ...p, type : ptype };
            });
            const mInits = func.inits.map(init => {
                init.type = concretizeGenericTypes(init.type, genv);
                if(init.value.tag === "zero") {
                  init.value = resolveZero(init.type, init.a);
                }
                return init;
            });

            const mret = concretizeGenericTypes(func.ret, genv);
            const mBody = func.body.map(bstmt => processStmts(bstmt, genv, prog));
            const mfunc = { ...func, name: canonicalFuncName, parameters: mParameters, inits: mInits, ret: mret, body: mBody };
            funcs.push(mfunc);

            return mfunc;
        }

        return funcs[genv.funcsInx.get(expr.fn.name)];
    }
}

export function processExprs(expr: Expr<Annotation>, genv: GlobalMorphEnv, prog: Program<Annotation>) : Expr<Annotation> {
    if (expr.a.type === undefined) {
        return expr;
    }
    switch(expr.tag) {
        case "binop":
            const binL = processExprs(expr.left, genv, prog);
            const binR = processExprs(expr.right, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, left: binL, right: binR };
        case "call":
            const cExprs = expr.arguments.map(a => processExprs(a, genv, prog));
            let fnExpr;
            if (expr.fn.tag === "id" && genv.genericFuncs.has(expr.fn.name)) {
                let mfname = processFuncCall(genv, expr, prog).name;
                fnExpr = processExprs(expr.fn, genv, prog);
                if (fnExpr.tag === "id") {
                    fnExpr.name = mfname;
                }
            } else {
                fnExpr = processExprs(expr.fn, genv, prog);
            }
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, fn: fnExpr, arguments: cExprs };
        case "construct":
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            const constructCname = getCanonicalTypeName(expr.a.type)
            return { ...expr, a: {...expr.a, type: CLASS(constructCname)}, name: constructCname };
        case "id":
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)} };
        case "index":
            const inxExpr = processExprs(expr.index, genv, prog);
            const inxObj = processExprs(expr.obj, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, index: inxExpr, obj: inxObj };
        case "lookup":
            const lObj = processExprs(expr.obj, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, obj: lObj };
        case "method-call":
            const mcExprs = expr.arguments.map(a => processExprs(a, genv, prog));
            const mcObj = processExprs(expr.obj, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, arguments: mcExprs, obj: mcObj };
        case "uniop":
            const uexpr = processExprs(expr.expr, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, expr: uexpr };
        case "builtin1":
            const b1arg = processExprs(expr.arg, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, arg: b1arg };
        case "builtin2":
            const b2left = processExprs(expr.left, genv, prog);
            const b2right = processExprs(expr.right, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, left: b2left, right: b2right };
        case "if-expr":
            const ifexprcond = processExprs(expr.cond, genv, prog);
            const ifexprthn = processExprs(expr.thn, genv, prog);
            const ifexprels = processExprs(expr.els, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, cond: ifexprcond, thn: ifexprthn, els: ifexprels};
        case "lambda":
            // Assuming a Callable always gets concretized and cannonicalized to a Callable type
            // @ts-ignore
            const ltype: Callable = getCanonicalType(concretizeGenericTypes(expr.type, genv));
            const lexpr = processExprs(expr.expr, genv, prog);
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return { ...expr, a: {...expr.a, type: ltype}, expr: lexpr, type: ltype};
        default:
            expr.a.type = concretizeGenericTypes(expr.a.type, genv);
            return expr;
    }
}

export function processStmts(stmt: Stmt<Annotation>, genv: GlobalMorphEnv, prog: Program<Annotation>) : Stmt<Annotation> {
    if (stmt.a.type === undefined) {
        return stmt;
    }
    switch(stmt.tag) {
        case "assign":
            const assignValueExpr = processExprs(stmt.value, genv, prog);
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, value: assignValueExpr };
        case "expr":
            const expr = processExprs(stmt.expr, genv, prog);
            if (stmt.a.type.tag === "class" && stmt.a.type.params.length > 0) {
                stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
                return {...stmt, a: {...stmt.a, type: CLASS(getCanonicalTypeName(stmt.a.type))}, expr };
            }
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return {...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, expr };
        case "field-assign":
            const faobj = processExprs(stmt.obj, genv, prog);
            const faval = processExprs(stmt.value, genv, prog);
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, obj: faobj, value: faval };
        case "index-assign":
            const iaobj = processExprs(stmt.obj, genv, prog);
            const iinx = processExprs(stmt.index, genv, prog);
            const ival = processExprs(stmt.value, genv, prog);
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, obj: iaobj, index: iinx, value: ival };
        case "if":
            const ifcond = processExprs(stmt.cond, genv, prog);
            const ifthn = stmt.thn.map(st => processStmts(st, genv, prog));
            const ifels = stmt.els.map(st => processStmts(st, genv, prog));
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, cond: ifcond, thn: ifthn, els: ifels };
        case "return":
            const retExpr = processExprs(stmt.value, genv, prog);
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, value: retExpr };
        case "while":
            const wcond = processExprs(stmt.cond, genv, prog);
            const wBody = stmt.body.map(st => processStmts(st, genv, prog));
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, cond: wcond, body: wBody };
        case "for":
            const {body, iterator, values} = stmt;
            const wbody = body.map(st => processStmts(st, genv, prog));
            const wvalues = processExprs(values, genv, prog);
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, iterator, body: wbody, values: wvalues };
        default:
            stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
            return stmt;
    }
}

export function typifySuperclassTypeArguments(typename: string, genv: GlobalMorphEnv) : Type {
  switch(typename) {
    case "int":
      return NUM;
    case "bool":
      return BOOL;
    default:
      if(genv.classesInx.has(typename)) {
        return CLASS(typename);
      } else {
        return TYPEVAR(typename);
      }
  }
}

export function monomorphizeSuperclasses(mClass: Class<Annotation>, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv, prog: Program<Annotation>) {
      mClass.super = new Map(Array.from(mClass.super.entries()).map(([sClassName, params]) => {
      let sClassType = CLASS(sClassName, params.map(p => typifySuperclassTypeArguments(p, genv)));
      let map = new Map(sClassType.params.filter(p => p.tag === "typevar").map(p => {
        //@ts-ignore we just did a filter.. sigh
        return [p.name, genv.typeVars.get(p.name)];
      }));
      let newGenv = {...genv, typeVars: map};

      let msClassType = processType(concretizeGenericTypes(sClassType, newGenv), classes, newGenv, prog);

      //@ts-ignore we know superclass will be processed into a type
      return [msClassType.name, []];
    }));
}

export function monomorphizeClass(cname: string, canonicalName: string, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv, prog: Program<Annotation>) : Class<Annotation> {
    let cClass : Class<Annotation> = classes[genv.classesInx.get(cname)];
    // https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
    let mClass : Class<Annotation> = JSON.parse(JSON.stringify(cClass, (key, value) => typeof value === "bigint" ? value.toString() : value));
    mClass.name = canonicalName;

    // properly deep copy the super classes
    mClass.super = new Map(Array.from(cClass.super.entries()).map(([name, params]) => {
      return [name, [...params]];
    }));

    mClass.typeParams = [];
    mClass.fields = mClass.fields.map(field => {
        field.type = concretizeGenericTypes(field.type, genv);
        if(field.value.tag === "zero") {
          field.value = resolveZero(field.type, field.a);
        }
        return field;
    });
    mClass.methods = mClass.methods.map(method => {
        method.parameters = method.parameters.map(p => {
            const ptype = concretizeGenericTypes(p.type, genv);
            return { ...p, type : ptype };
        });
        method.inits = method.inits.map(init => {
            init.type = concretizeGenericTypes(init.type, genv);
            if (init.value.tag === "zero") {
                init.value = resolveZero(init.type, init.a);
            }
            return init;
        });
        method.ret = concretizeGenericTypes(method.ret, genv);

        return method;
    });

    mClass.fields = processInits(mClass.fields, classes, genv, prog);
    mClass.methods = mClass.methods.map(m => {
        // assuming method annotation is none, we don't do anything with it
        return { ...m, parameters: processMethodParams(m.parameters, classes, genv, prog), inits: processInits(m.inits, classes, genv, prog), 
                body: m.body.map(s => processStmts(s, genv, prog)) };
    });

    return mClass;
}

export function getCanonicalTypeName(t : Type) : string {
    switch (t.tag) {
        case "number":
        case "bool":
            return t.tag;
        case "class":
            const paramNames = t.params.map(p => getCanonicalTypeName(p)).join("$");
            return t.name + (t.params.length > 0 ? "$" + paramNames : "");
        default:
            throw new Error(`Invalid State Exception : unexpected type passed as a generic type ${t.tag}`);
    }
}

export function getCanonicalType(t: Type) : Type {
  switch(t.tag) {
    case "number":
    case "bool":
    case "none":
    case "either":
    case "empty":
      return t;
    case "list":
      const citemType = getCanonicalType(t.itemType);
      return LIST(citemType);
    case "class":
      return CLASS(getCanonicalTypeName(t));
    case "callable":
      const cparams = t.params.map(getCanonicalType);
      const cret = getCanonicalType(t.ret);
      return CALLABLE(cparams, cret);
    default:
      return t;
  }
}

export function processType(t: Type, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv, prog: Program<Annotation>) : Type {
  switch(t.tag) {
    case "number":
    case "bool":
    case "none":
    case "either":
    case "empty":
      return t;
    case "list":
      const citemType = processType(t.itemType, classes, genv, prog);
      return LIST(citemType);
    case "class":
      if(t.name === 'object') {
        return t;
      }


      if(t.params.length > 0) {
        const canonicalType = getCanonicalType(t);
        if(canonicalType.tag === 'class' && !genv.morphedClasses.has(canonicalType.name)) {
          const cname = t.name;
          t.params.forEach((tv, inx) => genv.typeVars.set(classes[genv.classesInx.get(cname)].typeParams[inx], tv));
          genv.morphedClasses.add(canonicalType.name);
          let mClass = monomorphizeClass(cname, canonicalType.name, classes, genv, prog)
          monomorphizeSuperclasses(mClass, classes, genv, prog);
          classes.push(mClass);
        }
        return canonicalType;
      }

      return t;
    case "callable":
      const cparams = t.params.map(p => processType(p, classes, genv, prog));
      const cret = processType(t.ret, classes, genv, prog);
      return CALLABLE(cparams, cret);
    default:
      return t;
  }
}

export function processMethodParams(params: Array<Parameter<Annotation>>, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv, prog: Program<Annotation>) : Array<Parameter<Annotation>> {
    return params.map(param => {
        const ptype = processType(param.type, classes, genv, prog);
        return { ...param, type: ptype };
    });
}

export function processInits(inits: Array<VarInit<Annotation>>, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv, prog: Program<Annotation>) : Array<VarInit<Annotation>> {
    return inits.map(init => {
        const itype = processType(init.type, classes, genv, prog);
        return { ...init, type: itype };
    });
}

export function monomorphizeProgram(program: Program<Annotation>) : Program<Annotation> {
    let classesInx : Map<string, number> = new Map();
    let funcsInx : Map<string, number> = new Map();
    program.classes.forEach((clazz, inx) => classesInx.set(clazz.name, inx));
    program.funs.forEach((func, inx) => funcsInx.set(func.name, inx));
    let genv : GlobalMorphEnv = {classesInx, funcsInx, typeVars: new Map(), morphedClasses: new Set(), morphedFuncs: new Set(), genericFuncs: new Set()};
    program.classes.forEach(clazz => {
      if(clazz.typeParams.length === 0) {
        monomorphizeSuperclasses(clazz, program.classes, genv, program);
      } 
    }); 
    program.funs.forEach(f => {
        if (isGenericFunc(f)) {
            genv.genericFuncs.add(f.name);
        }
    });
    const inits = processInits(program.inits, program.classes, genv, program);
    const monoMorphizedClasses = program.classes.filter(clazz => clazz.typeParams.length === 0);
    const processedStmts = program.stmts.map(s => processStmts(s, genv, program));
    const monomorphizedFuncs = program.funs.filter(f => !genv.genericFuncs.has(f.name));
    return { ...program, inits, classes: monoMorphizedClasses, typeVarInits: [], stmts: processedStmts, funs: monomorphizedFuncs };
}
