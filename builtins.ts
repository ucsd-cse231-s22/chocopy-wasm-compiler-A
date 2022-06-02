import { bigMath, builtin_float } from "./utils";
import { builtin_bignum } from "./utils";
import { NUM, FLOAT } from "./utils";
import { Type } from "./ast";

import { comb, factorial, gcd, lcm, perm } from "./stdlib/math";
import { randint, randrange } from "./stdlib/random";
import { ceil, cos, exp, floor, fpow, log, log10, log2, round, sin, sqrt, tan } from "./stdlib/float_math";

export type BuiltinFunction = {
  name: string;
  mod: string;
  args: Array<Type>;
  ret: Type;
  fn: Function;
  need_import: boolean; // whether we import this by default
  num_type: string; // whether we need libmem to call this, workaround bignum/float
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
    num_type: "bignum",
  },
  {
    name: "max",
    mod: "builtins",
    args: [NUM, NUM],
    ret: NUM,
    fn: bigMath.max,
    need_import: false,
    num_type: "bignum",
  },
  {
    name: "min",
    mod: "builtins",
    args: [NUM, NUM],
    ret: NUM,
    fn: bigMath.min,
    need_import: false,
    num_type: "bignum",
  },
  {
    name: "pow",
    mod: "builtins",
    args: [NUM, NUM],
    ret: NUM,
    fn: bigMath.pow,
    need_import: false,
    num_type: "bignum",
  },
  {
    name: "comb",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: comb,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "perm",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: perm,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "gcd",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: gcd,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "lcm",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: lcm,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "factorial",
    mod: "math",
    args: [NUM],
    ret: NUM,
    fn: factorial,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "randint",
    mod: "random",
    args: [NUM, NUM],
    ret: NUM,
    fn: randint,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "randrange",
    mod: "random",
    args: [NUM],
    ret: NUM,
    fn: randrange,
    need_import: true,
    num_type: "bignum",
  },
  {
    name: "ceil",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: ceil,
    need_import: true,
    num_type: "float",
  },
  {
    name: "floor",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: floor,
    need_import: true,
    num_type: "float",
  },
  {
    name: "round",
    mod: "float_math",

    args: [FLOAT],
    ret: FLOAT,
    fn: round,
    need_import: true,
    num_type: "float",
  },
  {
    name: "exp",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: exp,
    need_import: true,
    num_type: "float",
  },
  {
    name: "log",
    mod: "float_math",
    args: [FLOAT, FLOAT],
    ret: FLOAT,
    fn: log,
    need_import: true,
    num_type: "float",
  },
  {
    name: "log2",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: log2,
    need_import: true,
    num_type: "float",
  },
  {
    name: "log10",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: log10,
    need_import: true,
    num_type: "float",
  },
  {
    name: "fpow",
    mod: "float_math",
    args: [FLOAT, FLOAT],
    ret: FLOAT,
    fn: fpow,
    need_import: true,
    num_type: "float",
  },
  {
    name: "sqrt",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: sqrt,
    need_import: true,
    num_type: "float",
  },
  {
    name: "sin",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: sin,
    need_import: true,
    num_type: "float",
  },
  {
    name: "cos",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: cos,
    need_import: true,
    num_type: "float",
  },
  {
    name: "tan",
    mod: "float_math",
    args: [FLOAT],
    ret: FLOAT,
    fn: tan,
    need_import: true,
    num_type: "float",
  }
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
      if (b.num_type == "bignum") {
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
      } else if (b.num_type == "float") {
        // rewrite function to use builtin_float and libmem
        if (b.args.length == 1) {
          importObject.imports[b.name] = (arg: number) =>
            builtin_float([arg], b.fn, importObject.libmemory);
        } else if (b.args.length == 2) {
          importObject.imports[b.name] = (arg1: number, arg2: number) =>
            builtin_float([arg1, arg2], b.fn, importObject.libmemory);
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
