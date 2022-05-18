import "mocha";
import { expect } from "chai";
import { BasicREPL } from "../repl";
import { Value, Annotation } from "../ast";
import { importObject } from "./import-object.test";
import {run, typeCheck} from "./helpers.test";
import { fail } from 'assert'
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"
import { RUNTIME_ERROR_STRING, TYPE_ERROR_STRING } from "../errors"

// Assert an error gets thrown at runtime, with reported source, row/col number, and some messages
export function assertFailWithSrc(name: string, source: string, reportSource: string, row: number, col: number, msgs: Array<string>) {
    it(name, async () => {
      try {
        await run(source);
        fail("Expected an exception");
      } catch (err) {
        expect(err.message).to.contain(reportSource);
        expect(err.message).to.contain(`line ${row} at col ${col}`);
        msgs.forEach(msg => expect(err.message).to.contain(msg));
      }
    });
  }

describe("Runtime Errors", () => {
assertFailWithSrc("field-of-none",
`class C(object):
    x : int = 0
c1 : C = None
c2 : C = None
c1 = C()
c2.x`, 
`c2.x`, 6, 1, 
[RUNTIME_ERROR_STRING, "cannot perform operation on none"]
);
    
assertFailWithSrc("method-of-none", 
`class C(object):
    other : C = None
    def f(self:C, other: C):
        other.f(self)
    
c : C = None
c = C()
c.f(None)`, 
`        other.f(self)`, 4, 9, 
[RUNTIME_ERROR_STRING, "cannot perform operation on none"]
);

assertFailWithSrc("divide-by-zero", 
`1 // 0`, 
`1 // 0`, 1, 1, 
[RUNTIME_ERROR_STRING, "cannot divide by zero"]);

assertFailWithSrc("divide-by-zero-dyn", 
`def foo(a:int):
    1 % a
x : int = 0
foo(x)`, 
`    1 % a`, 2, 5, 
[RUNTIME_ERROR_STRING, "cannot divide by zero"]);
});




describe("Type Check Errors", () => {
assertFailWithSrc("binop-num-wrong-type",
`a: int = 1
b: bool = True
a + b`, 
`a + b`, 3, 1, 
[TYPE_ERROR_STRING, `Binary operator \`+\` expects type "number" on both sides, got "number" and "bool"`]
);
});