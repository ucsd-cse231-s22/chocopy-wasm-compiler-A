import { assertPrint, assertFail, assertTCFail, assertTC, assertOptimize } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Optimizations tests", () => {
    assertOptimize(
        "sanity-simple-constant-folding", 
        `
        a: int = 0
        print(a)
        a = 5 + 7
        print(a)
        `,
        { print: ["0","12"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-complex-constant-folding", 
        `
        a:int=1
        a=1*2-1+4
        print(a)
        `,
        { print: ["5"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-while-constant-folding-neg", 
        `
        a:int=10
        b:int = 5
        while a<10:
            a = 1
        b = a
        print(b)
        `,
        { print: ["10"], isIrDifferent: false }
    );

    assertOptimize(
        "sanity-if-constant-prop", 
        `
        a:int = 3
        if 0<3:
            a = 4
            print(a)
        `,
        { print: ["4"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-if-constant-prop-neg", 
        `
        a:int = 3
if False:
   a = 4
else:
   a = 5
print(a)
        `,
        { print: ["5"], isIrDifferent: false }
    );

    assertOptimize(
        "sanity-while-constant-prop-folding", 
        `
        a:int=1
        b:int = 5
        while a<3:
            b = 2 + 3
            a = a + 1
            print(a)
        print(b)
        `,
        { print: ["2", "3", "5"], isIrDifferent: true }
    );

});