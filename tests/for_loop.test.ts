import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("PA3 hidden tests", () => {

// 1 - Not paired variable
assertTCFail("invalid-var-for-loop",
`
a:[int] = None
b:[int] = None
i:bool = 0
a = [1,2,3,6,19]
for i in a:
  pass
`)

// 2 - Nested for loops
assertPrint("nested-for",
`
a:[[int]] = None
b:[int] = None
i1:[int] = None
i2:int = 0
b = [2,3,4,5]
a = [b, [1,2], [3]]
for i1 in a:
  for i2 in i1:
    print(i2)
`, [`2`, `3`, `4`, `5`, `1`, `2`, `3`])

// 3 - for loop to none
assertFail("for-loop-none",
`
a:[int] = None
i:int = 2
for i in a:
   pass
`)

// 4 - for loop to empty
assertPrint("for-loop-empty",
`
a:[int] = None
i:int = 2
a = []
for i in a:
   print(i)
print(i)
`, [`2`])

});
