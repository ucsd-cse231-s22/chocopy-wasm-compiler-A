import { BasicBlock, FunDef, Program } from "../ir";
import { duplicateEnv } from "./optimization_utils";


const varDefEnvTag: string = "$$VD$$";

export type OptimizationSwitch = "0" | "1" | "2" | "3" | "4"

export class Env {

    //General basic block environment class for dataflow analysis

    get(arg: any): any {
        // Get the value of arg from the Environment map
        return;
    }
    has(arg: any): any {
        // Check if the environment map has the arg
        return;
    }
    set(arg: any, value: any) {
        // Set the value of arg in the environment map
        return;
    }
    duplicateEnv(): Env {
        // Return a duplicate of the calling environment object
        return;
    }
    checkEqual(b: Env): boolean {
        // Check if calling environment object and arg are equal
        return;
    }
    updateEnvironmentByBlock(block: BasicBlock<any>): Env {
        // Return an updated environment
        return;
    }
    mergeEnvironment(b: Env): Env {
        // Return a new environment which merges the calling environment object and arg
        return;
    }

}

function workListAlgorithm(
    workList: Array<string>,
    inEnvMapping: Map<string, Env>,
    outEnvMapping: Map<string, Env>,
    preds: Map<string, string[]>,
    succs: Map<string, string[]>,
    blockMapping: Map<string, BasicBlock<any>>
) {
    if (workList.length === 0)
        return;
    const currBlock: string = workList.pop();
    const newInEnv: Env = mergeAllPreds(preds.get(currBlock), outEnvMapping);
    if (inEnvMapping.get(currBlock).checkEqual(newInEnv)) {
        workListAlgorithm(workList, inEnvMapping, outEnvMapping, preds, succs, blockMapping);
        return;
    }
    inEnvMapping.set(currBlock, newInEnv);
    outEnvMapping.set(currBlock, newInEnv.updateEnvironmentByBlock(blockMapping.get(currBlock)));

    const wlAddition: string[] = (succs.get(currBlock) === undefined) ? ([]) : (succs.get(currBlock).map(succBlock => {
        if (succBlock !== varDefEnvTag) return succBlock;
    }));

    workListAlgorithm([...workList, ...wlAddition], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return;
}

function mergeAllPreds(predecessorBlocks: Array<string>, outEnvMapping: Map<string, Env>): Env {
    if (predecessorBlocks.length === 0) {
        throw new Error(`CompileError: Block with predecessors`);
    }
    var inEnv: Env = outEnvMapping.get(predecessorBlocks[0]);

    predecessorBlocks.slice(1).forEach(b => {
        inEnv = inEnv.mergeEnvironment(outEnvMapping.get(b));
    });

    return inEnv;
}

export function generateEnvironmentFunctions(func: FunDef<any>, computeInitEnv: Function, addParamsToEnv: Function): [Map<string, Env>, Map<string, Env>] {
    var initialEnv = computeInitEnv(func.inits, false);
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

    preds.set(func.body[0].label, [varDefEnvTag]);
    succs.set(varDefEnvTag, [func.body[0].label]);
    outEnvMapping.set(varDefEnvTag, initialEnv);

    workListAlgorithm([func.body[0].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

//Assuming jumps if it occurs will occur at the last statement of the block
export function computePredecessorSuccessor(basicBlocks: Array<BasicBlock<any>>): [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] {
    let succs: Map<string, string[]> = new Map<string, string[]>();
    let preds: Map<string, string[]> = new Map<string, string[]>();
    let blockMapping: Map<string, BasicBlock<any>> = new Map<string, BasicBlock<any>>();
    basicBlocks.forEach(basicBlock => {
        blockMapping.set(basicBlock.label, basicBlock);
        const lastStmt = basicBlock.stmts[basicBlock.stmts.length - 1];
        if (lastStmt !== undefined && lastStmt.tag === "ifjmp") {
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
            if (preds.has(lastStmt.thn) && !preds.get(lastStmt.thn).includes(basicBlock.label))
                preds.set(lastStmt.thn, [...preds.get(lastStmt.thn), basicBlock.label]);
            else if (!preds.has(lastStmt.thn))
                preds.set(lastStmt.thn, [basicBlock.label]);

            if (preds.has(lastStmt.els) && !preds.get(lastStmt.els).includes(basicBlock.label))
                preds.set(lastStmt.els, [...preds.get(lastStmt.els), basicBlock.label]);
            else if (!preds.has(lastStmt.els))
                preds.set(lastStmt.els, [basicBlock.label]);
        }
        else if (lastStmt !== undefined && lastStmt.tag === "jmp") {
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

export function generateEnvironmentProgram(
    program: Program<any>,
    computeInitEnv: Function
): [Map<string, Env>, Map<string, Env>] {
    var initialEnv = computeInitEnv(program.inits, false);

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var dummyEnv = computeInitEnv(program.inits, true);

    program.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(dummyEnv));
        outEnvMapping.set(f.label, duplicateEnv(dummyEnv));
    });

    var [preds, succs, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(program.body);

    preds.set(program.body[0].label, [varDefEnvTag]);
    succs.set(varDefEnvTag, [program.body[0].label]);
    outEnvMapping.set(varDefEnvTag, initialEnv);

    workListAlgorithm([program.body[0].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

export function generateEnvironmentProgramForLiveness(
    program: Program<any>,
    computeInitEnv: Function
    ): [Map<string, Env>, Map<string, Env>] {
    // var initialEnv = computeInitEnv(program.inits, false);

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var dummyEnv = computeInitEnv(program.inits, true);

    program.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(dummyEnv));
        outEnvMapping.set(f.label, duplicateEnv(dummyEnv));
    });

    //Swapping predecessors and succesors
    var [succs, preds, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(program.body);

    const end = program.body.length - 1;
    preds.set(program.body[end].label, [varDefEnvTag]);
    succs.set(varDefEnvTag, [program.body[end].label]);
    outEnvMapping.set(varDefEnvTag, dummyEnv);

    workListAlgorithm([program.body[end].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}

export function generateEnvironmentFunctionsForLiveness(
    func: FunDef<any>, computeInitEnv: Function,
    addParamsToEnv: Function
    ): [Map<string, Env>, Map<string, Env>] {
    // var initialEnv = computeInitEnv(func.inits, false);
    // addParamsToEnv(func.parameters, initialEnv, false);

    var inEnvMapping: Map<string, Env> = new Map<string, Env>();
    var outEnvMapping: Map<string, Env> = new Map<string, Env>();

    var dummyEnv = computeInitEnv(func.inits, true);
    addParamsToEnv(func.parameters, dummyEnv, true);

    func.body.forEach(f => {
        inEnvMapping.set(f.label, duplicateEnv(dummyEnv));
        outEnvMapping.set(f.label, duplicateEnv(dummyEnv));
    });
    const end = func.body.length - 1;

    inEnvMapping.set(func.body[end].label, dummyEnv);

    var [succs, preds, blockMapping]: [Map<string, string[]>, Map<string, string[]>, Map<string, BasicBlock<any>>] = computePredecessorSuccessor(func.body);

    preds.set(func.body[end].label, [varDefEnvTag]);
    succs.set(varDefEnvTag, [func.body[end].label]);
    outEnvMapping.set(varDefEnvTag, dummyEnv);

    workListAlgorithm([func.body[end].label], inEnvMapping, outEnvMapping, preds, succs, blockMapping);

    return [inEnvMapping, outEnvMapping];
}
