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
`, [5]))
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

```python
assertTC("list-basic", 
`
a : [int] = None
a = [1, 2, 3, 4, 5]`, LIST({tag: "number"}));
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
return x
print(f())`, ["4"]
);
```



## Changes to AST, IR, and built-in libraries

### String

In `ast.ts`, we need to add string type to `Type`.
```typescript
{tag: "str", name: string}
```

In `ir.ts`, we need to add string type to `Value<A>`.
```typescript
{ a?: A, tag: "str", name: string }
```


### Lists

In `ast.ts`, we need to add list and empty to `Type`.
```typescript
{tag: "list", type: Type}
{tag: "empty"}
```

We need to add list to `Expr<A>`.
```typescript
{ a?: A, tag: "list", value: Expr<A>[] }
```

We need to add empty to `Literal`.
```typescript
{ tag: "empty" }
```

In `ir.ts`, we need to add list and empty to `Value<A>`.
```typescript
{ a?: A, tag: "list", value: Value<A>[] }
{ a?: A, tag: "empty" }
```

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
{ tag: "for", name: name, iterable: iter, body: body}
```



## New Functions

### String

+ In `type-check.ts`, add case `str` in `tcString` to annotate a string. 
+ In `type-check.ts`, modify `tcExpr`  to make `BinOp.Plus` with 2 strings legal. 
+ In `compiler.ts`, need a function `CodeGenString` to generate wasm code.
+ In `compiler.ts`, need to modify case `binop` in `codeGenExpr` to handle string concatence situation.

### Lists

+ In `parser.ts`, support parsing list and empty in `traverseExpr`.
+ In `type-check.ts`, support type checking list and empty in `tcExpr`. 
+ In `lower.ts`, support lowering list and empty in `flattenExprToExpr`, `flattenExprToVal`, and `literalToVal`.
+ In `compiler.ts`, support code generation for list and empty in `codeGenExpr` and `codeGenValue`.

### For-loop
+ In `parser.ts`, support parsing for "for" statement in `traverseStmt`.
+ In `type-check.ts`, support type checking for "for" statement in `tcStmt`.
+ In `compiler.ts`, support code generation for "for" statement in `codeGenStmt` 

## Value Representation and Memory Layout for New Runtime Values

### String

String are placed consecutively on heap memory. Concatenation of two strings returns a new string whose first char is placed on the next available heap address at the time of concatenation.

### Lists

List elements are placed consecutively on heap memory. Concatenation of two lists returns a new list whose first element is placed on the next available heap address at the time of concatenation.

### For-loop

The implementation of the for loop can use a helper class with three different fields: initial_state, step, stop_condition; we can utilize this helper class to generate code for the loop
