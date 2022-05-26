import { idText } from 'typescript';
import { Stmt, Expr, Type, UniOp, BinOp, Literal, Parameter, Program, FunDef, VarInit, Class } from './ast';
import {NUM, BOOL, NONE, CLASS, STR} from './utils';
import {emptyLocalTypeEnv} from "./type-check";

var namecount = 0;
export type LocalFuncEnv = {
    funnonlocalsdic: Map<string, Array<Parameter<Type>>>;
    funlocals: Set<string>;
    funnamestack: Array<string>;
    visiblefuncs: [Array<string>, Array<string>];
    classesneeded: Map<string, [Type, Type]>;  // 0: old type 1: new type
  }

function getNonLocalsDicInFun(fun: FunDef<Type>, env: LocalFuncEnv) {
    fun.funs.forEach(f => {
        getNonLocalsDicInFun(f, env);
    });

    env.funnonlocalsdic.set(fun.name, Array.from(getNonLocalsInFunBody(fun, env)[0]).map(e => <Parameter<Type>>{name: (e as any).name, type: e.a}));
}

export function liftprogram(prog: Program<Type>): Program<Type>{
    var funs: Array<FunDef<Type>> = [];
    var classes = prog.classes;
    var env = createEnv();
    prog.funs.forEach(f => {
        var flattenedfun;
        var generatedclasses;

        getNonLocalsDicInFun(f, env);

        [flattenedfun, generatedclasses] = lambdalift(f, env);
        funs.push(...flattenedfun);
        classes.push(...generatedclasses);
    });

    return {...prog, funs, classes};
}

export function lambdalift(fun: FunDef<Type>, env: LocalFuncEnv): [Array<FunDef<Type>>, Array<Class<Type>>]{
    var flattenedfun: Array<FunDef<Type>> = [];
    var generatedclasses: Array<Class<Type>> = [];
    lambdalift_helper(undefined, fun, env, flattenedfun, generatedclasses);
    return [flattenedfun, generatedclasses];
}

function lambdalift_helper(preFun: FunDef<Type>, fun: FunDef<Type>, env: LocalFuncEnv, flattenedfun: FunDef<Type>[], generatedclasses: Class<Type>[]) {
    env.visiblefuncs[0] = [];  // sibling nodes, including itself.
    env.visiblefuncs[1] = [];  // children nodes.
    
    if (preFun !== undefined) {
        preFun.funs.forEach(f => {
            env.visiblefuncs[0].push(f.name);
        })
    }
    else{
        env.visiblefuncs[0].push(fun.name);
    }
    env.visiblefuncs[1] = fun.funs.map(f => f.name);

    env.funlocals = new Set();
    fun.parameters.forEach(p => {
        env.funlocals.add(p.name);
    });
    fun.inits.forEach(v => {
        env.funlocals.add(v.name);
    });

    env.funnamestack.push(fun.name);
    var funcname = env.funnamestack.join("$");
    var body_all_locals: Array<Stmt<Type>>;          // function body with all explicit nonlocals modefied as lookup
    var body_correct_call:Array<Stmt<Type>> = [];    // function body with modified subfunction names.
    var body_final: Array<Stmt<Type>> = [];          // 
    
    var paramset: Set<Expr<Type>>;
    [paramset, body_all_locals] = getNonLocalsInFunBody(fun, env);
    var funcparams = Array.from(paramset).map(e => <Parameter<Type>>{name: (e as any).name, type: e.a}).concat(fun.parameters);
    body_all_locals.forEach(s => {
        body_correct_call.push(changeCallinStmt(s, env));
    })
    for(var i=0; i<fun.funs.length; i++){
        lambdalift_helper(fun, fun.funs[i], env, flattenedfun, generatedclasses);
    }
    env.funnamestack.pop();

    env.funlocals = new Set();
    fun.parameters.forEach(p => {
        env.funlocals.add(p.name);
    });
    fun.inits.forEach(v => {
        env.funlocals.add(v.name);
    });
    // get the right locals 
    body_final = body_correct_call;
    env.funlocals.forEach(local =>{
        if(env.classesneeded.get(local)){
            var classinfo = env.classesneeded.get(local)
            var classname = (classinfo[1] as any).name
            generatedclasses.push(generateClassDef(local, classname, classinfo[0]));
            fun.parameters.forEach(p =>{
                if(p.name === local){
                    p.name = local+ "_value";
                }
                body_final = body_final.map(s => changeIDtoLookupinStmt(s, local, p.type, classinfo[1]));
            })
            var classinit: Array<VarInit<Type>> = [];
            var classconstruct : Array<Stmt<Type>> = [];
            classinit.push({a:NONE, name: local, type: classinfo[1], value:{tag:"none"}});
            classconstruct.push({a: NONE, tag: "assign", name: local, value: {a:classinfo[1], tag: "construct", name: classname}})
            classconstruct.push({a: NONE, tag: "field-assign", obj: {a: classinfo[1], tag: "id", name: local}, field: "value", value: {a: {tag: "number"}, tag: "id", name: local+"_value"}})
            body_final = classconstruct.concat(body_final);
            fun.inits.push(...classinit);
        }
    })

    flattenedfun.push({ ...fun, name: funcname, parameters: funcparams, funs: [], body: body_final});
}

