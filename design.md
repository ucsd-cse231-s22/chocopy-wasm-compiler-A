# **Project: Milestone Code 1 (Chocopy)**
### Naga Siva Subramanyam Makam, Laxminarasimha Saketh Khandavalli
---
## 1) Features proposed this week
- Lists
- Strings
- For loops

## 2) Changes to AST
```
export type Type =
  | {tag: "str"}
  | { tag: 'list', type: Type }
  ...
export type Stmt<A> =
  | {  a?: A, tag: "for", iterator: string, iterable: Expr<A>, body: Array<Stmt<A>> }
  | {  a?: A, tag: "index-assign", obj: Expr<A>, index: Expr<A>, value: Expr<A> }
  ...
export type Expr<A> =
  | {  a?: A, tag: "index", object: Expr<A>, index: Expr<A> }
  ...
export type Literal = 
  | { tag: "str", value: string }
  | { tag: "list", value: Array<Expr<null>>|Array<Expr<Type>>, type?: Type}
  ...

```
## 3) Changes to IR
```
export type Stmt<A> =
  | { a?: A, tag: "for", iterator: string, iterable: Value<A>, body: Array<Stmt<A>> }
  | { a?: A, tag: "list-store", start: Value<A>, offset: Value<A>, value: Value<A> } // start should be an id
  ...
export type Expr<A> =
  | {  a?: A, tag: "list-load", start: Value<A>, offset: Value<A> }
  ...
```

## 4) Feature implementation details
- For each of the features that we implemented, we added test cases in milestone1.test.ts These can be automatically run using the command `npm test`.
- By using the command `npm run build-web` the working REPL and IDE can be used in the browser.
- For each of the features we described our progress and provided some interesting test cases.

### a) Lists:
We were able implement the support for lists completely.
Some interesting testcases:
##### Test case 1

```
a : [int] = None
a = [1,2,3,4,5]
print(a[len(a)-1]
```
Expected output: `5`

##### Test case 2
```
a:[int] = None
a = [1, 2, 3] + [True, False, True]
print(a[3])
```
Expected output: `TYPE ERROR` (lists with different types cannot be concatenated)
##### Test case 3
```
class Cat(object):
    x:int = 0

c:[Cat] = None
c = [None, None] + [Cat(), Cat()]
print(c[2].x)
```
Expected output: `0`

### b) Strings:
We were able implement the support for strings completely.
Some interesting testcases:
##### Test case 1

```
myStr: str = "abc"
print(myStr)
print(myStr[1])
```
Expected output: 
`abc`
`b`

##### Test case 2
```
a: str = ""
a = "abc" + "edf"
print(a)
```
Expected output: `abcedf`
##### Test case 3
```
a: str = ""
b: [int] = None
b = [10, 20, 30]
print(a+b)
```
Expected output: `TYPE ERROR`

### c) For loops:
We were able implement the basic support for for-loops. But there are still some interesting cases we were able to identify where our implementation does not work currently. (Explained below with testcases)
Some interesting testcases:
##### Test case 1 (works)

```
a: [int] = None
x: int = 0
a = [1,2,3]
for x in a:
    print(x)
```
Expected output: 
`1`
`2`
`3`

##### Test case 2 (works)
```
a: str = "abc"
x: int = 0
for x in a:
    print(x)
```
Expected output: `TYPE ERROR` (Iterator `x` must be of the type `str`)
##### Test case 3 (does not work)
```
a: str = "abc"
x: str = ""
for x in a:
  print(x)
```
Expected output:
`a`
`b`
`c`
Explanation: In general for lists, the iterator is of the same type of the list contents, (eg: iterator should be `int` for `[1,2,3]` list). But in the case of strings the iterator is also of type `str`, this needs to be handled carefully and we aim to finish it during next week.
##### Test case 4 (does not work)
```
x : int = 0
for x in [1, 2, 3, 4, 5]:
  if x > 3:
    print(x)
```
Expected output:
`4`
`5`
Explanation: This test case requires good understanding of the control flow graph for implementation because there is an `if` condition inside the for-loop. This week we gained a proper understanding of how different blocks are arranged in the graph. So we aim to solve these kind of testcases during next week.
## 5) Plan for next week
We aim to finish the shortcomings described above and also aim to work on `Inheritence` and `Conditional Expression`. We also need to add features removed in PA3 such as `functions`, `elif`, `pass` etc 
