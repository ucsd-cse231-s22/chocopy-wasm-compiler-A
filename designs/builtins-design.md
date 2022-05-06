## Functionality we'll implement next week
#### 1. Type-casting for int, bool, NoneType 

```python
>>> print(bool(3))
True
>>> print(int(3))
3
>>> print(int(False))
0
>>> print(bool(int(True))
True
```

#### 2. the `import` keyword, and module.item syntax
```python
>>> import math
>>> math : bool = False
NameError: math is already the name of an imported module
```

#### 3. `from x import y` statements (including `from x import *`)

```python
>>> from math import *
>>> def factorial():
...   return
NameError: factorial is already the name of a function
```

#### 4. `import x as y` statements

```python
>>> import math as m
>>> math : int = 30
>>> # no error!
```

#### 5. `math.factorial()`, in WASM

```python
>>> print(math.factorial(5))
120
>>> print(math.factorial(0))
1
```

#### 6. `math.gcd()`, in WASM

```python
>>> print(math.gcd(6, 9))
3
```

#### 7. `math.lcm()`, in WASM

```python
>>> print(math.lcm(6,9))
18
```

#### 8. a few extensions to print()
```python
>>> print()

>>> print(1, 1)
1 1
>>> print(print)
<built-in function print>
```

#### 9. Basic `float` Type

```python
>>> x : float = 3.2
>>> # implement floats! (but not float funcs yet)
```

#### 10. Basic Ellipse type

```python
>>> print(...)
Ellipsis  # this is an object :)
```

## Changes we want to make
#### Changes to the AST
- add a new `ImportedModule` type:
```typescript
export type ImportedModule = {
    name: string,
    importedAs: string
}
```
- add a new field `imports: Array<ImportedModule>` to `Program`
- add new Literal kind `...` (but don't add its type (?), because casting to an ellipsis doesn't make sense)
- add new Literal kind `float: number`
#### Changes to the IR
- this is less a change to the IR and more a change to how the IR is used: we want to add preprocessing for imports!
    - no circular imports allowed (catching this will be kind of annoying, so we won't implement it yet)
    - during IR tree construction, add FunDefs corresponding to all ImportedModules' functions to Program.funs; this will make type-checking seamless
    - add individual functions imported from modules into the IR the same way
#### Changes to builtin libraries

- print() will get changed pretty extensively
    - print will no longer be unary -- any arity is valid!
        - nullary: prints new line
        - unary: prints the argument
        - n-ary: prints all arguments, separated by spaces


## New functions, types, and/or files
- math.wat
    - factorial(n : int) -> int
    - gcd(a : int, b : int) -> int
    - lcm(a : int, b : int) -> int
- `float`, as a type
- various flavors of `import` statement
    - `import x`
    - `import x as y`
    - `from x import y`

## Value representation / memory layout for new stuff
- Imported modules and functions get added to the IR tree during preprocessing (modify lower.ts)
    - NOTE that this is NOT import's full Python functionality! Files are NOT run before importing them, and we aren't adding support for importing user-made files.
- floats will be represented as [32-bit wasm floats](https://webassembly.github.io/spec/core/syntax/values.html#syntax-float)
