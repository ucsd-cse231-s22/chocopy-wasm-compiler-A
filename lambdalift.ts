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
    var funcparams = env.funparamsstack.flat();
    
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
