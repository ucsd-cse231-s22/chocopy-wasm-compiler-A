import { BinOp, Parameter, Type, UniOp} from "./ast";
import { Stmt, Expr, Value, VarInit, BasicBlock, Program, FunDef, Class } from "./ir";

import { isTagBoolean, isTagNone, isTagId, isTagBigInt, isTagEqual, checkValueEquality, checkCompileValEquality, checkStmtEquality } from "./optimization_utils"; 

type Env = {
    vars: Map<string, compileVal>;
}

export type compileVal = {
    tag: "nac"|"val"|"undef", value?: Value<any>;
}

export function optimizeValue(val: Value<any>, env: Env): Value<any>{
    if (val.tag !== "id"){
        return val;
    }
    if (env.vars.has(val.name)){
        if (["nac", "undef"].includes(env.vars.get(val.name).tag))
            return val;
        val = env.vars.get(val.name).value;
    }
    return val;
}

export function checkIfFoldableBinOp(op: BinOp, leftVal: Value<any>, rightVal: Value<any>): boolean {
    if ([BinOp.IDiv, BinOp.Mod].includes(op)){
        if (!isTagBigInt(leftVal) || !isTagBigInt(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        if (rightVal.value === 0n) return false;
    }
    return true;
}

export function evaluateBinOp(op: BinOp, leftVal: Value<any>, rightVal: Value<any>): Value<any>{
    if([BinOp.Plus, BinOp.Minus,BinOp.IDiv,BinOp.Mul, BinOp.Gt, BinOp.Lt, BinOp.Gte, BinOp.Lte, BinOp.Mod].includes(op)){
        if(!isTagBigInt(leftVal) || !isTagBigInt(rightVal))
            throw new Error("Compiler Error: Function should be invoked only if the expression can be folded");
        
        switch(op){
            case BinOp.Plus: return {tag: "num", value: leftVal.value + rightVal.value};
            
            case BinOp.Minus: return {tag: "num", value: leftVal.value - rightVal.value}
            
            case BinOp.Mul: return {tag: "num", value: leftVal.value * rightVal.value}

            case BinOp.IDiv: {
                return {tag: "num", value: leftVal.value / rightVal.value}
            }
            
            case BinOp.Mod: {
                return {tag: "num", value: leftVal.value % rightVal.value}
            }
            
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
            if (left.tag === "id" || right.tag === "id" || !checkIfFoldableBinOp(e.op, left, right))
                return {...e, left: left, right: right};
            var val: Value<any> = evaluateBinOp(e.op, left, right);
            return {tag: "value", value: val};
        case "uniop":
            var arg = optimizeValue(e.expr, env);
            if (arg.tag === "id")
                return {...e, expr: arg};
            var val: Value<any> = evaluateUniOp(e.op, arg);
            return {tag: "value", value: val};
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
    }
}

export function optimizeStatements(stmt: Stmt<any>, env: Env): Stmt<any>{
    switch(stmt.tag){
        case "assign":
            var optimizedExpression: Expr<any> = optimizeExpression(stmt.value, env);
            if (optimizedExpression.tag === "value"){
                if (optimizedExpression.value.tag === "id"){
                    env.vars.set(stmt.name, {tag: "nac"});
                }
                else{
                    env.vars.set(stmt.name, {tag: "val", value: optimizedExpression.value});
                }
            }
            else{
                env.vars.set(stmt.name, {tag: "nac"});
            }
            return {...stmt, value: optimizedExpression};
        case "return":
            var optimizedValue: Value<any> = optimizeValue(stmt.value, env);
            return {...stmt, value: optimizedValue};
        case "expr":
            var optimizedExpression: Expr<any> = optimizeExpression(stmt.expr, env);
            return {...stmt, expr: optimizedExpression};
        case "pass":
            return stmt;
        case "ifjmp":
            var optimizedValue: Value<any> = optimizeValue(stmt.cond, env);
            return {...stmt, cond: optimizedValue};
        case "jmp":
            return stmt;
        case "store":
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

function computeInitEnv(varDefs: Array<VarInit<any>>, dummyEnv: boolean): Env{
    var env: Env = {vars: new Map<string, compileVal>()};
    varDefs.forEach(def => {
        if (!dummyEnv)
            env.vars.set(def.name, {tag: "val", value: def.value});
        else
            env.vars.set(def.name, {tag: "undef"});
    });
    return env;
}

function mergeEnvironment(a: Env, b: Env): Env{
    var returnEnv: Env = {vars: new Map<string, compileVal>()};

    a.vars.forEach((aValue: compileVal, key: string) => {
        const bValue: compileVal = b.vars.get(key);
        if (bValue.tag === "nac" || aValue.tag === "nac")
            returnEnv.vars.set(key, {tag: "nac"});
        else if (aValue.tag === "undef" && bValue.tag === "undef"){
            returnEnv.vars.set(key, {tag: "undef"})
        }
        else if (aValue.tag === "undef"){
            returnEnv.vars.set(key, {tag: "val", value: bValue.value})
        }
        else if (bValue.tag === "undef"){
            returnEnv.vars.set(key, {tag: "val", value: aValue.value});
        }
        else if (checkValueEquality(aValue.value, bValue.value))
            returnEnv.vars.set(key, {tag: "val", value: aValue.value});
        else
            returnEnv.vars.set(key, {tag: "nac"});
    });

    return returnEnv;
}

function updateEnvironmentByBlock(inEnv: Env, block: BasicBlock<any>): Env{
    var outEnv: Env = {vars: new Map(inEnv.vars)};
    block.stmts.forEach(statement => {
        if (statement.tag === "assign"){
            const optimizedExpression = optimizeExpression(statement.value, outEnv);
            if (optimizedExpression.tag === "value"){
                if (optimizedExpression.value.tag === "id"){
                    outEnv.vars.set(statement.name, {tag: "nac"});
                }
                else{
                    outEnv.vars.set(statement.name, {tag: "val", value: optimizedExpression.value});
                }
            }
            else{
                outEnv.vars.set(statement.name, {tag: "nac"});
            }
        }
    });
    return outEnv;
}

function duplicateEnv(env: Env): Env{
    return {vars: new Map(env.vars)};
}

function addParamsToEnv(params: Array<Parameter<any>>, env: Env, dummyEnv: boolean){
    params.forEach(p => {
        if (dummyEnv){
            env.vars.set(p.name, {tag: "undef"});
        }
        else{
            env.vars.set(p.name, {tag: "nac"});
        }
    });
}

function optimizeBlock(block: BasicBlock<any>, env: Env): [BasicBlock<any>, boolean]{
    var blockOptimized: boolean = false;
    var newStmts: Stmt<any>[] = block.stmts.map(s => {
        var optimizedstatement = optimizeStatements(s, env);
        if (!blockOptimized && !checkStmtEquality(optimizedstatement, s)) blockOptimized = true;
        return optimizedstatement;
    });
    return [{...block, stmts: newStmts}, blockOptimized];
}

export function optimizeFunction(func: FunDef<any>): FunDef<any>{
    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentFunctions(func);

    var functionOptimized: boolean = false;
    //Write code to optimize functions here
    var newBody: Array<BasicBlock<any>> = func.body.map(b => {
        var tempBlockEnv: Env = duplicateEnv(inEnvMapping.get(b.label));
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!functionOptimized && blockOptimized) functionOptimized = true;
        return optimizedBlock;
    });

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
    var initialEnv = computeInitEnv(program.inits, false);

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var dummyEnv = computeInitEnv(program.inits, true);

    program.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(dummyEnv));
        outEnvMapping.set(f.label, duplicateEnv(dummyEnv));
    });

    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(program.body);

    preds.set(program.body[0].label, ["VD"]);
    succs.set("VD", [program.body[0].label]);
    outEnvMapping.set("VD", initialEnv);

    generateEnvironments([program.body[0].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

export function generateEnvironmentFunctions(func: FunDef<any>): [Map<string, Env>, Map<string, Env>]{
    var initialEnv  = computeInitEnv(func.inits, false);
    addParamsToEnv(func.parameters, initialEnv, false);

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var dummyEnv = computeInitEnv(func.inits, true);
    addParamsToEnv(func.parameters, initialEnv, true);

    func.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(dummyEnv));
        outEnvMapping.set(f.label, duplicateEnv(dummyEnv));
    });

    inEnvMapping.set(func.body[0].label, initialEnv);

    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(func.body);

    preds.set(func.body[0].label, ["VD"]);
    succs.set("VD", [func.body[0].label]);
    outEnvMapping.set("VD", initialEnv);
    
    generateEnvironments([func.body[0].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

export function optimizeProgram(program: Program<any>): Program<any>{

    var [inEnvMapping, _outEnvMapping]: [Map<string, Env>, Map<string, Env>] = generateEnvironmentProgram(program);

    //Write code to optimize the program using the environment
    var programOptimized: boolean = false;
    var newBody: Array<BasicBlock<any>> = program.body.map(b => {
        var tempBlockEnv: Env = duplicateEnv(inEnvMapping.get(b.label));
        var [optimizedBlock, blockOptimized]: [BasicBlock<any>, boolean] = optimizeBlock(b, tempBlockEnv);
        if (!programOptimized && blockOptimized) programOptimized = true;
        return optimizedBlock;
    });
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
    
    const aVars = a.vars;
    const bVars = b.vars;

    for (const key of aVars.keys()){
        const aValue = aVars.get(key);
        const bValue = bVars.get(key);
        
        if (!checkCompileValEquality(aValue, bValue)) return false;
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
    
    const wlAddition: string[] = (succs.get(currBlock) === undefined)?([]):(succs.get(currBlock));
    generateEnvironments([...workList, ...wlAddition], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return;
}
