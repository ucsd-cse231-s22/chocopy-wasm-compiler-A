import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("builtin tests", () => {
    // 1
    assertPrint("print-1-arg", `print(1)`, [`1`]);
    // 2
    assertPrint("print-2-args", `print(1,2)`, [`1 2`]);
    // 3
    assertPrint(`print-null`, `print()`,[``]);
    // 4

  });