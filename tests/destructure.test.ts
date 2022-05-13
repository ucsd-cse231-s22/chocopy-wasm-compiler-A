import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { assertTC, assertTCFail } from './asserts.test';
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
    `, NUM);

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

});