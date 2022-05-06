## Test Cases
---

1. **Basic Type Variable Declaration**

```python
T = TypeVar('T')
```

This should add a type variable T, with the descriptive name 'T', to the global typing environment. 
This name can be potentially be used for descriptive error messages from the compiler.

2. **Class Definition with a Type Variable**

```python
T = TypeVar('T')

class Box(Generic[T]):
    pass
```
This should typecheck the class **Box** and add this to the global state of classes with a generic type parameter, T.

3. **Object creation using Type Variable instantiated with a Primtive Type**
```python
T = TypeVar('T')

class Box(Generic[T]):
    pass

b: Box[int] = Box()
```
This should 

4. **Object creation using Type Variable instantiated with a User-Defined Type**

```python
T = TypeVar('T')

class Box(Generic[T]):
    pass

class Rat():
    pass

b: Box[Rat] = Box()
```
This should 

5. **Type Variables and Generic Classes with Constraints**

```python
T = TypeVar('T')
R = TypeVar('R', int, bool)

class Box(Generic[T]):
    pass

class ConstrainedBox(Generic[R]):
    pass

b1: Box[int] = Box()
cb1: ConstrainedBox[bool] = ConstrainedBox()
```
This should 

6. **Generic Class with Fields of a Generic Type**
```python
T = TypeVar('T')

class Box(Generic[T]):
    f : T = __ZERO__

b : Box[int] = None
b = Box()
print(b.f) #prints 0 (zero value of int)
b.f = 10
print(b.f) #prints 10
```

7. **Generic Class with Methods with Generic Types in their signature**
```python
T = TypeVar('T')

class Box(Generic[T]):
    f : T = __ZERO__

    def getF(self: Box[T]) -> T:
        return self.f

    def setF(self: Box[T], f: T):
        self.f = f

b : Box[int] = None
b = Box()
print(b.getF()) #prints 0 (zero value of int)
b.setF(10)
print(b.getF()) #prints 10
print(b.f) #prints 10
```

8. **Type Variables cannot shadow class name**
```python
T = TypeVar('T')

class T(): # TypeError: Duplicate identifier in the same scope.
    pass
```

9. **Classed with multiple Type Parameters**
```python
L = TypeVar('L')
R = TypeVar('R')

class Pair(Generic[L, R]):
    left: L = __ZERO__
    right: R = __ZERO__

p1 : Pair[int, int] = None
p1 = Pair()
p2 : Pair[int, bool] = None
p2 = Pair()
```

10. **Function that uses Type Parameters**
```python
T = TypeVar('T')

def id(t: T) -> T:
    return t
```

11. **Joe's blessed test case from class**
```python
T= TypeVar('T')
class C(Generic[T]):
    t: T = __ZERO__
    def f(self: C[T], other: C[T]):
        other.t = self.t

c1 : C[int] = None
c1 = C()
c2 : C[int] = None
c2 = C()
print(c1.t) #prints 0
c2.t = 10
c1.f(c2)
print(c1.t) #prints 10
```

---

## Proposed changes to the AST

```typescript
export type Type =
  ...
  | { tag: "class", name: string, params: Array<Type> }
  | { tag: "typevar", name: string }
  ...
```

Type annotations of the form `<ClassName>[<TypeVar>]` for example `a: C[int] = None` will have the following `Type`:

```typescript
{ tag: "class", name: "C", params: [{ tag: "number" }] }
```

During the type checking phase, we'll update the type annotations from class to typeVar, if required. For instance in the following program, 
```python
T = TypeVar('T')
class A(Generic[T]):
    f: T = __ZERO__
```
the field f will intially have the type annotation `class`. During the typechecking phase, we will detect that T is a `TypeVar` and update the type annnotation 
to `typevar`.

---

```typescript
...
export type Program<A> = { a?: A, funs: Array<FunDef<A>>, inits: Array<VarInit<A>>, typeVarInits: Array<TypeVar<A>>, classes: Array<Class<A>>, stmts: Array<Stmt<A>> }
...
export type TypeVar<A> = { a?: A, name: string, types: Array<Type> }
...
```

We add a new construct for defining Type Variables : `TypeVar<A>`. Any Type Variables need to be defined globally similar to class definitions. 
`Program<A>` has a list of these Type Variable declarations.

---

```typescript
...
export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, typeParams: Array<string> }
...
```

Classes can be parameterized by a list of Type Variables. We introduce `typeParams` to store the Type Variable names for the class.

---

```typescript
export type Literal = 
  ...
  | { tag: "zero" }
```

We introduce a special init value for variables of a generic type : `__ZERO__`. For exisiting types, following are the "zero" values :
```
int --> 0
bool --> False
class --> None
```

---

## Proposed changes to the Parser

---

## Proposed changes to the Type-Checker

---

## Proposed new compiler pass : Monomorphizer