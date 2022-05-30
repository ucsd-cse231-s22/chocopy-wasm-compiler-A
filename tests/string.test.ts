import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("String tests", () => {

// 1 - Simple string printing
assertPrint("string-printing", `
s:str = "fhgfjkhakadkd"
i:str = ""
print(s)
`, [`fhgfjkhakadkd`]);

// 2 - Print string by for loop
assertPrint("list-access", `
a:str = "Joe"
i:str = ""
for i in a:
  print(i)`, [`J`, `o`, `e`]);

// 3 - String concat
assertPrint("string-concat", `
a:str = "Joe"
i:str = "Hello"
c:str = ""
print(i + a)
for c in a:
  print(i + c)`, [`HelloJoe`, `HelloJ`, `Helloo`, `Helloe`]);

// 4 - String access
assertPrint("string-access", `
a:str = "Joe"
i:str = "Hello"
print((i + a)[0])
print(i[3])
print("IloveCompiler"[5])`, [`H`, `l`, `C`]);

// 5 - String invalid index
assertFail("string-invalid-index",
`
a:str = "Hello"
b:str = "World"
(a+b)[15]
`)

// 6 - String length
assertPrint("string-length", `
a:str = "Joe"
i:str = "Hello"
print(len(i + a))
print(len(a))
print(len("IloveCompiler"))`, [`8`, `3`, `13`]);

// 7 - String access with expr
assertPrint("string-expr-access", `
a:str = "Joe"
i:str = "Hello"
ind:int = 1
print(a[1 + 1])
print(i[ind * 2])
print((a + i)[len(a)])`, [`e`, `l`, `H`]);

});
