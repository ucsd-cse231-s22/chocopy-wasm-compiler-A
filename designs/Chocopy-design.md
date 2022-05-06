# Chocopy-design.md

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



## Changes to AST

In order to support string, we need to add string type to `Type`.
```typescript
{tag: "str", name: string}
```

Also, we need to add string type to `Value<A>` in `ir.ts`.
```typescript
{ a?: A, tag: "str", name: string }
```

## New Functions

In order to support string operations, we need to:

+ Add case `str` in `tcString` to annotate a string. 
+ Modify `tcExpr` in `type-check.ts` to make `BinOp.Plus` with 2 strings legal. 
+ Need a function `CodeGenString` in `compiler.ts` to generate wasm code.
+ Need to modify case `binop` in `codeGenExpr` to handle string concatence situation.


## Value Representation and Memory Layout for New Runtime Values

No change should be made in this part.