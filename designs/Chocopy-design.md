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
print(len("Hello")
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
a = [1, 2, 3, 4, 5]`, "list");
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
b = [4 ,5 ,6, 7, 8]
c = a + b

for i in c:
    print(i)`, [`1`, `2`, `3`, `4`, `5`, `4`, `5`, `6`, `7`, `8`]);
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

## New Functions

### String

+ Add case `str` in `tcString` to annotate a string. 
+ Modify `tcExpr` in `type-check.ts` to make `BinOp.Plus` with 2 strings legal. 
+ Need a function `CodeGenString` in `compiler.ts` to generate wasm code.
+ Need to modify case `binop` in `codeGenExpr` to handle string concatence situation.

### Lists

+ In `parser.ts`, support parsing list and empty in `traverseExpr`.
+ In `type-check.ts`, support type checking list and empty in `tcExpr`. 
+ In `lower.ts`, support lowering list and empty in `flattenExprToExpr`, `flattenExprToVal`, and `literalToVal`.
+ In `compiler.ts`, support code generation for list and empty in `codeGenExpr` and `codeGenValue`.


## Value Representation and Memory Layout for New Runtime Values

### String

No change should be made in this part.

### Lists

List elements are placed consecutively on heap memory. Concatenation of two lists returns a new list whose first element is placed on the next available heap address at the time of concatenation.
