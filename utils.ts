import { Value, Type, Annotation } from "./ast";

export function PyValue(typ: Type, result: number): Value<Annotation> {
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

export function PyInt(n: number): Value<Annotation> {
  return { tag: "num", value: n };
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

export const NUM : Type = {tag: "number"};
export const BOOL : Type = {tag: "bool"};
export const NONE : Type = {tag: "none"};
export function CLASS(name : string) : Type {return {tag: "class", name}};
