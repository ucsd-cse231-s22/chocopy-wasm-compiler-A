import { Parameter, Type } from "../ast";
import { BasicBlock, Expr, FunDef, Program, Stmt, Value, VarInit } from "../ir";
import { Env, generateEnvironmentFunctions, generateEnvironmentProgram } from "./optimization_common";
import { checkCopyValEquality, checkStmtEquality, duplicateEnv, isTagId } from "./optimization_utils";


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
                const currReverse = outEnv.has(statement.name) ? outEnv.get(statement.name).reverse : [];
                outEnv.updateForwardsAndBackwards(statement, optimizedExpression);
            }
        });
        return outEnv;
    }

    updateForwardsAndBackwards(stmt: Stmt<any>, optimizedExpression: Expr<any>) {
        if (stmt.tag === "assign") {
            const copyTo = stmt;
            this.copyVars.get(copyTo.name).reverse

            this.copyVars.get(copyTo.name).reverse.forEach((id) => {
                if (this.copyVars.has(id)) {
                    this.copyVars.set(id, { ...this.copyVars.get(id), tag: "copyId", value: { tag: "id", name: id } })
                }
            });

            if (stmt.value.tag === "value" && isTagId(stmt.value.value)) {
                const copyFrom = stmt.value.value.name;

                let backwards: string[] = [];
                const oldCopyFromEnv = this.copyVars.get(copyFrom);

                var oldBackwards = oldCopyFromEnv.reverse;
                backwards = [...oldBackwards, copyTo.name];

                this.copyVars.set(copyFrom, { ...oldCopyFromEnv, reverse: backwards });

                if (optimizedExpression.tag === "value" && isTagId(optimizedExpression.value))
                    this.copyVars.set(copyTo.name, { tag: "copyId", value: optimizedExpression.value, reverse: [] });
                else
                    this.copyVars.set(stmt.name, { tag: "copyId", value: { tag: "id", name: stmt.name }, reverse: [] });
            }
            else
                this.copyVars.set(stmt.name, { tag: "copyId", value: { tag: "id", name: stmt.name }, reverse: [] });
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
                returnEnv.copyVars.set(key, { tag: "copyId", value: bValue.value, reverse: [...bValue.reverse] })
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

        if (env.get(copyId.value.name).reverse.includes(val.name))
            val = { ...val, name: copyId.value.name };
        else
            return val;
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

            return { ...e, left, right };
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
                let newReverse: string[] = [];
                if (env.has(stmt.name))
                    newReverse = env.get(stmt.name).reverse

                env.set(stmt.name, { tag: "nac", reverse: newReverse });
            }
            env.updateForwardsAndBackwards(stmt, optimizedExpression);
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
        else env.copyVars.set(def.name, { tag: "undef", reverse: [] });
    });
    return env;
}

function addParamsToCopyEnv(params: Array<Parameter<any>>, env: copyEnv, dummyEnv: boolean) {
    params.forEach(p => {
        if (dummyEnv) {
            env.set(p.name, { tag: "undef", reverse: [] });
        }
        else {
            env.set(p.name, { tag: "copyId", value: { tag: "id", name: p.name }, reverse: [] });
        }
    });
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
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentFunctions(func, computeInitEnv, addParamsToCopyEnv);

    var functionOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = func.body.map(b => {
        var tempBlockEnv: copyEnv = duplicateEnv(inEnvMapping.get(b.label)) as copyEnv;
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!functionOptimized && blockOptimized) functionOptimized = true;
        return optimizedBlock;
    });

    return [{ ...func, body: newBody }, functionOptimized];
}
