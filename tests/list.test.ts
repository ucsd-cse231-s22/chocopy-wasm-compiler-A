import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("list test", () => {
  // 1
  assertPrint("list-basic", 
  `
  a : [int] = None
  a = [1, 2, 3, 4, 5]
  print(a[0])
  print(a[1])
  print(a[2])
  print(a[3])
  print(a[4])`, [`1`, `2`, `3`, `4`, `5`]);
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

  assertPrint("list-class-as-entries",
  `
  a:[A] = None
  class A(object):
      a:int =1
  entry1:A = None
  entry2:A = None
  entry1 = A()
  entry2 = A()
  entry2.a = 4
  a = [entry1, entry2]
  print(a[0].a)
  print(a[1].a)`, [`1`, `4`]);

  assertPrint("list-class-and-subclass-as-entries",
  `
  a:[A] = None
  class A(object):
      a:int =1
  class Asub(A):
      b:int = 2
  entry1:A = None
  entry2:Asub = None
  entry1 = A()
  entry2 = Asub()
  a = [entry1, entry2]
  print(a[0].a)
  print(a[1].a)`, [`1`, `1`]);
  
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
