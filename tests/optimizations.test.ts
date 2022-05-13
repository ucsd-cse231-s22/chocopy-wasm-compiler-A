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

    assertOptimize(
        "complex-constant-folding", 
        `
        a:int=1
        a=1*2-1+4
        `,
        `
        a: int = 1
        a = 5
        `
    );

    assertOptimize(
        "while-constant-folding", 
        `
        a:int=1
        b:int = 5
        while a<10:
            a = 1
        b = a
        `,
        `
        a:int=1
        b:int = 5
        while 1<10:
            a = 1
        b = 1
        `
    );

    assertOptimize(
        "while-constant-folding-neg", 
        `
        a:int=1
        b:int = 5
        while a<10:
            a = 11
        b = a
        `,
        `
        a:int=1
        b:int = 5
        while a<10:
            a = 11
        b = a
        `
    );

});