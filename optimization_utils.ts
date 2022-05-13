import { Stmt, Value } from "./ir";
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
    else if (a.tag === "id" || b.tag === "id")
        return false;
    else if (a.value === b.value)
        return true;
    return false;
}

export function checkCompileValEquality(a: compileVal, b: compileVal): boolean{
    if (a.tag !== b.tag)
        return false;
    if (a.tag === "val"){
        return checkValueEquality(a.value, b.value);
    }
    return true;
}

export function checkStmtEquality(a: Stmt<any>, b: Stmt<any>): boolean{
    if (a.tag !== b.tag)
        return false;
    switch(a.tag){
        case "assign":
            
    }
}
