import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("if-exper tests", () => {
  assertPrint("Simple True", `print(True if True else False)`, [`True`]);
  assertPrint("Simple False", `print(True if False else False)`, [`False`]);
  assertPrint("Nesting",`print(0 if False else 2 if False else 3 if False else 4 + 0 if False else 2 if True else 3 if False else 4)`, [`2`])
  assertPrint("Nesting2",`print((0 if False else 2 if False else 3 if False else 4) + (0 if False else 2 if True else 3 if False else 4))`,[`6`])
  assertTCFail("Different 'return's",`print(True if False else 10)`)
  assertTCFail("Bad conditional",`print(True if 55 else 10)`)
  assertTCFail("assign to wrong type",
`x : bool = True
 x = 55 if False else 10`)
 assertPrint("In a Class method",`class Foo(object):
 x: int = 10
 def f(self: Foo, q: int) -> bool:
   return True if q > self.x else False
foobar: Foo = None
foobar = Foo()
print(foobar.f(0))
print(foobar.f(20))
`,["False","True"])
assertPrint("Functions",
`def f(x: int) -> int:
  1+1
  1+1
  return x + 10
def q(x: int) -> int:
  return x - 10
def z() -> bool:
  return True
l : int = 0
l = f(10) if z() else q(10)
print(l)`,["20"])
});
