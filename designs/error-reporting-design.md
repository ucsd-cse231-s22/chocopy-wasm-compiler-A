### Error Reporting
Errors to Beautify:
1. More information in all error messages
	1. [Report Line Number](#report-line-number)
	2. [Report Column Number](#report-column-number)
	3. [Report Source Code](#report-source-code)
	4. [Pretty Source Code](#pretty-source-code)
2. Better type error
	1. [Assignment with different types](#Assignment-with-different-types)
	2. [Override \_\_init\_\_ signature](#override-\_\_init\_\_-signature)
	3. [Which branch does not have a return statement](#which-branch-does-not-have-a-return-statement)
	4. [Binary operator type hint](#binary-operator-type-hint)
	5. [Condition expression type hint](#condition-expression-type-hint)
3. Better parse error
	1. [Using keywords as variable](#using-keywords-as-variable)
4. Better Run-time error
	1. [Divide by zero](#divide-by-zero)
	2. [Assert not none](#assert-not-none)
	3. [Type check print/len argument](#type-check-print/len-argument)
	4. [Out of memory](#out-of-memory)
5. Stack trace
	1. [Tracing Function Calls](#tracing-function-calls)
	2. [Tracing Method Calls](#tracing-method-calls)
	3. [Tracing Constructor Calls](#tracing-constructor-calls)
	4. [Tracing Closure Calls](#tracing-closure-calls)

Changes to Data Structures:
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

TODOs:
- Give an example for everything in "Error to Beautify"
- Give some explanation to "Changes to Data Structure".


#### Report Line Number
#### Report Column Number
#### Report Source Code
#### Pretty Source Code
#### Assignment with different types
#### Override \_\_init\_\_ signature
#### Which branch does not have a return statement
#### Binary operator type hint
#### Condition expression type hint
#### Using keywords as variable
#### Divide by zero
```python 
1 // 0
```
Should give the following error at runtime:
```
ZeroDivisionError: divide by zero on line 1 at col 3

1 // 0
^^^^^^ attempt to divide by zero
```
#### Assert not none
#### Type check print/len argument
#### Out of memory
#### Tracing Function Calls
#### Tracing Method Calls
#### Tracing Constructor Calls
#### Tracing Closure Calls