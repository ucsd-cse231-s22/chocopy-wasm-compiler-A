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

2. Return the length of a string.
    ```Python
    s:str = "abcd"
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

9. Throw Type Error on string plus int
    ```Python
    s1:str = 'ab'
    print(s1 + 3)
    ```
    Expected output:
    ```Python
    Type Error: Cannot apply + on str and int
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

## Changes on AST, IR and builtin libraries
### AST
- We need to add a new Type "string" on the ast. It should be "{tag: "string"}".
- We need to add a new Literal "string". It should be "{a?:A, tag: "string", value: string}", where a is the annotation for type checking, the value is the string itself. For example, the string "abc"'s literal value is "abc".
- We need to add a new expression for indexing "{a?: A, tag: "indexing", name: Expr\<A>, index: Expr\<A>}". For example, if we enter "s[0]", the name will be an id expression on the "s" case, the index will be 0. The reason that we need the "index" to be an expression is that we also allow the script like "s[0+1]" to be acceptable.


### IR
- We need to add a new Value type which is like "{ tag: "string"; value: string; address: number }". The value is the string itself as in ast. The address is where the start of the addresss where the string is stored.

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

- Compiler 
    - New case "string" for codeGenLiteral, according to the length of the string we need to use the $heap pointer to allocate some space for the string
    - New case "len" on the codeGenExpr for the builtin functions
    - New case "Indexing" on the codeGenExpr for the indexing operations
    - Modifications on the codeGenExpr when we applying concatenation of strings
    
## A description of the value representation and memory layout for any new runtime

We would like to store the value of the string by (Extended)ASCII. Since ASCII is from 0 to 256, we would like to store a i32 to represent each character of a string into a continuous memory space and the start address of the string will be returned. Also, we will store the length of the string in the start address. In this way, when we reading a variable of string type, we can know where to stop (maybe useful for indexing).