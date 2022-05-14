import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("string test", () => {
  // 1
  assertPrint("list-len",
  `
  a : [int] = None
  a = [1, 2, 3, 4, 5]
  print(a[len(a) - 1])`, [`5`]);
  assertPrint("list-operation",
  `
  a : [int] = None
  b : [int] = None
  c : [int] = None
  i : int = 0
  a = [1, 2, 3, 4, 5]
  b = [6, 7, 8, 9, 10]
  c = a + b
  
  for i in c:
      print(i)`, [`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`]);
  assertTCFail("list-tc", `
  a : [int] = None
  a = [1, 2, 3, False, True]`);
  assertPrint("for-loop-basic",
  `
  ans : int = 0
  x : int = 0
  for x in [1, 2, 3, 4, 5]:
    ans = ans + x
  print(ans)`, ["15"]
  );
  assertPrint("for-loop-return-intermediate",
  `
  def f() -> int:
    x : int = 0
    for x in [1, 2, 3, 4, 5]:
      if x > 3:
        return x
      else:
        pass
    return x
  print(f())`, ["4"]
  );
});
