import * as AST from './ast';
import * as IR from './ir';
import {flattenWasmInt} from './lower';

/****** Full line of src that contains an error ******/
export function fullSrcLine(SRC: string, fromLocIdx: number, fromLocCol: number, eolLocIdx: number) {
    const lineStart = fromLocIdx - fromLocCol + 1; // src and col has an offset of 1
    return SRC.slice(lineStart, eolLocIdx);
}

export function drawSquiggly(fromLocRow: number, endLocRow: number, fromLocCol: number, endLocCol: number) {
    return (fromLocRow === endLocRow) ? `${' '.repeat(fromLocCol - 1)}${'^'.repeat(endLocCol - fromLocCol)}` : '';
}

/****** Runtime Errors *******/
// TODO: make a register for errors so that we don't need to pass so many arguments at runtime
// TODO: refactor code to reduce repetition. Approaches: 1. Subclass Error. 2. Make a bunch of helper functions.
export function assert_not_none(arg: any, start_row: any, start_col: any, start_idx: any, end_row: any, end_col: any, end_idx: any, eol_idx: any) : any {
    if (arg === 0){
        const loc = ` on line ${start_row} at col ${start_col}`;
        const src = fullSrcLine(importObjectErrors.src, start_idx, start_col, eol_idx);
        const squiggly = drawSquiggly(start_row, end_row, start_col, end_col);
        const msg = `\n\n${src}\n${squiggly}`;
        throw new Error(`RUNTIME ERROR: cannot perform operation on none` + loc + msg);
    }
    return arg;
}

export function flattenAssertNotNone(oval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {

    const posArgs = [oval.a.fromLoc.row, oval.a.fromLoc.col, oval.a.fromLoc.srcIdx, oval.a.endLoc.row, oval.a.endLoc.col, oval.a.endLoc.srcIdx, oval.a.eolLoc.srcIdx].map(x => flattenWasmInt(x));
    return { tag: "expr", expr: { tag: "call", name: `assert_not_none`, arguments: [oval, ...posArgs]}}
}

export function divide_by_zero(arg: any, start_row: any, start_col: any, start_idx: any, end_row: any, end_col: any, end_idx: any, eol_idx: any) : any {
    if (arg === 0){
        const loc = ` on line ${start_row} at col ${start_col}`;
        const src = fullSrcLine(importObjectErrors.src, start_idx, start_col, eol_idx);
        const squiggly = drawSquiggly(start_row, end_row, start_col, end_col);
        const msg = `\n\n${src}\n${squiggly}`;
        throw new Error(`RUNTIME ERROR: cannot divide by zero` + loc + msg);
    }
    return arg;
}

export function flattenDivideByZero(oval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {
    const posArgs = [oval.a.fromLoc.row, oval.a.fromLoc.col, oval.a.fromLoc.srcIdx, oval.a.endLoc.row, oval.a.endLoc.col, oval.a.endLoc.srcIdx, oval.a.eolLoc.srcIdx].map(x => flattenWasmInt(x));
    return { tag: "expr", expr: { tag: "call", name: `divide_by_zero`, arguments: [oval, ...posArgs]}}
}

// TODO: src field here is a temporary hack. Source doesn't get properly if it is not in the last compiled source. 
// For example, when running code in REPL, if a runtime error happens in code 
// that belongs to a previous REPL block or the main editor, source code does not get properly reported.
export const importObjectErrors : any = {
    src: "",         // For reporting source code in runtime errors.  
    assert_not_none, 
    divide_by_zero,
}

export const wasmErrorImports : string = `
    (func $assert_not_none (import "errors" "assert_not_none") (param i32)  (param i32) (param i32) (param i32) (param i32) (param i32) (param i32) (param i32) (result i32))
    (func $divide_by_zero (import "errors" "divide_by_zero") (param i32)  (param i32) (param i32) (param i32) (param i32) (param i32) (param i32) (param i32) (result i32))
`

