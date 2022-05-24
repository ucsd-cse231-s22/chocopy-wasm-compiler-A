## Bignums
Our implementation for reporting static and runtime errors should not interfere with the Bignums feature. From a high-level, the Bignums implementation extends the current compiler to support large values, whereas the implementation for our feature records source code and location information to the AST. Their implementation does not modify the ast or the parsing process, which is the main place to which our changes have been added. 

Example that illustrates how error reporting can work well with Bignums:
```python
x : int = 100000000000000000000000
x = True
```
would have the following error message:
```
TypeError: assignment value should have assignable type to type `int`, got `bool` on line 2 at col 5

x = True
    ^^^^ attempt to assign type `bool` to type `int`
```

## Built-in libraries
Our implementation for reporting static and runtime errors should not interfere with the support for Built-in libraries. However, our implementation only applies to existing features of the compiler, and extending the support to Built-in libraries needs more work. Specifically, more work is needed to embed the source code and location information we've added to the AST during parsing to their changes in `ast.ts` and `parser.ts`.

In addition, their design decision of using code transformation to replace `import` statements with source code they wrote in the AST (after parsing) is a bit concerning for us as well as the front-end team. Our current guess based on reading their code is that this change wouldn't affect our calculation for line and column numbers that is already done during parsing and future error reporting. However, a conversation with the built-in team might be necessary to further understand their implementation.

Example of an error involving `import` that needs future work:
```python
from math import fact # `fact` does not exist
fact(5)
```
this program should have the following runtime error:
```
ImportError: cannot import name `fact` from `math` on line 1 at col 18

from math import fact
                 ^^^^ attempt to import a name that does not exist from a given library
```

## Closures/first class/anonymous functions
Our implementation for reporting static and runtime errors should not interfere with the support for closures. However, our implementation only applies to existing features of the compiler, and extending the support to closures needs more work. Specifically, more work is needed to embed the source code and location information we've added to the AST during parsing to their changes in `ast.ts` and `parser.ts`.

Example of an error involving a closure that needs future work:
```python
def a():
    n = 1
    def b(a:int) -> bool:
        return a + 1
    b(n)
a()
```
this program should have the following static error:
```
TypeError: return value of function `b` should have assignable type to type `bool`, got `int` on line 4 at col 19

    def b(a:int) -> bool:
        return a + 1
               ^^^^^ expected `bool`, found `int` 
```

## comprehensions
Our implementation for reporting static and runtime errors should not interfere with the support for comprehensions. However, our implementation only applies to existing features of the compiler, and extending the support to comprehensions needs more work. Specifically, more work is needed to embed the source code and location information we've added to the AST during parsing to their changes in `ast.ts` and `parser.ts`.

In addition, an `Error` object instead of a `TypeCheckError` object is thrown when there is a static error with comprehensions. For our implementation to work we'd need to manually change all `Error` instances in `type-check.ts` to `TypeCheckError` first before embedding source code and location information.

Example of an error involving comprehensions that needs future work:
```python
ns:int[] = [1,2,3,4,5]
a:bool[] = [n and False for n in ns]
```
this program should have the following static error:
```
TypeError: binary operator `and` should take type `bool` on both sides, got `int` and `bool` in line 2 at col 13

a:bool[] = [n and False for n in ns]
            ^^^^^^^^^^^ attempt to use `n` of type `int` with `and`
```

## Destructuring assignment
Our implementation for reporting static and runtime errors should not interfere with the support for assignment destructuring. However, as with other new features that change the AST and `parser.ts`, our implementation only applies to existing features of the compiler, and extending the support to this feature needs more work. More work is needed to embed the source code and location information we've added to the AST during parsing to their changes in `ast.ts` and `parser.ts`.

Example of an error involving destructuring assignments that needs future work:
```python
a:int = [1]
x:int = 0
y:int = 0
x,y = a
```
this program should have the following static error:
```
TypeError: not enough values to unpack (expected at least 2, got 3) in line 4 at col 1

x,y = a
^^^^^^^ attempt to unpack `a`, a list of 1 element to 2 variables `x` and `y`
```


