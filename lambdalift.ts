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
    var funcname = env.funnamestack.join("$");
    env.funnamestack.pop();
    var funcparams = fun.parameters.concat(env.funparamsstack.flat());
    var funcbody = [];
    fun.body.forEach(s => {
        funcbody.push(changeCallNameinStmt(s, env));
    })

    if(fun.funs.length!=0){
        env.funnamestack.push(fun.name);
        env.funparamsstack.push(fun.parameters);
        for(var i=0; i<fun.funs.length; i++){
            lambdalift_helper(fun.funs[i], env, flattenedfun, generatedclasses);
        }
        env.funnamestack.pop();
        env.funparamsstack.pop();
    }
    flattenedfun.push({ ...fun, name: funcname, parameters: funcparams, funs: []});
}

// function changeCallNameinStmt(stmt: Stmt<Type>, env : LocalFuncEnv) : Array<Stmt<Type>>{
//     switch (stmt.tag){
//         case "assign":
//             var value = changeCallName()
//         case "return":
//         case "expr":
//         case "field-assign":
//         case "index-assign":
//         case "if":
//         case "while":
//         case "for":
//     }
// }

// function changeCallNameinExpr(expr: Expr<Type>, env: LocalFuncEnv): Expr<Type>{

// }

function createEnv(): LocalFuncEnv{
    var funnamestack:Array<string> = [];
    var funparamsstack:Array<Array<Parameter<Type>>> = [];
    var visiblefuncs:Array<string> = [];
    return {funnamestack, funparamsstack, visiblefuncs};
}
