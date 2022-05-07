# TODOs:
- Review everything in "Examples of Design"
- Review "Changes to Data Structure".
- Review "Functions to add"
- Review "Future Work"

# Error Reporting

## Design
### What we aim to achieve by next week
1. More information in all error messages
    1. [Report Line Number](#report-line-number)
    2. [Report Column Number](#report-column-number)
    3. [Report Source Code](#report-source-code)
    4. [Pretty Source Code](#pretty-source-code)

2. Better type error
    1. [Assignment with different types](#Assignment-with-different-types)
    2. [Override \_\_init\_\_ signature](#override-\_\_init\_\_-signature)
    3. [Binary operator type hint](#binary-operator-type-hint)
    4. [Condition expression type hint](#condition-expression-type-hint)
    5. [Type check print/len argument](#type-check-print/len-argument)

3. Better parse error
    1. [Using keywords as variable names](#using-keywords-as-variable)

4. Better Run-time error
    1. [Divide by zero](#divide-by-zero)

### Future Work
1. [Stack trace](#stack-trace)

2. Better type error
    1. [Function return check](#function-return-check)
    2. [Branch return hint](#branch-return-hint)

2. Better Run-time error
    1. [Assert not none](#assert-not-none)
    2. [Out of memory](#out-of-memory)



## Changes to Data Structures

The only changes we would add to the AST is the following:

- We're extending the annotation type `A` to `Annotation` with information of start and end location (line and column numbers) as well as the full line of source code that contains the given component.
- Such information except for the type information will be added during parsing, and type information will be added after type checking.

Here's an overview of the changes in code:

```ts
Annotation = {
    type?: Type,
    fromLoc: Loc,
    toLoc: Loc,
    fullSrc: string
}

Loc = {
    line: num,
    col: num,
}
```

## Functions to Add
### Parsing
During parsing, we will need to record the starting and ending location of each AST node. We need to figure out how to get line and column number out of lezer or count them ourselves. We may add `annotateLocation(ast, lezer_cursor)` function that calculates location information from a lezer cursor and add to the annotation field of the AST node.

### Type Checking
We will add a collection of functions, such as `binaryOperatorTypeError(ast)` that helps format the error message using the annotation in the AST node.

### Compiler
We plan to implement a global `trace()` function that accumulates stack traces at runtime: a trace will be added whenever a function/method frame is entered, which contains the name of the frame and its location. Based on the current architecture, we will add the `trace()` function to `compile.ts`, and the traces will be reused in `runner.ts` when a runtime error is caught for printing out the stack trace.

## Examples of Design

### What we aim to achieve by next week

#### Report Line Number 

We report the line at which an error occurred. See examples below.

#### Report Column Number

We report the beginning column (0-index'd) of the token where an error occurred. See examples below.

#### Report Source Code

We report the full line of source code that contains an error. See examples below.

#### Pretty Source Code

We highlight the part in the source code that led to an error with squiggly lines (similar to Rust error reporting). See examples below.

#### Assignment with different types

```python
a:int = 10
a = True
```

Should report the following static error:

```
TypeError: assignment value should have assignable type to type `int`, got `bool` on line 1 at col 4

a = True
    ^^^^ attempt to assign type `bool` to type `int`
```



#### Override \_\_init\_\_ signature

```python
class C(object):
  def __init__(self:C, other:D):
    pass
  
x:C = None
x = C()
```

Should report the following static error:

```
TypeError: `__init__` takes 1 argument of the same type of the class, got 2 on line 2 at col 21

def __init__(self:C, other:D):
                   ^^^^^^^^^^^ attempt to have more than 1 argument for `__init__`
```



#### Binary operator type hint

```python
a:bool = True
a > 10
```

Should report the following static error:

```
TypeError: binary operator `>` should take type `int` on both sides, got `bool` and `int`

a > 10
^^ attempt to use `a` of type `int` with `>`
```



#### Condition expression type hint

```python
a:int = 10
if a:
  print(a)
```

Should report the following static error:

```
TypeError: a conditional expression should have type `bool`, got `int` on line 2 at col 3

if a:
   ^^ attempt to use `a` of type `int` as a conditional expression
```



#### Type check print/len argument

```python
c:C = None
c = C()
print(c)
```

Should report the following static error:

```
TypeError: print() only takes types `int` and `bool` as the argument, got `C` on line 3 at col 6

print(c)
      ^^ attempt to call print() on `c` which has type `C`
```



#### Using keywords as variable

```python
if:int = 10
```

Should report the following static error:

```
TypeError: using a reserved keyword as variable name on line 1 at col 1

if:int = 10
^^ attempt to use keyword `if` as a variable name
```



#### Divide by zero
```python 
1 // 0
```
Should report the following runtime error:
```
Traceback:
  Toplevel, line 1

ZeroDivisionError: divide by zero on line 1 at col 5

1 // 0
^^^^^^ attempt to divide by zero
```

### Future Work
#### Function/method return check
```python 
def foo(x: bool, y: bool) -> int:
    pass
```
Should report the following static error:
```
TypeError: missing return statement for function `foo` on line 1 at col 29 

def foo(x: bool, y: bool) -> int:
                             ^^^ expected `int`, missing return statement
```

```python 
def foo(x: bool, y: bool) -> int:
    return False
```
Should report the following static error:
```
TypeError: return value of function `foo` should have assignable type to type `int`, got `bool` on line 2 at col 11

def foo(x: bool, y: bool) -> int:
                             --- expected `int` 
    return False
           ^^^^^ expected `int`, found `bool` 
```
#### Branch return hint
```python 
def foo(x: bool, y: bool) -> int:
    if x:
        pass
    else:
        pass
```
When the last statement is an if-statement, we could hint that each branch (of the last and out-most if-statement) should have a return statement. The above program should report the following static errors:
```
TypeError: missing return statement for function `foo` in if branch starting on line 2 at col 8:

def foo(x: bool, y: bool) -> int:
                             --- expected `int` 
    if x:
 _______^
|       pass
|__________^ expected `int`, missing return statement
```
and 
```
TypeError: missing return statement for function `foo` in else branch starting on line 4 at col 8:

def foo(x: bool, y: bool) -> int:
                             --- expected `int` 
    else:
 _______^
|       pass
|__________^ expected `int`, missing return statement
```
#### Assert not none
```python
c:C = None
print(c.data)
print(c.foo())
c.data = 0
```

Should report the following runtime errors:

```
Traceback:
  Toplevel, line 2

OperationOnNoneError: attempt to access attribute `data` on value `None` on line 2 at col 7

print(c.data)
       ^^^^^ attempt to access attribute `data` on value `None`
```

```
Traceback:
  Toplevel, line 3

OperationOnNoneError: attempt to call method `fool` on value `None` on line 3 at col 7

print(c.foo())
       ^^^^^^ attempt to call method `foo` on value `None`
```

```
Traceback:
  Toplevel, line 3

OperationOnNoneError: attempt to call method `foo` on value `None` on line 3 at col 7

print(c.foo())
       ^^^^^ attempt to access `data` on value `None`
```
#### Out of memory
If the program is out of memory, the following runtime error should be reported:
```
Traceback:
  Toplevel, line 10

OutOfMemoryError: Out of memory
```
We might improve this reporting behaviour based on the kind of errors that the memory manager reports.

#### Stack Trace
For runtime errors, a stack trace should be reported along with the actual error. The stack trace will look like this:
```
Traceback:
  Toplevel, line 1               # toplevel
  In function `foo`, line 2      # function call
  In method `bar` of `C`, line 5 # method
  In constructor of `C`, line 3  # constructor
  In closure on line 6           # closure

ActualError: some error on line 6 col 1
```
