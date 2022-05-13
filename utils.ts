import { Value, Type } from "./ast";

export function load_bignum(addr: number, loader: WebAssembly.ExportValue): bigint {
  const load = loader as CallableFunction;
  console.log("load bignum addr"+addr)
  const numlength = load(addr, 0);
  console.log("load bignum len"+numlength)
  var bignum : bigint = BigInt(0);
  console.log(numlength);
  for (let i = Math.abs(numlength); i > 0; i--) {
    bignum <<= BigInt(31);
    bignum += BigInt(load(addr, i) & 0x7fffffff); // mask number to 2^31
  }
  if (numlength < 0)
    bignum *= BigInt(-1);
  return bignum;
}

export function alloc_bignum(numlength: number, allocator: WebAssembly.ExportValue): number {
  const alloc = allocator as CallableFunction;
  return alloc(Math.abs(numlength));
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

export function PyValue(typ: Type, result: number): Value {
  switch (typ.tag) {
    case "number":
      return PyInt(result);
    case "bool":
      return PyBool(Boolean(result));
    case "class":
      return PyObj(typ.name, result);
    case "none":
      return PyNone();
  }
}

export function PyInt(n: number): Value {
  return { tag: "num", value: n };
}

export function PyBool(b: boolean): Value {
  return { tag: "bool", value: b };
}

export function PyObj(name: string, address: number): Value {
  if (address === 0) return PyNone();
  else return { tag: "object", name, address };
}

export function PyNone(): Value {
  return { tag: "none" };
}

export const NUM : Type = {tag: "number"};
export const BOOL : Type = {tag: "bool"};
export const NONE : Type = {tag: "none"};
export function CLASS(name : string) : Type {return {tag: "class", name}};

