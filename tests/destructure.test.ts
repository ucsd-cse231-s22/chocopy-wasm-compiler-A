import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { assertTC, assertTCFail, assertPrint } from './asserts.test';
import { NUM, NONE } from '../utils';

const rangeDef = `
    class iterator(Object):
        start: int = 0
        end: int = 0
    
        def next(self: iterator)->int:
            output: int = 0
            if self.start < self.end:
                output = self.start
                self.start = self.start + 1
                return output
            return -1

        def hasNext(self: iterator)->bool:
            return self.start < self.end

    def range(s: int, e: int)->iterator:
        it: iterator = None
        it = iterator()
        it.start = s
        it.end = e
        return it
`

describe('tc for destructure', () => {

    assertTC("simple-assignment", `
    a : int = 1
    a = 2
    `, NONE);

    assertTCFail("simple-assignment-failure", `
    a : int = 1
    a = True
    `);

    assertTC("destructure-assignment", `
    a : int = 1
    b : bool = True
    a, b = 2, False
    `, NONE);

    assertTC("destructure-assignment-with-ignore", `
    a : int = 1
    b : bool = True
    a, _, b = 2, 3, False
    `, NONE);

    // TODO: after introducing list
    // assertTC("destructure-assignment-with-star", `
    // a : int = 1
    // b : bool = True
    // c : [int] = []
    // a, *c, b = 2, 4, 5, False
    // `, NONE);

    // TODO: after introducing list
    // assertTC("destructure-assignment-with-star-empty", `
    // a : int = 1
    // b : bool = True
    // c : [int] = []
    // a, *c, b = 2, False
    // `, NONE);

    assertTCFail("destructure-assignment-type-failure", `
    a : int = 1
    b : bool = True
    a, b = 2, 3
    `);

    assertTCFail("destructure-assignment-num-failure", `
    a : int = 1
    b : bool = True
    a, b = 2
    `);

    // TODO: after introducing list
    // assertTCFail("destructure-assignment-with-star-failure", `
    // a : int = 1
    // b : bool = True
    // c : [int] = []
    // d : int = 2
    // a, *c, b, d = 2, 4
    // `, NONE);

    assertTC("destructure-assignment-with-range", `
    ${rangeDef}
    a : int = 0
    b : int = 0
    a, _, b = range(1, 4)
    `, NONE);

    assertTCFail("destructure-assignment-with-range-type-failure", `
    ${rangeDef}
    a : int = 0
    b : bool = False
    a, _, b = range(1, 4)
    `);

    assertTC("destructure-assignment-in-func", `
    ${rangeDef}
    def func(a: int, b: int)->iterator:
        i : int = 0
        j : int = 0
        i, _, _, j = range(a, b)
        return range(i, j)
    a : int = 0
    b : int = 0
    a, _, b = func(1, 5)
    `, NONE);

    assertPrint("destructure-assignment-sep", `
    a : int = 1
    b : bool = True
    a, b = 2, False
    print(a)
    print(b)
    `, ['2', 'False']);

    assertPrint("destructure-assignment-with-ignore-sep", `
    a : int = 1
    b : bool = True
    a, _, b = 2, 3, False
    print(a)
    print(b)
    `, ['2', 'False']);

    assertPrint("destructure-assignment-with-range-sep", `
    ${rangeDef}
    a : int = 0
    b : int = 0
    a, b = range(1, 3)
    print(a)
    print(b)
    `, ['1', '2']);

    assertPrint("destructure-assignment-in-func-sep", `
    ${rangeDef}
    def func(a: int, b: int)->iterator:
        i : int = 0
        j : int = 0
        i, _, j = range(a, b)
        return range(i, j)
    a : int = 0
    b : int = 0
    a, b = func(1, 4)
    print(a)
    print(b)
    `, ['1', '2']);

    assertPrint("destructure-assignment-in-class-sep", `
    ${rangeDef}
    c: cl = None
  
    class cl(Object):
        f1: int = 0
        f2: bool = False
    
    c = cl()
    c.f1, c.f2 = 1, True
    print(c.f1)
    print(c.f2)
    `, ['1', 'True']);

    assertPrint("destructure-assignment-in-class-range-sep", `
    ${rangeDef}
    c: cl = None
  
    class cl(Object):
        f1: int = 0
        f2: int = 0
    
    c = cl()
    c.f1, c.f2 = range(1, 3)
    print(c.f1)
    print(c.f2)
    `, ['1', '2']);

    assertTCFail("destructure-assignment-in-class-type-failure", `
    ${rangeDef}
    c: cl = None
  
    class cl(Object):
        f1: bool = 0
        f2: bool = 0
    
    c = cl()
    c.f1, c.f2 = range(1, 3)
    `);

    assertTCFail("destructure-assignment-in-none-obj-failure", `
    ${rangeDef}
    c: cl = None
  
    class cl(Object):
        f1: bool = 0
        f2: bool = 0
    
    c.f1, c.f2 = range(1, 3)
    `);

    assertTCFail("destructure-assignment-in-not-class-failure", `
    ${rangeDef}
    c : int = 0
    c.f1, c.f2 = range(1, 3)
    `);

    assertPrint("destructure-assignment-in-mix-sep", `
    ${rangeDef}
    c: cl = None
    a: int = 0
  
    class cl(Object):
        f1: int = 0
    
    c = cl()
    c.f1, _, a = range(1, 4)
    print(c.f1)
    print(a)
    `, ['1', '3']);
    
});