// s : a statement
// name: name of the parameter
// pretype: previous type of this parameter
// currtype: current type- must be a class Refx. 
function changeIDtoLookupinStmt(s: Stmt<Type>, name: string, pretype: Type, currtype: Type): Stmt<Type>{
    switch (s.tag){
        case "assign":
            var value = changeIDtoLookupinExpr(s.value, name, pretype, currtype);
            return {...s, value};
        case "return":
            var value = changeIDtoLookupinExpr(s.value, name, pretype, currtype);
            return {...s, value};
        case "expr":
            var expr = changeIDtoLookupinExpr(s.expr, name, pretype, currtype);
            return {...s, expr};
        case "field-assign":
            var obj = changeIDtoLookupinExpr(s.obj, name, pretype, currtype);
            var value = changeIDtoLookupinExpr(s.value, name, pretype, currtype);
            return {...s, obj, value};
        case "index-assign":
            var list = changeIDtoLookupinExpr(s.list, name, pretype, currtype);
            var index = changeIDtoLookupinExpr(s.index, name, pretype, currtype);
            var value = changeIDtoLookupinExpr(s.value, name, pretype, currtype);
            return {...s, list, index, value};
        case "if":
            var cond = changeIDtoLookupinExpr(s.cond, name, pretype, currtype);
            var newthn: Array<Stmt<Type>> = [];
            var newels: Array<Stmt<Type>> = [];
            s.thn.forEach(s_thn =>{
                newthn.push(changeIDtoLookupinStmt(s_thn, name, pretype, currtype));
            })
            s.els.forEach(s_els =>{
                newels.push(changeIDtoLookupinStmt(s_els, name, pretype, currtype));
            })
            return {...s, cond, thn:newthn, els:newels};
        case "while":
            var cond = changeIDtoLookupinExpr(s.cond, name, pretype, currtype);
            var body: Array<Stmt<Type>> = [];
            s.body.forEach(s_body =>{
                newthn.push(changeIDtoLookupinStmt(s_body, name, pretype, currtype));
            })
            return {...s, cond, body};
        case "for":
            var iterable = changeIDtoLookupinExpr(s.iterable, name, pretype, currtype);
            var body: Array<Stmt<Type>> = [];
            s.body.forEach(s_body =>{
                newthn.push(changeIDtoLookupinStmt(s_body, name, pretype, currtype));
            })
            return {...s, iterable, body};
        default:
            return s;
    }
}

