import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { assertTC, assertTCFail } from './asserts.test';
import { NUM } from '../utils';

describe('tc for destructure', () => {

    assertTC("simple-assignment", 'a : int = 1', NUM);

});