import { Parameter } from "../ast";
import { BasicBlock, Class, FunDef, Program } from "../ir";
import { constantPropagateAndFoldProgramBody, constantPropagateAndFoldProgramFuns } from "./optimizations_prop_fold";
import { Env } from "./optimization_common_models";
import { copyPropagateProgramBody, copyPropagateProgramFuns } from "./optimization_copy_prop";
import { duplicateEnv } from "./optimization_utils";


const varDefEnvTag: string = "$$VD$$";

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

function addParamsToEnv(params: Array<Parameter<any>>, env: Env, dummyEnv: boolean) {
    params.forEach(p => {
        if (dummyEnv) {
            env.set(p.name, { tag: "undef" });
        }
        else {
            env.set(p.name, { tag: "nac" });
        }
    });
}

function optimizeFunction(func: FunDef<any>, optimizationSwitch: "1" | "2"): FunDef<any> {
    var [funDef, functionOptimized] = constantPropagateAndFoldProgramFuns(func);
    [funDef, functionOptimized] = optimizationSwitch === "2" ? copyPropagateProgramFuns(func) : [funDef, false];
    // [funDef, functionOptimized] = deadCodeProgramFuns(func);
    if (functionOptimized) return optimizeFunction(funDef, optimizationSwitch);
    return funDef;
}

function optimizeClass(c: Class<any>, optimizationSwitch: "1" | "2"): Class<any> {
    var optimizedMethods: Array<FunDef<any>> = c.methods.map(m => {
        return optimizeFunction(m, optimizationSwitch);
    })
    return { ...c, methods: optimizedMethods };
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

export function generateEnvironmentFunctions(func: FunDef<any>, computeInitEnv: Function): [Map<string, Env>, Map<string, Env>] {
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

export function optimizeProgram(program: Program<any>, optimizationSwitch: "0" | "1" | "2"): Program<any> {
    if (program.body.length == 0 || optimizationSwitch === "0") return program;

    var program = optimizeProgramBody(program, optimizationSwitch);

    var newClass: Array<Class<any>> = program.classes.map(c => {
        return optimizeClass(c, optimizationSwitch);
    });

    var newFunctions: Array<FunDef<any>> = program.funs.map(f => {
        return optimizeFunction(f, optimizationSwitch);
    });

    return { ...program, classes: newClass, funs: newFunctions };
}

function optimizeProgramBody(program: Program<any>, optimizationSwitch: "1" | "2"): Program<any> {
    if (program.body.length == 0) return program;
    var [program, programOptimized]: [Program<any>, boolean] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramBody(program) : [program, false];
    var programOptimizedFromCopy: boolean = false;
    [program, programOptimizedFromCopy] = optimizationSwitch === "2" ? copyPropagateProgramBody(program) : [program, false];
    // // [program, programOptimized] = eliminateDeadCodeProgram(program);
    if (programOptimized || programOptimizedFromCopy) program = optimizeProgramBody(program, optimizationSwitch);

    return program;
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