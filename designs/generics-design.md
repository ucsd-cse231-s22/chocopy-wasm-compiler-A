## Test Cases
---

Generics are a programming language feature that allow classes and functions to
abstract over the specific types of data that they work with. This is done by
parameterizing classes and functions over the types that they can work with.

1. **Basic Type Variable Declaration**

```python
T = TypeVar('T')
```

A type variable can be introduced using a TypeVar definition. New type variables
can be introduced only in global scope and can used across any number of generic
class/function definitions.

The first parameter to TypeVar can be used to provide a more descriptive name
for the type variable and can potentially be used for more descriptive error
messages from the compiler for example.

2. **Class Definition with a Type Variable**

```python
T = TypeVar('T')

class Box(Generic[T]):
    pass
```

A generic class can be defined by inheriting from the special base class Generic
along with a defined type variable. Any other class that this class
inherits from in the inheritance hierarchy can be specified after this.

A generic class is type-checked for all possible allowed instantiations of its
type variables independent of the instantiations actually made in the program.

3. **Object creation using Type Variable instantiated with a Primitive Type**
```python
T = TypeVar('T')

class Box(Generic[T]):
    pass

b: Box[int] = None
b = Box()
```

An object of a generic class can be created by instantiating the type parameter
with a primitive type in the type annotation for the object's variable declaration.

After type-checking and before lowering a copy of each generic class is made for
each type that its type variables are instantiated with over the course of the program.


4. **Object creation using Type Variable instantiated with a User-Defined Type**

```python
T = TypeVar('T')

class Box(Generic[T]):
    pass

class Rat():
    pass

b: Box[Rat] = None
b = Box()
```

A type parameter of a generic class can also be instantiated with a user-defined
class.

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

A type variable definition may include a list of types that constrains the types
that the variable can be instantiated with. The list of types are interpreted as
"OR" constraints on the type variable.

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

Generic classes can have fields with the type parameter as a type annotation. Since
fields need to always be initialized but we don't know the actual type of the field, generic
fields need to be initialized with the special __ZERO__ literal value that automatically uses
a reasonable default value depending on the type the type-variable is actually instantiated with.

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

Generic classes can have methods that use type parameters in their argument and
return types. Also note the `Box[T]` annotation on the self argument.


8. **Type Variables cannot shadow class name**
```python
T = TypeVar('T')

class T(): # TypeError: Duplicate identifier in the same scope.
    pass
```

Type Variable names cannot overlap with class, function or variable names. This
is because in some contexts we need to be able to unambiguosly determine if an
identifier is a type variable.

9. **Generic Class with multiple Type Parameters**
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

A class can have multiple type parameters. These type parameters can be independently
instantiated to different types based on their own constraints.

10. **Function that uses Type Parameters**
```python
T = TypeVar('T')

def id(t: T) -> T:
    return t
```

An independent function can also be generic. The arguments and return type can use
any of the type variables that are declared in the program.

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

Type annotations that use type variables directly are initially marked as having a class type. During the type checking phase, we'll update the type annotations from class to typeVar, if required. For instance in the following program, 
```python
T = TypeVar('T')
class A(Generic[T]):
    f: T = __ZERO__
```
the field f will intially have the type annotation `class`. During the typechecking phase, we will detect that T is a type variable and update the type annnotation 
to `typevar`. When the type variables are instantiated and the generic class is monomorphized all type annotations with the `typevar` annotation are replaced with the concrete type.

---

```typescript
...
export type Program<A> = { a?: A, funs: Array<FunDef<A>>, inits: Array<VarInit<A>>, typeVarInits: Array<TypeVar<A>>, classes: Array<Class<A>>, stmts: Array<Stmt<A>> }
...
export type TypeVar<A> = { a?: A, name: string, constraints: Array<Type> }
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

### Type Variable Definitions

Parser should identify and parse type-variable definitions as part of the global definitions.

```typescript
export function traverseDefs(c : TreeCursor, s : string) : [Array<VarInit<null>>, Array<FunDef<null>>, Array<Class<null>>, Array<TypeVar<null>>] {
  ... 
  const typevars: Array<TypeVar<null>> = [];

  while(true) {
    ...
    else if(isTypeVar(c, s) {
      typevars.push(traverseTypeVar);  
    } else {
      return [inits, funs, classes, typevars];
    }
    c.nextSibling();
  }
}
```

### Type Annotations for Generic Types

Parser should be able to pass fancy type annotations of generic types with type parameters.

```typescript
export function traverseType(c : TreeCursor, s : string) : Type {
  if(c.type.name === "MemberExpression") {
    // parse generic type with type parameters
    ...
  } else {
    ... 
  }
}
```

### Generic Class Definitions

Parser should look for classes inheriting from the special Generic superclass and parse the type parameters.

```typescript
export function traverseClass(c : TreeCursor, s : string) : Class<null> {
  const fields : Array<VarInit<null>> = [];
  const methods : Array<FunDef<null>> = [];
  const typeParams: Array<string> = [];
  c.firstChild();
  c.nextSibling(); // Focus on class name
  const className = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on arglist/superclass
  // Parse the superclass list and look for Generic
  // and parse the type parameters if found
  ...
  return {
    name: className,
    fields,
    methods,
    typeParams
  };
}
```

### __ZERO__ Literal

Parser should properly parse the new __ZERO__ value as a literal.

```typescript
export function traverseLiteral(c : TreeCursor, s : string) : Literal {
  switch(c.type.name) {
    case "VariableName":
      // check if variable is called __ZERO__ and return literal 
    default:
      throw new Error("Not literal")
  }
}
```

---

## Proposed changes to the Type-Checker

---

## Proposed new compiler pass : Monomorphizer
