import { Value, Type, Annotation, Literal } from "./ast";

export const bigMath = {
  // https://stackoverflow.com/a/64953280
  abs(x: bigint) {
    return x < BigInt(0) ? -x : x
  },
  sign(x: bigint) {
    if (x === BigInt(0)) return BigInt(0)
    return x < BigInt(0) ? BigInt(-1) : BigInt(1)
  },
  pow(base: bigint, exponent: bigint) {
    return base ** exponent
  },
  min(value: bigint, ...values: bigint[]) {
    for (const v of values)
      if (v < value) value = v
    return value
  },
  max(value: bigint, ...values: bigint[]) {
    for (const v of values)
      if (v > value) value = v
    return value
  },
  add(value1: bigint, value2: bigint) {
    return value1 + value2
  },
  sub(value1: bigint, value2: bigint) {
    return value1 - value2
  },
  mul(value1: bigint, value2: bigint) {
    return value1 * value2
  },
  div(value1: bigint, value2: bigint) {
    return value1 / value2
  },
  mod(value1: bigint, value2: bigint) {
    return value1 % value2
  },
  eq(value1: bigint, value2: bigint) {
    return value1 === value2
  },
  neq(value1: bigint, value2: bigint) {
    return value1 !== value2
  },
  lte(value1: bigint, value2: bigint) {
    return value1 <= value2
  },
  gte(value1: bigint, value2: bigint) {
    return value1 >= value2
  },
  lt(value1: bigint, value2: bigint) {
    return value1 < value2
  },
  gt(value1: bigint, value2: bigint) {
    return value1 > value2
  },
}

export const floatMath = {
  // https://stackoverflow.com/a/64953280
  abs(x: number) {
    return x < 0 ? -x : x
  },
  sign(x: number) {
    if (x === 0) return 0
    return x < 0 ? -1 : 1
  },
  pow(base: number, exponent: number) {
    return base ** exponent
  },
  min(value: number, ...values: number[]) {
    for (const v of values)
      if (v < value) value = v
    return value
  },
  max(value: number, ...values: number[]) {
    for (const v of values)
      if (v > value) value = v
    return value
  },
  add(value1: number, value2: number) {
    return value1 + value2
  },
  sub(value1: number, value2: number) {
    return value1 - value2
  },
  mul(value1: number, value2: number) {
    return value1 * value2
  },
  div(value1: number, value2: number) {
    return value1 / value2
  },
  eq(value1: number, value2: number) {
    return Math.abs(value1-value2) < 0.00000001
  },
  neq(value1: number, value2: number) {
    return value1 !== value2
  },
  lte(value1: number, value2: number) {
    return value1 <= value2
  },
  gte(value1: number, value2: number) {
    return value1 >= value2
  },
  lt(value1: number, value2: number) {
    return value1 < value2
  },
  gt(value1: number, value2: number) {
    return value1 > value2
  },
}

export function des_check(hashNext: boolean) : boolean {
  if(hashNext === false) {
    throw new Error(`invalid assignment`);
  }
  return hashNext;
}

export function bignum_to_i32(addr: number, loader: WebAssembly.ExportValue) : number {
  const bignum = load_bignum(addr, loader);
  if(bignum > 2**32 || bignum < -(2**32))
    throw new Error("bignum is too large for an i32");
  return Number(bignum);
}

export function binop_bignum(args: number[], builtin: Function, libmem: WebAssembly.Exports): number {
  var rslt : bigint = BigInt(0);
  const load = libmem.load;
  
  if(args.length === 2)
    rslt = builtin(load_bignum(args[0], load), load_bignum(args[1], load));
  else
    throw new Error("Runtime Error: too many arguments for builtin functions");
  return save_bignum(rslt, libmem);
}

export function binop_comp_bignum(args: number[], builtin: Function, libmem: WebAssembly.Exports): number {
  var rslt : bigint = BigInt(0);
  const load = libmem.load;
  
  if(args.length === 2)
    rslt = builtin(load_bignum(args[0], load), load_bignum(args[1], load));
  else
    throw new Error("Runtime Error: too many arguments for builtin functions");
  return Number(rslt);
}

export function load_bignum(addr: number, loader: WebAssembly.ExportValue): bigint {
  const load = loader as CallableFunction;
  if (addr === 0) 
    return BigInt(0);
  const numlength = load(addr, 0);
  var bignum : bigint = BigInt(0);
  for (let i = Math.abs(numlength); i > 0; i--) {
    bignum <<= BigInt(31);
    bignum += BigInt(load(addr, i) & 0x7fffffff); // mask number to 2^31
  }
  if (numlength < 0)
    bignum *= BigInt(-1);
  return bignum;
}

export function load_float(addr: number, loader: WebAssembly.ExportValue): number {
  const load_float = loader as CallableFunction;
  return Number(load_float(addr,0));
}

export function alloc_bignum(numlength: number, allocator: WebAssembly.ExportValue): number {
  const alloc = allocator as CallableFunction;
  // allocate one extra space for metadata (length)
  return alloc(Math.abs(numlength)+1);
}

