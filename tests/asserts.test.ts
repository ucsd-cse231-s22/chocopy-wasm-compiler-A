import "mocha";
import { expect } from "chai";
import { BasicREPL } from "../repl";
import { Value } from "../ast";
import { importObject } from "./import-object.test";
import { run, typeCheck } from "./helpers.test";
import { fail } from 'assert'


// Clear the output before every test
beforeEach(function () {
  importObject.output = "";
});

// suppress console logging so output of mocha is clear
before(function () {
  console.log = function () { };
});

export function assert(name: string, source: string, expected: Value) {
  it(name, async () => {
    const repl = new BasicREPL(importObject);
    const result = await repl.run(source);
    expect(result).to.deep.eq(expected);
  });
}

export async function assertOptimize(name: string, source: string, expected: { print: Array<string>, isIrDifferent: boolean }) {
  it(name, async () => {
    const repl = new BasicREPL(importObject);
    const [ preOptimizedIr, optimizedIr ] = repl.optimize(source);

    if (!expected.isIrDifferent)
      expect(preOptimizedIr).to.deep.eq(optimizedIr);
    else
      expect(preOptimizedIr).to.not.deep.eq(optimizedIr);
    await repl.run(source);
    expect(importObject.output.trim().split('\n')).to.deep.eq(expected.print);
  });
}

export function asserts(name: string, pairs: Array<[string, Value]>) {
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
      expect(err.message).to.contain("RUNTIME ERROR:");
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
    expect(function () {
      typeCheck(source);
    }).to.throw('TYPE ERROR:');
  });
}

