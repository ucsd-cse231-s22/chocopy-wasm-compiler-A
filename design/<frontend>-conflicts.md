# Read the other features’ pull requests for your compiler, and for each of them, analyze:

### Chaowang:
* Bignums
```
def f(c:int) -> int:
    c = 100000000000000000000000
    return c
print(f(0))
```
The main feature of bignum is to create, calculate and store a big num. We have overlap at webstart.ts, in function print and webstart. We need to maintain the original structure of print and webstart and also import their new changes.
    
*  Built-in libraries 
    ```
        assertTC("float-init", `x : float = 3.2` , NONE);
    ```
    we have overlap in printing and stringify function at webstart.ts file since built-in libraries need to stringify new type "float". We need to maintain the original structure of print and webstart and also import their new changes.
    
* Closures/first class
    We do not have a overlap. The main feature of our features is implemented in webstart.ts. The feature of Closures did not change the view and interaction of the logic in webstart.ts.

* Comprehensions
```
    j: int = 2
    print([j for a in range(1,5) for a!=1])
```
	
The feature of comprehension does not relate to changing the feature of print function. The group could realize and modify their own print and stringfy function to parse comprehensions. The only possible overlap is in print function but the group did not realize the feature. So there is no overlap for now.
    
    

### Sitan Liu: 
* Destructuring Assignment: 
    
    This feature will not interfere with our current implementation. The new destructuring assignment statement, which is the subset of python,  will be recognized by the code mirror. And because it does not define new data type, it will not interfere with our object print function. Our autocompelete function will not interfere with it, because it is based on each word, instead of the  assignments. 
    
* Error Reporting:
    
    They modified the webstart.ts, but their modification is easy to merge. This feature overall will not affect our design, but we need to add additional code to support a new feature so that the type error can be displayed on the script pad. Specifically, Type errors, such as accessing field value to a none object, assigning a int variable with a bool value should be labeled. like this
    $\underline{int:x = True}$

* Fancy Calling Conventions:
    They did not modify webstart.ts, so this feature will not conflict with our code or design, for syntax highlighting, it is just subset python, which would be recognized by codeMirror.
    
* ForLoop/Iterator:
    They did not modify webstart.ts, so this feature will not conflict with our code or design, for syntax highlighting, it is just subset python, which would be recognized by codeMirror. To display the iterator, we need to support from ForLoop team. Depends on their need, the changes are needed in function renderresult() or stringify() of webstart.ts: If stringify() can support iterator then we can call print on iterator, if stringify

### Yiming Mao
* Generics and polymorphism:
    
    This feature will not affect our design, for syntax highlighting, it is just subset python, which would be recognized by codeMirror.
    
* I/O, files:
    
    This feature will not affect our design since it is only related to background data reading and writing. No UI interaction will happen during this process.
    
* Inheritance:
    
    ```
    input: 
    class E(object):
        a : int = 1
        f : int = 2
    class C(E):
        a : int = 2
        e : E = None
        def __init__(self: C):
           self.e = E()
        def d(self: C) -> int:
          return 1
    c : C = None
    c = C()
    // in REPL:
    >>> c
    
    Correct output: 
        {
            address: 4
            a: 2,
            f: 2,
            e: {
                address: 16
                a: 1
                f: 2
            }
        }
    
    Current output:
        {
            address: 4
            a: 2 
            e: {
                address: 12
                a: 1 
                f: 2 
            }
        }

    ```
    To print the object correctly, we need a correct class REPL environment for subclasses, which contains the fields of their super classes. The REPL environment is returned by `run()`.
    
    
* Lists:
    
    ```
    a:[int] = None
    a = [1,2,3]
    print(a)
    ```
    
    To show the content of lists on the web page, we need the support from the list team to print lists. The changes are needed in function `stringify()` of `webstart.ts`: If `stringify()` can support type list then we can print the list on REPL.


### Shicheng Bei:
* Memory Management:
    ```
    import * as memMgmt from './memory';
    ```
    we have overlap in stringify function at webstart.ts file because libmemory in stringfy need to load needed functions from one new file named memory.ts. The original structure should be kept and what we should do is just to import the changes

* Optimization:
    This feature will not affect our design, we can accept corresponding changes directly.
    
    
* Sets:
    Sets is a new data structure, so many changes should be applied from ast.ts to compiler.ts. The main overlap is a newly added function named ele_not_found in webstart.ts, which is to check element in iterable structure. Directly importing corresponding changes is OK for us.
    
* Strings:
    
    For this is a new data structure, many files like parser.ts and type-check.ts need to be updated. We also have overlap in print function, stringfy function and assert_not_none function of webstart.ts file. For some new logics were added to print function, which may have conflicts with our own logics, we will try to link with Strings team to comprehend their thoughts.
    
    ```
    case "str":
      return String.fromCharCode(arg as number);
    ```
    Besides, the code has professor's comments that we think should be solved properly, or the error must appear.