import { Type } from "../ast";
import { BasicBlock, Expr, FunDef, Program, Stmt, Value, VarInit } from "../ir";
import { computePredecessorSuccessor } from "./optimization_common";
import { checkCopyValEquality, checkStmtEquality, duplicateEnv, isTagId } from "./optimization_utils";

const varDefEnvTag: string = "$$VD$$";

function eliminateUselessVariables(program: Program<any>): Program<any> {
    return program;
}

function eliminateIfJmp(stmt: Stmt<any>,
    block: string,
    preds: string[], 
    blockMapping: Map<string, BasicBlock<any>>){
    
    if(stmt.tag!=="ifjmp" || stmt.cond.tag!=="bool")
        throw new Error("Compiler Error!")
    
    var truthBlock : string;
    var deadBlock : string;
    
    if(stmt.cond.value===true){
        truthBlock = stmt.thn;
        deadBlock = stmt.els;
    }
    else{
        truthBlock = stmt.els;
        deadBlock = stmt.thn;
    }
    
    preds.forEach((pred) => {
        var predBlock = blockMapping.get(pred);
        predBlock.stmts[predBlock.stmts.length - 1] = {
            tag: "jmp",
            lbl: truthBlock
        };
        blockMapping.set(pred, predBlock);
    });
}

function eliminateBlockUnreachableCode(block: BasicBlock<any>,
    preds: Map<string, string[]>, 
    blockMapping: Map<string, BasicBlock<any>>){
    
    var returnIndex: number = block.stmts.length - 1;
    var numStmts = block.stmts.length;
    var index : number = 0;
    while(index<numStmts){
        var returnStmt = false;
        const stmt = block.stmts[index];
        switch(stmt.tag){
            case "ifjmp":
                if(stmt.cond.tag!=="bool")
                    return stmt;
                eliminateIfJmp(stmt, block.label, preds.get(block.label), blockMapping);
            break;
            case "return":
                returnIndex = index;
                returnStmt = true;
            break;
        }
        if(returnStmt){
            if(index < numStmts-1){
                block.stmts = block.stmts.slice(0, index+1);
            }
            break;
        }
        index += 1;
    }
    return block;
}

function getReachableBlocks(body: BasicBlock<any>[],
    blockMapping: Map<string, BasicBlock<any>>) : BasicBlock<any>[]{
    const reachableBlocks : BasicBlock<any>[] = [];
    const endBlock = body[body.length - 1];
    var blockQueue : BasicBlock<any>[] = [blockMapping.get(varDefEnvTag)];
    var visitedBlocks : Map<string, boolean> = new Map();
    visitedBlocks.set(varDefEnvTag, true);
    while(blockQueue.length>0){
        const currBlock = blockQueue[0];
        blockQueue = blockQueue.slice(1, blockQueue.length);
        
        if(currBlock.label===endBlock.label)
            continue;
        visitedBlocks.set(currBlock.label, true)
        const lastStmt = currBlock.stmts[currBlock.stmts.length - 1];
        if(lastStmt.tag==="ifjmp"){
            if(!visitedBlocks.has(lastStmt.thn)){
                reachableBlocks.push(blockMapping.get(lastStmt.thn));
                blockQueue.push(blockMapping.get(lastStmt.thn));
            }
            if(!visitedBlocks.has(lastStmt.els)){
                reachableBlocks.push(blockMapping.get(lastStmt.els));
                blockQueue.push(blockMapping.get(lastStmt.els));
            }
        }
        else if(lastStmt.tag==="jmp"){
            if(!visitedBlocks.has(lastStmt.lbl)){
                reachableBlocks.push(blockMapping.get(lastStmt.lbl));
                blockQueue.push(blockMapping.get(lastStmt.lbl));
            }
        }
        else if(lastStmt.tag!=="return"){
            throw new Error("Compiler Error: Last stmt is not a jump stmt");
        }
    }
    return reachableBlocks;
}


function eliminateUnreachableCode(body: BasicBlock<any>[],
    preds: Map<string, string[]>, 
    succs: Map<string, string[]>, 
    blockMapping: Map<string, BasicBlock<any>>) : BasicBlock<any>[] {
    
    body.map((block) => {
        const eliminatedBlock = eliminateBlockUnreachableCode(block, preds, blockMapping);
        return eliminatedBlock;
    });
    body = getReachableBlocks(body, blockMapping);
    return body;
}

export function eliminateDeadCodeFunc(func: FunDef<any>): [FunDef<any>, boolean] {
    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(func.body);
    preds.set(func.body[0].label, [varDefEnvTag]);
    blockMapping.set(varDefEnvTag, {
        label: varDefEnvTag,
        stmts: [{
            tag:"jmp",
            lbl: func.body[0].label
        }]
    });
    succs.set(varDefEnvTag, [func.body[0].label]);

    const preOptimizedBody = func.body;
    func.body = eliminateUnreachableCode(func.body, preds, succs, blockMapping);

    return [func, checkIfBodyChanged(preOptimizedBody, func.body)];
}

function checkIfBodyChanged(preOptimizedBody: BasicBlock<any>[], optimizedBody: BasicBlock<any>[]): boolean {
    var preOptimizedBodyStmtCount = 0;
    var optimizedBodyStmtCount = 0;

    preOptimizedBody.forEach(block => {
        preOptimizedBodyStmtCount += block.stmts.length;
    })

    optimizedBody.forEach(block => {
        optimizedBodyStmtCount += block.stmts.length;
    })

    return preOptimizedBodyStmtCount < optimizedBodyStmtCount;

}

export function eliminateDeadCodeProgram(program: Program<any>): [Program<any>, boolean] {
    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(program.body);
    preds.set(program.body[0].label, [varDefEnvTag]);
    blockMapping.set(varDefEnvTag, {
        label: varDefEnvTag,
        stmts: [{
            tag:"jmp",
            lbl: program.body[0].label
        }]
    });
    succs.set(varDefEnvTag, [program.body[0].label]);
    
    // program = eliminateUselessVariables(program);
    const preOptimizedBody = program.body;
    program.body = eliminateUnreachableCode(program.body, preds, succs, blockMapping);

    return [program, checkIfBodyChanged(preOptimizedBody, program.body)];
}
