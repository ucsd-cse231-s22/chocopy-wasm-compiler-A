import { idText } from 'typescript';
import { Stmt, Expr, Type, UniOp, BinOp, Literal, Parameter, Program, FunDef, VarInit, Class } from './ast';
import {NUM, BOOL, NONE, CLASS, STR} from './utils';

export type LocalFuncEnv = {
    funnamestack: Array<string>;
    funparamsstack: Array<Array<Parameter<Type>>>;
    visiblefuncs: Array<string>;
  }

export function liftprogram(prog: Program<Type>): Program<Type>{
    var funs: Array<FunDef<Type>> = [];
    var classes = prog.classes;
    var env = createEnv();
    prog.funs.forEach(f => {
        var flattenedfun;
        var generatedclasses;
        [flattenedfun, generatedclasses] = lambdalift(f, env);
        funs.push(...flattenedfun);
        classes.push(...generatedclasses);
    });

    return {...prog, funs, classes};
}

export function lambdalift(fun: FunDef<Type>, env: LocalFuncEnv): [Array<FunDef<Type>>, Array<Class<Type>>]{
    var flattenedfun: Array<FunDef<Type>> = [];
    var generatedclasses: Array<Class<Type>> = [];
    lambdalift_helper(fun, env, flattenedfun, generatedclasses);
    return [flattenedfun, generatedclasses];
}

function lambdalift_helper(fun: FunDef<Type>, 
                           env: LocalFuncEnv, 
                           flattenedfun: FunDef<Type>[], 
                           generatedclasses: Class<Type>[])
{
    env.visiblefuncs = fun.funs.map(f=> f.name);

    env.funnamestack.push(fun.name);
    env.funparamsstack.push(fun.parameters);
    var funcname = env.funnamestack.join("$");
    var funcbody:Array<Stmt<Type>> = [];
    fun.body.forEach(s => {
        funcbody.push(changeCallinStmt(s, env));
    })
    var funcparams = Array.from(getNonLocalsInFunBody(fun)).map(e => <Parameter<Type>>{name: (e as any).name, type: e.a}).concat(fun.parameters);

    for(var i=0; i<fun.funs.length; i++){
        lambdalift_helper(fun.funs[i], env, flattenedfun, generatedclasses);
    }
    env.funnamestack.pop();
    env.funparamsstack.pop();

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
            var found = env.visiblefuncs.find(element => element === e.name);
            if(found){
                newname = env.funnamestack.join("$") + "$" + e.name; 
            }
            else{
                newname = e.name;
            }
            // also need to change arg lists.
            env.funparamsstack.flat().forEach(p=> {
                newargs.push({tag: "id", name: p.name});
            })
            newargs = newargs.concat(e.arguments);
            return {...e, name: newname, arguments: newargs};
        default: 
            return {...e};
    }
}

function createEnv(): LocalFuncEnv{
    var funnamestack:Array<string> = [];
    var funparamsstack:Array<Array<Parameter<Type>>> = [];
    var visiblefuncs:Array<string> = [];
    return {funnamestack, funparamsstack, visiblefuncs};
}

function getNonLocalsInExpr(e: Expr<Type>, env: Set<string>, res: [Set<string>, Set<Expr<Type>>]) {
    switch (e.tag){
        case "literal":
            return;
        case "id":
            if (!env.has(e.name) && !res[0].has(e.name)) {
                res[0].add(e.name);
                res[1].add(e);
            }
            return;
        case "binop":
            getNonLocalsInExpr(e.left, env, res);
            getNonLocalsInExpr(e.right, env, res);
            return;
        case "uniop":
            getNonLocalsInExpr(e.expr, env, res);
            return;
        case "builtin1":
            getNonLocalsInExpr(e.arg, env, res);
            return;
        case "builtin2":
            getNonLocalsInExpr(e.left, env, res);
            getNonLocalsInExpr(e.right, env, res);
            return;
        case "call":
            e.arguments.forEach(e => {
                getNonLocalsInExpr(e, env, res);
            });
            return;
        case "lookup":
            getNonLocalsInExpr(e.obj, env, res);
            return;
        case "index":
            getNonLocalsInExpr(e.obj, env, res);
            getNonLocalsInExpr(e.index, env, res);
            return;
        case "method-call":
            getNonLocalsInExpr(e.obj, env, res);
            e.arguments.forEach(e => {
                getNonLocalsInExpr(e, env, res);
            });
            return;
        case "construct":
            return;
        case "list-obj":
            e.entries.forEach(e => {
                getNonLocalsInExpr(e, env, res);
            });
            return;
        case "list-length":
            getNonLocalsInExpr(e.list, env, res);
            return;
        default:
            return;
    }
}

function getNonLocalsInStmt(s: Stmt<Type>, env: Set<string>, res: [Set<string>, Set<Expr<Type>>]) {
    switch (s.tag){
        case "assign":
            getNonLocalsInExpr(s.value, env, res);
            return;
        case "return":
            getNonLocalsInExpr(s.value, env, res);
            return;
        case "expr":
            getNonLocalsInExpr(s.expr, env, res);
            return;
        case "field-assign":
            getNonLocalsInExpr(s.obj, env, res);
            getNonLocalsInExpr(s.value, env, res);
            return;
        case "index-assign":
            getNonLocalsInExpr(s.list, env, res);
            getNonLocalsInExpr(s.index, env, res);
            getNonLocalsInExpr(s.value, env, res);
            return;
        case "if":
            getNonLocalsInExpr(s.cond, env, res);
            s.thn.forEach(s => {
                getNonLocalsInStmt(s, env, res);
            });
            s.els.forEach(s => {
                getNonLocalsInStmt(s, env, res);
            });
            return;
        case "while":
            getNonLocalsInExpr(s.cond, env, res);
            s.body.forEach(s => {
                getNonLocalsInStmt(s, env, res);
            });
            return;
        case "for":
            getNonLocalsInExpr(s.iterable, env, res);
            s.body.forEach(s => {
                getNonLocalsInStmt(s, env, res);
            });
            return;
        default:
            return;
    }
}

export function getNonLocalsInFunBody(fun : FunDef<Type>) : Set<Expr<Type>> {
    var res : [Set<string>, Set<Expr<Type>>] = [new Set(), new Set()];
    var env : Set<string> = new Set();
    fun.parameters.forEach(p => {
        env.add(p.name);
    });
    fun.inits.forEach(v => {
        env.add(v.name);
    });

    fun.body.forEach(s => {
        getNonLocalsInStmt(s, env, res);
    });

    return res[1];
}
