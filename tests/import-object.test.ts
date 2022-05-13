import { readFileSync } from "fs";

enum Type { Num, Bool, None, STR }

function stringify(typ: Type, arg: any): string {
  switch (typ) {
    case Type.Num:
      return (arg as number).toString();
    case Type.Bool:
      return (arg as boolean) ? "True" : "False";
    case Type.STR:
      var curChar = String.fromCharCode(arg as number);
      if (curChar === "\0") return "\n";
      return curChar;
    case Type.None:
      return "None";
  }
}

function print(typ: Type, arg: any): any {
  importObject.output += stringify(typ, arg);
  if (typ === Type.STR) return arg;
  importObject.output += "\n";
  return arg;
}

function rte_printarg(arg: any) {
  throw new Error("RUNTIME ERROR: Invalid argument type for print")
}

function assert_not_none(arg: any) : any {
  if (arg === 0)
    throw new Error("RUNTIME ERROR: cannot perform operation on none");
  return arg;
}

function assert_valid_access(length: number, ind: number) : any {
  if (ind >= length || ind < 0)
    throw new Error("RUNTIME ERROR: cannot access list with invalid index");
  return ind;
}

export async function addLibs() {
  const bytes = readFileSync("build/memory.wasm");
  const memory = new WebAssembly.Memory({initial:10, maximum:100});
  var heap = new WebAssembly.Global({value: 'i32', mutable: true}, 4);
  const memoryModule = await WebAssembly.instantiate(bytes, { js: { mem: memory, heap: heap } })
  const lBytes = readFileSync("build/iterable.wasm");
  const iterModule = await WebAssembly.instantiate(lBytes,
    { imports: { print_char: (arg: number) => print(Type.STR, arg) }, js: { mem: memory, heap: heap } })
  importObject.libmemory = memoryModule.instance.exports,
  importObject.libiter = iterModule.instance.exports,
  importObject.memory_values = memory;
  importObject.js = { memory: memory, heap: heap };
  return importObject;
}

export const importObject : any = {
  imports: {
    // we typically define print to mean logging to the console. To make testing
    // the compiler easier, we define print so it logs to a string object.
    //  We can then examine output to see what would have been printed in the
    //  console.
    assert_not_none: (arg: any) => assert_not_none(arg),
    assert_valid_access: (length: number, ind: number) => assert_valid_access(length, ind),
    rte_printarg: (arg: any) => rte_printarg(arg),
    print: (arg: any) => print(Type.Num, arg),
    print_num: (arg: number) => print(Type.Num, arg),
    print_bool: (arg: number) => print(Type.Bool, arg),
    print_none: (arg: number) => print(Type.None, arg),
    print_char: (arg: number) => print(Type.STR, arg),
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
  },

  output: "",
};