export function store_bignum(addr: number, numlength: number, digits: number[], storer: WebAssembly.ExportValue) {
  const store = storer as CallableFunction;
  store(addr, 0, numlength);
  digits.forEach((d, i) => {
    store(addr, i+1, d);
  });
}

export function save_bignum(bignum: bigint, libmem: WebAssembly.Exports): number {
  const alloc = libmem.alloc;
  const store = libmem.store;
  const neg = bignum < 0;
  if (neg)
    bignum *= BigInt(-1);
  const digits :number[] = [];
  while (bignum > 0) {
    digits.push(Number(bignum & BigInt(0x7fffffff))); // mask number to 2^31
    bignum = bignum >> BigInt(31);
  }
  const numlength = neg? digits.length * -1: digits.length;
  if (numlength === 0) 
    return 0;
  const addr = alloc_bignum(numlength, alloc);
  store_bignum(addr, numlength, digits, store);
  return addr;
}

export function builtin_bignum(args: number[], builtin: Function, libmem: WebAssembly.Exports): number {
  var rslt : bigint = BigInt(0);
  const load = libmem.load;
  if(args.length === 1)
    rslt = builtin(load_bignum(args[0], load));
  else if(args.length === 2)
    rslt = builtin(load_bignum(args[0], load), load_bignum(args[1], load));
  else
    throw new Error("Runtime Error: too many arguments for builtin functions");
  return save_bignum(rslt, libmem);
}

export function binop_float(args: number[], builtin: Function, libmem: WebAssembly.Exports): number {
  var rslt : number = 0;
  const load = libmem.load_float;
  
  if(args.length === 2)
    rslt = builtin(load_float(args[0], load), load_float(args[1], load));
  else
    throw new Error("Runtime Error: too many arguments for builtin functions");
  return save_float(rslt, libmem);
}

export function binop_comp_float(args: number[], builtin: Function, libmem: WebAssembly.Exports): number {
  var rslt : number = 0;
  const load = libmem.load_float;
  
  if(args.length === 2)
    rslt = builtin(load_float(args[0], load), load_float(args[1], load));
  else
    throw new Error("Runtime Error: too many arguments for builtin functions");
  return Number(rslt);
}

export function save_float(float: number, libmem: WebAssembly.Exports): number {
  const alloc = libmem.alloc;
  const store = libmem.store_float;
  const addr = alloc_float(1, alloc);
  store_float(addr, float, store);
  return addr;
}

export function alloc_float(numlength: number, allocator: WebAssembly.ExportValue): number {
  const alloc = allocator as CallableFunction;
  return alloc(Math.abs(numlength));
}

export function store_float(addr: number, num: number, storer: WebAssembly.ExportValue) {
  const store = storer as CallableFunction;
  store(addr, 0, num);
}

export function builtin_float(args: number[], builtin: Function, libmem: WebAssembly.Exports): number {
  var rslt : number = 0;
  const load = libmem.load_float;
  if(args.length === 1)
    rslt = builtin(load_float(args[0], load));
  else if(args.length === 2)
    rslt = builtin(load_float(args[0], load), load_float(args[1], load_float));
  else
    throw new Error("Runtime Error: too many arguments for builtin functions");
  return save_float(rslt, libmem);
}

export function PyValue(typ: Type, result: bigint): Value<Annotation> {
  switch (typ.tag) {
    case "number":
      return PyInt(result);
    case "float":
      return PyFloat(result);
    case "bool":
      return PyBool(Boolean(result));
    case "class":
      return PyObj(typ.name, Number(result));
    case "none":
      return PyNone();
  }
}

export function PyInt(n: bigint): Value<Annotation> {
  return { tag: "num", value: n };
}

export function PyFloat(n: bigint): Value<Annotation> {
  return { tag: "float", value: Number(n)};
} 

export function PyBool(b: boolean): Value<Annotation> {
  return { tag: "bool", value: b };
}

export function PyObj(name: string, address: number): Value<Annotation> {
  if (address === 0) return PyNone();
  else return { tag: "object", name, address };
}

export function PyNone(): Value<Annotation> {
  return { tag: "none" };
}

export function PyZero(): Literal<Annotation> {
  return { tag: "zero" };
}

export const NUM : Type = {tag: "number"};
export const FLOAT : Type = {tag: "float"};
export const BOOL : Type = {tag: "bool"};
export const NONE : Type = {tag: "none"};
export const ELLIPSIS : Type = {tag: "..."};
export function LIST(itemType : Type) : Type {return {tag: "list", itemType}};
export function EMPTY(): Type {return {tag: "empty"}};

export function CLASS(name : string, params: Array<Type> = []) : Type {return {tag: "class", name, params}};
export function TYPEVAR(name: string) : Type {return {tag: "typevar", name}};
export function CALLABLE(params: Array<Type>, ret: Type) : Type {return {tag: "callable", params, ret}};

export const APPLY : string = "apply";
export function createMethodName(cls: string, method: string): string{
  return `${cls}$${method}`;
}

export function makeWasmFunType(paramNum: number): string {
  return `$callable${paramNum}param`;
}
