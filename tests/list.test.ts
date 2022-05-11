import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("PA3 hidden tests", () => {

// 1 - Simple list accessing
assertPrint("list-access", `
 a:[int] = None
 x:int = 5
 a = [1,2,3,4]
 print(a[x - 3])
 print(a[1])`, [`3`, `2`]);

// 2 - Nested lists & len
assertPrint("nested-lists-1", `
 a:[int] = None
 b:[[int]] = None
 x:int = 5
 a = [1,2,3,4]
 b = [a, [2]]
 print(len(b))
 print(b[1][0])
 print(len(b[0]))`, [`2`, `2`, `4`]);

// 3 - None lists
assertFail("none-lists", `
 a:[int] = None
 a[1]`);

// 4 - Wrong index
assertFail("wrong-index-1", `
  a:[int] = None
  a = [1,2,3,4,5]
  a[12]`);

// 5 - Wrong index
assertFail("wrong-index-2", `
a:[int] = None
a = [1,2,3,4,5]
a[-4]`);

// 6 - Invalid assign
assertTCFail("invalid-assign",`
a:[[int]] = None
a = [1,2,3,4]
`)

// 7 - Empty Type
assertPrint("empty-type", `
a:[int] = None
b:[[int]] = None
a = []
b = [a, [1,2,3]]
print(len(b[0]))
print(b[1][2])
`, [`0`, `3`])

// 8 - Lists in  Classes
assertPrint("lists-with-classes",
`
class A(object):
  x:[int] = None
  def accessX(self:A, y:int):
    if (y >= len(self.x)):
      print(False)
    else:
      print(self.x[y])
a:A = None
a = A()
a.x = [1,2,3,6,19]
a.accessX(12)
a.accessX(4)
`, [`False`, `19`])

});
