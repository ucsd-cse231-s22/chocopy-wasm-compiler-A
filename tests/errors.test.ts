import "mocha";
import { expect } from "chai";
import { BasicREPL } from "../repl";
import { Value, Annotation } from "../ast";
import { importObject } from "./import-object.test";
import {run, typeCheck} from "./helpers.test";
import { fail } from 'assert'
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"
import * as ERRORS from "../errors"

// Assert an error gets thrown at runtime, with reported source, row/col number, and some messages
export function assertFailWithSrc(name: string, source: string, errorName: string, row: number, col: number, msgs: Array<string>) {
    it(name, async () => {
      try {
        await run(source);
        fail("Expected an exception");
      } catch (err) {
        expect(err.name).to.contain(errorName);
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
ERRORS.RUNTIME_ERROR_STRING, 6, 1, 
[`c2.x`,  ERRORS.OperationOnNoneNote]
);
    
assertFailWithSrc("method-of-none", 
`class C(object):
    other : C = None
    def f(self:C, other: C):
        other.f(self)
    
c : C = None
c = C()
c.f(None)`, 
ERRORS.RUNTIME_ERROR_STRING, 4, 9, 
[`        other.f(self)`,ERRORS.OperationOnNoneNote]
);

assertFailWithSrc("divide-by-zero", 
`1 // 0`, 
ERRORS.RUNTIME_ERROR_STRING, 1, 1, 
[`1 // 0`, ERRORS.DivideByZeroNote]);

assertFailWithSrc("divide-by-zero-dyn", 
`def foo(a:int):
    1 % a
x : int = 0
foo(x)`, 
ERRORS.RUNTIME_ERROR_STRING, 2, 5, 
[`    1 % a`, ERRORS.DivideByZeroNote]);
});



// TODO: Move TYPE_ERROR_STRING from err.message to err.name.
describe("Type Check Errors", () => {
assertFailWithSrc("binop-num-wrong-type",
`a: int = 1
b: bool = True
a + b`, 
`Error`, 3, 1, 
[`a + b`, ERRORS.TYPE_ERROR_STRING, `Binary operator \`+\` expects type "number" on both sides, got "number" and "bool"`]
);

assertFailWithSrc("mklambda-callable-wrong-type",
`isZero: Callable[[int], bool] = None
isZero = mklambda(Callable[[int], int], lambda num: num == 0)`, 
`Error`, 2, 10, 
[`mklambda(Callable[[int], int], lambda num: num == 0)`, ERRORS.TYPE_ERROR_STRING, `Expected type {"tag":"number"} in lambda, got type "bool"`]
);

assertFailWithSrc("mklambda-lambda-wrong-type",
`isZero: Callable[[int], bool] = None
isZero = mklambda(Callable[[int], bool], lambda num: num)`, 
`Error`, 2, 10, 
[`mklambda(Callable[[int], bool], lambda num: num)`, ERRORS.TYPE_ERROR_STRING, `Expected type {"tag":"bool"} in lambda, got type "number"`]
);

assertFailWithSrc("mklambda-wrong-type",
`isZero: Callable[[int], bool] = None
isZero = mklambda(Callable[[int], int], lambda num: num)`, 
`Error`, 2, 10, 
[`mklambda(Callable[[int], int], lambda num: num)`, ERRORS.TYPE_ERROR_STRING, `Assignment value should have assignable type to type callable[["number"], "bool"], got callable[["number"], "number"]`]
);

});

// TODO: test multiple sources