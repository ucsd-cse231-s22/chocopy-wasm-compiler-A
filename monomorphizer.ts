import { Annotation, Class, Expr, Literal, Parameter, Program, Stmt, Type, VarInit, Callable } from './ast';
import {CALLABLE} from './tests/helpers.test';
import { BOOL, CLASS, NONE, NUM } from './utils';

export type GlobalMorphEnv = {
    classesInx: Map<string, number>,
    typeVars: Map<string, Type>,
    morphedClasses: Set<string>
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
            return { a: { ...a, type: NUM}, tag: "num", value: 0 };
        case "bool":
            return { a: { ...a, type: BOOL}, tag: "bool", value: false };
        // TODO: should the annotation type preserve the original class/callable type ?
        case "class":
            return { a: { ...a, type: NONE}, tag: "none" };
        case "callable":
            return { a: {...a, type: NONE}, tag: "none" };
    }
}

export function processExprs(expr: Expr<Annotation>, genv: GlobalMorphEnv) : Expr<Annotation> {
    if (expr.a.type === undefined) {
        return expr;
    }
    expr.a.type = concretizeGenericTypes(expr.a.type, genv);
    switch(expr.tag) {
        case "binop":
            const binL = processExprs(expr.left, genv);
            const binR = processExprs(expr.right, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, left: binL, right: binR };
        case "call":
            const cExprs = expr.arguments.map(a => processExprs(a, genv));
            const fnExpr = processExprs(expr.fn, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, fn: fnExpr, arguments: cExprs };
        case "construct":
            const constructCname = getCanonicalTypeName(expr.a.type)
            return { ...expr, a: {...expr.a, type: CLASS(constructCname)}, name: constructCname };
        case "id":
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)} };
        case "index":
            const inxExpr = processExprs(expr.index, genv);
            const inxObj = processExprs(expr.obj, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, index: inxExpr, obj: inxObj };
        case "lookup":
            const lObj = processExprs(expr.obj, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, obj: lObj };
        case "method-call":
            const mcExprs = expr.arguments.map(a => processExprs(a, genv));
            const mcObj = processExprs(expr.obj, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, arguments: mcExprs, obj: mcObj };
        case "uniop":
            const uexpr = processExprs(expr.expr, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, expr: uexpr };
        case "builtin1":
            const b1arg = processExprs(expr.arg, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, arg: b1arg };
        case "builtin2":
            const b2left = processExprs(expr.left, genv);
            const b2right = processExprs(expr.right, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, left: b2left, right: b2right };
        case "if-expr":
            const ifexprcond = processExprs(expr.cond, genv);
            const ifexprthn = processExprs(expr.thn, genv);
            const ifexprels = processExprs(expr.els, genv);
            return { ...expr, a: {...expr.a, type: getCanonicalType(expr.a.type)}, cond: ifexprcond, thn: ifexprthn, els: ifexprels};
        case "lambda":
            // Assuming a Callable always gets concretized and cannonicalized to a Callable type
            // @ts-ignore
            const ltype: Callable = getCanonicalType(concretizeGenericTypes(expr.type, genv));
            const lexpr = processExprs(expr.expr, genv);
            return { ...expr, a: {...expr.a, type: ltype}, expr: lexpr, type: ltype};
        default:
            return expr;
    }
}

export function processStmts(stmt: Stmt<Annotation>, genv: GlobalMorphEnv) : Stmt<Annotation> {
    if (stmt.a.type === undefined) {
        return stmt;
    }
    stmt.a.type = concretizeGenericTypes(stmt.a.type, genv);
    switch(stmt.tag) {
        case "assign":
            const assignValueExpr = processExprs(stmt.value, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, value: assignValueExpr };
        case "expr":
            const expr = processExprs(stmt.expr, genv);
            if (stmt.a.type.tag === "class" && stmt.a.type.params.length > 0) {
                return {...stmt, a: {...stmt.a, type: CLASS(getCanonicalTypeName(stmt.a.type))}, expr };
            }
            return {...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, expr };
        case "field-assign":
            const faobj = processExprs(stmt.obj, genv);
            const faval = processExprs(stmt.value, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, obj: faobj, value: faval };
        case "index-assign":
            const iaobj = processExprs(stmt.obj, genv);
            const iinx = processExprs(stmt.index, genv);
            const ival = processExprs(stmt.value, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, obj: iaobj, index: iinx, value: ival };
        case "if":
            const ifcond = processExprs(stmt.cond, genv);
            const ifthn = stmt.thn.map(st => processStmts(st, genv));
            const ifels = stmt.els.map(st => processStmts(st, genv));
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, cond: ifcond, thn: ifthn, els: ifels };
        case "return":
            const retExpr = processExprs(stmt.value, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)}, value: retExpr };
        case "while":
            const wcond = processExprs(stmt.cond, genv);
            const wBody = stmt.body.map(st => processStmts(st, genv));
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)} ,cond: wcond, body: wBody };
        case "for":
            const {body, iterator, values} = stmt;
            const wbody = body.map(st => processStmts(st, genv));
            const wvalues = processExprs(values, genv);
            return { ...stmt, a: {...stmt.a, type: getCanonicalType(stmt.a.type)} , iterator, body: wbody, values: wvalues };
        default:
            return stmt;
    }
}