## Fancy calling conventions
Our implementation for reporting static and runtime errors should not interfere with the support for fancy calling conventions. However, as with other new features that change the AST and `parser.ts`, our implementation only applies to existing features of the compiler, and extending the support to this feature needs more work. More work is needed to embed the source code and location information we've added to the AST during parsing to their changes in `ast.ts` and `parser.ts`.

Example of an error involving fancy calling conventions that needs future work:
```python
def f(x : int, y : int = 5, z : int = 10):
    return

f(x=1, x=1)
```
this program should have the following static error:
```
TypeError: keyword argument repeated in line 4 at col 8

f(x=1, x=1)
       ^^^ attempt to use keyword argument `x` again
```

## for loops/iterators
Our implementation for reporting static and runtime errors should not interfere with the support for for loops. However, as with other new features that change the AST and `parser.ts`, our implementation only applies to existing features of the compiler, and extending the support to this feature needs more work. More work is needed to embed the source code and location information we've added to the AST during parsing to their changes in `ast.ts` and `parser.ts`.

In addition, a for loop definitely spans multiple lines, and our squiggly line drawing mechanism in error reporting doesn't work for multi-line source code at the moment. Despite the malfunction of squiggly lines drawing, we should still be able to report the full for loop body and its header if there is anything that goes wrong with the whole loop body.

A more challenging question would be to show a trace of how type checking fails when the variable used to run through an iterator doesn't have the same type as elements in the iterator. See the example below for more details -- this is how our current implementation works, and it might be confusing because it is only showing the lowest source of the error (the `has` method) without displaying how it is triggered in the first place (having `i` with `bool` type while using it in `for i in cls`):

```python
class Range(object):
   current : int = 0
   min : int = 0
   max : int = 0
   def new(self:Range, min:int, max:int)->Range:
     self.min = min
     self.current = min
     self.max = max
     return self
   def next(self:Range)->int:
     c : int = 0
     c = self.current
     self.current = self.current + 1
     return c
   def has(self:Range)->bool:
     return self.current < self.max

cls:Range = None
i:bool = True
cls = Range().new(1,3)
for i in cls:
  print(i)
```
this program should have the following static error:
```
TypeError: binary operator `<` should take type `int` on both sides, got `bool` and `int` in line 16 at col 13

  return self.current < self.max
         ^^^^^^^^^^^^ attempt to use `self.current` of type `bool` with `>`
```

## Front-end user interface
The only place that our implementation might overlap with the front-end team's is the calculation and reporting of error source locations. The front-end team mentioned that they would like to use such information that we calculated to highlight the source code errors inside the editor. We have already coordinated with the front-end team by providing them with an API so that they could get line / col info when a static error occurs. The changes have already been merged to the main repository and now accessible to all teams. We still need to work on building a similar API for runtime errors so that the similar information could be outputed to the front-end team.

Frankly, we don't think it's possible to provide an example of how our features overlap / not overlap without having a running version of the UI, especially when some critical features remain unavailable / WIP according to the team's design documentation. We hoped to find screenshots in their design doc but there didn't seem to be any by the time we checked.

## Generics and polymorphism
Most functionality won't interfere. Special care should be taken when doing with the following.
1. Switching from `Type` to `Annotation` for the `a` fields,
2. Parsing source location for the new AST constructs, specifically `TypeVar`,
3. Throwing type errors with source and location information.

Most of the `TypeCheckError`s can be easily annotated with location information. There is no location information available for the `Tried to zip two arrays of different length` error in `zip()` in `type-check.ts`, but upon inpection, the error is impossible to be thrown unless the compiler is faulty.

There is only one `Error` in `monomorphizer.ts` and upon inpection, the error is impossible to be thrown unless the compiler is faulty.

The the string message in creating `TypeVar` can be used for better error messages. 

