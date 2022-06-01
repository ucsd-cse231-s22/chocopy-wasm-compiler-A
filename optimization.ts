import { Class, FunDef, Program } from "./ir";
import { constantPropagateAndFoldProgramBody, constantPropagateAndFoldProgramFuns } from "./optimizations/optimizations_prop_fold";
import { OptimizationSwitch } from "./optimizations/optimization_common";
import { copyPropagateProgramBody, copyPropagateProgramFuns } from "./optimizations/optimization_copy_prop";
import { eliminateDeadCodeFunc, eliminateDeadCodeProgram } from "./optimizations/optimization_DCE";
import { livenessProgramBody, livenessProgramFuns } from "./optimizations/optimization_deadcode";


function optimizeFunction(func: FunDef<any>, optimizationSwitch: OptimizationSwitch): FunDef<any> {
    if (func.body.length == 0) return func;
    var [func, funcOptimized]: [FunDef<any>, boolean] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramFuns(func) : [func, false];
    var funcOptimizedFromCopy: boolean = false;
    [func, funcOptimizedFromCopy] = optimizationSwitch >= "2" ? copyPropagateProgramFuns(func) : [func, false];
    var funcOptimizedFromDCE: boolean = false;
    [func, funcOptimizedFromDCE] = optimizationSwitch >= "3" ? eliminateDeadCodeFunc(func) : [func, false];

    var functionOptimizedFromLiveness: boolean = false;
    [func, functionOptimizedFromLiveness] = optimizationSwitch === "4" ? livenessProgramFuns(func) : [func, false];

    if (funcOptimized || funcOptimizedFromCopy || funcOptimizedFromDCE || functionOptimizedFromLiveness) func = optimizeFunction(func, optimizationSwitch);

    return func;
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
    var [program, programOptimized]: [Program<any>, boolean] = optimizationSwitch >= "5" ? constantPropagateAndFoldProgramBody(program) : [program, false];
    var programOptimizedFromCopy: boolean = false;
    [program, programOptimizedFromCopy] = optimizationSwitch >= "5" ? copyPropagateProgramBody(program) : [program, false];
    var programOptimizedFromDCE: boolean = false;
    [program, programOptimizedFromDCE] = optimizationSwitch >= "5" ? eliminateDeadCodeProgram(program) : [program, false];
    var programOpimizedFromDeadElim: boolean = false;
    [program, programOpimizedFromDeadElim] = optimizationSwitch === "4" ? livenessProgramBody(program) : [program, false];

    if (programOptimized || programOptimizedFromCopy || programOptimizedFromDCE || programOpimizedFromDeadElim) program = optimizeProgramBody(program, optimizationSwitch);

    return program;
}