export function monomorphizeClass(cname: string, canonicalName: string, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv) : Class<Annotation> {
    let cClass : Class<Annotation> = classes[genv.classesInx.get(cname)];
    let mClass : Class<Annotation> = JSON.parse(JSON.stringify(cClass))
    mClass.name = canonicalName;
    mClass.typeParams = [];
    mClass.fields = mClass.fields.map(field => {
        if (field.type.tag === "typevar" || (field.type.tag === "class" && field.type.params.length > 0)) {
            field.type = concretizeGenericTypes(field.type, genv);
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
            if (init.type.tag === "typevar" || (init.type.tag === "class" && init.type.params.length > 0)) {
                init.type = concretizeGenericTypes(init.type, genv);
                init.value = resolveZero(init.type, init.a);
            }
            return init;
        });
        method.ret = concretizeGenericTypes(method.ret, genv);

        return method;
    });

    mClass.fields = processInits(mClass.fields, classes, genv);
    mClass.methods = mClass.methods.map(m => {
        // assuming method annotation is none, we don't do anything with it
        return { ...m, parameters: processMethodParams(m.parameters, classes, genv), inits: processInits(m.inits, classes, genv), 
                body: m.body.map(s => processStmts(s, genv)) };
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
      return t;
    case "class":
      return CLASS(getCanonicalTypeName(t));
    case "callable":
      const cparams = t.params.map(getCanonicalType);
      const cret = getCanonicalType(t.ret);
      return CALLABLE(cparams, cret);
    default:
      throw new Error(`Invalid State Exception : unexpected type passed as a generic type ${t.tag}`);
  }
}

export function processType(t: Type, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv) : Type {
  switch(t.tag) {
    case "number":
    case "bool":
    case "none":
    case "either":
      return t;
    case "class":
      if(t.params.length > 0) {
        const canonicalType = getCanonicalType(t);
        if(canonicalType.tag === 'class' && !genv.morphedClasses.has(canonicalType.name)) {
          const cname = t.name;
          t.params.forEach((tv, inx) => genv.typeVars.set(classes[genv.classesInx.get(cname)].typeParams[inx], tv));
          genv.morphedClasses.add(canonicalType.name);
          classes.push(monomorphizeClass(cname, canonicalType.name, classes, genv));
        }
        return canonicalType;
      }
      return t;
    case "callable":
      const cparams = t.params.map(p => processType(p, classes, genv));
      const cret = processType(t.ret, classes, genv);
      return CALLABLE(cparams, cret);
    default:
      throw new Error(`Invalid State Exception : unexpected type passed as a generic type ${t.tag}`);
  }
}

export function processMethodParams(params: Array<Parameter<Annotation>>, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv) : Array<Parameter<Annotation>> {
    return params.map(param => {
        const ptype = processType(param.type, classes, genv);
        return { ...param, type: ptype };
    });
}

export function processInits(inits: Array<VarInit<Annotation>>, classes: Array<Class<Annotation>>, genv: GlobalMorphEnv) : Array<VarInit<Annotation>> {
    return inits.map(init => {
        const itype = processType(init.type, classes, genv);
        return { ...init, type: itype };
    });
}

export function monomorphizeProgram(program: Program<Annotation>) : Program<Annotation> {
    let classesInx : Map<string, number> = new Map();
    program.classes.forEach((clazz, inx) => classesInx.set(clazz.name, inx));
    let genv : GlobalMorphEnv = {classesInx, typeVars: new Map(), morphedClasses: new Set()};
    const inits = processInits(program.inits, program.classes, genv);
    const monoMorphizedClasses = program.classes.filter(clazz => clazz.typeParams.length === 0);
    const processedStmts = program.stmts.map(s => processStmts(s, genv));
    return { ...program, inits, classes: monoMorphizedClasses, typeVarInits: [], stmts: processedStmts };
}
