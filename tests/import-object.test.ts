import { readFileSync } from "fs";

enum Type { Num, Bool, None, Str }

function stringify(typ: Type, arg: any, memory: WebAssembly.Memory) : string {
  switch(typ) {
    case Type.Num:
      return (arg as number).toString();
    case Type.Bool:
      return (arg as boolean)? "True" : "False";
    case Type.None:
      return "None";
    case Type.Str:
      var i32 = new Uint32Array(memory.buffer);
      var length = i32[arg/4];
      var output = "";
      for (let idx = 0;idx < length; idx++) {
        output += String.fromCharCode(i32[idx+arg/4+1]);
      }
      return output;
  }
}

function print(typ: Type, arg : number, memory: WebAssembly.Memory) : any {
  importObject.output += stringify(typ, arg, memory);
  importObject.output += "\n";
  return arg;
}

function print_char(arg : number, memory: WebAssembly.Memory) : any {
  importObject.output += String.fromCharCode(arg);
  importObject.output += "\n";
  return arg;
}

function assert_not_none(arg: any) : any {
  if (arg === 0)
    throw new Error("RUNTIME ERROR: cannot perform operation on none");
  return arg;
}

function assert_check_bounds(listLength: any, Index: any) : void {
  if (Index >= listLength || Index < 0)
    throw new Error("RUNTIME ERROR: out of bounds");
}
let memory : WebAssembly.Memory;

export async function addLibs() {
  const bytes = readFileSync("build/memory.wasm");
  memory = new WebAssembly.Memory({initial:10, maximum:100});
  const memoryModule = await WebAssembly.instantiate(bytes, { js: { mem: memory } })
  importObject.libmemory = memoryModule.instance.exports,
  importObject.memory_values = memory;
  importObject.js = {memory};
  return importObject;
}

export const importObject : any = {
  imports: {
    // we typically define print to mean logging to the console. To make testing
    // the compiler easier, we define print so it logs to a string object.
    //  We can then examine output to see what would have been printed in the
    //  console.
    assert_not_none: (arg: any) => assert_not_none(arg),
    assert_check_bounds: (arg1: any, arg2: any) => assert_check_bounds(arg1, arg2),
    print_num: (arg: number) => print(Type.Num, arg, memory),
    print_bool: (arg: number) => print(Type.Bool, arg, memory),
    print_none: (arg: number) => print(Type.None, arg, memory),
    print_str: (arg: number) => print(Type.Str, arg, memory),
    print_char: (arg: number) => print_char(arg, memory),
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    pow: Math.pow
  },

  output: "",
};
