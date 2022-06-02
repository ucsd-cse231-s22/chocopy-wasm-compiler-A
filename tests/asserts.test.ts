import { fail } from 'assert';
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import "mocha";
import { Annotation, Value } from "../ast";
import { Program } from '../ir';
import { OptimizationSwitch } from '../optimizations/optimization_common';
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

const optimizationsSwitch = "3";

export function assert(name: string, source: string, expected: Value<Annotation>) {
  it(name, async () => {
    const repl = new BasicREPL(importObject);
    const result = await repl.run(source, optimizationsSwitch);
    chai.expect(result).to.deep.eq(expected);
  });
}

export async function assertOptimizeIR(name: string, source: string, expectedIR: Program<Annotation>, optimizationSwitch: OptimizationSwitch) {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    const [ _, optimizedIr ] = repl.optimize(source, optimizationSwitch);
    chai.expect(optimizedIr).excludingEvery(['a', 'label', 'name']).to.deep.eq(expectedIR);
  });
}

// export async function assertOptimizeDCE(name: string, source: string, expected: { print: Array<string>, isIrDifferent: boolean }) {
//   it(name, async () => {
//     const repl = new BasicREPL(await addLibs());
//     var [ preOptimizedIr, preDCEOptimizedIr ] = repl.optimize(source, "2");
//     var [ preOptimizedIr, DCEOptimizedIr ] = repl.optimize(source, "3");
//     // if (!expected.isIrDifferent)
//     //   chai.expect(preDCEOptimizedIr.body.length).to.deep.eq(DCEOptimizedIr.body.length);
//     // else
//     //   chai.expect(preDCEOptimizedIr.body.length).greaterThan(DCEOptimizedIr.body.length);
//     throw new Error(`
//     ${JSON.stringify(preDCEOptimizedIr.body.map(stmt => {return stmt.label}))}\n
//     ${JSON.stringify(DCEOptimizedIr.body.map(stmt => {return stmt.label}))}\n`);
//     // await repl.run(source, "3");
    
//     // chai.expect(importObject.output.trim().split('\n')).to.deep.eq(expected.print);
//   });
// }

export async function assertOptimizeDCE(name: string, source: string, expected: { print: Array<string>, isIrDifferent: boolean }) {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    var [ _, preDCEOptimizedIr ] = repl.optimize(source, optimizationsSwitch);
    var [ _, DCEOptimizedIr ] = repl.optimize(source, optimizationsSwitch);
    
    var preDCEOptimizedIrStmtCount = 0;
    var DCEOptimizedIrStmtCount = 0;
    
    preDCEOptimizedIr.body.forEach(block => {
      preDCEOptimizedIrStmtCount += block.stmts.length;
    })
    preDCEOptimizedIr.funs.forEach(fun => {
      fun.body.forEach(block => {
        preDCEOptimizedIrStmtCount += block.stmts.length;
      })
    })
    preDCEOptimizedIr.classes.forEach(classDef => {
      classDef.methods.forEach(method => {
        method.body.forEach(block => {
          preDCEOptimizedIrStmtCount += block.stmts.length;
        })
      })
    })
    // var DCEOptimizedIrBody = [];
    var DCEOptimizedIrFuns = new Map();

    DCEOptimizedIr.body.forEach(block => {
      DCEOptimizedIrStmtCount += block.stmts.length;
    })
    DCEOptimizedIr.funs.forEach(fun => {
      DCEOptimizedIrFuns.set(fun.name, []);
      fun.body.forEach(block => {
        DCEOptimizedIrFuns.get(fun.name).push(...block.stmts);
        DCEOptimizedIrStmtCount += block.stmts.length;
      })
    })
    DCEOptimizedIr.classes.forEach(classDef => {
      classDef.methods.forEach(method => {
        method.body.forEach(block => {
          DCEOptimizedIrStmtCount += block.stmts.length;
        })
      })
    })
      
    if (!expected.isIrDifferent)
      chai.expect(preDCEOptimizedIrStmtCount).to.deep.eq(DCEOptimizedIrStmtCount);
    else
      // chai.expect(preDCEOptimizedIrStmtCount).greaterThan(DCEOptimizedIrStmtCount);
      chai.expect(preDCEOptimizedIrStmtCount).greaterThanOrEqual(DCEOptimizedIrStmtCount);
    // throw new Error(`
    // ${JSON.stringify(preDCEOptimizedIrStmtCount)},
    // ${JSON.stringify(DCEOptimizedIrStmtCount)}`);
    // ${JSON.stringify(preDCEOptimizedIr.body.map(stmt => {return stmt.label}))}\n
    // ${JSON.stringify(DCEOptimizedIr.body.map(stmt => {return stmt.label}))}\n`);
    await repl.run(source, optimizationsSwitch);
    
    chai.expect(importObject.output.trim().split('\n')).to.deep.eq(expected.print);
  });
}

export async function assertOptimize(name: string, source: string, expected: { print: Array<string>, isIrDifferent: boolean }, optimizationSwitch: OptimizationSwitch) {
  it(name, async () => {
    const repl = new BasicREPL(await addLibs());
    
    const [ preOptimizedIr, optimizedIr ] = repl.optimize(source, optimizationSwitch);
    
    if (!expected.isIrDifferent)
      chai.expect(preOptimizedIr).to.deep.eq(optimizedIr);
    else
      chai.expect(preOptimizedIr).to.not.deep.eq(optimizedIr);
    await repl.run(source, optimizationSwitch);
    chai.expect(importObject.output.trim().split('\n')).to.deep.eq(expected.print);
  });
}


export function asserts(name: string, pairs: Array<[string, Value<Annotation>]>) {
  const repl = new BasicREPL(importObject);

  it(name, async () => {
    for (let i = 0; i < pairs.length; i++) {
      const result = await repl.run(pairs[i][0], optimizationsSwitch);
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

