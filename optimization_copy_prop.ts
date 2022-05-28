import { stringify } from "querystring";
import { BinOp, Parameter, Type, UniOp} from "./ast";
import { Stmt, Expr, Value, VarInit, BasicBlock, Program, FunDef, Class } from "./ir";

import { isTagBoolean, isTagNone, isTagId, isTagBigInt, isTagEqual, checkValueEquality, checkCopyValEquality, checkStmtEquality } from "./optimization_utils"; 
import { BasicREPL } from "./repl";

type Env = {
    copyVars?: Map<string, copyVal>;
}

// export type compileVal = {
//     tag: "nac"|"val"|"undef", value?: Value<any>;
// }

export type copyVal = {
    tag: "nac"|"copyId"|"undef", forward ?: string, reverse?: string[];
}

const varDefEnvTag: string = "$$VD$$";


export function optimizeValue(val: Value<any>, env: Env): Value<any>{
    if (val.tag !== "id"){
        return val;
    }
    if (env.copyVars.has(val.name)){
        if (["nac", "undef"].includes(env.copyVars.get(val.name).tag))
            return val;
        
        val = { name: env.copyVars.get(val.name).forward, ...val };
    }
    return val;
}

export function evaluateBinOp(op: BinOp, leftVal: Value<any>, rightVal: Value<any>): Value<any>{
    if([BinOp.Plus, BinOp.Minus,BinOp.IDiv,BinOp.Mul, BinOp.Gt, BinOp.Lt, BinOp.Gte, BinOp.Lte, BinOp.Mod].includes(op)){
        if(!isTagBigInt(leftVal) || !isTagBigInt(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        
        switch(op){
            case BinOp.Plus: return {tag: "num", value: leftVal.value + rightVal.value};
            
            case BinOp.Minus: return {tag: "num", value: leftVal.value - rightVal.value}
            
            case BinOp.Mul: return {tag: "num", value: leftVal.value * rightVal.value}

            case BinOp.IDiv: return {tag: "num", value: leftVal.value / rightVal.value}
            
            case BinOp.Mod: return {tag: "num", value: leftVal.value % rightVal.value}
            
            case BinOp.Gt: return {tag: "bool", value: leftVal.value > rightVal.value}
            
            case BinOp.Lt: return {tag: "bool", value: leftVal.value < rightVal.value}
            
            case BinOp.Gte: return {tag: "bool", value: leftVal.value >= rightVal.value}
            
            case BinOp.Lte: return {tag: "bool", value: leftVal.value <= rightVal.value}
        }
    }
    else if([BinOp.And, BinOp.Or].includes(op)){
        if(!isTagBoolean(leftVal) || !isTagBoolean(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        
        switch(op){
            case BinOp.And: return {tag: "bool", value: leftVal.value && rightVal.value};

            case BinOp.Or: return {tag: "bool", value: leftVal.value || rightVal.value};
        }
    }
    else if([BinOp.Eq, BinOp.Neq].includes(op)){
        if(!isTagEqual(leftVal, rightVal) || isTagNone(leftVal) || isTagNone(rightVal) || isTagId(leftVal) || isTagId(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        switch(op){
            case BinOp.Eq: return {tag: "bool", value: leftVal.value === rightVal.value};

            case BinOp.Neq: return {tag: "bool", value: leftVal.value !== rightVal.value};

        }
    }
    else{
        //Is operator handler
        if (!isTagNone(leftVal) || !isTagNone(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        return {tag: "bool", value: true};
    }
}

export function evaluateUniOp(op: UniOp, val: Value<any>): Value<any>{
    switch(op){
        case UniOp.Neg:

            if (isTagId(val) || isTagNone(val) || isTagBoolean(val)) 
                throw new Error("Compiler Error");
            const minus1: bigint = -1n;
            return {tag: "num", value: minus1 as bigint * (val.value as bigint)};

        case UniOp.Not:

            if (!isTagBoolean(val)) 
                throw new Error("Compiler Error");
            
                return {tag: "bool", value: !(val.value)};
    }
}

export function optimizeExpression(e: Expr<Type>, env: Env): Expr<Type>{
    switch(e.tag) {
        case "value":
           var optimizedValue: Value<any> = optimizeValue(e.value, env);
           return {...e, value: optimizedValue};
        case "binop":
            var left = optimizeValue(e.left, env);
            var right = optimizeValue(e.right, env);

            return {tag: "value", left, right, ...e};
        case "uniop":
            var arg = optimizeValue(e.expr, env);
            if (arg.tag === "id")
                return {...e, expr: arg};
            return e;
 
        case "builtin1":
            var arg = optimizeValue(e.arg, env);
            return {...e, arg: arg};
        case "builtin2":
            var left = optimizeValue(e.left, env);
            var right = optimizeValue(e.right, env);
            return {...e, left:left, right: right};
        case "call":
            var modifiedParams = e.arguments.map(a => {
                return optimizeValue(a, env);
            });
            return {...e, arguments: modifiedParams};
        case "alloc":
            var amount = optimizeValue(e.amount, env);
            return {...e, amount: amount};
        case "load":
            var start = optimizeValue(e.start, env);
            var offset = optimizeValue(e.offset, env);
            return {...e, start: start, offset: offset};
        default:
            return e;
    }
}

export function optimizeStatements(stmt: Stmt<any>, env: Env): Stmt<any>{
    switch(stmt.tag){
        case "assign":
            var optimizedExpression: Expr<any> = optimizeExpression(stmt.value, env);
            if (optimizedExpression.tag !== "value"){
                env.copyVars.set(stmt.name, {tag: "nac"});
            }
            return {...stmt, value: optimizedExpression};
        case "return":
            var optimizedValue: Value<any> = optimizeValue(stmt.value, env);
            return {...stmt, value: optimizedValue};
        case "expr":
            var optimizedExpression: Expr<any> = optimizeExpression(stmt.expr, env);
            return {...stmt, expr: optimizedExpression};
        case "pass":
        case "ifjmp":
        case "jmp":
        case "store":
            return stmt;
        default:
            return stmt;
    }
}

//Assuming jumps if it occurs will occur at the last statement of the block
export function computePredecessorSuccessor(basicBlocks: Array<BasicBlock<any>>): [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>]{
    let succs: Map<string, string[]> = new Map<string, string[]>();
    let preds: Map<string, string[]> = new Map<string, string[]>();
    let blockMapping: Map<string, BasicBlock<any>> = new Map<string, BasicBlock<any>>();
    basicBlocks.forEach(basicBlock=>{
        blockMapping.set(basicBlock.label, basicBlock);
        const lastStmt = basicBlock.stmts[basicBlock.stmts.length-1];
        if(lastStmt !== undefined && lastStmt.tag === "ifjmp"){
            //Assigning successors
            if (succs.has(basicBlock.label) && !succs.get(basicBlock.label).includes(lastStmt.thn))
                succs.set(basicBlock.label, [...succs.get(basicBlock.label), lastStmt.thn]);
            else if (!succs.has(basicBlock.label))
                succs.set(basicBlock.label, [lastStmt.thn]);
            

            if (succs.has(basicBlock.label) && !succs.get(basicBlock.label).includes(lastStmt.els))
                succs.set(basicBlock.label, [...succs.get(basicBlock.label), lastStmt.els]);
            else if (!succs.has(basicBlock.label))
                succs.set(basicBlock.label, [lastStmt.els]);

            //Assigning predecessors
            if(preds.has(lastStmt.thn) && !preds.get(lastStmt.thn).includes(basicBlock.label))
                preds.set(lastStmt.thn, [...preds.get(lastStmt.thn), basicBlock.label]);
            else if (!preds.has(lastStmt.thn))
                preds.set(lastStmt.thn, [basicBlock.label]);

            if(preds.has(lastStmt.els) && !preds.get(lastStmt.els).includes(basicBlock.label))
                preds.set(lastStmt.els, [...preds.get(lastStmt.els), basicBlock.label]);
            else if (!preds.has(lastStmt.els))
                preds.set(lastStmt.els, [basicBlock.label]);
        }
        else if (lastStmt !== undefined && lastStmt.tag === "jmp"){
            //Assigning successors
            if (succs.has(basicBlock.label) && !succs.get(basicBlock.label).includes(lastStmt.lbl))
                succs.set(basicBlock.label, [...succs.get(basicBlock.label), lastStmt.lbl]);
            else if (!succs.has(basicBlock.label))
                succs.set(basicBlock.label, [lastStmt.lbl]);

            //Assigning predecessors
            if (preds.has(lastStmt.lbl) && !preds.get(lastStmt.lbl).includes(basicBlock.label))
                preds.set(lastStmt.lbl, [...preds.get(lastStmt.lbl), basicBlock.label]);
            else if (!preds.has(lastStmt.lbl))
                preds.set(lastStmt.lbl, [basicBlock.label]);
        }
    });
    return [preds, succs, blockMapping];

}

function computeInitEnv(varDefs: Array<VarInit<any>>): Env{
    var env: Env = {copyVars: new Map<string, copyVal>()};
    varDefs.forEach(def => {
        env.copyVars.set(def.name, {tag: "undef"});
    });
    return env;
}

function mergeEnvironment(a: Env, b: Env): Env{
    var returnEnv: Env = {copyVars: new Map<string, copyVal>()};

    a.copyVars.forEach((aValue: copyVal, key: string) => {
        const bValue: copyVal = b.copyVars.get(key);
        if (bValue.tag === "nac" || aValue.tag === "nac")
            returnEnv.copyVars.set(key, {tag: "nac"});
        else if (aValue.tag === "undef" && bValue.tag === "undef"){
            returnEnv.copyVars.set(key, {tag: "undef"})
        }
        else if (aValue.tag === "undef"){
            returnEnv.copyVars.set(key, {tag: "copyId", forward: bValue.forward, reverse: [...bValue.reverse, ...aValue.reverse]})
        }
        else if (bValue.tag === "undef"){
            returnEnv.copyVars.set(key, {tag: "copyId", forward: aValue.forward, reverse: [...aValue.reverse, ...bValue.reverse]});
        }
        else if (aValue.forward === bValue.forward)
            returnEnv.copyVars.set(key, {tag: "copyId", forward: aValue.forward, reverse: [...bValue.reverse, ...aValue.reverse]});
        else
            returnEnv.copyVars.set(key, {tag: "nac"});
    });

    return returnEnv;
}

function updateForwardsAndBackwards(stmt: Stmt<any>, env: Env): Env{
    // const forwards: Map<string, string> = new Map<string, string>();
    if(stmt.tag === "assign" && stmt.value.tag === "value" && isTagId(stmt.value.value)){
        const copyFrom = stmt.value.value.name;
        const copyTo = stmt.name;
        
        let backwards: string[] = [];
        const oldCopyFromEnv = env.copyVars.get(copyFrom);
        
        var oldBackwards = oldCopyFromEnv.reverse;
        backwards = [...oldBackwards, copyTo];

        env.copyVars.set(copyFrom, {tag: "copyId", reverse: backwards, ...oldCopyFromEnv});
        env.copyVars.set(copyTo, {tag: "copyId", forward: copyTo, reverse: []});
        
        return env;
    }
}

function updateEnvironmentByBlock(inEnv: Env, block: BasicBlock<any>): Env{
    var outEnv: Env = {copyVars: new Map(inEnv.copyVars)};
    block.stmts.forEach(statement => {
        if (statement === undefined) { console.log(block.stmts); }
        if (statement.tag === "assign"){
            const optimizedExpression = optimizeExpression(statement.value, outEnv);
            if (optimizedExpression.tag === "value"){
                if (optimizedExpression.value.tag === "id"){
                    // outEnv.vars.set(statement.name, {tag: "nac"});
                    outEnv = updateForwardsAndBackwards(statement, outEnv);
                }
                // else{
                //     outEnv.vars.set(statement.name, {tag: "val", value: optimizedExpression.value});
                // }
            }
            else{
                outEnv.copyVars.set(statement.name, {tag: "nac"});
            }
        }
    });
    return outEnv;
}

function duplicateEnv(env: Env): Env{
    return {copyVars: new Map(env.copyVars)};
}

function addParamsToEnv(params: Array<Parameter<any>>, env: Env, dummyEnv: boolean){
    params.forEach(p => {
        if (dummyEnv){
            env.copyVars.set(p.name, {tag: "undef"});
        }
        else{
            env.copyVars.set(p.name, {tag: "nac"});
        }
    });
}

function optimizeBlock(block: BasicBlock<any>, env: Env): [BasicBlock<any>, boolean]{
    var blockOptimized: boolean = false;
    var newStmts: Stmt<any>[] = block.stmts.map(s => {
        var optimizedstatement = optimizeStatements(s, env);
        if (!blockOptimized && !checkStmtEquality(optimizedstatement, s)) {
            blockOptimized = true;
        }
        return optimizedstatement;
    });
    return [{...block, stmts: newStmts}, blockOptimized];
}

export function optimizeFunction(func: FunDef<any>): FunDef<any>{
    if (func.body.length === 0) return func;
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentFunctions(func);

    var functionOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = func.body.map(b => {
        var tempBlockEnv: Env = duplicateEnv(inEnvMapping.get(b.label));
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!functionOptimized && blockOptimized) functionOptimized = true;
        return optimizedBlock;
    });

    /* NOTE(joe): taking out all recursive optimization because there is no easy
     * way to add fallthrough cases above */
    if (functionOptimized) return optimizeFunction({...func, body: newBody})

    return {...func, body: newBody};
}

export function optimizeClass(c: Class<any>): Class<any>{
    var optimizedMethods: Array<FunDef<any>> = c.methods.map(m => {
        return optimizeFunction(m);
    })
    return {...c, methods: optimizedMethods};
}

export function generateEnvironmentProgram(program: Program<any>): [Map<string, Env>, Map<string, Env>]{

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var initialEnv = computeInitEnv(program.inits);

    program.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(initialEnv));
        outEnvMapping.set(f.label, duplicateEnv(initialEnv));
    });

    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(program.body);

    preds.set(program.body[0].label, [varDefEnvTag]);
    succs.set(varDefEnvTag, [program.body[0].label]);
    outEnvMapping.set(varDefEnvTag, initialEnv);

    generateEnvironments([program.body[0].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

export function generateEnvironmentFunctions(func: FunDef<any>): [Map<string, Env>, Map<string, Env>]{
    var initialEnv  = computeInitEnv(func.inits);
    addParamsToEnv(func.parameters, initialEnv, false);

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var dummyEnv = computeInitEnv(func.inits);
    addParamsToEnv(func.parameters, initialEnv, true);

    func.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(dummyEnv));
        outEnvMapping.set(f.label, duplicateEnv(dummyEnv));
    });

    inEnvMapping.set(func.body[0].label, initialEnv);

    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(func.body);

    preds.set(func.body[0].label, [varDefEnvTag]);
    succs.set(varDefEnvTag, [func.body[0].label]);
    outEnvMapping.set(varDefEnvTag, initialEnv);
    
    generateEnvironments([func.body[0].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

export function optimizeProgram(program: Program<any>): Program<any>{
    if (program.body.length == 0) return program;
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentProgram(program);

    //Write code to optimize the program using the environment
    var programOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = program.body.map(b => {
        var tempBlockEnv: Env = duplicateEnv(inEnvMapping.get(b.label));
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!programOptimized && blockOptimized) programOptimized = true;
        return optimizedBlock;
    });
    /* NOTE(joe): turning this off; it (a) doesn't have fallthrough cases for new
     * expressions and (b) when I add fallthrough cases, it stack-overflows */
    if (programOptimized) program = optimizeProgram({...program, body: newBody});

    var newClass: Array<Class<any>> = program.classes.map(c => {
        return optimizeClass(c);
    });

    var newFunctions: Array<FunDef<any>> = program.funs.map(f => {
        return optimizeFunction(f);
    });

    return {...program, body: newBody, classes: newClass, funs: newFunctions};
}

function mergeAllPreds(predecessorBlocks: Array<string>, outEnvMapping: Map<string, Env>): Env{
    if (predecessorBlocks.length === 0){
        throw new Error(`CompileError: Block with predecessors`);
    }
    var inEnv: Env = outEnvMapping.get(predecessorBlocks[0]);
    
    predecessorBlocks.slice(1).forEach(b => {
        inEnv = mergeEnvironment(inEnv, outEnvMapping.get(b));
    });
    
    return inEnv;
}

function checkEnvEquality(a: Env, b: Env): boolean{
    
    const aVars = a.copyVars;
    const bVars = b.copyVars;

    for (const key of aVars.keys()){
        const aValue = aVars.get(key);
        const bValue = bVars.get(key);
        
        if (!checkCopyValEquality(aValue, bValue)) return false;
    }
    return true;
}

export function generateEnvironments(workList: Array<string>, inEnvMapping: Map<string, Env>, outEnvMapping: Map<string, Env>, preds: Map<string, string[]>, succs: Map<string, string[]>, blockMapping: Map<string, BasicBlock<any>>){
    if (workList.length === 0)
        return;
    const currBlock: string = workList.pop();
    const newInEnv: Env = mergeAllPreds(preds.get(currBlock), outEnvMapping);
    if (checkEnvEquality(inEnvMapping.get(currBlock), newInEnv)){
        generateEnvironments(workList, inEnvMapping, outEnvMapping, preds, succs, blockMapping);
        return;
    }
    inEnvMapping.set(currBlock, newInEnv);
    outEnvMapping.set(currBlock, updateEnvironmentByBlock(newInEnv, blockMapping.get(currBlock)));
    
    const wlAddition: string[] = (succs.get(currBlock) === undefined)?([]):(succs.get(currBlock).map(succBlock => {
        if (succBlock !== varDefEnvTag) return succBlock;
    }));

    generateEnvironments([...workList, ...wlAddition], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return;
}
