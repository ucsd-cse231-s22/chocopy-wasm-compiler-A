import * as mocha from "mocha";
import { expect } from "chai";
import { parser } from "@lezer/python";
import {
  traverseExpr,
  traverseStmt,
  traverse,
  parse,
  traverseType,
} from "../parser";
import { emptyGlobalTypeEnv, tc } from "../type-check";
import { assert } from "console";
import { importObject } from "./import-object.test";
import {run, typeCheck} from "./helpers.test";
import { assertPrint } from "./asserts.test";

// We write tests for each function in parser.ts here. Each function gets its
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected.
describe("functions", () => {
assertPrint("call function",`
def f():
  pass
f()
`,[''])

assertPrint("nested function",`
def f(y: int) -> int:
  def fact(x: int) -> int:
    if x == 1: return 1
    else: return fact(x-1) * x
  return fact(y)
print(f(5))
`,['120'])
});
