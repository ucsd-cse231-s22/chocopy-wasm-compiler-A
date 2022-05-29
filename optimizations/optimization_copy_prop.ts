import { stringify } from "querystring";
import { BinOp, Parameter, Type, UniOp } from "../ast";
import { Stmt, Expr, Value, VarInit, BasicBlock, Program, FunDef, Class } from "../ir";

import { isTagBoolean, isTagNone, isTagId, isTagBigInt, isTagEqual, checkValueEquality, checkCopyValEquality, checkStmtEquality, duplicateEnv } from "./optimization_utils";
import { BasicREPL } from "../repl";
import { Env } from "./optimization_common_models";
import { generateEnvironmentFunctions, generateEnvironmentProgram } from "./optimization";

export class copyEnv extends Env {
    copyVars: Map<string, copyVal>;

    constructor(copyVars: Map<string, copyVal>) {
        super();
        this.copyVars = copyVars;
    }

    get(arg: string): copyVal {
        return this.copyVars.get(arg);
    }

    set(arg: string, value: copyVal) {
        this.copyVars.set(arg, value);
    }

    has(arg: string): boolean {
        return this.copyVars.has(arg);
    }

    duplicateEnv(): copyEnv {
        return new copyEnv(new Map(this.copyVars))
    }

    checkEqual(b: copyEnv): boolean {
        const aVars = this.copyVars;
        const bVars = b.copyVars;

        for (const key of aVars.keys()) {
            const aValue = aVars.get(key);
            const bValue = bVars.get(key);

            if (!checkCopyValEquality(aValue, bValue)) return false;
        }
        return true;
    }

    updateEnvironmentByBlock(block: BasicBlock<any>): copyEnv {
        var outEnv: copyEnv = new copyEnv(new Map(this.copyVars));
        block.stmts.forEach(statement => {
            if (statement === undefined) { console.log(block.stmts); }
            if (statement.tag === "assign") {
                const optimizedExpression = optimizeExpression(statement.value, outEnv);
                const currReverse = outEnv.get(statement.name).reverse;
                if (optimizedExpression.tag === "value") {
                    if (optimizedExpression.value.tag === "id") {
                        // outEnv.vars.set(statement.name, {tag: "nac"});
                        outEnv.updateForwardsAndBackwards(statement);
                    }
                    else {
                        outEnv.copyVars.set(statement.name, { tag: "nac", reverse: currReverse });
                    }
                }
                else {
                    outEnv.copyVars.set(statement.name, { tag: "nac", reverse: currReverse });
                }
            }
        });
        return outEnv;
    }

    updateForwardsAndBackwards(stmt: Stmt<any>) {
        // const forwards: Map<string, string> = new Map<string, string>();
        if (stmt.tag === "assign" && stmt.value.tag === "value" && isTagId(stmt.value.value)) {
            const copyFrom = stmt.value.value.name;
            const copyTo = stmt;

            let backwards: string[] = [];
            const oldCopyFromEnv = this.copyVars.get(copyFrom);

            var oldBackwards = oldCopyFromEnv.reverse;
            backwards = [...oldBackwards, copyTo.name];

            this.copyVars.set(copyFrom, { tag: "copyId", reverse: backwards, ...oldCopyFromEnv });
            this.copyVars.set(copyTo.name, { tag: "copyId", value: stmt.value.value, reverse: [] });
        }
    }

    mergeEnvironment(b: copyEnv): copyEnv {
        var returnEnv: copyEnv = new copyEnv(new Map<string, copyVal>());
        this.copyVars.forEach((aValue: copyVal, key: string) => {
            const bValue: copyVal = b.copyVars.get(key);
            if (bValue.tag === "nac" || aValue.tag === "nac")
                returnEnv.copyVars.set(key, { tag: "nac", reverse: [...bValue.reverse, ...aValue.reverse] });
            else if (aValue.tag === "undef" && bValue.tag === "undef") {
                returnEnv.copyVars.set(key, { tag: "undef", reverse: [...bValue.reverse, ...aValue.reverse] })
            }
            else if (aValue.tag === "undef") {
                returnEnv.copyVars.set(key, { tag: "copyId", value: bValue.value, reverse: [...bValue.reverse ] })
            }
            else if (bValue.tag === "undef") {
                returnEnv.copyVars.set(key, { tag: "copyId", value: aValue.value, reverse: [...aValue.reverse] });
            }
            else if (aValue.value === bValue.value)
                returnEnv.copyVars.set(key, { tag: "copyId", value: aValue.value, reverse: [...bValue.reverse, ...aValue.reverse] });
            else
                returnEnv.copyVars.set(key, { tag: "nac", reverse: [...bValue.reverse, ...aValue.reverse] });
        });
        return returnEnv;
    }
}

export type copyVal = {
    tag: "nac" | "copyId" | "undef", value?: Value<any>, reverse?: string[];
}

