# TODOs
Passing AST with row/col info to front-end runtime so that the front end team can use:
- class `TypeCheckError` will have a `getA()` method for getting the AST info (if any, could be undefined) and a `getErrMsg()` method for getting the full string of error message

# Error Reporting

## Design
### What have right now
1. More information in all error messages
    1. [Report Line Number](#report-line-number)
    2. [Report Column Number](#report-column-number)
    3. [Report Source Code](#report-source-code)
    4. [Pretty Source Code for single line](#pretty-source-code)
2. Better type error
    1. [Assignment with different types](#Assignment-with-different-types)
    2. [Override \_\_init\_\_ signature](#override-\_\_init\_\_-signature)
    3. [Binary operator type hint](#binary-operator-type-hint)
    4. [Condition expression type hint](#condition-expression-type-hint)
4. Run-time error
    1. [Divide by zero](#divide-by-zero)
    2. [Access None Field](#access-none)
    3. [Access None Method](#access-none)

### Future Work
1. [Stack trace](#stack-trace)
2. [Pretty Source Code for multiple lines](#pretty-source-code)
3. Explanation of the error in the context of the source code
3. Better type error
    1. [Function return check](#function-return-check)
    2. [Branch return hint](#branch-return-hint)
    2. [Type check print/len argument](#type-check-print/len-argument)
4. Better Run-time error
    1. [Assert not none](#assert-not-none)
    2. [Out of memory](#out-of-memory)


5. Better parse error
    1. [Using keywords as variable names](#using-keywords-as-variable)


## Changes to Data Structures (Week 6)

The only changes we would add to the AST is the following:

- We're extending the annotation type `A` to `Annotation` with information of start and end location (line and column numbers) as well as the full line of source code that contains the given component.
- Such information except for the type information will be added during parsing, and type information will be added after type checking.

Here's an overview of the changes in code:

```ts
Annotation = {
    type?: Type,
    fromLoc: Loc,
    toLoc: Loc,
    // fullSrc: string,
}

Loc = {
    line: num,
    col: num,
    srcIdx: num
}
```

## Changes to Data Structures (Week 7) 

We should pay attention to the following changes during merging:

1. We added `Annotation` and `Location` types for source reporting. We additionally added `eolLoc` so that we can report the whole line of source. The new data structures we added to the AST now become the following:

   ```ts
   export type Annotation = {
     type?: Type,
     fromLoc?: Location,
     endLoc?: Location,
     eolLoc: Location,
     src?: string
   }
   export type Location = {
     row: number,
     col: number,
     srcIdx: number,
   }
   ```

   

2. We changed all `a` fields to use `Annotation`. 

3. We added `a` fields to `AST.Literal` and `AST.Value` for error reporting.

4. In the parser, to annotate `AST` nodes with `Location`s, we made a wrapper `wrap_locs` for all the parser traverse functions. 

5. We stored the full source code in the `src` field of the `a` field of the head of the AST, the `Program` node.

6. We also added an environment `ParserEnv` that contains indices of line breaks in source code to parser functions so that we can calculate the column number of `AST` nodes.

## Design decisions

### Source and Locations
We decided to do pretty source code reporting. This require us to calculate and preserve a lot of position information for errors. stroing parts of the source string to AST nodes are not enough since we might want to display the context, at least the whole line. 

To annotate the start and end position of `AST` nodes, we enforce that a traverser function in the parser for a node will always start at the start of the node and end at the end of the node. We also enforce that each `AST` node should have a traverser fucntion. With this promise, we get the start and end position of all the `AST` nodes by looking at the position of the cursor `c` before and after the traverser functions. 

We can calculate the row and column number of a particular position in the source by first finding out where all the line breaks are in the source code, then do a binary search on the line break positions. For now, we are precalculating every row&col number during parsing. A more efficient way would be to calculate the row&col numbers when needed in reporting errors. But we will postpone that since we don't see efficiency problems right now.

Finally, we stored the full source code in the `Program` AST node only so that we could access the appropriate lines of source code based on the annotated locations in type checking.

### Runtime errors
We report runtime errors by calling checking functions, such as `assert_not_none`, in WASM. These checking functions are added in in `lower.ts`. All checking functions, import objects, and wasm imports are managed inside `errors.ts`. 

To report locations and get the locations needed for reporting source code, we pass in the location information from WASM as a list of `wasmint` arguments. These location arguments are moved from `AST` `Annotation`s to `IR` `wasmint`s in `lower.ts`. Right now we are using 7 location arguments. We might be able to reduce it by registering the errors in some dictionary and retrive them during actual error.

To get the source code during runtime, we added a src field to `importedObjects`, so that our checking functions can access the source code. However, it gets replaced every time a new program is being compiled. As a result, source isn't properly reported if it is not in the last compiled source. For example, when running code in REPL, if a runtime error happens in code that belongs to a previous REPL block or the main editor, source code does not get properly reported.

## Functions We Have Added

### `errors.ts`

We added this separate file that contains the following helper functions for error reporting:

- `fullSrcLine()`: given the full source code, the starting position of the erroneous token, and the index of the first new line character after that token, generate the full line(s) of source code that triggers the error
- `drawSquiggly()`: given the starting and ending positions of the errorneous token, produce a squiggly line that has the same length as that token and necessary padding before it if the errorneous code does not span across multiple lines, or an empty string if otherwise.
- Functions for embedding source code and location information into runtime errors of `divide_by_zero` and `assert_not_none`.

### `parser.ts`

We added the following functions to calculate and add location information to the AST nodes:

- `wrap_locs()`: adding location information after each node traversal
  - To do so, we also changed the original function names `traverse<NodeType>` to `traverse<NodeType>Helper`, and declare `traverse<NodeType>` as `wrap_locs(traverse<NodeType>Helper)` to maintain the lowest cost of refactoring and code merging.
- `indToLoc()`: given `srcIdx` from the `lezer` parser, find the `srcIdx` of the first new line character after it to further calculate `row` and `col`.
  - We implemented a `binarySearch()` on an array of source indices of line breaks to facilitate the search.
- `nextLineBreakLoc()`: given a token's ending location, find the location of the first new line character after it.



### Other changes in `type-check.ts`, `lower.ts` and `runner.ts` 

- Passing the full source code stored in the `Program` node to all type checking functions as an additional argument in `type-check.ts`.
- Calls to helper functions in `errors.ts` in the constructor of `TypeCheckError` to add the source code and squiggly lines (if any) to the static error message.
- Calls to helper functions in `errors.ts` in `lower.ts` to add source code information to runtime error reporting.
- Adding the full source code the `importObject` in `runner.ts` to facilitate runtim error reporting with source code information.

## Examples of Design

### What we have achieved by week 7

We report the line at which an error occurred. See examples below.

#### Report Column Number

We report the beginning column (0-index'd) of the token where an error occurred. See examples below.

#### Report Source Code

We report the full line of source code that contains an error. See examples below.

#### Pretty Source Code

We highlight the part in the source code that led to an error with squiggly lines (similar to Rust error reporting). See examples below. **Note:** We have NOT added the error explanation (in the context of the source code) behind the squggily lines yet.

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

Although we have had the implementation ready, it is failing one of the existing tests that prints a non-`int`/`bool` value. We wonder if `print()` in our language is no longer limited by the ChocoPy specs, which we will confirm with the instructors in the coming week.

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
