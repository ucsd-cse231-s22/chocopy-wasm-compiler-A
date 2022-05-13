import { BinOp, Type, UniOp} from "./ast";
import { Stmt, Expr, Value, VarInit, Program } from "./ir";

import { isTagBoolean, isTagNone, isTagId } from "./optimization_utils"; 

type Env = {
    vars: Map<string, Value<Type>>;
}

export function initializeDefinitions(inits: Array<VarInit<Type>>, env: Env){
    inits.forEach(init => {
        env.vars.set(init.name, init.value);
    });
}

export function optimizeValue(val: Value<Type>, env: Env): Value<Type>{
    if (val.tag !== "id"){
        return val;
    }
    if (env.vars.has(val.name)){
        val = env.vars.get(val.name);
    }
    return val;
}

export function evaluateBinOp(op: BinOp, leftVal: Value<Type>, rightVal: Value<Type>): Value<Type>{
    switch(op){
        case BinOp.Plus:

            if (isTagId(leftVal) || isTagNone(leftVal) || isTagBoolean(leftVal) || 
                isTagId(rightVal) || isTagNone(rightVal) || isTagBoolean(rightVal)) 
                throw new Error("Compiler Error");
            
            return {tag: "num", value: (leftVal.value as bigint) + (rightVal.value as bigint)};
    }
}

export function evaluateUniOp(op: UniOp, val: Value<Type>): Value<Type>{
    switch(op){
        case UniOp.Neg:

            if (isTagId(val) || isTagNone(val) || isTagBoolean(val)) 
                throw new Error("Compiler Error");
            const minus1: bigint = -1n;
            return { tag: "num", value: minus1 as bigint * (val.value as bigint)};

        case UniOp.Not:

            if (!isTagBoolean(val)) 
                throw new Error("Compiler Error");
            
            return { tag: "bool", value: !(val.value)};
    }
}

export function optimizeExpression(e: Expr<Type>, env: Env): Expr<Type>{
    switch(e.tag) {
        case "value":
           e.value = optimizeValue(e.value, env);
           return e;
        case "binop":
            var left = optimizeValue(e.left, env);
            var right = optimizeValue(e.right, env);
            if (left.tag === "id" || right.tag === "id")
                return e;
            
            const val = evaluateBinOp(e.op, e.left, e.right);
            return { tag: "value", value: evaluateBinOp(e.op, e.left, e.right)};

        case "uniop":
            
    }
}

export function optimizeStmt(stmt: Stmt<Type>, env: Env): Stmt<Type> {
    switch(stmt.tag) {
        case "assign":
            stmt.value = optimizeExpression(stmt.value, env);
            return stmt;
    }
}

export function optimizeProgram(pr: Program<Type>) : Program<Type>{
    pr.body = pr.body.map((basicBlock) => {
        basicBlock.stmts = basicBlock.stmts.map((stmt) => {
            return optimizeStmt(stmt, { vars: new Map<any, any>() });
        });
        return { ...basicBlock };
    });
    return pr;
}