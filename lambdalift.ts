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
    classesneeded: Map<string, Type>;
  }

function getNonLocalsDicInFun(fun: FunDef<Type>, env: LocalFuncEnv) {
    fun.funs.forEach(f => {
        getNonLocalsDicInFun(f, env);
    });

    env.funnonlocalsdic.set(fun.name, Array.from(getNonLocalsInFunBody(fun, env)).map(e => <Parameter<Type>>{name: (e as any).name, type: e.a}));
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

    env.funnamestack.push(fun.name);
    var funcname = env.funnamestack.join("$");
    var funcbody:Array<Stmt<Type>> = [];
    fun.body.forEach(s => {
        funcbody.push(changeCallinStmt(s, env));
    })
    var funcparams = Array.from(getNonLocalsInFunBody(fun, env)).map(e => <Parameter<Type>>{name: (e as any).name, type: e.a}).concat(fun.parameters);

    for(var i=0; i<fun.funs.length; i++){
        lambdalift_helper(fun, fun.funs[i], env, flattenedfun, generatedclasses);
    }
    env.funnamestack.pop();

    flattenedfun.push({ ...fun, name: funcname, parameters: funcparams, funs: [], body: funcbody});
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
                newargs.push({tag: "id", name: p.name});
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
    var classesneeded: Map<string, Type> = new Map();
    return {funnonlocalsdic, funlocals, funnamestack, visiblefuncs, classesneeded};
}

function getNonLocalsInExpr(e: Expr<Type>, explicit_nonlocals: Array<string>, env: LocalFuncEnv, res: [Set<string>, Set<Expr<Type>>]): Expr<Type>{
    switch (e.tag){
        case "literal":
            return;
        case "id":
            if (!env.funlocals.has(e.name) && !res[0].has(e.name)) {
                res[0].add(e.name);
                res[1].add(e);
            }
            if(explicit_nonlocals.find(name => name===e.name)){
                var classname = "Ref"+namecount;
                namecount++;
                return {  a: e.a, tag: "lookup", obj: {  a: {tag: "class", name: classname}, tag: "id", name: e.name }, field: "value" };
            }
            else{
                return e;
            }
        case "binop":
            var left = getNonLocalsInExpr(e.left, explicit_nonlocals, env, res);
            var right = getNonLocalsInExpr(e.right, explicit_nonlocals, env, res);
            return {...e, left:left, right:right};
        case "uniop":
            getNonLocalsInExpr(e.expr, explicit_nonlocals, env, res);
            return;
        case "builtin1":
            getNonLocalsInExpr(e.arg, explicit_nonlocals, env, res);
            return;
        case "builtin2":
            getNonLocalsInExpr(e.left, explicit_nonlocals, env, res);
            getNonLocalsInExpr(e.right, explicit_nonlocals, env, res);
            return;
        case "call":
            e.arguments.forEach(e => {
                getNonLocalsInExpr(e, explicit_nonlocals, env, res);
            });
            return;
        case "lookup":
            getNonLocalsInExpr(e.obj, explicit_nonlocals, env, res);
            return;
        case "index":
            getNonLocalsInExpr(e.obj, explicit_nonlocals, env, res);
            getNonLocalsInExpr(e.index, explicit_nonlocals, env, res);
            return;
        case "method-call":
            getNonLocalsInExpr(e.obj, explicit_nonlocals, env, res);
            e.arguments.forEach(e => {
                getNonLocalsInExpr(e, explicit_nonlocals, env, res);
            });
            return;
        case "construct":
            return;
        case "list-obj":
            e.entries.forEach(e => {
                getNonLocalsInExpr(e, explicit_nonlocals, env, res);
            });
            return;
        case "list-length":
            getNonLocalsInExpr(e.list, explicit_nonlocals, env, res);
            return;
        default:
            return;
    }
}

function getNonLocalsInStmt(s: Stmt<Type>, explicit_nonlocals: Array<string>, env: LocalFuncEnv, res: [Set<string>, Set<Expr<Type>>]) {
    switch (s.tag){
        case "assign":
            getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return;
        case "return":
            getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return;
        case "expr":
            getNonLocalsInExpr(s.expr, explicit_nonlocals, env, res);
            return;
        case "field-assign":
            getNonLocalsInExpr(s.obj, explicit_nonlocals, env, res);
            getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return;
        case "index-assign":
            getNonLocalsInExpr(s.list, explicit_nonlocals, env, res);
            getNonLocalsInExpr(s.index, explicit_nonlocals, env, res);
            getNonLocalsInExpr(s.value, explicit_nonlocals, env, res);
            return;
        case "if":
            getNonLocalsInExpr(s.cond, explicit_nonlocals, env, res);
            s.thn.forEach(s => {
                getNonLocalsInStmt(s, explicit_nonlocals, env, res);
            });
            s.els.forEach(s => {
                getNonLocalsInStmt(s, explicit_nonlocals, env, res);
            });
            return;
        case "while":
            getNonLocalsInExpr(s.cond, explicit_nonlocals, env, res);
            s.body.forEach(s => {
                getNonLocalsInStmt(s, explicit_nonlocals, env, res);
            });
            return;
        case "for":
            getNonLocalsInExpr(s.iterable, explicit_nonlocals, env, res);
            s.body.forEach(s => {
                getNonLocalsInStmt(s, explicit_nonlocals, env, res);
            });
            return;
        default:
            return;
    }
}

export function getNonLocalsInFunBody(fun : FunDef<Type>, env: LocalFuncEnv) : Set<Expr<Type>> {
    var res : [Set<string>, Set<Expr<Type>>] = [new Set(), new Set()];
    env.funlocals = new Set();
    fun.parameters.forEach(p => {
        env.funlocals.add(p.name);
    });
    fun.inits.forEach(v => {
        env.funlocals.add(v.name);
    });
    
    var explicit_nonlocals = fun.nonlocals;
    fun.body.forEach(s => {
        getNonLocalsInStmt(s, explicit_nonlocals, env, res);
    });

    return res[1];
}
