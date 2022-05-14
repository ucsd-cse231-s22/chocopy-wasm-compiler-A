# ChocoPy-design.md

## 10 Testcases

1. 

```python
assertPrint("basic-string",
`
aString: str = "Hello"
print(aString)       
`, ["Hello"])

```

2. 

```python
assertPrint("string-concat",
`
aString1: str = "Hello"
aString2: str = " world"
print(aString1+aString2)
`, ["Hello world"])

```

3. 

```python
assertPrint("string-length",
`
print(len("Hello"))
`, ["5"])
```

4. 

```python
assertPrint("string-index",
`
aString: str = "Hello"
print(aString[1])
`, ["e"])
```

5. 

**Note:** We changed this test case. Because based on our design, the previous test case is meaningless. 
```python
assertPrint("list-basic", 
`
a : [int] = None
a = [1, 2, 3, 4, 5]
print(a[0])
print(a[1])
print(a[2])
print(a[3])
print(a[4])`, [`1`, `2`, `3`, `4`, `5`]);
```

6. 

```python
assertPrint("list-len",
`
a : [int] = None
a = [1, 2, 3, 4, 5]
print(a[len(a) - 1])`, [`5`]);
```
7. 

```python
assertPrint("list-operation",
`
a : [int] = None
b : [int] = None
c : [int] = None
i : int = 0
a = [1, 2, 3, 4, 5]
b = [6, 7, 8, 9, 10]
c = a + b

for i in c:
    print(i)`, [`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`]);
```

8. 

```python
assertTCFail("list-tc", `
a : [int] = None
a = [1, 2, 3, False, True]`);
```

9. 

```python
assertPrint("for-loop-basic",
`
ans : int = 0
x : int = 0
for x in [1, 2, 3, 4, 5]:
  ans = ans + x
print(ans)`, ["15"]
);
```

10. 

```python
assertPrint("for-loop-return-intermediate",
`
def f() -> int:
  x : int = 0
  for x in [1, 2, 3, 4, 5]:
    if x > 3:
      return x
    else:
      pass
  return x
print(f())`, ["4"]
);
```



## Changes to AST, IR, and built-in libraries

### String

In `ast.ts`, we need to add string type to `Type`.
```typescript
{tag: "str"}
```

In `ir.ts`, we need to add string type to `Value<A>`.
```typescript
{ a?: A, tag: "str", value: string }
```


### Lists

~~In `ast.ts`, we need to add list to `Type`.
```typescript
{tag: "list", listsize: number, elementtype: Type}
```

We need to add list-obj, index to `Expr<A>`.
```typescript
{  a?: A, tag: "index", obj: Expr<A>, index: Expr<A> }
{  a?: A, tag: "list-obj", length: number, entries: Array<Expr<A>>}
```

We need to add index-assign to `Stmt<A>`,
```typescript
{  a?: A, tag: "index-assign", list: Expr<A>, index: Expr<A>, value: Expr<A> }
```

We do not need to add anything into `ir.ts`.

### For Statement
we need to add a new type of statement for “for-loop”,
the basic structure should be like this:
```python
for x in [list]:
    Array<Stmt>
```

there should be mainly three parts in this structure: a variable x, an iterator that can assign x with different values, and the “for body”.

x here should be a predefined variable, otherwise chocopy compiler should report the error that the variable is undefined, so x here is a name with the string type; the iterator should be a list in chocopy’s scope, and we can use an expression to represent it.
The final structure should be like this:
```typescript
{ a?: A, tag: "for", name: string, iterable: Expr<A>, body: Array<Stmt<A>>}
```



## New Functions

### String

+ In `type-check.ts`, add case `str` in `tcLiteral` to annotate a string. 
+ In `type-check.ts`, modify `tcExpr`  to make `BinOp.Plus` with 2 strings legal. 
+ In `compiler.ts`, add case `str` in `codeGenValue` to generate wasm code.
+ In `compiler.ts`, add function `codeGenBinOpStr` to handle string concatenation.

### Lists

+ In `parser.ts`, support parsing list in `traverseExpr`.
+ In `type-check.ts`, support type checking list in `tcExpr`. 
+ In `lower.ts`, support lowering list in `flattenExprToExpr`, `flattenExprToVal`, and `literalToVal`.
+ In `compiler.ts`, support runtime error check for list index out of bound.

### For-loop
+ In `parser.ts`, support parsing for "for" statement in `traverseStmt`.
+ In `type-check.ts`, support type checking for "for" statement in `tcStmt`.
+ In `compiler.ts`, support code generation for "for" statement in `codeGenStmt` 

## Value Representation and Memory Layout for New Runtime Values

### String

In the heap memory, a string is represented as a sequence of 32-bit integers. The first integer is the string's length, and the following integers are ASCII codes of the string characters. Indexing into a string returns a new string of length 1. Concatenation returns a new string with length equal to the sum of the lengths of its operands.

### Lists

List elements are placed consecutively on heap memory. The first element stored in the heap is the length of the list. Concatenation of two lists returns a new list whose first element is placed on the next available heap address at the time of concatenation.



### For-loop

As chocopy does not contain complex iterators like dictionary, so we choose a simple design to transfer the for loop to equal while statement.
I initialize a virtual index for each for loop with value 0. For each body of the for statement, I insert an assignment statement at the beginning to assign
current list[index] to the variable id, and a step statement at the end of the body to update the index. To avoid conflict of different for loop, I use
the generateName method to differentiate index for different "for loop".

## How to run/test our code
```
make
npm install
npm run test
```

Besides `PA3-visible-test` and `PA3-hidden-test`, you can see another two sets of tests called `string test` and `list-test`, which contains all the tests we described in `ChocoPy-design.md`.

You can also run `npm run build-web`. Open a webserver, and then type chocopy scripts on the webpage to see the result.