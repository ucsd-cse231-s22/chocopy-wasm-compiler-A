<!-- Markdown Template Credits: https://github.com/othneildrew/Best-README-Template/blob/master/README.md -->

<h1 align="center">
  <strong>ChocoPy Design Document</strong>
</h1>
<p align="center">
  by Saketh Khandavalli and Naga Makam
</p>

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Introduction](#introduction)
- [Expected Behaviours and Scenarios](#expected-behaviours-and-scenarios)
- [Proposed Changes to ast.ts](#proposed-changes-to-ast)
- [Proposed Changes to ir.ts](#proposed-changes-to-ir)
- [Milestone Test Cases](#test-cases)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
***
<br/>

## **Introduction**

This document outlines the changes and test cases that we intend to build as part of the compiler, during the course of the project for CSE231 - Advanced Compiler Design (Spring 22).

## **Plan for Next Week**

We are planning to implement following features this week:

1. Lists
1. Strings
1. For loop

<br/>

***

<br/>

## **Expected features**
  
- [ ] Lists
  - [ ] Declarations
  - [ ] Look up and assign elements by index
  - [ ] Concatenation and Printing Size of List

- [ ] Strings
  - [ ] Declarations
  - [ ] Look up by index
  - [ ] Concatenation

- [ ] For loop
  - [ ] Iterator for list/string
  - [ ] Body

<br/>

***

<br/>

## **Proposed Changes to AST**

```
export type Type =
  ....
  | { tag: 'list',   type: Type }
  ....

export type Parameter<A> = 
{ .... }

export type Program<A> = 
  ....

export type FunDef<A> =
  ...

export type ClassDef<A> = 
  ....

export type VarInit<A> =
  ....

export type Stmt<A> =
  ....
  | { a?: A, tag: "list-assign", lhs: Expr<A>, index: Number, value: Expr<A>, typ: Type }
  | { a?: A, tag: "string-assign", lhs: Expr<A>, value: Expr<A>, typ: Type }
  ....

export type Expr<A> =
  ....
  | { a?: A, tag: 'subscript', object: Expr<A>, index: number }  
  | { a?: A, tag: 'listexpr', elements: Array<Expr<A>> }
  ....

export type Value =
  ....

export type Literal<A> =
  | { tag: "string", value: string }
  ....

```

<br/>

***

<br/>

## **Proposed Changes to IR**

```
export type Program<A> = 
{ .... }

export type Class<A> = 
{ .... }

export type VarInit<A> = 
{ .... }

export type FunDef<A> = 
{ .... }

export type BasicBlock<A> = 
  ....

export type Stmt<A> =
  ....

export type Expr<A> =
  ----

export type Value<A> = 
  ....

```


<br/>

***

<br/>


***
