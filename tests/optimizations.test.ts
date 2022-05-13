import { assertPrint, assertFail, assertTCFail, assertTC, assertOptimize } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Optimizations tests", () => {
    assertOptimize(
        "simple-constant-folding", 
        `
        a: int = 0
        a = 5 + 7
        `,
        `
        a: int = 0
        a = 12
        `
    );
});