import { Value } from "./ir";
import { Type } from "./ast";

export function isTagId(value: Value<Type>): value is { tag: "id",  name: string, a?: Type} {
    return value.tag === "id";
}

export function isTagNone(value: Value<Type>): value is { tag: "none", a?: Type} {
    return value.tag === "none";
}

export function isTagBoolean(value: Value<Type>): value is { tag: "bool", value: boolean, a?: Type} {
    return value.tag === "bool";
}

export function isTagBigInt(value: Value<Type>): value is { tag: "num", value: bigint, a?: Type} {
    return value.tag === "num";
}

export function isTagNumber(value: Value<Type>): value is { tag: "wasmint", value: number, a?: Type} {
    return value.tag === "wasmint";
}

export function isTagEqual(a: Value<Type>, b: Value<Type>): boolean {
    if(isTagBigInt(a) && isTagBigInt(b) || isTagBoolean(a) && isTagBoolean(b) || isTagNone(a) && isTagNone(b))
        return true
    else
        return false
}
