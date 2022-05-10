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
