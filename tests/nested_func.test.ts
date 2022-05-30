import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("nested function test", () => {
  // 1
assertPrint("nested-function-test1", 
  `
def f(x : int) -> int:
  def g(y : int) -> int:
    return y+1
  return g(x) + g(3)
print(f(6))`, [`11`]);

assertPrint("nested-function-nonlocal1", 
`
def f(x : int) -> int:
  def h(z : int) -> int:
    nonlocal x
    x = z+x
    return x
  return h(10) + h(7)

print(f(6))
`, [`39`]);

assertPrint("nested-function-nonlocal2", 
`
def f(x : int) -> int:
  def h(z : int) -> int:
    nonlocal x
    x = z+x
    return x
  return h(x) + h(7)

print(f(6))`, [`31`]);




});