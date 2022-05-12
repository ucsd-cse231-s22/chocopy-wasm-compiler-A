import {Type, BinOp, UniOp, Parameter} from './ast';

export type Program<A> = { a?: A, funs: Array<FunDef<A>>, inits: Array<VarInit<A>>, classes: Array<Class<A>>, body: Array<BasicBlock<A>> }

export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>}

export type VarInit<A> = { a?: A, name: string, type: Type, value: Value<A> }

export type FunDef<A> = { a?: A, name: string, parameters: Array<Parameter<A>>, ret: Type, inits: Array<VarInit<A>>, body: Array<BasicBlock<A>> }

export type BasicBlock<A> = 
| {  a?: A, label: string, stmts: Array<Stmt<A>> }

export type Stmt<A> =
  | {  a?: A, tag: "assign", destruct: DestructuringAssignment<A>, value: Expr<A> }
  | {  a?: A, tag: "return", value: Value<A> }
  | {  a?: A, tag: "expr", expr: Expr<A> }
  | {  a?: A, tag: "pass" }
  | {  a?: A, tag: "ifjmp", cond: Value<A>, thn: string, els: string }
  | {  a?: A, tag: "jmp", lbl: string }

  | { a?: A, tag: "store", start: Value<A>, offset: Value<A>, value: Value<A> } // start should be an id

export type DestructuringAssignment<A> = { a?: A, isSimple: boolean, vars: AssignVar<A>[] }

export type AssignVar<A> = { a?: A, target: Assignable<A>, ignorable: boolean }

export type Assignable<A> =
  | { a?: A; tag: "id"; name: string }
  | { a?: A; tag: "lookup"; obj: Expr<A>; field: string }

export type Expr<A> =
  | {  a?: A, tag: "value", value: Value<A> }
  | {  a?: A, tag: "binop", op: BinOp, left: Value<A>, right: Value<A>}
  | {  a?: A, tag: "uniop", op: UniOp, expr: Value<A> }
  | {  a?: A, tag: "builtin1", name: string, arg: Value<A> }
  | {  a?: A, tag: "builtin2", name: string, left: Value<A>, right: Value<A>}
  | {  a?: A, tag: "call", name: string, arguments: Array<Value<A>> } 

  | {  a?: A, tag: "alloc", amount: Value<A> }
  | {  a?: A, tag: "load", start: Value<A>, offset: Value<A> }
  // array-expr should be plain format like 1, 2, 3 without brackets
  | {  a?: A; tag: "array-expr", elements: Array<Expr<A>> }

export type Value<A> = 
    { a?: A, tag: "num", value: bigint }
  | { a?: A, tag: "wasmint", value: number }
  | { a?: A, tag: "bool", value: boolean }
  | { a?: A, tag: "id", name: string }
  | { a?: A, tag: "none" }


