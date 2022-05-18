import * as AST from './ast';
import { Annotation } from './ast';
import * as IR from './ir';
import {flattenWasmInt} from './lower';

export const RUNTIME_ERROR_STRING = "RUNTIME ERROR"
export const TYPE_ERROR_STRING = "TYPE ERROR"

/****** Full line of src that contains an error ******/
export function fullSrcLine(SRC: string, fromLocIdx: number, fromLocCol: number, eolLocIdx: number) {
    const lineStart = fromLocIdx - fromLocCol + 1; // src and col has an offset of 1
    return SRC.slice(lineStart, eolLocIdx);
}

// TODO: how to draw squigglies if the error spans multiple lines?
export function drawSquiggly(fromLocRow: number, endLocRow: number, fromLocCol: number, endLocCol: number) {
    return (fromLocRow === endLocRow) ? `${' '.repeat(fromLocCol - 1)}${'^'.repeat(endLocCol - fromLocCol)}` : '';
}


/****** Runtime Errors *******/

/**
 * Runtime Error base class.
 */
export class RuntimeError extends Error {
    __proto__: Error;
    a?: Annotation | undefined;
    SRC?: string | undefined;
    note: string; 

    constructor(SRC?: string, a?: Annotation) {
        const trueProto = new.target.prototype;
        super();
        // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
        this.__proto__ = trueProto;
        this.a = (a) ?? undefined;
        this.SRC = (SRC) ?? undefined;
        this.name = RUNTIME_ERROR_STRING;
        this.message = "You shouldn't see this. Compiler's cursed. Check if you prepared the error before throwing it out."
        this.note = "";
    }
  
    public getA(): Annotation | undefined {
        return this.a;
    }

    // Create error message lazily to reduce memory overhead
    public prepare() {
        var locSquigglySrc = "";
        if (this.a && this.SRC) {
            const a = this.a;
            const SRC = this.SRC;
            const fromLoc = a.fromLoc;
            const endLoc = a.endLoc;
            const eolLoc = a.eolLoc;
            const loc = ` on line ${fromLoc.row} at col ${fromLoc.col}`;
            const src = fullSrcLine(SRC, fromLoc.srcIdx, fromLoc.col, eolLoc.srcIdx);
            const squiggly = drawSquiggly(fromLoc.row, endLoc.row, fromLoc.col, endLoc.col);
            locSquigglySrc = `${loc}\n\n${src}\n${squiggly}`;
        }
        const msg = this.note + locSquigglySrc;
        this.message = msg;
    }

    public getErrMsg(): string {
        return String(this);
    }
  
}

/**
 * Used to register for runtime errors
 */
type RuntimeErrorRegistry = Array<RuntimeError>
// TODO: Should the error registry be global, be put in ImportedObjects, or be somewhere else? 
export const runtimeErrorRegistry = new Array<RuntimeError>();
export function registerRE(e: RuntimeError, registry: RuntimeErrorRegistry=runtimeErrorRegistry): number {
    registry.push(e);
    return registry.length - 1;
}
export function getRE(reNum: number, registry: RuntimeErrorRegistry=runtimeErrorRegistry) {
    return registry[reNum];
}

/**** Common Error checking behaviors ****/
function assert_not_zero(arg: any, reNum: any) : any {
    if (arg === 0){
        const re = getRE(reNum);
        re.prepare();
        throw re;
    }
    return arg;
}


/********** Divide by Zero Error ***********/
export const DivideByZeroNote = "cannot divide by zero"
export class DivideByZeroError extends RuntimeError {
    note: string = DivideByZeroNote;
}

export const divide_by_zero = assert_not_zero;

export function flattenDivideByZero(a:Annotation , rval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {
    const error = new DivideByZeroError(importObjectErrors.src, a);
    const reNum = registerRE(error);
    const posArg = flattenWasmInt(reNum);
    return { tag: "expr", expr: { tag: "call", name: `divide_by_zero`, arguments: [rval, posArg]}}
}


/********* Operation On None Error *********/
// TODO: Separate into different cases (Method call on None, Field access on None, indexing on None, etc.)
export const OperationOnNoneNote = "cannot perform operation on none"
export class OperationOnNoneError extends RuntimeError {
    note: string = OperationOnNoneNote;
}

export const assert_not_none = assert_not_zero;

export function flattenAssertNotNone(a: Annotation, oval:IR.Value<AST.Annotation>): IR.Stmt<AST.Annotation> {
    const error = new OperationOnNoneError(importObjectErrors.src, a);
    const reNum = registerRE(error);
    const posArg = flattenWasmInt(reNum);
    return { tag: "expr", expr: { tag: "call", name: `assert_not_none`, arguments: [oval, posArg]}}
}


/******* WASM Imports *******/
export const importObjectErrors : any = {
    src: "",         // For reporting source code in runtime errors.  
    assert_not_none, 
    divide_by_zero,
}

export const wasmErrorImports : string = `
    (func $assert_not_none (import "errors" "assert_not_none") (param i32) (param i32) (result i32))
    (func $divide_by_zero (import "errors" "divide_by_zero")  (param i32) (param i32) (result i32))
`
