<!-- Markdown Template Credits: https://github.com/othneildrew/Best-README-Template/blob/master/README.md -->

<h1 align="center">
  <strong>ChocoPy Design Document</strong>
</h1>
<p align="center">
  by Arpit Gupta and Rishabh Mittal
</p>

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Introduction](#introduction)
- [Expected Behaviours and Scenarios](#expected-behaviours-and-scenarios)
- [Proposed Changes to ast.ts](#proposed-changes-to-ast)
- [Proposed Changes to ir.ts](#proposed-changes-to-ir)
- [Test Cases](#test-cases)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
***
<br/>

## **Introduction**

This document outlines the behaviours, scenarios and test cases that we intend to build as part of the compiler, during the course of the project for CSE231 - Advanced Compiler Design (Spring 22).

<br/>

***

<br/>

## **Expected Behaviours and Scenarios**

- [ ] Inheritance

- [ ] Nested Functions

- [ ] Lists
  - [ ] Declarations and Assignments
  - [ ] Subscripting and Lookup
  - [ ] Concatenation and Printing

- [ ] Strings
  - [ ] Declarations and Assignments
  - [ ] Subscripting and Lookup
  - [ ] Concatenation and Printing


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

export type ClassDef<A> =
  ....

export type VarInit<A> =
  ....

export type Stmt<A> =
  ....
  | { a?: A, tag: "list-assign", object: Expr<A>, index: Number, value: Expr<A>, typ: Type }
  ....

export type Expr<A> =
  ....
  | { a?: A, tag: 'subscript', object: Expr<A>, index: number }  
  | { a?: A, tag: 'listexpr', elements: Array<Expr<A>> }
  ....

export type Value =
    Literal<Type>
  | { tag: "object", name: string, address: number}

export type Literal<A> =
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
  ....

export type Value<A> = 
  ....

```


<br/>

***

<br/>

## **Test Cases**

- **List Declaration and Assignment** - of primitive Data Type
```
myList : [[int]] = None
myList = [[1, 2], [3, 4], [5], [6, 7, 8, 9]]

print(myList[3][3])
```
> The above program must compile successfully, and print `9`

<br/>

- **List Declaration and Assignment** - of unknown Data Type
```
myList : [[cls]] = None
myList = [[1, 2], [3, 4], [5], [6, 7, 8, 9]]

print(myList[3][3])
```
> The above program must return a `TYPE ERROR`

<br/>

- **List Declaration and Assignment** - of incompatible Data Type
```
myList : [bool] = None
myList = [True, False, True, 1]

print(myList[0])
```
> The above program must return a `TYPE ERROR`

<br/>

- **List Subscripting** - valid index
```
myList : [int] = None
myList = [99, 88, 77, 66, 55]

print(myList[2])
```
> The above program must compile successfully, and print `77`

<br/>

- **List Subscripting** - index out of bounds
```
myList : [int] = None
myList = [99, 88, 77, 66, 55]

print(myList[20])
```
> The above program must return a `RUNTIME ERROR`

<br/>

- **List Concatenation** - compatible list types
```
myList1 : [int] = None
myList2 : [int] = None
myList3 : [int] = None

myList1 = [1, 2, 3]
myList2 = [4, 5, 6]
myList3 = myList1 + myList2

print(myList1[3])
```
> The above program must compile successfully, and print `4`

<br/>

- **List Concatenation** - incompatible list types
```
myList1 : [int] = None
myList2 : [bool] = None
myList3 : [int] = None

myList1 = [1, 2, 3]
myList2 = [True, False, True]
myList3 = myList1 + myList2

print(myList1[3])
```
> The above program must return a `TYPE ERROR`

<br/>



<br/>

***
