import { expect } from 'chai';
import { BasicREPL } from '../repl'
import { Type, Value, Class } from '../ast';
import { NUM, BOOL, NONE } from '../utils';
import { print_class } from '../webstart'



// export function print_class(memory:WebAssembly.Memory, repl: BasicREPL, pointer: number, classname: string, level: number, met_object: Map<number, number>, object_number: number): Array<string> {

//     var fields_offset_ = repl.currentEnv.classes.get(classname);
//     var fields_type = repl.currentTypeEnv.classes.get(classname)[0];
//     var mem = new Uint32Array(memory.buffer);
//     var display: Array<string> = [];
//     // A[1][0] refers to the offset value of field A, sorted by the offset value to ensure the iteration has a consistent order. 
//     var fields_offset = Array.from(fields_offset_.entries());
//     fields_offset.sort((a, b) => {
//       return a[1][0] - b[1][0];
//     });
//     // the reason why pointer beacuse mem is u32 array(4 byte addressing) and the pointer value returned by the run method is in raw address(byte adress)
//     // surprisingly(since there is also i64 in wasm), the offset stored int the currentenv is in 4 byte addressing.
//     const space = " ";
//     if (met_object.has(pointer)) {
//       display.push(`${space.repeat(level)}displayed ${met_object.get(pointer)}:${classname} object at addr ${pointer}: ...`);
//       return display;
//     }
//     display.push(
//       `${space.repeat(level)}${object_number}:${classname} object at addr ${pointer}: {`);
//     met_object.set(pointer, object_number)
//     fields_offset.forEach(thisfield => {
//       var thisfield_type = fields_type.get(thisfield[0]);
//       if (thisfield_type.tag === "class") {
//         if (mem[pointer / 4 + thisfield[1][0]] === 0) {
//           display.push(`${space.repeat(level + 2)}${thisfield[0]} : none `);
//         } else {
//           display.push(`${space.repeat(level + 2)}${thisfield[0]}:{`)
//           display.push(...print_class(memory, repl, mem[pointer / 4 + thisfield[1][0]], thisfield_type.name, level + 5, met_object, object_number + 1));
//           display.push(`${space.repeat(level + 2)}}`)
//         }
//       } else {
//         display.push(`${space.repeat(level + 2)}${thisfield[0]} : ${stringify(thisfield_type, mem[pointer / 4 + thisfield[1][0]])} `);
//       }
//     }
//     )
//     display.push(
//       `${space.repeat(level + 1)}}`);
//     return display;
//   }
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

});



    // TODO: add additional tests here to ensure parse works as expected
