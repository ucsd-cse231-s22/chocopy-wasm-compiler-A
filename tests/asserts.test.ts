import "mocha";
import { expect } from "chai";
import { BasicREPL } from "../repl";
import { Value, Annotation } from "../ast";
import { importObject } from "./import-object.test";
import {run, typeCheck} from "./helpers.test";
import { fail } from 'assert'
import { compact, debugId, memAddr, debugMemAlloc } from "../memory";



// Clear the output before every test
beforeEach(function () {
  importObject.output = "";
});

// suppress console logging so output of mocha is clear
before(function () {
  console.log = function () {};
});

export function assert(name: string, source: string, expected: Value<Annotation>) {
  it(name, async () => {
    const repl = new BasicREPL(importObject);
    const result = await repl.run(source);
    expect(result).to.deep.eq(expected);
  });
}

export function asserts(name: string, pairs: Array<[string, Value<Annotation>]>) {
  const repl = new BasicREPL(importObject);

  it(name, async () => {
    for (let i = 0; i < pairs.length; i++) {
      const result = await repl.run(pairs[i][0]);
      expect(result).to.deep.eq(pairs[i][1]);
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
      expect(String(err)).to.contain("RUNTIME ERROR:");
    }
  });
}


export function assertPrint(name: string, source: string, expected: Array<string>) {
  it(name, async () => {
    await run(source);
    const output = importObject.output;
    expect(importObject.output.trim().split("\n")).to.deep.eq(expected);
  });
}

export function assertTC(name: string, source: string, result: any) {
  it(name, async () => {
      const typ = typeCheck(source);
      expect(typ).to.deep.eq(result);
  });
}

export function assertTCFail(name: string, source: string) {
  it(name, async () => {
    expect(function(){
      typeCheck(source);
  }).to.throw('TYPE ERROR:');
  });
}

export function assertMemState(name: string, source: string, pairs: Array<[number, number, number]>) {
  it(name, async () => {
    await run(source);
    for (const p of pairs) {
      expect(debugId(p[0], p[1])).to.eq(p[2])
    }
  });
}
export function assertHeap(name:string, source: string, heap: memAddr) {
  it(name, async () => {
    await run(source);
    expect(compact()).to.eq(heap)
  });
}

export function assertMemAlloc(name: string, source: string, expected: number) {
  it(name, async () => {
    await run(source);
    expect(debugMemAlloc()).to.eq(expected)
  });
}