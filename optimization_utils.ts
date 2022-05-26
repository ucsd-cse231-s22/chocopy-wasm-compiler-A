import { Expr, Stmt, Value } from "./ir";
import { Type } from "./ast";
import { compileVal } from "./optimization";

export function isTagId(value: Value<any>): value is { tag: "id",  name: string, a?: any} {
    return value.tag === "id";
}

export function isTagNone(value: Value<any>): value is { tag: "none", a?: any} {
    return value.tag === "none";
}

export function isTagBoolean(value: Value<any>): value is { tag: "bool", value: boolean, a?: any} {
    return value.tag === "bool";
}

export function isTagBigInt(value: Value<any>): value is { tag: "num", value: bigint, a?: any} {
    return value.tag === "num";
}

export function isTagNumber(value: Value<any>): value is { tag: "wasmint", value: number, a?: any} {
    return value.tag === "wasmint";
}

export function isTagEqual(a: Value<any>, b: Value<any>): boolean {
    if(isTagBigInt(a) && isTagBigInt(b) || isTagBoolean(a) && isTagBoolean(b) || isTagNone(a) && isTagNone(b))
        return true
    else
        return false
}

export function checkValueEquality(a: Value<any>, b: Value<any>): boolean{
    if (a.tag !== b.tag)
        return false;
    else if (a.tag === "none" || b.tag === "none")
        return true;
    else if (a.tag === "id" || b.tag === "id"){
        if (b.tag !== "id" || a.tag !== b.tag) throw new Error(`Compiler Error!`); //Will never be executed (to convince typescript)
        if (a.name === b.name) return true;
        return false;
    }
    else if (a.value === b.value)
        return true;
    return false;
}

export function checkCompileValEquality(a: compileVal, b: compileVal): boolean{
    if (a.tag !== b.tag)
        return false;
    // || a.tag === "copyId"
    if (a.tag === "val"){
        return checkValueEquality(a.value, b.value);
    }
    return true;
}

export function checkExprEquality(a: Expr<any>, b: Expr<any>): boolean{
    if (a.tag !== b.tag)
        return false;
    switch(a.tag){
        case "value":
            if (b.tag !== "value") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.value, b.value);
        case "binop":
            if (b.tag !== "binop") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            if (a.op !== b.op) return false;
            return checkValueEquality(a.left, b.left) && checkValueEquality(a.right, b.right);
        case "uniop":
            if (b.tag !== "uniop") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            if (a.op !== b.op) return false;
            return checkValueEquality(a.expr, b.expr);
        case "builtin1":
            if (b.tag !== "builtin1") throw new Error(`Compiler Error!`); //Will never be executed, santiy check
            if (a.name !== b.name) return false;
            return checkValueEquality(a.arg, b.arg);
        case "builtin2":
            if (b.tag !== "builtin2") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            if (a.name !== b.name) return false;
            return checkValueEquality(a.left, b.left) && checkValueEquality(a.right, b.right);
        case "call":
            if (b.tag !== "call") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            if (a.name !== b.name || a.arguments.length !== b.arguments.length) return false;
            for (let index = 0; index < a.arguments.length; index++){
                const argA = a.arguments[index];
                const argB = b.arguments[index];
                if (!checkValueEquality(argA, argB)) return false;
            }
            return true;
        case "alloc":
            if (b.tag !== "alloc") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.amount, b.amount);
        case "load":
            if (b.tag !== "load") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.start, b.start) && checkValueEquality(a.offset, b.offset);
    }
}

export function checkStmtEquality(a: Stmt<any>, b: Stmt<any>): boolean{
    if (a.tag !== b.tag)
        return false;
    switch(a.tag){
        case "assign":
            if (b.tag !== "assign") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            if (a.name !== b.name) return false;
            return checkExprEquality(a.value, b.value);
        case "return":
            if (b.tag !== "return") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.value, b.value);
        case "expr":
            if (b.tag !== "expr") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkExprEquality(a.expr, b.expr);
        case "pass":
            if (b.tag !== "pass") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return true;
        case "ifjmp":
            if (b.tag !== "ifjmp") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            if ((a.thn !== b.thn) || (a.els !== b.els)) return false;
            return checkValueEquality(a.cond, b.cond);
        case "jmp":
            if (b.tag !== "jmp") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return (a.lbl === b.lbl);
        case "store":
            if (b.tag !== "store") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.start, b.start) && checkValueEquality(a.offset, b.offset);
    }
}
