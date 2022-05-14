import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, FLOAT, BOOL, NONE, ELLIPSIS, CLASS } from "./helpers.test"

describe("builtin tests", () => {
    // 1
    assertPrint("bool-to-int", `print(bool(3))`, [`True`]);
    // 2
    assertPrint("int-to-int", `print(int(3))`, [`3`]);
    // 3
    assertPrint(`bool-to-int`, `print(int(False))`,[`0`]);
    // 4
    assertPrint("bool-int-bool", ` print(bool(int(True)))`, [`True`]);
    // 5
    assertPrint("ellipsis", `print(...)`, [`Ellipsis`]
      );
    // 6
    assertTC("float-init", `x : float = 3.2` , NONE);
    // 7
    assertTC("basic-float", 
        `x : float = 3.2
        x` , 
        FLOAT);

    // import / math
    assertPrint("gcd", `print(gcd(12, 18))`, [`6`]);
    assertPrint("lcm", `print(lcm(12, 18))`, [`36`]);
    assertPrint("factorial", `print(factorial(5))`, [`120`]);
    assertTC("import-x-from-y", `from y import x`, NONE);
    assertTC("import-x", `import x`, NONE);
  });
  