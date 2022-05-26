import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("List tests", () => {

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

// 8 - Lists in Classes
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

// 9 - Lists indexed by list
assertPrint("list-index-by-list",
`
a:[int] = None
b:[int] = None
a = [1,2,3,6,19]
b = [0, 1, 3]
print(a[b[0]])
print(a[b[1]])
print(a[b[2]])
`, [`1`, `2`, `6`])

// 10 - List for loops
assertPrint("list-for-loops",
`
a:[int] = None
b:[int] = None
i:int = 0
a = [1,2,3,6,19]
b = [0, 1, 3]
for i in a:
  print(i)
for i in b:
  print(a[i])
`, [`1`, `2`, `3`, `6`, `19`, `1`, `2`, `6`])

// 11 - Concat two lists
assertPrint("concat-two-lists",
`
a:[int] = None
b:[int] = None
i:int = 0
b = [1,3,4]
a = [1,2,3]
b = a + b
for i in b:
  print(i)
`, [`1`, `2`, `3`, `1`, `3`, `4`])

// 12 - Concat two lists with empty
assertPrint("concat-list-empty",
`
a:[int] = None
b:[int] = None
i:int = 0
b = [1,3,4,19]
a = []
b = a + b
for i in b:
  print(i)
`, [`1`, `3`, `4`, `19`])

// 13 - String in list
assertPrint("string-in-list",
`
s1:str = "Hi"
s2:str = "Joe"
a:[str] = None
i:str = ""
s:str = ""

a = [s1, s2]
for s in a:
  for i in s:
    print(i)
`, [`H`, `i`, `J`, `o`, `e`])

// 14 - String in nested list
assertPrint("string-in-nested-list",
`
s1:str = "Hi"
s2:str = "Joe"
a:[[str]] = None
iter:[str] = None
i:str = ""
s:str = ""

a = [[s1, s2], ["Love" + s]]
for iter in a:
  for i in iter:
    print(i)

for iter in a:
  for i in iter:
    for s in i:
      print(s)
`, [`Hi`, `Joe`, `Love`, `H`, `i`, `J`, `o`, `e`, `L`, `o`, `v`, `e`])

});