function changeIDtoLookupinExpr(e: Expr<Type>, name: string, pretype: Type, currtype: Type): Expr<Type>{
    switch (e.tag){
        case "literal":
            return e;
        case "id":
            if(e.name === name && e.a.tag === pretype.tag){
                return {a: pretype, tag: "lookup", obj: {a: currtype, tag: "id", name: name}, field: "value"};
            }
            else{
                return e;
            }
        case "binop":
            var left = changeIDtoLookupinExpr(e.left, name, pretype, currtype);
            var right = changeIDtoLookupinExpr(e.right, name, pretype, currtype);
            return {...e, left, right};
        case "uniop":
            var expr = changeIDtoLookupinExpr(e.expr, name, pretype, currtype);
            return {...e, expr};
        case "builtin1":
            var arg = changeIDtoLookupinExpr(e.arg, name, pretype, currtype);
            return {...e, arg};
        case "builtin2":
            var left = changeIDtoLookupinExpr(e.left, name, pretype, currtype);
            var right = changeIDtoLookupinExpr(e.right, name, pretype, currtype);
            return {...e, left, right};
        case "call":
            var newargs: Array<Expr<Type>> = [];
            e.arguments.forEach(a=>{
                newargs.push(changeIDtoLookupinExpr(a, name, pretype, currtype));
            });
            return {...e, arguments: newargs};
        case "lookup":
            var obj = changeIDtoLookupinExpr(e.obj, name, pretype, currtype);
            return {...e, obj};
        case "index":
            var obj = changeIDtoLookupinExpr(e.obj, name, pretype, currtype);
            var index = changeIDtoLookupinExpr(e.index, name, pretype, currtype);
            return {...e, obj, index};
        case "method-call":
            var obj = changeIDtoLookupinExpr(e.obj, name, pretype, currtype);
            var newargs: Array<Expr<Type>> = [];
            e.arguments.forEach(a=>{
                newargs.push(changeIDtoLookupinExpr(a, name, pretype, currtype));
            });
            return {...e, obj, arguments: newargs};
        case "construct":
            return e;
        case "list-obj":
            var newentries: Array<Expr<Type>> = [];
            e.entries.forEach(entry=>{
                newentries.push(changeIDtoLookupinExpr(entry, name, pretype, currtype));
            });
            return {...e, entries: newentries};
        case "list-length":
            var list = changeIDtoLookupinExpr(e.list, name, pretype, currtype);
            return {...e, list};
        default:
            return e;
    }
}

function changeCallinStmt(s: any, env : LocalFuncEnv) : Stmt<Type>{
    switch (s.tag){
        case "assign":
            var value = changeCallinExpr(s.value, env);
            return {...s, value};
        case "return":
            var value = changeCallinExpr(s.value, env);
            return {...s, value};
        case "expr":
            var expr = changeCallinExpr(s.expr, env);
            return {...s, expr};
        case "field-assign":
        case "index-assign":
        case "if":
        case "while":
        case "for":
            return {...s};
    }
}

function changeCallinExpr(e: Expr<Type>, env: LocalFuncEnv): Expr<Type>{
    switch (e.tag){
        case "literal":
        case "id":
            return e;
        case "binop":
            var left = changeCallinExpr(e.left, env);
            var right = changeCallinExpr(e.right, env);
            return{...e, left, right};
        case "uniop":
            var expr = changeCallinExpr(e.expr, env);
            return {...e, expr}
        case "builtin1":
            var arg = changeCallinExpr(e.arg, env);
            return {...e, arg}
        case "builtin2":
            var left = changeCallinExpr(e.left, env);
            var right = changeCallinExpr(e.right, env);
            return{...e, left, right};
        case "call":
            var newname;
            var newargs: Array<Expr<Type>> = [];
            if(env.visiblefuncs[1].find(element => element === e.name)) {
                newname = env.funnamestack.join("$") + "$" + e.name;
            } else if (env.visiblefuncs[0].find(element => element === e.name)) {
                newname = env.funnamestack.slice(0, env.funnamestack.length - 1).join("$") + "$" + e.name;
            } else {
                return e;
            }
            // also need to change arg lists.
            env.funnonlocalsdic.get(e.name).flat().forEach(p=> {
                newargs.push({a: p.type, tag: "id", name: p.name});
            })
            newargs = newargs.concat(e.arguments);
            return {...e, name: newname, arguments: newargs};
        default: 
            return {...e};
    }
}

