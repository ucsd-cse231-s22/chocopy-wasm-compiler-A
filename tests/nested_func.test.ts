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

// assertPrint("nested-function-nonlocal", 
//   `
// def f(x : int) -> int:
//   def g(y : int) -> int:
//     nonlocal x
//     x = x+1
//     return x
//   return g(x) + g(x)
// print(f(6))`, [`15`]);


});