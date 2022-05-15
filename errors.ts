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
// TODO: pretty print source
export function assert_not_none(arg: any, row: any, col: any, pos_start: any, pos_end: any) : any {
    if (arg === 0)
      throw new Error(`RUNTIME ERROR: cannot perform operation on none at row ${row} col ${col}`);
    return arg;
}

// TODO: unable to do run time error w/ messages atm because not sure how to pass in string arguments in WASM
export function flattenAssertNotNone(oval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {
    const src = fullSrcLine("", oval.a.fromLoc.srcIdx, oval.a.fromLoc.col, oval.a.eolLoc.srcIdx);
    const squigglies = drawSquiggly(oval.a.fromLoc.row, oval.a.endLoc.row, oval.a.fromLoc.col, oval.a.endLoc.col);
    const posArgs = [oval.a.fromLoc.row, oval.a.fromLoc.col, oval.a.fromLoc.srcIdx, oval.a.endLoc.srcIdx].map(x => flattenWasmInt(x));
    return { tag: "expr", expr: { tag: "call", name: `assert_not_none`, arguments: [oval, ...posArgs]}}
}

export function divide_by_zero(arg: any, row: any, col: any, pos_start: any, pos_end: any) : any {
    if (arg === 0)
      throw new Error(`RUNTIME ERROR: cannot divide by zero at row ${row} col ${col}`);
    return arg;
}

// TODO: unable to do run time error w/ messages atm because not sure how to pass in string arguments in WASM
export function flattenDivideByZero(oval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {
    const srcLine = fullSrcLine("", oval.a.fromLoc.srcIdx, oval.a.fromLoc.col, oval.a.eolLoc.srcIdx);
    const squigglies = drawSquiggly(oval.a.fromLoc.row, oval.a.endLoc.row, oval.a.fromLoc.col, oval.a.endLoc.col);
    const posArgs = [oval.a.fromLoc.row, oval.a.fromLoc.col, oval.a.fromLoc.srcIdx, oval.a.endLoc.srcIdx].map(x => flattenWasmInt(x));
    return { tag: "expr", expr: { tag: "call", name: `divide_by_zero`, arguments: [oval, ...posArgs]}}
}

export const importObjectErrors : any = {
    assert_not_none: (arg: any, row: any, col: any, pos_start: any, pos_end: any) => assert_not_none(arg, row, col, pos_start, pos_end),
    divide_by_zero: (arg: any, row: any, col: any, pos_start: any, pos_end: any) => divide_by_zero(arg, row, col, pos_start, pos_end),
}

export const wasmErrorImports : string = `
    (func $assert_not_none (import "errors" "assert_not_none") (param i32) (param i32) (param i32) (param i32) (param i32) (result i32))
    (func $divide_by_zero (import "errors" "divide_by_zero") (param i32) (param i32) (param i32) (param i32) (param i32) (result i32))
`

