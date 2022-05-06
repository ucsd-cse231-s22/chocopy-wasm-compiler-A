# Closures Design Document

## New Type __<ins>(parsing requires "@lezer/python": "^0.16.0", or elbow grease)</ins>__

### Grammar

```pl
callable := Callable[[ [<type> [, <type>]* ]? ], <type> ]
type :=
...
| <callable>
```

### AST

```ts
type Type =
...
| { tag: "callable", params: Array<Type>, ret: Type }
```

## mklambda, closures
### Grammar

```pl
lambda_expr := lambda [<name> [, <name>]*]? : <expr>
literal :=
...
| mklambda(<callable>, <lambda_expr>)
```

### AST

```ts
type FunDef<A> = { ..., capturedVars: Array<Parameter<A>> }

type Literal<A> =
...
| { a?: A, tag: "closure", params: Array<Parameter<A>>, expr: Expr<A>, capturedVars: Array<Parameter<A>> }
```

## If expression
We would like to have if expressions to express ternary/conditional logic in lambda bodies.
### Grammar

```pl
expr := ...
| <expr> if <expr> else <expr>
```

### AST

```ts
type Expr<A> =
...
| { a?: A, tag: "if-expr", cond: Expr<A>, thn: Expr<A>, els: Expr<A> }
```

## Representation of Callables
All function definitions (including builtins) are each wrapped in a class
so that we can store references to them. A function definition in code
is transformed into a class definition and a variable definition as follows:

```python
def a():
  print("hello")
```
  
```python
class a_$closure(object):
  def apply():
    print("hello")
a: a_$closure = a_$closure()
```

The name is mangled to avoid aliasing with user defined types.

Lambda definitions are treated a similar way, but instead of being immediately
assigned a name we simply call the constructor and leave it as an expression. We
generate a unique name for the lambda as well:

```python
lambda: print("hello")
```
  
```python
class lambda_$123(object):
  def apply():
    print("hello")
lambda_$123()
```

Callables are nullable because we want to define variables without
immediately initializing it to a lambda. Calling a null function results
in a runtime error. We will represent null callables as zeros, which
is the same way we represent null objects.

## Handling captured variables
Handling captured variables involves identifying which variables we need to
capture and storing them in refboxes so that we can share them. Captured variables
are passed into the constructor of closures as arguments and stored as fields:

```python
x: int = 5
def a():
  print(x)
```

Will be turned into:

```python
class a_$closure(object):
  x: IntRef = None
  def apply():
    print(self.x.val)

x: IntRef = None
x = IntRef()
x.val = 5

a = a_$closure()
a.x = x
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
  ] = mklambda(Callable[
    [
      Callable[
        [Callable[[int], int]], 
        Callable[[int], int]
      ]
    ],
    Callable[[int], int]
  ], lambda g:
  mklambda(Callable[[Callable[[int], int]], Callable[[int], int]],  
  lambda rec: g(lambda y: rec(rec)(y)) )
  ( lambda rec: g(lambda y: rec(rec)(y)) ))

fact: Callable[[int], int] = None
fact = make_rec(lambda rec: lambda x:
  1 if x == 0 else rec(x - 1) * x)
print(fact(5))
```
Should pass, yielding `120`.

### 2. Lambda as argument
```python 
def a(num: int, func: Callable[[int], bool]) -> bool:
    return func(num)
isEven: Callable[[int], bool] = mklambda(Callable[[int], bool], lambda num: num % 2 == 0)
print(a(9, isEven))
```
Should pass, yielding `False`.

### 3. Type checking in lambda
```python 
isEven: Callable[[int], bool] = mklambda(Callable[[int], bool], lambda num: num + None == 0)
```
Should yield type error on BinOp.

### 4. Type checking of lambda itself
```python 
isEven: Callable[[int], bool] = mklambda(Callable[[int], int], lambda num: num)
```
Should yield type error on assignment.

### 5. Currying
```python 
add: Callable[[int], Callable[[int], int]] = mklambda(
  Callable[[int], Callable[[int], int]], 
  lambda a: mklambda(
    Callable[[int], int], 
    lambda b: a + b))
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
add_ref = mklambda(Callable[[int, int], int], lambda a, b: a + b + 1)
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
a: Callable[[int], int] = mklambda(Callable[[int], int], lambda a: a)
print(a(True))
```
Should yield type error on function call.
(This works in mypy, but it shouldn't.)

### 10. No arguments
```python 
noop: Callable[[], None] = mklambda(Callable[[], None], lambda: None)
noop()
```
Should pass.

### 11. No arguments
```python 
a: int = 4
def print_a():
  print(a)
print_a()
a=5
print_a()
```
Should print `4\n5`
