import { Parameter, Type } from "../ast";
import { BasicBlock, Expr, FunDef, Program, Stmt, Value, VarInit } from "../ir";
import { generateEnvironmentFunctions, generateEnvironmentFunctionsForLiveness, generateEnvironmentProgram, generateEnvironmentProgramForLiveness } from "./optimization_common";
import { Env } from "./optimization_common";
import { checkCopyValEquality, checkLiveValEquality, checkStmtEquality, duplicateEnv, isTagId } from "./optimization_utils";


export type val = {
    tag: "alive" | "dead" | "undef", name: string;
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

    checkEqual(b: liveEnv): boolean {
        const aVars = this.vars;
        const bVars = b.vars;

        for (const key of aVars.keys()) {
            const aValue = aVars.get(key);
            const bValue = bVars.get(key);

            if (!checkLiveValEquality(aValue, bValue)) return false;
        }
        return true;
    }

    updateEnvironmentByBlock(block: BasicBlock<any>): liveEnv {
        var outEnv: liveEnv = new liveEnv(new Map(this.vars));
        block.stmts.reverse().forEach(statement => {
            if (statement === undefined) { console.log(block.stmts); }
            switch(statement.tag){
                case "assign" :
                    const expression = statement.value;
                    outEnv.updateLiveVariables(statement, expression);
                    break;

                case "return":
                    if(statement.value.tag === "id"){
                        outEnv.set(statement.value.name, {tag:"alive", name: statement.value.name});
                    }
                    break;

                case "expr":
                    outEnv.updateLiveVariables(statement, statement.expr);
                    break;

                case "ifjmp":
                    if(statement.cond.tag === "id"){
                        outEnv.set(statement.cond.name, {tag:"alive", name: statement.cond.name});
                    }
                    break;

                case "store":
                    if(statement.start.tag === "id"){
                        outEnv.set(statement.start.name, {tag:"alive", name: statement.start.name});
                    }
                    if(statement.offset.tag === "id"){
                        outEnv.set(statement.offset.name, {tag:"alive", name: statement.offset.name});
                    }
                    if(statement.value.tag === "id"){
                        outEnv.set(statement.value.name, {tag:"alive", name: statement.value.name});
                    }
                    break;     
            }
            
        });
        return outEnv;
    }

    updateLiveVariables(stmt: Stmt<any>, e: Expr<any>){
        switch(e.tag) {
            case "value":
                if(isTagId(e.value)){
                    this.set(e.value.name, {tag:"alive", name: e.value.name}); 
                }
                break;
            case "binop":
                if(isTagId(e.left)){
                    this.set(e.left.name, {tag:"alive", name: e.left.name});
                }
                if(isTagId(e.right)){
                    this.set(e.right.name, {tag:"alive", name: e.right.name});
                }
                break;
            case "uniop":
                if(isTagId(e.expr)){
                    this.set(e.expr.name, {tag:"alive", name: e.expr.name});
                }
                break;
            case "builtin1":
                if(isTagId(e.arg)){
                    this.set(e.arg.name, {tag:"alive", name: e.arg.name});
                }
                break;
            case "builtin2":
                if(isTagId(e.left)){
                    this.set(e.left.name, {tag:"alive", name: e.left.name});
                }
                if(isTagId(e.right)){
                    this.set(e.right.name, {tag:"alive", name: e.right.name});
                }
                break;
            case "call" || "call_indirect":
                e.arguments.forEach(v =>{
                    if(isTagId(v)){
                        this.set(v.name, {tag:"alive", name: v.name});
                    }
                });
                break;
            case "alloc":
                if(isTagId(e.amount)){
                    this.set(e.amount.name, {tag:"alive", name: e.amount.name});
                }
                break;
            case "load":
                if(isTagId(e.start)){
                    this.set(e.start.name, {tag:"alive", name: e.start.name});
                }
                if(isTagId(e.offset)){
                    this.set(e.offset.name, {tag:"alive", name: e.offset.name});
                }
                break;
        }
        if(stmt.tag === "assign")
            this.set(stmt.name, {tag:"dead", name: stmt.name});
    }

    mergeEnvironment(b: liveEnv): liveEnv {
        var returnEnv: liveEnv = new liveEnv(new Map<string, val>());
        this.vars.forEach((aValue: val, key: string) => {
            const bValue: val = b.vars.get(key);
            if (bValue.tag === "alive" || aValue.tag === "alive")
                returnEnv.set(key, { tag: "alive", name: key});
            else if (aValue.tag === "undef" && bValue.tag === "undef") {
                returnEnv.set(key, { tag: "undef", name: key })
            }
            else if (aValue.tag === "undef") {
                returnEnv.set(key, { tag: bValue.tag, name:key })
            }
            else if (bValue.tag === "undef") {
                returnEnv.set(key, { tag: aValue.tag, name: key });
            }
            else if (aValue.tag === bValue.tag)
                returnEnv.set(key, { tag: aValue.tag, name: key });
            // else
            //     returnEnv.set(key, { tag: "dead" });
        });
        return returnEnv;
    }
}

function computeInitEnv(varDefs: Array<VarInit<any>>, dummyEnv: boolean): Env {
    var env: liveEnv = new liveEnv(new Map<string, val>());
    varDefs.forEach(def => {
        if (!dummyEnv) env.set(def.name, { tag: "dead", name: def.name })
        else env.set(def.name, { tag: "undef", name: def.name });
    });
    return env;
}

function addParamsToLiveEnv(params: Array<Parameter<any>>, env: liveEnv, dummyEnv: boolean) {
    params.forEach(p => {
        if (dummyEnv) {
            env.set(p.name, { tag: "undef", name: p.name});
        }
        else {
            env.set(p.name, { tag: "dead", name: p.name });
        }
    });
}

function optimizeBlock(block: BasicBlock<any>, env: liveEnv): [BasicBlock<any>, boolean] {
    var blockOptimized: boolean = false;
    var newStmts: Stmt<any>[];
    block.stmts.reverse().forEach(s => {
        // var optimizedstatement = optimizeStatements(s, env);
        if(s.tag === "assign"){
            if(!env.has(s.name) || env.get(s.name).tag === "dead"){
                env.set(s.name, {tag: "dead", name: s.name});
                blockOptimized = true;
            }
            else{
                newStmts.push(s);
            }
            env.updateLiveVariables(s, s.value);
        }
    });
    return [{ ...block, stmts: newStmts }, blockOptimized];
}

export function livenessProgramBody(program: Program<any>): [Program<any>, boolean] {
    if (program.body.length == 0) return [program, false];
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentProgramForLiveness(program, computeInitEnv);

    //Write code to optimize the program using the environment
    var programOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = program.body.map(b => {
        var tempBlockEnv: liveEnv = duplicateEnv(inEnvMapping.get(b.label)) as liveEnv;
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!programOptimized && blockOptimized) programOptimized = true;
        return optimizedBlock;
    });
    return [{ ...program, body: newBody }, programOptimized]
}

export function livenessProgramFuns(func: FunDef<any>): [FunDef<any>, boolean] {
    if (func.body.length === 0) return [func, false];
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentFunctionsForLiveness(func, computeInitEnv, addParamsToLiveEnv);

    var functionOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = func.body.map(b => {
        var tempBlockEnv: liveEnv = duplicateEnv(inEnvMapping.get(b.label)) as liveEnv;
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!functionOptimized && blockOptimized) functionOptimized = true;
        return optimizedBlock;
    });

    return [{ ...func, body: newBody }, functionOptimized];
}
