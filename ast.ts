// import { TypeCheckError } from "./type-check";

// export enum Type {NUM, BOOL, NONE, OBJ}; 
export type Type =
  | {tag: "number"}
  | {tag: "bool"}
  | {tag: "none"}
  | {tag: "str"}
  | {tag: "class", name: string}
  | {tag: "either", left: Type, right: Type }
  | { tag: 'list', type: Type }

export type Parameter<A> = { name: string, type: Type }

export type Program<A> = { a?: A, inits: Array<VarInit<A>>, classes: Array<Class<A>>, fundefs: Array<FunDef<A>>, stmts: Array<Stmt<A>> }

export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, superclass: string }

export type VarInit<A> = { a?: A, name: string, type: Type, value: Literal }

export type GlobalDecl<A> = { a?: A, name: string }

export type NonLocalDecl<A> = { a?: A, name: string }

export type FunDef<A> = { a?: A, name: string, parameters: Array<Parameter<A>>, 
                          ret: Type, inits: Array<VarInit<A>>, fundefs: Array<FunDef<A>>, 
                          body: Array<Stmt<A>>, globaldecls: Array<GlobalDecl<A>>, 
                          nonlocaldecls: Array<NonLocalDecl<A>> }

export type Stmt<A> =
  | {  a?: A, tag: "assign", name: string, value: Expr<A> }
  | {  a?: A, tag: "return", value: Expr<A> }
  | {  a?: A, tag: "expr", expr: Expr<A> }
  | {  a?: A, tag: "pass" }
  | {  a?: A, tag: "field-assign", obj: Expr<A>, field: string, value: Expr<A> }
  | {  a?: A, tag: "if", cond: Expr<A>, thn: Array<Stmt<A>>, els?: Stmt<A>|Array<Stmt<A>> }
  | {  a?: A, tag: "while", cond: Expr<A>, body: Array<Stmt<A>> }
  | {  a?: A, tag: "for", iterator: string, iterable: Expr<A>, body: Array<Stmt<A>> }
  | {  a?: A, tag: "for-str", iterator: string, iterable: Expr<A>, body: Array<Stmt<A>> }
  | {  a?: A, tag: "index-assign", obj: Expr<A>, index: Expr<A>, value: Expr<A> }

export type Expr<A> =
    {  a?: A, tag: "literal", value: Literal }
  | {  a?: A, tag: "id", name: string }
  | {  a?: A, tag: "binop", op: BinOp, left: Expr<A>, right: Expr<A>}
  | {  a?: A, tag: "uniop", op: UniOp, expr: Expr<A> }
  | {  a?: A, tag: "builtin1", name: string, arg: Expr<A> }
  | {  a?: A, tag: "builtin2", name: string, left: Expr<A>, right: Expr<A>}
  | {  a?: A, tag: "call", name: string, arguments: Array<Expr<A>> } 
  | {  a?: A, tag: "lookup", obj: Expr<A>, field: string }
  | {  a?: A, tag: "method-call", obj: Expr<A>, method: string, arguments: Array<Expr<A>> }
  | {  a?: A, tag: "construct", name: string }
  | {  a?: A, tag: "index", object: Expr<A>, index: Expr<A> }
  | {  a?: A, tag: "index-str", object: Expr<A>, index: Expr<A> }
  | {  a?: A, tag: "cond-expr", ifobj: Expr<A>, elseobj: Expr<A>, cond: Expr<A> }

export type Literal = 
    { tag: "num", value: number }
  | { tag: "bool", value: boolean }
  | { tag: "none" }
  | { tag: "str", value: string }
  | { tag: "list", value: Array<Expr<null>>|Array<Expr<Type>>, type?: Type}

// TODO: should we split up arithmetic ops from bool ops?
export enum BinOp { Plus, Minus, Mul, IDiv, Mod, Eq, Neq, Lte, Gte, Lt, Gt, Is, And, Or};

export enum UniOp { Neg, Not };

export type Value =
    Literal
  | { tag: "object", name: string, address: number}
