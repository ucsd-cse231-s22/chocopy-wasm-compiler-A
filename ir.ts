import {Type, BinOp, UniOp, Parameter} from './ast';

export type Program<A> = { a?: A, strinits: Array<VarInit<A>>, strstmts: Array<Stmt<A>>, inits: Array<VarInit<A>>, classes: Array<Class<A>>, fundefs: Array<FunDef<A>>, body: Array<BasicBlock<A>>, vtable: Vtable}

export type Vtable = Map<number,Array<[string, string]>>;

export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, superclass: string}

export type VarInit<A> = { a?: A, name: string, type: Type, value: Value<A> }

export type GlobalDecl<A> = { a?: A, name: string }

export type NonLocalDecl<A> = { a?: A, name: string }

export type FunDef<A> = { a?: A, name: string, parameters: Array<Parameter<A>>, fundefs: Array<FunDef<A>>, 
  ret: Type, inits: Array<VarInit<A>>, body: Array<BasicBlock<A>>,
  globaldecls: Array<GlobalDecl<A>>, nonlocaldecls: Array<NonLocalDecl<A>> }

export type BasicBlock<A> = 
| {  a?: A, label: string, stmts: Array<Stmt<A>> }

export type Stmt<A> =
  | {  a?: A, tag: "assign", name: string, value: Expr<A> }
  | {  a?: A, tag: "return", value: Value<A> }
  | {  a?: A, tag: "expr", expr: Expr<A> }
  | {  a?: A, tag: "pass" }
  | {  a?: A, tag: "ifjmp", cond: Value<A>, thn: string, els: string }
  | {  a?: A, tag: "jmp", lbl: string }

  | { a?: A, tag: "store", start: Value<A>, offset: Value<A>, value: Value<A> } // start should be an id
  | { a?: A, tag: "for", iterator: string, iterable: Value<A>, body: Array<Stmt<A>> }
  | { a?: A, tag: "for-str", iterator: string, iterable: Value<A>, body: Array<Stmt<A>> }
  | { a?: A, tag: "list-store", start: Value<A>, offset: Value<A>, value: Value<A> } // start should be an id

export type Expr<A> =
  | {  a?: A, tag: "value", value: Value<A> }
  | {  a?: A, tag: "binop", op: BinOp, left: Value<A>, right: Value<A>}
  | {  a?: A, tag: "uniop", op: UniOp, expr: Value<A> }
  | {  a?: A, tag: "builtin1", name: string, arg: Value<A> }
  | {  a?: A, tag: "builtin2", name: string, left: Value<A>, right: Value<A>}
  | {  a?: A, tag: "call", name: string, arguments: Array<Value<A>> } 
  | {  a?: A, tag: "call-indirect", arguments: Array<Value<A>> }

  | {  a?: A, tag: "alloc", amount: Value<A> }
  | {  a?: A, tag: "load", start: Value<A>, offset: Value<A> }
  | {  a?: A, tag: "list-load", start: Value<A>, offset: Value<A> }
  | {  a?: A, tag: "str-load", start: Value<A>, offset: Value<A> }
  | {  a?: A, tag: "cond-expr", ifobj: Value<A>, elseobj: Value<A>, cond: Value<A> }

export type Value<A> = 
    { a?: A, tag: "num", value: bigint }
  | { a?: A, tag: "wasmint", value: number }
  | { a?: A, tag: "bool", value: boolean }
  | { a?: A, tag: "id", name: string }
  | { a?: A, tag: "none" }


