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
expr := ...
| mklambda(<callable>, <lambda_expr>)

scopedef := nonlocal <name>
fundef := ...
   <vardef | scopedef>*
```

### AST

```ts
type FunDef<A> = { 
  ...
  nonlocals: Array<string>, 
  parent?: FunDef<A> }
type Lambda<A> = { 
  a?: A, 
  tag: "lambda", 
  params: Array<Parameter<A>>,
  expr: Expr<A>, 
  parent?: Lambda<A> | FunDef<A> }

type Expr<A> = 
  ...
  | Lambda<A>
type Stmt<A> = 
  ...
  | FunDef<A>
```

We keep a reference to the parent function definition, if any, so that we are able to resolve variables that aren't parameters or locally declared. During type checking, we will search recursively up the tree, checking parameters and local variables along the way. During the lower step, we will handle captured variables by having the function access them through their parent field.

Non-locals are put in a separate array which is checked on any assignment statements of the closure body. Here, nonlocal simply designates that a nonlocal variable is mutable.

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
class f_closure:
  x: int = 0
  def apply(self: f_closure, x: int) -> int:
    self.x = x
    g: g_closure = None
    h: h_closure = None
    g = g().setParent(self)
    h = h().setParent(self)
    return g.apply(10) + g.apply(7)
class g_closure:
  parent: f_closure = None
  def apply(self: g_closure, y: int) -> int:
    return self.parent.h.apply(y) + self.parent.x
  def setParent(self: g_closure, parent: f_closure) -> g_closure:
    self.parent = parent
    return self
class h_closure:
  parent: f_closure = None
  def apply(self: h_closure, z: int) -> int:
    self.parent.x = z
    return self.parent.x + 1
  def setParent(self: h_closure, parent: f_closure) -> h:
    self.parent = parent
    return self
f: f_closure = None
f = f_closure()
print(f.apply(6))
```

The argument of `setParent` will be self or None depending on whether the function is being declared within another function or in the global scope. The scope of captured variables is known because we keep track of where to find captured variables during type checking by recursively searching up the tree.

Global variables can't be assigned to via nonlocal within a function, but can be referred to. Because of this, we don't need to do any work to capture them and can simply refer to them by name.

---

## Test Cases

### 1. Nonlocal

```python
def f(x: int):
  def g():
    nonlocal x
    x = x + 1
    print(x)
  g()
  g()
f(5)
```

Should pass, yielding `6\n7`.

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
def f():
  def g():
    print(a + 1)
  print(a)
  return g
f()()
```

Should print `4\n5`
