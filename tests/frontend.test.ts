import * as mocha from 'mocha';
import { expect } from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';
import { BasicREPL } from '../repl'
import { Type, Value, Class } from '../ast';
import { defaultTypeEnv } from '../type-check';
import { NUM, BOOL, NONE } from '../utils';
import CodeMirror from 'codemirror';
import { print_class } from '../webstart'
import "codemirror/addon/edit/closebrackets";
import "codemirror/mode/python/python";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/lint/lint";

import "codemirror/addon/scroll/simplescrollbars";
import "./style.scss";
// We write tests for each function in parser.ts here. Each function gets its 
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected. 

function print(typ: Type, arg: number): any {
    console.log("Logging from WASM: ", arg);
    const elt = document.createElement("pre");
    document.getElementById("output").appendChild(elt);
    elt.innerText = stringify(typ, arg);
    return arg;
}
function stringify(typ: Type, arg: any): string {
    switch (typ.tag) {
        case "number":
            return (arg as number).toString();
        case "bool":
            return (arg as boolean) ? "True" : "False";
        case "none":
            return "None";
        case "class":
            return typ.name;
    }
}
function assert_not_none(arg: any): any {
    if (arg === 0)
        throw new Error("RUNTIME ERROR: cannot perform operation on none");
    return arg;
}


describe('print simple class', () => {
    it("sdfs", async () => {
        const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
        const memoryModule = await fetch('memory.wasm').then(response =>
            response.arrayBuffer()
        ).then(bytes =>
            WebAssembly.instantiate(bytes, { js: { mem: memory } })
        );
        var importObject = {
            imports: {
                assert_not_none: (arg: any) => assert_not_none(arg),
                print_num: (arg: number) => print(NUM, arg),
                print_bool: (arg: number) => print(BOOL, arg),
                print_none: (arg: number) => print(NONE, arg),
                abs: Math.abs,
                min: Math.min,
                max: Math.max,
                pow: Math.pow
            },
            libmemory: memoryModule.instance.exports,
            memory_values: memory,
            js: { memory: memory }
        };
        var repl = new BasicREPL(importObject);
        var source =
`class C:
    a : int = 1
    b : int = 2
c : C = None
c = C()`
        repl.run(source).then((r) => {
            if (r.tag === "object") {

                var pr = print_class(memory, repl, r.address, r.name, 0, new Map(), 1).join("\n")

                expect(pr).equal(
`
1:C object at addr 4: {
    a : 1 
    b : 2 
   }
`
                )
            }

        })
    })

    // TODO: add additional tests here to ensure traverseExpr works as expected
});



    // TODO: add additional tests here to ensure parse works as expected
