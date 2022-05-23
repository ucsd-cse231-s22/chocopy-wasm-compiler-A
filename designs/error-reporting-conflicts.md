Describe in a few sentences why your feature and that feature don’t really interact much. Give an example of a program that showcases your feature and theirs without interacting, and justify why it’s representative (that is, why there isn’t some other interesting interaction between your features)

OR


Identify a place where your features overlap and will need more implementation to make them work together. This might be an opportunity for cool new stuff, or something that’s broken.
1. Describe it with a representatitve test case/scenario. This could be a Python program that will have an issue and crash the compiler because the two features were combined, or a novel combination of features that need good behavior. It could also be a UI interaction, a reason libraries won’t work well together, etc.
2. Describe what changes you think are needed to make these features work together: What should the new expected output be? What new additions to the compiler are needed to make them work together? Does their design need to change a bit, or does yours? How? Treat this like the first

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
- No new feature overlap observed. We already coordinated on how line / col numbers could be reported to them for static errors. We need to further coordinate on how runtime errors could be reported similarly, though
- TODO: example? maybe not?

## Generics and polymorphism

## I/O, files

## Inheritance

## Lists

## Memory management

## Optimization

## Sets and/or tuples and/or dictionaries

## Strings