Example of an error involving generics and polymorphism that needs future work:
```python
T = TypeVar('Only_Some_Int', int)
```
this program should have the following static error:
```
TypeError: type-variable `Some_Type` should have 0 or at least 2 constraints in line 1 at col 5

T = TypeVar('Only_Some_Int', int)
                             ^^^ type variable have only one constraint
```

## I/O, files
The I/O team implemented the I/O behaviour in ts, with a `File` class as an interface. 

The main concern with the I/O group is how to report error locations and line numbers for the runtime errors that occur inside `read()`, `write()`, `seek()`, and `close()`. The problems are the following.
1. The declaration of `File` is not exist in the user source code. It is given in a string that is concactenated to the user source code. The concactnenation messes with the location information of user source code. We should compile the I/O (as well as other built-in library) separately once before compiling user source code. 
2. The function calls to `read()` etc are another function call to `File.builtin_read()`. We might want to report the user code instead of the wrapper code in `File` during runtime errors. This won't be a problem after call stack reporting is implemented, where code of callers on the call stack will be reported.  
3. The runtime errors will be thrown directly from their TS library. It deviates from the current structure where all runtime errors are registered before compiled. Some care should be taken when throwing runtime errors from the TS library so that the location and source will be properly reported. The plan is to use information on the call-stack for reporting location and source when it is implemented. 

Example of an error involving I/O that needs future work:
```python
f:File = None
f = open(0, 0)
f.write(0)
f.close()
```
this program should have the following runtime error:
```
Traceback:
  Toplevel, line 3

f.write(0)
  ^^^^^^^^ file not writable
RUNTIME ERROR: file with fd = 2 is not writable (mode = 0) in line 3 at col 3
```

## Inheritance
Most functionality won't interfere. Special care should be taken when doing with the following.
1. Switching from `Type` to `Annotation` for the `a` fields,
2. Throwing type errors with source and location information.

The `super` string field in `Class` AST node does not have location information attached to it, some changes would need to be done so that the underline in the following error can be drawn:
```python
class A(NonExistentClass):
  pass
```
this program should have the following static error:
```
class A(NonExistentClass):
        ^^^^^^^^^^^^^^^^ superclass not defined

TypeError: Superclass `NonExistentClass` does not exist on line 1 at col 9
```

## Lists
Most functionality won't interfere. Special care should be taken when doing with the following.
1. Switching from `Type` to `Annotation` for the `a` fields,
2. Throwing type errors with source and location information.
3. Register and prepare runtime errors before throwing. 

Two examples of an error involving lists that needs future work:
```python
a: [int] = None
a = [0,1,2]
print(a[3])
```
this program should have the following runtime error:
```
Traceback:
  Toplevel, line 3

print(a[3])
        ^ index out of bounds
RUNTIME ERROR: index out of bound in line 3 at col 9
```

And:
```python
a: [int] = None
a = [0,1,2]
print(a[False])
```
this program should have the following static error:
```
print(a[False])
        ^^^^^ index is not integer
TypeError: index if of non-integer type 'bool' in line 3 at col 9
```

## Memory management
Most functionality won't interfere. Special care should be taken when doing with the following.
1. Switching from `Type` to `Annotation` for the `a` fields,
2. Throwing type errors with source and location information.

Similar to I/O and Built-In teams, the runtime errors from the memory manager will be thrown directly from their TS library. It deviates from the current structure where all runtime errors are registered before compiled. Some care should be taken when throwing runtime errors from the TS library so that the location and source will be properly reported. The plan is to use information on the call-stack for reporting location and source when it is implemented. 

Example of an error involving Memory Management that needs future work:
```python
class C(object):
    x : int = 0 
a1 = C()
...
a2147483648 = C()
```
this program should have the following runtime error:
```
Traceback:
  Toplevel, line 2147483650
    a2147483648 = C()
                  ^^^
  In constructor of `C`, <INTERNAL> 

MemoryError: maximum references allocated in internal code
```

## Optimization

## Sets and/or tuples and/or dictionaries

## Strings