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
lambda = lambda [<name> [, <name>]*]? : <expr>
expr :=
...
| mklambda(<callable>, <lambda>)
```

### AST

```ts
type Literal<A> =
...
| { a?: A, tag: "closure", params: Array<Parameter>, expr: Expr<A> }
```

## Representation of Callables
We will create an entry in the table with the methods, and represent the
lambda in memory with the index of the function in the table. When we call 
a lambda, we simply call indirect with the index. As for captured variables,
we will store these as fields by reference in the class.

All function definitions (including builtins) will have to be wrapped in a class
this way so that we can store references to them. A function definition in code
will be transformed into a class definition and a variable definition as follows:

```python
def a():
  print("hello")
```
  
```python
class a_closure(object):
  def apply():
    print("hello")
a: a_closure = a_closure()
```

Lambda definitions will be treated a similar way, but instead of being immediately
assigned a name we simply call the constructor and leave it as an expression. We
will have to generate a unique name for the lambda as well:

```python
lambda: print("hello")
```
  
```python
class lambda_123(object):
  def apply():
    print("hello")
lambda_123()
```

## Handling captured variables
Handling captured variables will involve identifying which variables we need to
capture and storing them in refboxes so that we can share them. Captured variables
will be passed into the constructor of closures as arguments and stored as fields:

```python
x: int = 5
def a():
  print(5)
```

Will be turned into:

```python
class a_closure(object):
  x: IntRef = None
  def apply():
    print(self.x.val)

x: IntRef = None
x = IntRef()
x.val = 5

a = a_closure()
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

