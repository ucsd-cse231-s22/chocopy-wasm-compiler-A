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
    assertPrint("for-loop-id",
        `
x : [int] = None
y : int = 0
x = [7,8,9]
for y in x:
    print(y)
`, ["7", "8", "9"]
    );
    assertPrint("for-loop-function",
        `
x : int = 0
def f() -> [int]:
  return [4,5,6]

for x in f():
    print(x)
`, ["4", "5", "6"]
    );
    assertPrint("for-iterate-string",
        `
s : str = "abc"
c : str = "x"
for c in s:
    print(c)`, ["a","b","c"]
    );
    assertTCFail("for-mismatch-id-list-type", `
x : str = "a"
for x in [1,2,3,4,5]:
    print(x)    
`)
});
