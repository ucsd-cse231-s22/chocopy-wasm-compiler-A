import { fail } from 'assert';
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import "mocha";
import { Annotation, Value } from "../ast";
import { Program } from '../ir';
import { BasicREPL } from "../repl";
import { run, typeCheck } from "./helpers.test";
import { addLibs, importObject } from "./import-object.test";

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

export async function assertOptimizeIR(name: string, source: string, expectedIR: Program<Annotation>, optimizationSwitch: "0" | "1" | "2") {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    const [ _, optimizedIr ] = repl.optimize(source, optimizationSwitch);
    chai.expect(optimizedIr).excludingEvery(['a', 'label', 'name']).to.deep.eq(expectedIR);
  });
}


export async function assertOptimize(name: string, source: string, expected: { print: Array<string>, isIrDifferent: boolean }, optimizationSwitch: "0" | "1" | "2") {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    const [ preOptimizedIr, optimizedIr ] = repl.optimize(source, optimizationSwitch);
    
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

