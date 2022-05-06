# Closures Design Document

## Callable Type

**Parsing requires <ins>"@lezer/python": "^0.16.0"</ins> (or elbow grease)**

### Grammar

```text
callable := Callable[[ [<type> [, <type>]* ]? ], <type> ]
type := ...
| <callable>
```

### AST

```ts
type Type = ...
| { tag: "callable", params: Array<Type>, ret: Type }
```

---

## Lambda literal (`mklambda`)

### Grammar

```text
lambda_expr := lambda [<name> [, <name>]*]? : <expr>
literal := ...
| mklambda(<callable>, <lambda_expr>)
```

### AST

```ts
type FunDef<A> = { ..., capturedVars: Array<Parameter<A>> }

type Literal<A> =
...
| { a?: A, tag: "closure", params: Array<Parameter<A>>, expr: Expr<A>, capturedVars: Array<Parameter<A>> }
```

---

## `if` expression

We would like to have `if` expressions to express ternary/conditional logic in lambda bodies.

### Grammar

```text
expr := ...
| <expr> if <expr> else <expr>
```

### AST

```ts
type Expr<A> = ...
| { a?: A, tag: "if-expr", cond: Expr<A>, thn: Expr<A>, els: Expr<A> }
```

---

## Representation of `Callable`

Each function definition (including builtins) is wrapped in a class
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

The name is mangled to avoid aliasing with user-defined classes.

Anonymous functions are transformed identically, sans variable definition as they are nameless. To reference these functions in WASM, we generate a unique name for each.

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

---

## Handling captured variables

Nested functions have `parent` fields that reference the function
that contains it (one level up), and writes to fields of parent objects
carry reference semantics, getting desired `nonlocal` behavior.

```python
def f(x: int) -> int:
  def g(y: int) -> int:
    return h(y) + x
  def h(z: int) -> int:
    nonlocal x
    x = z
    return x + 1
  return g(10) + g(7)
print(f(6))
```

Without name mangling for readability:

```python
class f:
  x: int = 0
  def apply(self: f, x: int) -> int:
    self.x = x
    return g().setParent(self).apply(10) + g().setParent(self).apply(7)
class g:
  parent: f = None
  def apply(self: g, y: int) -> int:
    return h().setParent(self.parent).apply(y) + self.parent.x
  def setParent(self: g, parent: f) -> g:
    self.parent = parent
    return self
class h:
  parent: f = None
  def apply(self: h, z: int) -> int:
    self.parent.x = z
    return self.parent.x + 1
  def setParent(self: h, parent: f) -> h:
    self.parent = parent
    return self
print(f().apply(6))
```

To determine the argument of `setParent` we have to check if the function being called is a child of the current function (`self`), a sibling of the current function (`self.parent`), a sibling of the parent function (`self.parent.parent`), etc. Since the AST parses function definitions into a tree, this is simple to check. The correct scope of captured variables is determined similarly.

---

## Test Cases

### 1. Z-combinator

```python
make_rec: Callable[
  [Callable[[Callable[[int], int]], Callable[[int], int]]],
  Callable[[int], int]
] = mklambda(
      Callable[
        [Callable[[Callable[[int], int]], Callable[[int], int]]],
        Callable[[int], int]
      ],
      lambda g: mklambda(
        Callable[[Callable[[int], int]], Callable[[int], int]],
        lambda rec: g(mklambda(
          Callable[[int], int],
          lambda y: rec(rec)(y)
        ))
      )(mklambda(
        Callable[[Callable[[int], int]], Callable[[int], int]],
        lambda rec: g(mklambda(
          Callable[[int], int],
          lambda y: rec(rec)(y)
        ))
      ))
    )
fact: Callable[[int], int] = make_rec(
  lambda rec: lambda x: 1 if x == 0 else rec(x - 1) * x
)
print(fact(5))
```

Should pass, yielding `120`.

### 2. Lambda as argument

```python
def apply(func: Callable[[int], bool], arg: int) -> bool:
    return func(arg)
isEven: Callable[[int], bool] = mklambda(
  Callable[[int], bool],
  lambda num: num % 2 == 0
)
print(apply(isEven, 9))
```

Should pass, yielding `False`.

### 3. Type checking in lambda

```python
isEven: Callable[[int], bool] = mklambda(
  Callable[[int], bool],
  lambda num: num + None == 0
)
```

Should yield type error on BinOp.

### 4. Type checking of lambda itself

```python
isEven: Callable[[int], bool] = mklambda(
  Callable[[int], int],
  lambda num: num
)
```

Should yield type error on assignment.

### 5. Currying

```python
add: Callable[[int], Callable[[int], int]] = mklambda(
  Callable[[int], Callable[[int], int]],
  lambda a: mklambda(
    Callable[[int], int],
    lambda b: a + b
  )
)
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
add_ref = mklambda(
  Callable[[int, int], int],
  lambda a, b: a + b + 1
)
print(add_ref(5, 8))
```

Should pass, yielding `13\n14`.

### 8. Bad argument to lambda

```python
a: Callable[[int], int] = mklambda(
  Callable[[int], int],
  lambda a: a
)
print(a(True))
```

Should yield type error on function call.
(This works in mypy, but it shouldn't.)

### 9. No arguments

```python
noop: Callable[[], None] = mklambda(
  Callable[[], None],
  lambda: None
)
noop()
```

Should pass.

### 10. Global reference

```python
a: int = 4
def f(x: int):
  def g():
    print(x + 1)
  print(x)
  return g
f()()
```

Should print `4\n5`