export function optimizeValue(val: Value<any>, env: copyEnv): Value<any> {
    if (!isTagId(val)) {
        return val;
    }
    if (env.has(val.name)) {
        let copyId = env.get(val.name);
        if (["nac", "undef"].includes(copyId.tag))
            return val;

        if (!isTagId(copyId.value)) throw new Error("Compiler Error: Unexpected tag in copy Id");

        val = { name: copyId.value.name, ...val };
    }
    return val;
}

export function optimizeExpression(e: Expr<Type>, env: copyEnv): Expr<Type> {
    switch (e.tag) {
        case "value":
            var optimizedValue: Value<any> = optimizeValue(e.value, env);
            return { ...e, value: optimizedValue };
        case "binop":
            var left = optimizeValue(e.left, env);
            var right = optimizeValue(e.right, env);

            return { tag: "value", left, right, ...e };
        case "uniop":
            var arg = optimizeValue(e.expr, env);
            if (arg.tag === "id")
                return { ...e, expr: arg };
            return e;

        case "builtin1":
            var arg = optimizeValue(e.arg, env);
            return { ...e, arg: arg };
        case "builtin2":
            var left = optimizeValue(e.left, env);
            var right = optimizeValue(e.right, env);
            return { ...e, left: left, right: right };
        case "call":
            var modifiedParams = e.arguments.map(a => {
                return optimizeValue(a, env);
            });
            return { ...e, arguments: modifiedParams };
        case "alloc":
            var amount = optimizeValue(e.amount, env);
            return { ...e, amount: amount };
        case "load":
            var start = optimizeValue(e.start, env);
            var offset = optimizeValue(e.offset, env);
            return { ...e, start: start, offset: offset };
        default:
            return e;
    }
}

export function optimizeStatements(stmt: Stmt<any>, env: copyEnv): Stmt<any> {
    switch (stmt.tag) {
        case "assign":
            var optimizedExpression: Expr<any> = optimizeExpression(stmt.value, env);
            if (optimizedExpression.tag !== "value") {
                env.copyVars.set(stmt.name, { tag: "nac" });
            }
            return { ...stmt, value: optimizedExpression };
        case "return":
            var optimizedValue: Value<any> = optimizeValue(stmt.value, env);
            return { ...stmt, value: optimizedValue };
        case "expr":
            var optimizedExpression: Expr<any> = optimizeExpression(stmt.expr, env);
            return { ...stmt, expr: optimizedExpression };
        case "pass":
        case "ifjmp":
        case "jmp":
        case "store":
            return stmt;
        default:
            return stmt;
    }
}

function computeInitEnv(varDefs: Array<VarInit<any>>, dummyEnv: boolean): Env {
    var env: copyEnv = new copyEnv(new Map<string, copyVal>());
    varDefs.forEach(def => {
        if (!dummyEnv) env.copyVars.set(def.name, { tag: "copyId", value: { tag: "id", name: def.name }, reverse: [] })
        else env.copyVars.set(def.name, { tag: "undef" });
    });
    return env;
}

function optimizeBlock(block: BasicBlock<any>, env: copyEnv): [BasicBlock<any>, boolean] {
    var blockOptimized: boolean = false;
    var newStmts: Stmt<any>[] = block.stmts.map(s => {
        var optimizedstatement = optimizeStatements(s, env);
        if (!blockOptimized && !checkStmtEquality(optimizedstatement, s)) {
            blockOptimized = true;
        }
        return optimizedstatement;
    });
    return [{ ...block, stmts: newStmts }, blockOptimized];
}

export function optimizeFunction(func: FunDef<any>): FunDef<any> {
    if (func.body.length === 0) return func;
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentFunctions(func, computeInitEnv);

    var functionOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = func.body.map(b => {
        var tempBlockEnv: copyEnv = duplicateEnv(inEnvMapping.get(b.label)) as copyEnv;
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!functionOptimized && blockOptimized) functionOptimized = true;
        return optimizedBlock;
    });

    /* NOTE(joe): taking out all recursive optimization because there is no easy
     * way to add fallthrough cases above */
    if (functionOptimized) return optimizeFunction({ ...func, body: newBody })

    return { ...func, body: newBody };
}

export function copyPropagateProgramBody(program: Program<any>): [Program<any>, boolean] {
    if (program.body.length == 0) return [program, false];
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentProgram(program, computeInitEnv);

    //Write code to optimize the program using the environment
    var programOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = program.body.map(b => {
        var tempBlockEnv: copyEnv = duplicateEnv(inEnvMapping.get(b.label)) as copyEnv;
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!programOptimized && blockOptimized) programOptimized = true;
        return optimizedBlock;
    });
    return [{ ...program, body: newBody }, programOptimized]
}

export function copyPropagateProgramFuns(func: FunDef<any>): [FunDef<any>, boolean] {
    if (func.body.length === 0) return [func, false];
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentFunctions(func, computeInitEnv);

    var functionOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = func.body.map(b => {
        var tempBlockEnv: copyEnv = duplicateEnv(inEnvMapping.get(b.label)) as copyEnv;
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!functionOptimized && blockOptimized) functionOptimized = true;
        return optimizedBlock;
    });

    return [{ ...func, body: newBody }, functionOptimized];
}
