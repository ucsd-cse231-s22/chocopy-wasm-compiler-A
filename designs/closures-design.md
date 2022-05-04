# Closures Design Document

## New expression

### Grammar

```pl
literal :=
...
| lambda [<name> [, <name>]*]? : <expr>
```

### AST

```ts
// To stay a subset of Python, lambda parameters cannot have type hints,
// so we defer the type-checking of an anonymous function to the point of use
// necessitating this new `LambdaParam` type
type LambdaParam = { name: string, type?: Type }
type Literal<A> =
...
| { a?: A, tag: "lambda", params: Array<LambdaParam>, expr: Expr<A> }
```

## New Type __<ins>(parsing requires "@lezer/python": "^0.16.0", or elbow grease)</ins>__

### Grammar

```pl
type :=
...
| Callable[[ [<type> [, <type>]* ]? ], <type> ]
```

### AST

```ts
type Type =
...
| { tag: "callable", params: Array<Type>, ret: Type }
```

## Test Cases

### 1. Z-combinator
```python 
make_rec: Callable[
    [
      Callable[
        [Callable[[int], int]], 
        Callable[[int], int]
      ]
    ],
    Callable[[int], int]
  ] = (lambda g:
  ( lambda rec: g(lambda y: rec(rec)(y)) )
  ( lambda rec: g(lambda y: rec(rec)(y)) ))

fact: Callable[[int], int] = make_rec(lambda rec: lambda x:
  1 if x == 0 else rec(x - 1) * x)
print(fact(5))
```
Should pass, yielding `120`.

### 2. Lambda as argument
```python 
def a(num: int, func: Callable[[int], bool]) -> bool:
    return func(num)
isEven: Callable[[int], bool] = lambda num: num % 2 == 0
print(a(9, isEven))
```
Should pass, yielding `False`.

### 3. Type checking in lambda
```python 
isEven: Callable[[int], bool] = lambda num: num + None == 0
```
Should yield type error on BinOp.

### 4. Type checking of lambda itself
```python 
isEven: Callable[[int], bool] = lambda num: num
```
Should yield type error on assignment.

### 5. Currying
```python 
add: Callable[[int], Callable[[int], int]] = lambda a: lambda b: a + b
add_5: Callable[[int], int] = add(5)
print(add_5(6))
```
Should pass, yielding `11`.

### 6. Storing function reference
```python 
def add(a: int, b: int) -> int:
    return a + b
add_ref: Callable[[int, int], int] = add
print(add_ref(5 + 8))
```
Should pass, yielding `13`.

### 7. Two callables, one variable
```python 
def add(a: int, b: int) -> int:
    return a + b
add_ref: Callable[[int, int], int] = add
print(add_ref(5, 8))
add_ref = lambda a, b: a + b + 1
print(add_ref(5, 8))
```
Should pass, yielding `13\n14`.

### 8. Infer lambda type
```python 
def call4(a: Callable[[int], int]) -> int:
    return a(4)
print(call4(lambda num: num * 4))
```
Should pass, yielding `16`.

### 9. Bad argument to lambda
```python 
a: Callable[[int], int] = lambda a: a
print(a(True))
```
Should yield type error on function call.
(This works in mypy, but it shouldn't.)

### 10. No arguments
```python 
noop: Callable[[], None] = lambda: None
noop()
```
Should pass.

### 11. Deferred type checking
```python 
lambda a, b, c: (a + b) == c == True
```
This should type check because we defer type-checking to 
the use of the lambda. (This lambda is never used.)

