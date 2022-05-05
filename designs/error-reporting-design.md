### Error Reporting
Errors to Beautify:
1. More information in all error messages
	1. Line number
	2. Column number
	3. Source code
	4. Pretty source code.
2. Better type error
	1. Assignment with different types
	2. Override \_\_init\_\_ signature
	3. Which branch does not have a return statement
	4. Binary operator type hint
	5. Condition expression type hint
3. Better parse error
	1. Using keywords as variable
4. Better Run-time error
	1. Divide by zero
	2. Assert not none
	3. Type check print/len argument
	4. Out of memory
5. Stack trace
	1. Functions
	2. Methods
	3. Constructor
	4. Closure

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
- Give an example for everything on the "Error to Beautify"
- Give some explanation to "Changes to Data Structure".