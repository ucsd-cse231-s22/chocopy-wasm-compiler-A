import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("string test", () => {
  // 1
assertPrint("basic-string",
`
aString: str = "Hello"
print(aString)
`, ["Hello"]);
assertPrint("string-concat",
`
aString1: str = "Hello"
aString2: str = " world"
print(aString1+aString2)
`, ["Hello world"]);
assertPrint("string-length",
`
print(len("Hello"))
`, ["5"]);
assertPrint("string-index",
`
aString: str = "Hello"
print(aString[1])
`, ["e"]);
assertPrint("string-cmp",
`
a:str = "123"
b:str = "321"
print(a == b)
print(a[0] == b[2])
print(a[0] != b[2])
print(a[0] != b[0])
print(("10"[0]+"20"[0]+"30"[0]) == a)
`, ["False", "True", "False", "True", "True"]);
});
