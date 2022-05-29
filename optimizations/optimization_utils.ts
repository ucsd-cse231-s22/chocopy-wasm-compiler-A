import { Expr, Stmt, Value } from "../ir";
import { BinOp, Type, UniOp } from "../ast";
import { propagateVal } from "./optimizations_prop_fold";
import { copyVal } from "./optimization_copy_prop";
import { Env } from "./optimization_common_models";

export function isTagId(value: Value<any>): value is { tag: "id", name: string, a?: any } {
    return value.tag === "id";
}

export function isTagNone(value: Value<any>): value is { tag: "none", a?: any } {
    return value.tag === "none";
}

export function isTagBoolean(value: Value<any>): value is { tag: "bool", value: boolean, a?: any } {
    return value.tag === "bool";
}

export function isTagBigInt(value: Value<any>): value is { tag: "num", value: bigint, a?: any } {
    return value.tag === "num";
}

export function isTagNumber(value: Value<any>): value is { tag: "wasmint", value: number, a?: any } {
    return value.tag === "wasmint";
}

export function isTagEqual(a: Value<any>, b: Value<any>): boolean {
    if (isTagBigInt(a) && isTagBigInt(b) || isTagBoolean(a) && isTagBoolean(b) || isTagNone(a) && isTagNone(b))
        return true
    else
        return false
}

export function checkValueEquality(a: Value<any>, b: Value<any>): boolean {
    if (a.tag !== b.tag)
        return false;
    else if (a.tag === "none" || b.tag === "none")
        return true;
    else if (a.tag === "id" || b.tag === "id") {
        if (b.tag !== "id" || a.tag !== b.tag) throw new Error(`Compiler Error!`); //Will never be executed (to convince typescript)
        if (a.name === b.name) return true;
        return false;
    }
    else if (a.value === b.value)
        return true;
    return false;
}

export function checkArrayEquality(a: Array<any>, b: Array<any>): boolean {
    if (a.length !== b.length) return false;

    return a.every((val) => { return b.includes(val) });
}

export function checkCopyValEquality(a: copyVal, b: copyVal): boolean {
    if (a.tag !== b.tag)
        return false;
    if (a.tag === "copyId") {
        return checkValueEquality(a.value, b.value) && checkArrayEquality(a.reverse, b.reverse);
    }
    return true;
}

export function checkPropagateValEquality(a: propagateVal, b: propagateVal): boolean {
    if (a.tag !== b.tag)
        return false;
    if (a.tag === "val") {
        return checkValueEquality(a.value, b.value);
    }
    return true;
}

export function checkArgsEquality(a: Array<Value<any>>, b: Array<Value<any>>): boolean {
    for (let index = 0; index < a.length; index++) {
        const argA = a[index];
        const argB = b[index];
        if (!checkValueEquality(argA, argB)) return false;
    }
    return true;
}

export function checkExprEquality(a: Expr<any>, b: Expr<any>): boolean {
    if (a.tag !== b.tag)
        return false;
    switch (a.tag) {
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
            return checkArgsEquality(a.arguments, b.arguments);
        case "call_indirect":
            if (b.tag !== "call_indirect") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkExprEquality(a.fn, b.fn) && checkArgsEquality(a.arguments, b.arguments);
        case "alloc":
            if (b.tag !== "alloc") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.amount, b.amount);
        case "load":
            if (b.tag !== "load") throw new Error(`Compiler Error!`); //Will never be executed, sanity check
            return checkValueEquality(a.start, b.start) && checkValueEquality(a.offset, b.offset);
        default:
            return true;
    }
}

export function checkStmtEquality(a: Stmt<any>, b: Stmt<any>): boolean {
    if (a.tag !== b.tag)
        return false;
    switch (a.tag) {
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
        default:
            return true;
    }
}

export function checkIfFoldableBinOp(op: BinOp, leftVal: Value<any>, rightVal: Value<any>): boolean {
    if ([BinOp.IDiv, BinOp.Mod].includes(op)) {
        if (!isTagBigInt(leftVal) || !isTagBigInt(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        if (rightVal.value === 0n) return false;
    }
    return true;
}

export function evaluateBinOp(op: BinOp, leftVal: Value<any>, rightVal: Value<any>): Value<any> {
    if ([BinOp.Plus, BinOp.Minus, BinOp.IDiv, BinOp.Mul, BinOp.Gt, BinOp.Lt, BinOp.Gte, BinOp.Lte, BinOp.Mod].includes(op)) {
        if (!isTagBigInt(leftVal) || !isTagBigInt(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");

        switch (op) {
            case BinOp.Plus: return { tag: "num", value: leftVal.value + rightVal.value };

            case BinOp.Minus: return { tag: "num", value: leftVal.value - rightVal.value }

            case BinOp.Mul: return { tag: "num", value: leftVal.value * rightVal.value }

            case BinOp.IDiv: return { tag: "num", value: leftVal.value / rightVal.value }

            case BinOp.Mod: return { tag: "num", value: leftVal.value % rightVal.value }

            case BinOp.Gt: return { tag: "bool", value: leftVal.value > rightVal.value }

            case BinOp.Lt: return { tag: "bool", value: leftVal.value < rightVal.value }

            case BinOp.Gte: return { tag: "bool", value: leftVal.value >= rightVal.value }

            case BinOp.Lte: return { tag: "bool", value: leftVal.value <= rightVal.value }
        }
    }
    else if ([BinOp.And, BinOp.Or].includes(op)) {
        if (!isTagBoolean(leftVal) || !isTagBoolean(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");

        switch (op) {
            case BinOp.And: return { tag: "bool", value: leftVal.value && rightVal.value };

            case BinOp.Or: return { tag: "bool", value: leftVal.value || rightVal.value };
        }
    }
    else if ([BinOp.Eq, BinOp.Neq].includes(op)) {
        if (!isTagEqual(leftVal, rightVal) || isTagNone(leftVal) || isTagNone(rightVal) || isTagId(leftVal) || isTagId(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        switch (op) {
            case BinOp.Eq: return { tag: "bool", value: leftVal.value === rightVal.value };

            case BinOp.Neq: return { tag: "bool", value: leftVal.value !== rightVal.value };

        }
    }
    else {
        //Is operator handler
        if (!isTagNone(leftVal) || !isTagNone(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        return { tag: "bool", value: true };
    }
}

export function evaluateUniOp(op: UniOp, val: Value<any>): Value<any> {
    switch (op) {
        case UniOp.Neg:

            if (isTagId(val) || isTagNone(val) || isTagBoolean(val))
                throw new Error("Compiler Error");
            const minus1: bigint = -1n;
            return { tag: "num", value: minus1 as bigint * (val.value as bigint) };

        case UniOp.Not:

            if (!isTagBoolean(val))
                throw new Error("Compiler Error");

            return { tag: "bool", value: !(val.value) };
    }
}

export function duplicateEnv(env: Env): Env {
    return env.duplicateEnv(); // new Env(new Map(env.vars));
}
