import { Class, FunDef, Program } from "./ir";
import { constantPropagateAndFoldProgramBody, constantPropagateAndFoldProgramFuns } from "./optimizations/optimizations_prop_fold";
import { OptimizationSwitch } from "./optimizations/optimization_common";
import { copyPropagateProgramBody, copyPropagateProgramFuns } from "./optimizations/optimization_copy_prop";
import { livenessProgramBody, livenessProgramFuns } from "./optimizations/optimization_deadcode";


function optimizeFunction(func: FunDef<any>, optimizationSwitch: OptimizationSwitch): FunDef<any> {
    var [funDef, functionOptimized] = constantPropagateAndFoldProgramFuns(func);
    [funDef, functionOptimized] = optimizationSwitch === "2" ? copyPropagateProgramFuns(func) : [funDef, false];
    // [funDef, functionOptimized] = deadCodeProgramFuns(func);
    [funDef, functionOptimized] = optimizationSwitch === "4" ? livenessProgramFuns(func) : [funDef, false];
    if (functionOptimized) return optimizeFunction(funDef, optimizationSwitch);
    return funDef;
}

function optimizeClass(c: Class<any>, optimizationSwitch: OptimizationSwitch): Class<any> {
    var optimizedMethods: Array<FunDef<any>> = c.methods.map(m => {
        return optimizeFunction(m, optimizationSwitch);
    })
    return { ...c, methods: optimizedMethods };
}

export function optimizeProgram(program: Program<any>, optimizationSwitch: OptimizationSwitch): Program<any> {
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

function optimizeProgramBody(program: Program<any>, optimizationSwitch: OptimizationSwitch): Program<any> {
    if (program.body.length == 0) return program;
    var [program, programOptimized]: [Program<any>, boolean] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramBody(program) : [program, false];
    var programOptimizedFromCopy: boolean = false;
    [program, programOptimizedFromCopy] = optimizationSwitch === "2" ? copyPropagateProgramBody(program) : [program, false];
    // // [program, programOptimized] = eliminateDeadCodeProgram(program);
    var programOpimizedFromDeadElim: boolean = false;
    [program, programOpimizedFromDeadElim] = optimizationSwitch === "4" ? livenessProgramBody(program) : [program, false];

    if (programOptimized || programOptimizedFromCopy) program = optimizeProgramBody(program, optimizationSwitch);

    return program;
}
