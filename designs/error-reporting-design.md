# TODOs:
- Give an example for everything in "Examples of Design"
- Give some explanation to "Changes to Data Structure".
- Explain "functions to add" -- we'd like a function that keeps track of stack trace of function calls etc.

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



## Changes to Data Structures:

```ts
Annotation = {
	type: Type,
	loc: Loc,
}
Loc = {
	line: num,
	col: num,
}
```



## Functions to Add

TODO: `trace` function for accumulating stack traces

## Examples of Design

### What we aim to achieve by next week

#### Report Line Number

#### Report Column Number
#### Report Source Code
#### Pretty Source Code
#### Assignment with different types
#### Override \_\_init\_\_ signature
#### Binary operator type hint
#### Condition expression type hint
#### Type check print/len argument

```python
c:C = C()
print(c)
```

Should report the following static error:

```
TypeError: print() only takes types `int` and `bool` as the argument, got `C` on line 2 at col 6

print(c)
      ^ attempt to call print() on `c` which has type `C`
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