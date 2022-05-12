import { Class, Literal, Parameter, Program, Type, VarInit } from './ast';
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
        return { ...m, parameters: processMethodParams(m.parameters, classes, genv), inits: processInits(m.inits, classes, genv) };
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
    return { ...program, inits, classes: monoMorphizedClasses, typeVarInits: [] };
}