import { Class, FunDef, Program } from "./ir";
import { constantPropagateAndFoldProgramBody, constantPropagateAndFoldProgramFuns } from "./optimizations/optimizations_prop_fold";
import { OptimizationSwitch } from "./optimizations/optimization_common";
import { copyPropagateProgramBody, copyPropagateProgramFuns } from "./optimizations/optimization_copy_prop";
import { eliminateDeadCodeFunc, eliminateDeadCodeProgram } from "./optimizations/optimization_DCE";
import { livenessProgramBody, livenessProgramFuns } from "./optimizations/optimization_deadcode";


function optimizeFunction(program: FunDef<any>, optimizationSwitch: OptimizationSwitch): FunDef<any> {
    if (program.body.length == 0) return program;
    
    var [optimizedProgramMain, programOptimizedConstantProp, programOptimizedFromCopy, programOptimizedFromDCE, programOptimizedLiveness]: [boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false];
    
    do{
        [program, programOptimizedConstantProp] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramFuns(program) : [program, false];
        if (programOptimizedConstantProp) optimizedProgramMain = true;
    }while(programOptimizedConstantProp)

    do{
        [program, programOptimizedFromCopy] = optimizationSwitch >= "2" ? copyPropagateProgramFuns(program) : [program, false];
        if (programOptimizedFromCopy) optimizedProgramMain = true;
    }while(programOptimizedFromCopy)

    do{
        [program, programOptimizedFromDCE] = optimizationSwitch >= "4" ? eliminateDeadCodeFunc(program) : [program, false];
        if (programOptimizedFromDCE) optimizedProgramMain = true;
    }while(programOptimizedFromDCE)

    do{
        [program, programOptimizedLiveness] = optimizationSwitch >= "3" ? livenessProgramFuns(program) : [program, false];
        if (programOptimizedLiveness) optimizedProgramMain = true;
    }while(programOptimizedLiveness)

    // var [program, programOptimizedConstantProp]: [Program<any>, boolean] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramBody(program) : [program, false];
    // if (programOptimizedConstantProp){ [] = constantPropagateAndFoldProgramBody()}
    
    // var programOptimizedFromCopy: boolean = false;
    // [program, programOptimizedFromCopy] = optimizationSwitch >= "2" ? copyPropagateProgramBody(program) : [program, false];
    // var programOptimizedFromDCE: boolean = false;
    // [program, programOptimizedFromDCE] = optimizationSwitch >= "3" ? eliminateDeadCodeProgram(program) : [program, false];
    // var programOpimizedFromDeadElim: boolean = false;
    // [program, programOpimizedFromDeadElim] = optimizationSwitch >= "4" ? livenessProgramBody(program) : [program, false];

    if (optimizedProgramMain) program = optimizeFunction(program, optimizationSwitch);

    return program;
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
    
    var [optimizedProgramMain, programOptimizedConstantProp, programOptimizedFromCopy, programOptimizedFromDCE, programOptimizedLiveness]: [boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false];
    
    do{
        [program, programOptimizedConstantProp] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramBody(program) : [program, false];
        if (programOptimizedConstantProp) optimizedProgramMain = true;
    }while(programOptimizedConstantProp)

    do{
        [program, programOptimizedFromCopy] = optimizationSwitch >= "2" ? copyPropagateProgramBody(program) : [program, false];
        if (programOptimizedFromCopy) optimizedProgramMain = true;
    }while(programOptimizedFromCopy)

    do{
        [program, programOptimizedFromDCE] = optimizationSwitch >= "4" ? eliminateDeadCodeProgram(program) : [program, false];
        if (programOptimizedFromDCE) optimizedProgramMain = true;
    }while(programOptimizedFromDCE)

    do{
        [program, programOptimizedLiveness] = optimizationSwitch >= "3" ? livenessProgramBody(program) : [program, false];
        if (programOptimizedLiveness) optimizedProgramMain = true;
    }while(programOptimizedLiveness)

    // var [program, programOptimizedConstantProp]: [Program<any>, boolean] = optimizationSwitch >= "1" ? constantPropagateAndFoldProgramBody(program) : [program, false];
    // if (programOptimizedConstantProp){ [] = constantPropagateAndFoldProgramBody()}
    
    // var programOptimizedFromCopy: boolean = false;
    // [program, programOptimizedFromCopy] = optimizationSwitch >= "2" ? copyPropagateProgramBody(program) : [program, false];
    // var programOptimizedFromDCE: boolean = false;
    // [program, programOptimizedFromDCE] = optimizationSwitch >= "3" ? eliminateDeadCodeProgram(program) : [program, false];
    // var programOpimizedFromDeadElim: boolean = false;
    // [program, programOpimizedFromDeadElim] = optimizationSwitch >= "4" ? livenessProgramBody(program) : [program, false];

    if (optimizedProgramMain) program = optimizeProgramBody(program, optimizationSwitch);

    return program;
}

