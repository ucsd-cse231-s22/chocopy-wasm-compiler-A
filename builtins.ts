import { bigMath } from "./utils";
import { builtin_bignum } from "./utils";
import { comb, factorial, gcd, lcm, perm } from "./stdlib/math";
import { NUM, FLOAT } from "./utils";
import { Type } from "./ast";
import { randint, randrange } from "./stdlib/random";

export type BuiltinFunction = {
  name: string;
  mod: string;
  args: Array<Type>;
  ret: Type;
  fn: Function;
  need_import: boolean; // whether we import this by default
  is_bignum: boolean; // whether we need libmem to call this, workaround bignum
};

// Database for builtin functions
export const builtins: Array<BuiltinFunction> = [
  // Original Builtin Functions
  {
    name: "abs",
    mod: "builtins",
    args: [NUM],
    ret: NUM,
    fn: bigMath.abs,
    need_import: false,
    is_bignum: true,
  },
  {
    name: "max",
    mod: "builtins",
    args: [NUM, NUM],
    ret: NUM,
    fn: bigMath.max,
    need_import: false,
    is_bignum: true,
  },
  {
    name: "min",
    mod: "builtins",
    args: [NUM, NUM],
    ret: NUM,
    fn: bigMath.min,
    need_import: false,
    is_bignum: true,
  },
  {
    name: "pow",
    mod: "builtins",
    args: [NUM, NUM],
    ret: NUM,
    fn: bigMath.pow,
    need_import: false,
    is_bignum: true,
  },
  {
    name: "comb",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: comb,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "perm",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: perm,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "gcd",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: gcd,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "lcm",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: lcm,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "factorial",
    mod: "math",
    args: [NUM],
    ret: NUM,
    fn: factorial,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "randint",
    mod: "random",
    args: [NUM, NUM],
    ret: NUM,
    fn: randint,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "randrange",
    mod: "random",
    args: [NUM],
    ret: NUM,
    fn: randrange,
    need_import: true,
    is_bignum: true,
  },
];

export function isBuiltin(name: string): boolean {
  return builtins.some((b) => b.name === name);
}

export function isBuiltinNumArgs(name: string, n_args: number): boolean {
  const b = builtins.find((b) => b.name === name);
  if (b === undefined) {
    return false;
  }
  return b.args.length === n_args;
}

export function findBuiltinByName(name: string): BuiltinFunction {
  return builtins.find((b) => b.name === name);
}

export function generateImportMap(
  imports: Map<string, Array<string>>,
  importObject: any
) {
  builtins.forEach((b) => {
    if (
      !b.need_import ||
      (imports.has(b.mod) && imports.get(b.mod).includes(b.name))
    ) {
      if (b.is_bignum) {
        // rewrite function to use builtin_bignum and libmem
        if (b.args.length == 1) {
          importObject.imports[b.name] = (arg: number) =>
            builtin_bignum([arg], b.fn, importObject.libmemory);
        } else if (b.args.length == 2) {
          importObject.imports[b.name] = (arg1: number, arg2: number) =>
            builtin_bignum([arg1, arg2], b.fn, importObject.libmemory);
        } else {
          throw new Error(`unexpected number of args for ${b.name}`);
        }
      } else importObject.imports[b.name] = b.fn(...b.args);
    }
  });
}

export function generateWasmSource(imports: Map<string, Array<string>>) {
  let source = "";
  builtins.forEach((b) => {
    if (
      !b.need_import ||
      (imports.has(b.mod) && imports.get(b.mod).includes(b.name))
    ) {
      // (func $abs (import "imports" "abs") (param i32) (result i32))
      if (b.args.length == 1)
        source += `(func \$${b.name} (import "imports" "${b.name}") (param i32) (result i32))\n`;
      // (func $min (import "imports" "min") (param i32) (param i32) (result i32))
      else if (b.args.length == 2)
        source += `(func \$${b.name} (import "imports" "${b.name}") (param i32) (param i32) (result i32))\n`;
      else throw new Error(`unexpected number of args for ${b.name}`);
    }
  });
  return source;
}
