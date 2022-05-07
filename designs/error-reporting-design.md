# TODOs:
- Review everything in "Examples of Design"
- Review "Changes to Data Structure".
- Review "Functions to add"
- Add examples to "Future Work"

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
1. Stack trace
	1. [Tracing Function Calls](#tracing-function-calls)
	2. [Tracing Method Calls](#tracing-method-calls)
	3. [Tracing Constructor Calls](#tracing-constructor-calls)
	4. [Tracing Closure Calls](#tracing-closure-calls)

2. Better type error
	1. [Which branch does not have a return statement](#which-branch-does-not-have-a-return-statement)

2. Better Run-time error
	1. [Assert not none](#assert-not-none)
	2. [Out of memory](#out-of-memory)



## Changes to Data Structures

The only changes we would add to the AST is the following:

- We're extending the annotation type `A` to `Annotation` with information of location (line and column numbers) as well as the full line of source code that contains the given component.
- Such information except for the type information will be added during parsing, and type information will be added after type checking.

Here's an overview of the changes in code:

```ts
Annotation = {
	type?: Type,
	loc: Loc,
  fullSrc: string
}

Loc = {
	line: num,
	col: num,
}
```

## Functions to Add

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
Should give the following error at runtime:
```
ZeroDivisionError: divide by zero on line 1 at col 5

1 // 0
^^^^^^ attempt to divide by zero
```

### Future Work
#### Which branch does not have a return statement

#### Assert not none
#### Out of memory
#### Tracing Function Calls
#### Tracing Method Calls
#### Tracing Constructor Calls
#### Tracing Closure Calls