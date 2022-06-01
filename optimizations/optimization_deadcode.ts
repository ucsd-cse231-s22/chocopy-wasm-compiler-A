import { Type } from "../ast";
import { BasicBlock, Expr, FunDef, Program, Stmt, Value, VarInit } from "../ir";
import { generateEnvironmentFunctions, generateEnvironmentProgram } from "./optimization";
import { Env } from "./optimization_common_models";
import { checkCopyValEquality, checkStmtEquality, duplicateEnv, isTagId } from "./optimization_utils";


export type val = {
    tag: "dead" | "alive" | "undef";
}

export class liveEnv extends Env {
    vars: Map<string, val>;

    constructor(vars: Map<string, val>) {
        super();
        this.vars = vars;
    }

    get(arg: string): val {
        return this.vars.get(arg);
    }

    set(arg: string, value: val) {
        this.vars.set(arg, value);
    }

    has(arg: string): boolean {
        return this.vars.has(arg);
    }

    duplicateEnv(): liveEnv {
        return new liveEnv(new Map(this.vars))
    }

    mergeEnvironment(b: liveEnv): liveEnv {
        var returnEnv: liveEnv = new liveEnv(new Map<string, val>());
        this.vars.forEach((aValue: val, key: string) => {
            const bValue: val = b.vars.get(key);
            if (bValue.tag === "nac" || aValue.tag === "nac")
                returnEnv.vars.set(key, { tag: "nac", reverse: [...bValue.reverse, ...aValue.reverse] });
            else if (aValue.tag === "undef" && bValue.tag === "undef") {
                returnEnv.vars.set(key, { tag: "undef", reverse: [...bValue.reverse, ...aValue.reverse] })
            }
            else if (aValue.tag === "undef") {
                returnEnv.vars.set(key, { tag: "copyId", value: bValue.value, reverse: [...bValue.reverse ] })
            }
            else if (bValue.tag === "undef") {
                returnEnv.vars.set(key, { tag: "copyId", value: aValue.value, reverse: [...aValue.reverse] });
            }
            else if (aValue.value === bValue.value)
                returnEnv.vars.set(key, { tag: "copyId", value: aValue.value, reverse: [...bValue.reverse, ...aValue.reverse] });
            else
                returnEnv.vars.set(key, { tag: "nac", reverse: [...bValue.reverse, ...aValue.reverse] });
        });
        return returnEnv;
    }
}