function createEnv(): LocalFuncEnv{
    var funnonlocalsdic: Map<string, Array<Parameter<Type>>> = new Map();
    var funlocals: Set<string> = new Set();
    var funnamestack:Array<string> = [];
    var visiblefuncs:[Array<string>, Array<string>] = [[],[]];
    var classesneeded: Map<string, [Type, Type]> = new Map();
    return {funnonlocalsdic, funlocals, funnamestack, visiblefuncs, classesneeded};
}

function getNonLocalsInExpr(e: Expr<Type>, explicit_nonlocals: Array<string>, env: LocalFuncEnv, res: [Set<string>, Set<Expr<Type>>]): Expr<Type>{
    switch (e.tag){
        case "literal":
            return e;
        case "id":
            var classname:string;
            if (!env.funlocals.has(e.name) && !res[0].has(e.name)) {
                if(explicit_nonlocals.find(name=>name == e.name)){ 
                    if(!env.classesneeded.has(e.name)){ //first time
                        classname = "Ref" + (namecount);
                        env.classesneeded.set(e.name, [e.a, {tag:"class", name:  classname}]);
                        namecount++;
                    }
                    else{
                        classname = (env.classesneeded.get(e.name)[1] as any).name
                    }
                    
                    res[0].add(e.name);
                    res[1].add({a: {tag: "class", name: classname}, tag: "id", name: e.name })
                }
                else  {
                }
            }
            if(explicit_nonlocals.find(name => name===e.name)){
                classname = "Ref"+(namecount-1);
                return {  a: e.a, tag: "lookup", obj: {  a: env.classesneeded.get(e.name)[1], tag: "id", name: e.name }, field: "value" };
            }
            else{
                return e;
            }
        case "binop":
            var left = getNonLocalsInExpr(e.left, explicit_nonlocals, env, res);
            var right = getNonLocalsInExpr(e.right, explicit_nonlocals, env, res);
            return {...e, left:left, right:right};
        case "uniop":
            var expr = getNonLocalsInExpr(e.expr, explicit_nonlocals, env, res);
            return {...e, expr:expr};
        case "builtin1":
            var arg = getNonLocalsInExpr(e.arg, explicit_nonlocals, env, res);
            return {...e, arg};
        case "builtin2":
            var left = getNonLocalsInExpr(e.left, explicit_nonlocals, env, res);
            var right = getNonLocalsInExpr(e.right, explicit_nonlocals, env, res);
            return {...e, left, right};
        case "call":
            var newargs: Array<Expr<Type>> = [];
            e.arguments.forEach(e => {
                newargs.push(getNonLocalsInExpr(e, explicit_nonlocals, env, res));
            });
            return {...e, arguments: newargs};
        case "lookup":
            var obj = getNonLocalsInExpr(e.obj, explicit_nonlocals, env, res);
            return {...e, obj};
        case "index":
            var obj = getNonLocalsInExpr(e.obj, explicit_nonlocals, env, res);
            var index = getNonLocalsInExpr(e.index, explicit_nonlocals, env, res);
            return {...e, obj, index};
        case "method-call":
            var obj = getNonLocalsInExpr(e.obj, explicit_nonlocals, env, res);
            var newargs: Array<Expr<Type>> = [];
            e.arguments.forEach(e => {
                newargs.push(getNonLocalsInExpr(e, explicit_nonlocals, env, res));
            });
            return {...e, obj, arguments: newargs};
        case "construct":
            return e;
        case "list-obj":
            var newentries: Array<Expr<Type>> = [];
            e.entries.forEach(e => {
                newentries.push(getNonLocalsInExpr(e, explicit_nonlocals, env, res));
            });
            return {...e, entries: newentries};
        case "list-length":
            var list = getNonLocalsInExpr(e.list, explicit_nonlocals, env, res);
            return {...e, list};
        default:
            return e;
    }
}

