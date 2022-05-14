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
`, ["e"])
});
