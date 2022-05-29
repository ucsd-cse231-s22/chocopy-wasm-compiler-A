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
import { assertPrint, assertTC, assertTCFail } from "./asserts.test";
import { NONE } from "../utils";

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

assertTC("Capture local variable",`
def a():
  x: int = 5
  def b():
    print(x + 8)
`, NONE)

assertTC("Capture parameter",`
def a(x: int):
  def b():
    print(x + 8)
`, NONE)

assertTCFail("Captured vars",`
def a(x: int):
  y: bool = False
  def b():
    print(x + y)
`)

assertTC("Nonlocal",`
def a() -> int:
  x: int = 5
  def b():
    nonlocal x
    x = 8
    print(x + 8)
  b()
  return x
`, NONE)

assertTCFail("Nonlocal fail",`
def a() -> int:
  x: int = 5
  def b():
    x = 8
    print(x + 8)
  b()
  return x
`)

assertPrint("Capture local variable run",`
def a():
  x: int = 4
  def b():
    print(13 + x)
  b()
a()
`, ['17']);

assertPrint(
  "Capture local param run", `
def a(x: int):
  def b():
    print(13 + x)
  b()
a(4)
`,
  ["17"]
);

assertPrint(
  "Capture nonlocal", `
def a(x: int):
  def b():
    nonlocal x
    x = x + 2
    print(13 + x)
  b()
  b()
a(4)
`,
  ["19", "21"]
);

assertPrint(
  "Capture nonlocal func", `
def a() -> Callable[[], int]:
  x: int = 4
  def b() -> int:
    nonlocal x
    x = x + 13
    return x
  return b
print(a()())
`,
  ["17"]
);

assertPrint("Capture redeclare",`
def a():
  x: int = 5
  def b():
    x: int = 6
    def c():
      print(x + 8)
    c()
  b()
a()
`, ['14']);