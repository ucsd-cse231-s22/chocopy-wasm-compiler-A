import { Class, Expr, Literal, Parameter, Program, Stmt, Type, VarInit } from './ast';
import { CLASS } from './utils';

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
        default:
            return type;
    }
}

export function resolveZero(type: Type) : Literal {
    switch (type.tag) {
        case "number":
            return { tag: "num", value: 0 };
        case "bool":
            return { tag: "bool", value: false };
        case "class":
            return { tag: "none" };
    }
}

export function processExprs(expr: Expr<Type>, genv: GlobalMorphEnv) : Expr<Type> {
    expr.a = concretizeGenericTypes(expr.a, genv);
    switch(expr.tag) {
        case "binop":
            const binL = processExprs(expr.left, genv);
            const binR = processExprs(expr.right, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), left: binL, right: binR };
            }
            return { ...expr, left: binL, right: binR };
        case "call":
            const cExprs = expr.arguments.map(a => processExprs(a, genv));
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), arguments: cExprs };
            }
            return { ...expr, arguments: cExprs };
        case "construct":
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                const constructCname = getCanonicalTypeName(expr.a)
                return { ...expr, a: CLASS(constructCname), name: constructCname };
            }
            return expr;
        case "id":
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)) };
            }
            return expr;
        case "index":
            const inxExpr = processExprs(expr.index, genv);
            const inxObj = processExprs(expr.obj, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), index: inxExpr, obj: inxObj };
            }
            return { ...expr, index: inxExpr, obj: inxObj };
        case "lookup":
            const lObj = processExprs(expr.obj, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), obj: lObj };
            }
            return { ...expr, obj: lObj };
        case "method-call":
            const mcExprs = expr.arguments.map(a => processExprs(a, genv));
            const mcObj = processExprs(expr.obj, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), arguments: mcExprs, obj: mcObj };
            }
            return { ...expr, arguments: mcExprs, obj: mcObj };
        case "uniop":
            const uexpr = processExprs(expr.expr, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), expr: uexpr };
            }
            return { ...expr, expr: uexpr };
        case "builtin1":
            const b1arg = processExprs(expr.arg, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), arg: b1arg };
            }
            return { ...expr, arg: b1arg };
        case "builtin2":
            const b2left = processExprs(expr.left, genv);
            const b2right = processExprs(expr.right, genv);
            if (expr.a.tag === "class" && expr.a.params.length > 0) {
                return { ...expr, a: CLASS(getCanonicalTypeName(expr.a)), left: b2left, right: b2right };
            }
            return { ...expr, left: b2left, right: b2right };
        default:
            return expr;
    }
}

export function processStmts(stmt: Stmt<Type>, genv: GlobalMorphEnv) : Stmt<Type> {
    stmt.a = concretizeGenericTypes(stmt.a, genv);
    switch(stmt.tag) {
        case "assign":
            const assignValueExpr = processExprs(stmt.value, genv);
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return { a: CLASS(getCanonicalTypeName(stmt.a)), ...stmt, value: assignValueExpr };
            }
            return { ...stmt, value: assignValueExpr };
        case "expr":
            const expr = processExprs(stmt.expr, genv);
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return {...stmt, a: CLASS(getCanonicalTypeName(stmt.a)), expr };
            }
            return { ...stmt, expr };
        case "field-assign":
            const faobj = processExprs(stmt.obj, genv);
            const faval = processExprs(stmt.value, genv);
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return { ...stmt, a: CLASS(getCanonicalTypeName(stmt.a)), obj: faobj, value: faval };
            }
            return { ...stmt, obj: faobj, value: faval };
        case "index-assign":
            const iaobj = processExprs(stmt.obj, genv);
            const iinx = processExprs(stmt.index, genv);
            const ival = processExprs(stmt.value, genv);
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return { ...stmt, a: CLASS(getCanonicalTypeName(stmt.a)), obj: iaobj, index: iinx, value: ival };
            }
            return { ...stmt, obj: iaobj, index: iinx, value: ival };
        case "if":
            const ifcond = processExprs(stmt.cond, genv);
            const ifthn = stmt.thn.map(st => processStmts(st, genv));
            const ifels = stmt.els.map(st => processStmts(st, genv));
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return { ...stmt, a: CLASS(getCanonicalTypeName(stmt.a)), cond: ifcond, thn: ifthn, els: ifels };
            }
            return { ...stmt, cond: ifcond, thn: ifthn, els: ifels };
        case "return":
            const retExpr = processExprs(stmt.value, genv);
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return { ...stmt, a: CLASS(getCanonicalTypeName(stmt.a)), value: retExpr };
            }
            return { ...stmt, value: retExpr };
        case "while":
            const wcond = processExprs(stmt.cond, genv);
            const wBody = stmt.body.map(st => processStmts(st, genv));
            if (stmt.a.tag === "class" && stmt.a.params.length > 0) {
                return { ...stmt, a: CLASS(getCanonicalTypeName(stmt.a)), cond: wcond, body: wBody };
            }
            return { ...stmt, cond: wcond, body: wBody };
        default:
            return stmt;
    }
}

