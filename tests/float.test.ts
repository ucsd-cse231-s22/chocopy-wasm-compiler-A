import { assertPrint, assertTCFail, assertTC, assertFail, assertClose } from "./asserts.test";
import { NUM, BOOL, FLOAT, NONE, CLASS } from "./helpers.test"

describe("float test", () => {
    // 1
    assertTC("float-init", `x : float = 3.2` , NONE);
    // 2
    assertTC("basic-float", 
        `x : float = 3.2
        x` , 
        FLOAT);
    // 3
    assertTC("basic-float-inf",
        `x : float = inf
        x`,
        FLOAT);
    // 4
    assertTC("basic-float-nan",
        `x : float = nan
        x = 1.3
        x`,
        FLOAT);
    // 5
    assertTCFail("basic-float-int",
        `x : float = nan
        x = 10
        `);
    // 6
    assertClose("basic-float-2",
        `print(1.1)`,
        `1.1`)
    // 7
    assertClose("float-binop-1",
        `print(1.2 + 8.397)`,
        `9.597`)
    // 8
    assertClose("float-binop-2",
        `x : float = 3.5
        y : float = 8.4
        x = 5.6
        print((x - 1.4) / y)`,
        `0.5`)
    // 9
    assertPrint(
        "float-binop-3",
        `x : float = 3.1
        y : float = 3.1
        print(x ==y )`,
        [`True`]
      );
});