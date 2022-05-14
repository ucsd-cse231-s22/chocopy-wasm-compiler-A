import { Value, Type } from "./ast";

export function PyValue(typ: Type, result: number): Value {
  switch (typ.tag) {
    case "number":
      return PyNum(result);
    case "float":
      return PyNum(result);
    case "bool":
      return PyBool(Boolean(result));
    case "class":
      return PyObj(typ.name, result);
    case "none":
      return PyNone();
  }
}

export function PyNum(n: number): Value {
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
export const FLOAT : Type = {tag: "float"};
export const BOOL : Type = {tag: "bool"};
export const NONE : Type = {tag: "none"};
export const ELLIPSIS : Type = {tag: "..."};
export function CLASS(name : string) : Type {return {tag: "class", name}};
