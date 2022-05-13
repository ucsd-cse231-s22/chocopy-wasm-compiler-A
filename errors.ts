import * as AST from './ast';
import * as IR from './ir';
import {flattenWasmInt} from './lower';


/****** Runtime Errors *******/
// TODO: make a register for errors so that we don't need to pass so many arguments at runtime
// TODO: pretty print source
export function assert_not_none(arg: any, row: any, col: any, pos_start: any, pos_end: any) : any {
    if (arg === 0)
      throw new Error(`RUNTIME ERROR: cannot perform operation on none at row ${row} col ${col}`);
    return arg;
}

export function flattenAssertNotNone(oval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {
    const posArgs = [oval.a.fromLoc.row, oval.a.fromLoc.col, oval.a.fromLoc.srcIdx, oval.a.endLoc.srcIdx].map(x => flattenWasmInt(x));
    return { tag: "expr", expr: { tag: "call", name: `assert_not_none`, arguments: [oval, ...posArgs]}}
}

export function divide_by_zero(arg: any, row: any, col: any, pos_start: any, pos_end: any) : any {
    if (arg === 0)
      throw new Error(`RUNTIME ERROR: cannot divide by zero at row ${row} col ${col}`);
    return arg;
}

export function flattenDivideByZero(oval:IR.Value<AST.Annotation>) {
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

