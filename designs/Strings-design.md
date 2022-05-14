# Compiler A: Strings
## 10 test cases

1. Store a string as a variable.
    ```Python
    s:str = "abcd"
    print(s)
    s
    ```
    Expected output:
    ```Python
    abcd
    "abcd"
    ```

    **Update Week 7**:

    We are considering that using a series of ASCIIs to store string in the momeory. However, in ir.ts, type VarInit\<A> = { a?: A, name: string, type: Type, value: Value\<A> }, the value is of type Value\<A>. Thus, for now we cannot simply assign the string to the variable (s here) because we need to allocate a block of memory and store the ASCIIs (this should be done in Expr\<A>).
    
    We have some solutions about this issue:
    1. When initializing a string variable (s:str = "abcd"), in parser.ts, we first parse it to s:str = None, then s = "abcd", i.e. we spilt varInit into varInit and Stmt(assignStmt). However, in class, we just have varInits and methods, thus, we cannot modify the string initialization in this way.
    2. We are thinking about changing the IR.VarInit\<A> = { a?: A, name: string, type: Type, value: Value\<A> } to IR.VarInit\<A> = { a?: A, name: string, type: Type, value: Expr\<A> }. By this way, we can accomplish the allocation and storing jobs.
    3. Actually, we are thinking about also change the AST.VarInit\<A> = { a?: A, name: string, type: Type, value: Literal } to AST.VarInit\<A> = { a?: A, name: string, type: Type, value: Expr\<A> }. We know that in ChocoPy, when initialzing the variables, we should not use a expression at the right hand side. Thus, when initialzing the variables which need the memory, the right hand side can only be None. However, by modifying the VarInit stucture, we can support the initializations such as l: [int] = [1, 2, 3] and c: C = C() where C is a class object. Then our behavior will be more python-like.

    Our temporay solution is that we require the user of our compiler to defined a string in two steps, which is the same as defining a class:
    1. Assign "None" to 1. (e.g. x:str = None)
    2. Assign a value to it. (e.g. x = "abcd")
    
    Therefore, the test case 1 will be:
    ```Python
    s:str = None
    s = "abcd"
    print(s)
    ```
    Expected output:
    ```Python
    abcd
    ```

2. Return the length of a string.
    ```Python
    s:str = "abcd"
    print(len(s))
    ```
    Expected output:
    ```Python
    4
    ```

    **Update**:

    Our solution is that when storing a string, we firstly store its length on top of its memory block (The string type should be immutable, so the length will not change). By doing so, when we want to load the string, we can know where to stop when generating the wasm loop block.

    Besides, regrading the builtin print and len, we would like to define two functions in wasm: print_str and len_str to handle the string case. For print_str, we first get the length of the string, and then generate a wasm loop to load the ASCIIs of the strings and convert them back to string. For len_str, simpler, we can get the length and call print_num.

    For now, we implement the print_str and len_str in complier.ts by adding new variables to get the length of the string and handle the loop block in wasm. In the following weeks, we should implement them in lower.ts using
    the for loop designed by the fop loop group.

    ```Python
    s:str = None
    s = "abcd"
    print(len(s))
    ```
    Expected output:
    ```Python
    4
    ```

3. Concatenate two strings
    ``` Python
    s1:str = "ab"
    s2:str = "cd"
    print(s1 + s2)
    ```
    Expected output:
    ```Python
    abcd
    ```

    **Update**:

    The design of string concatenation is that: for the string variable in wasm, we have the information of its address. Then we just need to load its value using its address and then peform the operations on them.



4. Comparison with two strings
    ```Python
    s1:str = "ab"
    s2:str = "ab"
    s3:str = "cd"
    print(s1 == s2)
    print(s1 == s3)
    print(s1 != s2)
    print(s1 != s3)
    print(s1 == "ab")
    print(s1 == "cd")
    ```
    Expected output:
    ```Python
    True
    False
    False
    True
    True
    False
    ```    

    **Update**:
    The comparison of strings is similar to test case 3, we need to load the string value of each variable and then compare each character of the strings.

5. Indexing of a string
    ```Python
    s1:str = "abcd"
    print(s1[0])
    ```
    Expected output:
    ```Python
    a
    ```

