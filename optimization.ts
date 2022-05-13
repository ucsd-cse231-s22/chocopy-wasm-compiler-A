import { BinOp, Type, UniOp} from "./ast";
import { Stmt, Expr, Value, VarInit, BasicBlock } from "./ir";

import { isTagBoolean, isTagNone, isTagId, isTagBigInt, isTagEqual } from "./optimization_utils"; 

type Env = {
    vars: Map<string, Value<Type>>;
}
type compileVal = {
    tag: "nac"|"val", value?: Value<Type>;
}

type EnvWork = {
    name: string,
    val: compileVal;
}

type WorkList = {
    vars: Map<string, EnvWork>;
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
    if([BinOp.Plus, BinOp.Minus,BinOp.IDiv,BinOp.Mul, BinOp.Gt, BinOp.Lt, BinOp.Gte, BinOp.Lte, BinOp.Mod].includes(op)){
        if(!isTagBigInt(leftVal) || !isTagBigInt(rightVal))
            throw new Error("Compiler Error");
        
        switch(op){
            case BinOp.Plus: return {a: {tag: "number"}, tag: "num", value: leftVal.value + rightVal.value};
            
            case BinOp.Minus: return {a: {tag: "number"}, tag: "num", value: leftVal.value - rightVal.value}
            
            case BinOp.Mul: return {a: {tag: "number"}, tag: "num", value: leftVal.value * rightVal.value}

            case BinOp.IDiv: return {a: {tag: "number"}, tag: "num", value: leftVal.value / rightVal.value}
            
            case BinOp.Mod: return {a: {tag: "number"}, tag: "num", value: leftVal.value % rightVal.value}
            
            case BinOp.Gt: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value > rightVal.value}
            
            case BinOp.Lt: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value < rightVal.value}
            
            case BinOp.Gte: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value >= rightVal.value}
            
            case BinOp.Lte: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value <= rightVal.value} 
        }
    }
    else if([BinOp.And, BinOp.Or].includes(op)){
        if(!isTagBoolean(leftVal) || !isTagBoolean(rightVal))
            throw new Error("Compiler Error")
        
        switch(op){
            case BinOp.And: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value && rightVal.value};

            case BinOp.Or: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value || rightVal.value};
        }
    }
    else if([BinOp.Eq, BinOp.Neq].includes(op)){
        if(!isTagEqual(leftVal, rightVal) || isTagNone(leftVal) || isTagNone(rightVal) || isTagId(leftVal) || isTagId(rightVal))
            throw new Error("Compiler Error");
        switch(op){
            case BinOp.Eq: return {a: {tag: "bool"}, tag: "bool", value: leftVal.value == rightVal.value};

        }
    }
}

export function evaluateUniOp(op: UniOp, val: Value<Type>): Value<Type>{
    switch(op){
        case UniOp.Neg:

            if (isTagId(val) || isTagNone(val) || isTagBoolean(val)) 
                throw new Error("Compiler Error");
            const minus1: bigint = -1n;
            return {a: {tag: "number"}, tag: "num", value: minus1 as bigint * (val.value as bigint)};

        case UniOp.Not:

            if (!isTagBoolean(val)) 
                throw new Error("Compiler Error");
            
            return {a: {tag: "bool"}, tag: "bool", value: !(val.value)};
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
            return {a: val.a, tag: "value", value: evaluateBinOp(e.op, e.left, e.right)};

        case "uniop":
            break;
    }
}

export function compPreSuc(bbs: Array<BasicBlock<Type>>): [Map<string, string[]>, Map<string, string[]>]{
    let succs: Map<string, string[]> = new Map<string, string[]>();
    let preds: Map<string, string[]> = new Map<string, string[]>();
    bbs.forEach(bb=>{
        const lastStmt = bb.stmts[-1];
        if(lastStmt.tag !== "ifjmp" && lastStmt.tag!== "jmp"){
            throw new Error("OPT Error: last stmt should be jump in BB!");
        }
        if(lastStmt.tag === "ifjmp"){
            let tmp: Array<string> = [];
            if(!succs.has(bb.label)){
                tmp = [lastStmt.thn, lastStmt.els];
                succs.set(bb.label, tmp);
            }
            else{
                tmp = succs.get(bb.label);
                tmp = tmp.concat([lastStmt.thn, lastStmt.els]);
                succs.set(bb.label, tmp);
            }
        }
        else{
            if(!succs.has(bb.label)){
                succs.set(bb.label, [lastStmt.lbl]);
            }
            else{
                succs.set(bb.label, succs.get(bb.label).concat([lastStmt.lbl]));
            }
        }
    });

    succs.forEach((value: string[], key: string) => {
        value.forEach(v=>{
            if(!preds.has(v)){
                preds.set(v, [key]);
            }
            else{
                preds.set(v, succs.get(v).concat([key]));
            }
        });
    });
    return [preds, succs];

}

export function calWorkList(inList: WorkList, outList: WorkList): [WorkList, WorkList]{

    return [inList, outList];

}
// export function optimizeConstantProp()