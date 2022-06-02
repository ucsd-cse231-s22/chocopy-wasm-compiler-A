import { bigMath } from "./utils";
import { builtin_bignum } from "./utils";
import { ceil_float, ceil_int, comb, copysign_float, copysign_int,
  fabs_float, fabs_int, factorial, floor_float, floor_int, gcd,
  isfinite_float, isfinite_int, isinf_float, isinf_int, isnan_float, isnan_int,
  isqrt_float, lcm, ldexp, perm, trunc_float, trunc_int, exp, expm1, log,
  logBase, log1p, log10, pow, sqrt, acos, asin, atan, cos, sin, tan, get_pi,
  get_e } from "./stdlib/math";
import { NUM, BOOL, FLOAT, NONE, CLASS, CALLABLE, TYPEVAR, LIST } from './utils';
import { Type } from "./ast";

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
  // Math Module
  {
    name: "ceil_float",
    mod: "math",
    args: [FLOAT],
    ret: NUM,
    fn: ceil_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "ceil_int",
    mod: "math",
    args: [NUM],
    ret: NUM,
    fn: ceil_int,
    need_import: true,
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
    name: "copysign_float",
    mod: "math",
    args: [FLOAT, FLOAT],
    ret: FLOAT,
    fn: copysign_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "copysign_int",
    mod: "math",
    args: [NUM, NUM],
    ret: NUM,
    fn: copysign_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "fabs_float",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: fabs_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "fabs_int",
    mod: "math",
    args: [NUM],
    ret: NUM,
    fn: fabs_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "floor_float",
    mod: "math",
    args: [FLOAT],
    ret: NUM,
    fn: floor_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "floor_int",
    mod: "math",
    args: [NUM],
    ret: NUM,
    fn: floor_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isfinite_float",
    mod: "math",
    args: [FLOAT],
    ret: BOOL,
    fn: isfinite_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isfinite_int",
    mod: "math",
    args: [NUM],
    ret: BOOL,
    fn: isfinite_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isinf_float",
    mod: "math",
    args: [FLOAT],
    ret: BOOL,
    fn: isinf_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isinf_int",
    mod: "math",
    args: [NUM],
    ret: BOOL,
    fn: isinf_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isnan_float",
    mod: "math",
    args: [FLOAT],
    ret: BOOL,
    fn: isnan_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isnan_int",
    mod: "math",
    args: [NUM],
    ret: BOOL,
    fn: isnan_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "isqrt_float",
    mod: "math",
    args: [FLOAT],
    ret: NUM,
    fn: isqrt_float,
    need_import: true,
    is_bignum: true,
  },
  // for many of the rest of these math functions, we're assuming floats
  // but theoretically, ints should work with some modification.
  {
    name: "ldexp",
    mod: "math",
    args: [FLOAT, FLOAT],
    ret: FLOAT,
    fn: ldexp,
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
    name: "trunc_float",
    mod: "math",
    args: [FLOAT],
    ret: NUM,
    fn: trunc_float,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "trunc_int",
    mod: "math",
    args: [NUM],
    ret: NUM,
    fn: trunc_int,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "exp",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: exp,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "expm1",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: expm1,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "log",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: log,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "log_base",
    mod: "math",
    args: [FLOAT,FLOAT],
    ret: FLOAT,
    fn: logBase,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "log1p",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: log1p,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "log10",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: log10,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "pow",
    mod: "math",
    args: [FLOAT, FLOAT],
    ret: FLOAT,
    fn: pow,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "sqrt",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: sqrt,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "acos",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: acos,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "asin",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: asin,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "atan",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: atan,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "cos",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: cos,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "sin",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: sin,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "tan",
    mod: "math",
    args: [FLOAT],
    ret: FLOAT,
    fn: tan,
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
    name: "get_pi",
    mod: "math",
    args: [],
    ret: FLOAT,
    fn: get_pi,
    need_import: true,
    is_bignum: true,
  },
  {
    name: "get_e",
    mod: "math",
    args: [],
    ret: FLOAT,
    fn: get_e,
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