function getNonLocalsInStmt(s: Stmt<Type>, explicit_nonlocals: Array<string>, env: LocalFuncEnv, res: [Set<string>, Set<Expr<Type>>]): Stmt<Type> {
    switch (s.tag){
        case "assign":
            var v = getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            if (explicit_nonlocals.find(name => name === s.name)){
                return {  a: NONE, tag: "field-assign", obj: {a: env.classesneeded.get(s.name)[1], tag: "id", name: s.name}, field: "value", value: v }
            }
            else{
                return {...s, value: v};
            }
        case "return":
            var v = getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return {...s, value: v};
        case "expr":
            var e = getNonLocalsInExpr(s.expr, explicit_nonlocals, env, res);
            return {...s, expr: e};
        case "field-assign":
            var obj = getNonLocalsInExpr(s.obj, explicit_nonlocals, env, res);
            var value = getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return {...s, obj, value};
        case "index-assign":
            var list = getNonLocalsInExpr(s.list, explicit_nonlocals, env, res);
            var index = getNonLocalsInExpr(s.index, explicit_nonlocals, env, res);
            var value = getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return {...s, list, index, value};
        case "if":
            var cond = getNonLocalsInExpr(s.cond, explicit_nonlocals, env, res);
            var thn: Array<Stmt<Type>> = [];
            var els: Array<Stmt<Type>> = [];
            s.thn.forEach(s => {
                thn.push(getNonLocalsInStmt(s, explicit_nonlocals, env, res));
            });
            s.els.forEach(s => {
                els.push(getNonLocalsInStmt(s, explicit_nonlocals, env, res));
            });
            return {...s, cond, thn, els};
        case "while":
            var cond = getNonLocalsInExpr(s.cond, explicit_nonlocals, env, res);
            var body: Array<Stmt<Type>> = [];
            s.body.forEach(s => {
                body.push(getNonLocalsInStmt(s, explicit_nonlocals, env, res));
            });
            return {...s, cond, body};
        case "for":
            var iter = getNonLocalsInExpr(s.iterable, explicit_nonlocals, env, res);
            var body: Array<Stmt<Type>> = [];
            s.body.forEach(s => {
                body.push(getNonLocalsInStmt(s, explicit_nonlocals, env, res));
            });
            return {...s, iterable: iter, body};
        default:
            return s;
    }
}

export function getNonLocalsInFunBody(fun : FunDef<Type>, env: LocalFuncEnv) : [Set<Expr<Type>>, Array<Stmt<Type>>] {
    var res : [Set<string>, Set<Expr<Type>>] = [new Set(), new Set()];
    var explicit_nonlocals = fun.nonlocals;
    var newbody: Array<Stmt<Type>> = [];
    fun.body.forEach(s => {
        newbody.push(getNonLocalsInStmt(s, explicit_nonlocals, env, res));
    });

    return [res[1], newbody];
}

export function generateClassDef(varname: string, classname: string, vartype: Type): Class<Type>{
    var fields :Array<VarInit<Type>> = [];
    var methods: Array<FunDef<Type>> = [];
    switch(vartype.tag){
        case "number":
            fields.push({ a: vartype, name: "value", type: vartype, value: { tag: "num", value: 0}})
            methods.push({a:{tag:"none"}, body: [], funs: [], inits: [], name: "__init__", parameters: [{name: "self", type: {tag: "class", name: classname}}], ret: {tag: "none"}});
            return { a: NONE, name: classname, fields: fields, methods: methods};
        default:
            throw new Error("Not Supported!");
    }
    
}