6. Support for escape sequences ( \", \n, \t, \ )
    ```Python
    a:str = "Hello\nWorld"
    print(a)
    ```
    Expected output:
    ```Python
    Hello
    World
    ```

    **Update**:

    We will look into the escape sequences next week.


7. Throw Error on invalid indexing
    ```Python
    s1:str = "ab"
    print(s1[2])
    ```
    Expected output:
    ```python
    Error: Index out of bounds
    ```

8. Throw Error on single quotes
    ```Python
    s1:str = 'ab'
    print(s1)
    ```
    Expected output:
    ```Python
    Parse Error: Unrecognized token
    ```

9.  Throw Type Error on string plus int
    ```Python
    s1:str = 'ab'
    print(s1 + 3)
    ```
    Expected output:
    ```Python
    Type Error: Cannot apply + on str and int
    ```

    **Update**:

    s1:str = 'ab'
    print(s1 + 3)
    ```
    Expected output:
    ```Python
    Error: TYPE ERROR: Type mismatch for numeric op0
    ```

10. Throw Error on invalid(undefined) escape sequences
    ```Python
    a:str = "abcd\k"
    print(a)
    ```
    Expected output:
    ```
    Parse Error: Bad escape sequences
    ```

    **Update**:

    We will look into the escape sequences next week.

## Changes on AST, IR and builtin libraries
### AST
- We need to add a new Type "string" on the ast. It should be "{tag: "string"}".
- We need to add a new Literal "string". It should be "{a?:A, tag: "string", value: string}", where a is the annotation for type checking, the value is the string itself. For example, the string "abc"'s literal value is "abc".
- We need to add a new expression for indexing "{a?: A, tag: "indexing", name: Expr\<A>, index: Expr\<A>}". For example, if we enter "s[0]", the name will be an id expression on the "s" case, the index will be 0. The reason that we need the "index" to be an expression is that we also allow the script like "s[0+1]" to be acceptable.


### IR
- We need to add a new Value type which is like "{ tag: "string"; value: string; address: number }". The value is the string itself as in ast. The address is where the start of the addresss where the string is stored.
- ISSUE:

### Builtin libraries
- len(): The length of a string can just be outputed by the length of the "value". Other data types like list and dictionary will also use the same len() function. So, there might be some changes on it.

## New functions, datatypes, and/or files

There will be no completely "new" and "independent" functions that will be added to the codebase. However, I would like to discuss some new codes and modifications that will be added to the current codebase.

- Parser
    - New case "String" on the traverseType
    - New case "String" on the traverseLiteral
    - New case "len" on the traverseExpr for CallExpression
    - New condition for MemberExpression on traverseExpr when we are traversing the indexing

- Type Checker
    - New case "string" on typeCheckLiteral. Specifically, we need to check whether the escape sequences are valid.
    - New case "indexing" on typeCheckExpr. Specifically, we need to check whether the expression that we perform indexing on is type "string".
    - New case for typeCheckExpr - case "binexpr". For example, "abc" + 3 should throw a TYPE ERROR.
    - **Update**:

- **Update**: Lower
    - 
    - 

- Compiler 
    - New case "string" for codeGenLiteral, according to the length of the string we need to use the $heap pointer to allocate some space for the string
    - New case "len" on the codeGenExpr for the builtin functions
    - New case "Indexing" on the codeGenExpr for the indexing operations
    - Modifications on the codeGenExpr when we applying concatenation of strings
    
## A description of the value representation and memory layout for any new runtime

We would like to store the value of the string by (Extended)ASCII. Since ASCII is from 0 to 256, we would like to store a i32 to represent each character of a string into a continuous memory space and the start address of the string will be returned. Also, we will store the length of the string in the start address. In this way, when we reading a variable of string type, we can know where to stop (maybe useful for indexing).



**Update**: Conclusion

The most critical part of string is how to store and load the value from the memory heap. Any other features like len(), string concatenation, string indexing and string comparison is just a combination of them. As for the store part, we managed to store a string into the memory heap. But we add some restrictions on it (Assigning None to a string first). The hard part is that we cannot make modification on the CodeGen, and the expressions and statements that IR offered are limited which will make it significantly complicated to generate the right WASM code by compiler.ts.