export function monomorphizeClass(cname: string, canonicalName: string, classes: Array<Class<Type>>, genv: GlobalMorphEnv) : Class<Type> {
    let cClass : Class<Type> = classes[genv.classesInx.get(cname)];
    let mClass : Class<Type> = { a: cClass.a, name: canonicalName, fields: cClass.fields, methods: cClass.methods, typeParams: [] }
    mClass.fields = mClass.fields.map(field => {
        if (field.type.tag === "typevar" || (field.type.tag === "class" && field.type.params.length > 0)) {
            field.type = concretizeGenericTypes(field.type, genv);
            field.value = resolveZero(field.type);
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
                init.value = resolveZero(init.type);
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
            return t.name + "$" + paramNames;
        default:
            throw new Error(`Invalid State Exception : unexpected type passed as a generic type ${t.tag}`);
    }
}

export function processMethodParams(params: Array<Parameter<Type>>, classes: Array<Class<Type>>, genv: GlobalMorphEnv) : Array<Parameter<Type>> {
    return params.map(param => {
        if (param.type.tag === "class" && param.type.params.length > 0) { // this implies a var init of a class with generic types
            const canonicalName = getCanonicalTypeName(param.type);
            if (!genv.morphedClasses.has(canonicalName)) {
                const typeCname = param.type.name;
                param.type.params.forEach((tv, inx) => genv.typeVars.set(classes[genv.classesInx.get(typeCname)].typeParams[inx], tv));
                genv.morphedClasses.add(canonicalName);
                classes.push(monomorphizeClass(typeCname, canonicalName, classes, genv));
            }
            return { ...param, type: CLASS(canonicalName) };
        }
        return param;
    });
}

export function processInits(inits: Array<VarInit<Type>>, classes: Array<Class<Type>>, genv: GlobalMorphEnv) : Array<VarInit<Type>> {
    return inits.map(init => {
        if (init.type.tag === "class" && init.type.params.length > 0) { // this implies a var init of a class with generic types
            const canonicalName = getCanonicalTypeName(init.type);
            if (!genv.morphedClasses.has(canonicalName)) {
                const typeCname = init.type.name;
                init.type.params.forEach((tv, inx) => genv.typeVars.set(classes[genv.classesInx.get(typeCname)].typeParams[inx], tv));
                genv.morphedClasses.add(canonicalName);
                classes.push(monomorphizeClass(typeCname, canonicalName, classes, genv));
            }
            return { ...init, type: CLASS(canonicalName) };
        }
        return init;
    });
}

export function monomorphizeProgram(program: Program<Type>) : Program<Type> {
    let classesInx : Map<string, number> = new Map();
    program.classes.forEach((clazz, inx) => classesInx.set(clazz.name, inx));
    let genv : GlobalMorphEnv = {classesInx, typeVars: new Map(), morphedClasses: new Set()};
    const inits = processInits(program.inits, program.classes, genv);
    const monoMorphizedClasses = program.classes.filter(clazz => clazz.typeParams.length === 0);
    const processedStmts = program.stmts.map(s => processStmts(s, genv));
    return { ...program, inits, classes: monoMorphizedClasses, typeVarInits: [], stmts: processedStmts };
}