import "mocha";
import { BasicREPL } from "../repl";
import { Value, Annotation } from "../ast";
import { addLibs, importObject } from "./import-object.test";
import { run, typeCheck } from "./helpers.test";
import { fail } from 'assert'
import { compact, dataOffset, memAddr, memHeap, refMap } from "../memory";
import {Program} from '../ir'
import {Type} from '../ast'
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import { load_bignum } from "../utils";

chai.use(chaiExclude);


// Clear the output before every test
beforeEach(function () {
  importObject.output = "";
});

// suppress console logging so output of mocha is clear
before(function () {
//  console.log = function () {};
});

export function assert(name: string, source: string, expected: Value<Annotation>) {
  it(name, async () => {
    const repl = new BasicREPL(importObject);
    const result = await repl.run(source);
    chai.expect(result).to.deep.eq(expected);
  });
}

export async function assertOptimizeIR(name: string, source: string, expectedIR: Program<Annotation>) {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    const [ _, optimizedIr ] = repl.optimize(source);
    chai.expect(optimizedIr).excludingEvery(['a', 'label']).to.deep.eq(expectedIR);
  });
}


export async function assertOptimize(name: string, source: string, expected: { print: Array<string>, isIrDifferent: boolean }) {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    const [ preOptimizedIr, optimizedIr ] = repl.optimize(source);
    
    if (!expected.isIrDifferent)
      chai.expect(preOptimizedIr).to.deep.eq(optimizedIr);
    else
      chai.expect(preOptimizedIr).to.not.deep.eq(optimizedIr);
    await repl.run(source);
    chai.expect(importObject.output.trim().split('\n')).to.deep.eq(expected.print);
  });
}


export function asserts(name: string, pairs: Array<[string, Value<Annotation>]>) {
  const repl = new BasicREPL(importObject);

  it(name, async () => {
    for (let i = 0; i < pairs.length; i++) {
      const result = await repl.run(pairs[i][0]);
      chai.expect(result).to.deep.eq(pairs[i][1]);
    }
  });
}

// Assert an error gets thrown at runtime
export function assertFail(name: string, source: string) {
  it(name, async () => {
    try {
      await run(source);
      fail("Expected an exception");
    } catch (err) {
      chai.expect(String(err)).to.contain("RUNTIME ERROR:");
    }
  });
}


export function assertPrint(name: string, source: string, expected: Array<string>) {
  it(name, async () => {
    await run(source);
    const output = importObject.output;
    chai.expect(importObject.output.trim().split("\n")).to.deep.eq(expected);
  });
}

export function assertTC(name: string, source: string, result: any) {
  it(name, async () => {
    const typ = typeCheck(source);
    chai.expect(typ).to.deep.eq(result);
  });
}

export function assertTCFail(name: string, source: string) {
  it(name, async () => {
    chai.expect(function () {
      typeCheck(source);
    }).to.throw('TYPE ERROR:');
  });
}

export function assertMemState(name: string, source: string, pairs: Array<[number, number, number]>) {
  //debug function for tests
  function debugId(id: number, offset: number) { // id should be of type int and the first field in the object
    for (const [_, addr] of refMap) {
        let n = load_bignum(memHeap[addr/4 + dataOffset + 1], importObject.libmemory.load);
        if (n as any == id) {
            return memHeap[addr/4 + offset];
        }
    }
    throw new Error(`no such id: ${id}`);
  }
  it(name, async () => {
    await run(source);
    for (const p of pairs) {
      chai.expect(debugId(p[0], p[1])).to.eq(p[2])
    }
  });
}
export function assertHeap(name:string, source: string, heap: memAddr) {
  it(name, async () => {
    await run(source);
    chai.expect(compact()).to.eq(heap)
  });
}


