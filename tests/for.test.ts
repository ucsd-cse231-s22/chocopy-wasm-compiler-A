import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("for test", () => {
    // 1
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
    assertPrint("for-iterate-string",
        `
s : str = "abc"
c : str = "x"
for c in s:
    print(c)`, ["a","b","c"]
    );
});
