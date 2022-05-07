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
- [Expected Features](#expected-features)
- [Proposed Changes to ast.ts](#proposed-changes-to-ast)
- [Proposed Changes to ir.ts](#proposed-changes-to-ir)
- [Test Cases](#test-cases)

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
  | { tag: 'str' }
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
  | { a?: A, tag: "list-assign", lhs: Expr<A>, index: Expr<A>, value: Expr<A>, typ: Type }
  | { a?: A, tag: "str-assign", lhs: Expr<A>, value: Expr<A>, typ: Type }
  | { tag: "for", iterator: string, iterable: Expr<A>, body: Array<Stmt<A>> }
  ....

export type Expr<A> =
  ....
  | { a?: A, tag: 'subscript', object: Expr<A>, index: Expr<A> }  
  | { a?: A, tag: 'listexpr', elements: Array<Expr<A>> }
  | { a?: A, tag: 'strexpr', elements: Array<Expr<A>> }
  ....

export type Value =
  ....

export type Literal<A> =
  | { tag: "string", value: string }
  | { tag: "empty" }
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
  | { a?: A, tag: "list-assign", lhs: Expr<A>, index: Expr<A>, value: Expr<A>, typ: Type }
  | { a?: A, tag: "str-assign", lhs: Expr<A>, value: Expr<A>, typ: Type }
  | { tag: "for", iterator: string, iterable: Expr<A>, body: Array<Stmt<A>> }
  ....

export type Expr<A> =
  | { a?: A, tag: 'subscript', object: Expr<A>, index: Expr<A> }  
  | { a?: A, tag: 'listexpr', elements: Array<Expr<A>> }
  | { a?: A, tag: 'strexpr', elements: Array<Expr<A>> }
  ----

export type Value<A> = 
  { a?: A, tag: "list", value: Value<A>[] }
  { a?: A, tag: "string", value: Value<A>[] }
  { a?: A, tag: "char", value: string }
  { a?: A, tag: "empty" }
  ....

```


<br/>

***

<br/>

## **Test Cases**
<details>
  <summary> List </summary>

  <br/>

  - **List Declaration and Assignment** - of primitive Data Type
  ```
  myList : [int] = None
  myList = [1,2,3,4]

  print(myList[3])
  ```
  > The above program must print `4`

  <br/>

  - **List Declaration and Assignment** - of unknown Data Type
  ```
  myList : [cls] = None
  myList = [1,2,3,4]

  print(myList[3])
  ```
  > The above program must throw a `TYPE ERROR` because `cls` is not a defined class

  <br/>

  - **List Declaration and Assignment** - of incompatible Data Type
  ```
  myList : [int] = None
  myList = [True, False, True, 1]

  print(myList[0])
  ```
  > The above program must throw a `TYPE ERROR` because `True` is not a valid element for integer list

  <br/>

  - **List Subscripting** - valid index
  ```
  myList : [int] = None
  myList = [99, 88, 77, 66, 55]

  myList[2] = 11
  print(myList[2])
  ```
  > The above program must print `11`

  <br/>

  - **List Subscripting** - index out of bounds
  ```
  myList : [int] = None
  myList = [1,2,3,4,5]

  print(myList[6])
  ```
  > The above program must return a `RUNTIME ERROR`

  <br/>

  - **List Length** - printing size of list
  ```
  myList : [int] = None
  myList = [1,2,3,4,5]

  print(len(myList))
  ```
  > The above program must print `5`

  <br/>
  
  - **List Length** - using size of list as operand
  ```
  myList : [int] = None
  myList = [1,2,3,4,5]

  print(myList[len(myList)-1])
  ```
  > The above program must print `5`

  <br/>

  - **List Concatenation** - compatible list types
  ```
  myList1 : [int] = None
  myList2 : [int] = None
  myList3 : [int] = None

  myList1 = [1, 2, 3]
  myList2 = [4, 5, 6]
  myList3 = myList1 + myList2

  print(myList3[3])
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

  print(myList3[3])
  ```
  > The above program must throw a `TYPE ERROR` because an list of integers cannot be concatenated with a list of booleans

  <br/>

</details>

<details>
  <summary> String </summary>

  <br/>

  - **String Declaration and Assignment**
  ```
  myStr: str = "abc"
  print(myStr)
  ```
  > The above program must print `abc`

  <br/>
  
  - **List Subscripting** - valid index
  ```
  myStr: str = "abc"
  print(myStr[2])
  ```
  > The above program must print `c`

  <br/>

  - **List Subscripting** - index out of bounds
  ```
  myStr: str = "abc"
  print(myStr[6])
  ```
  > The above program must return a `RUNTIME ERROR`

  <br/>

  - **String Length** - printing size of string
  ```
  myStr: str = "abc"
  print(len(myStr))
  ```
  > The above program must print `3`

  <br/>
  
  - **String Length** - using size of string as operand
  ```
  myStr: str = "abc"
  print(myStr[len(myStr)-1])
  ```
  > The above program must print `c`

  <br/>

  - **String Concatenation**
  ```
  myStr1: str = "abc"
  myStr2: str = "edf"
  myStr3: str = ""
  
  myStr3 = myStr1 + myStr2
  print(myStr3)
  ```
  > The above program must compile successfully, and print `abcedf`

  <br/>
  
</details>

<details>
  <summary> For Loop </summary>
  <br/>

  - **Iteration over array**
  ```
  a: [int] = None
  x: int = 0
  a = [1,2,3]
  
  for x in a:
    print(x)
  ```
  > The above program must print `1\n2\n3`

  <br/>
  
  - **Iteration over string**
  ```
  a: str = "abc"
  x: str = ""
  
  for x in a:
    print(x)
  ```
  > The above program must print `a\nb\nc`

  <br/>

  
  - **Iterator not defined**
  ```
  a: str = "abc"
  for x in a:
    print(x)
  ```
  > The above program must throw a `TYPE ERROR` because an iterator `x` is not defined

  <br/>
  
  - **Iterator defined with non-compatible type**
  ```
  a: str = "abc"
  x: int = 0
  for x in a:
    print(x)
  ```
  > The above program must throw a `TYPE ERROR` because an iterator `x` is not of the type `str`

  <br/>
  
   - **Returning from for loop**
   ```
   def f() -> int:
      x : int = 0
      for x in [1, 2, 3, 4, 5]:
        if x > 3:
          return x
      return x
   print(f())
  ```
  > The above program must print `4`

  <br/>
</details>

<br/>

***
