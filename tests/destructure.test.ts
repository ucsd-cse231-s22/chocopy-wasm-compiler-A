import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { assertTC, assertTCFail } from './asserts.test';
import { NUM } from '../utils';

const rangeDef = `
def range(s: int, e: int)->iterator:
    it: iterator = None
    it = iterator()
    it.start = s
    it.end = e
    return it

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
`

describe('tc for destructure', () => {

    assertTC("simple-assignment", `
    a : int = 1
    a = 2
    `, NUM);

});