# Possible Conflicts with Comprehensions

* Compiler A: Bignums

They have modified how bignums are created, calculated and stored in the memory, along with binary and unary operations of bignums. This should not overlap with our list comprehension implementation. Example program of no interaction:
```
i:int=0
print(BigInt("100000000000000000000000"))
print([i for i in Range.new(0,2)])
```
Even if bignums are used inside comprehensions, they should be handled automatically by their implementation. Example program:
```
c:int=BigInt("100000000000000000000000")
i:int=0
print([c for i in Range.new(0,2)])
```

* Compiler A: Built-in libraries

This team has implemented built-in libraries such as gcd, lcm, float, factorial and handling of import statements. This should not have any conflicts with our comprehensions implementation. Even is these libraries are used, they should be correctly handled by their implementation. Example program:
```
i:int=0
print([factorial(i) for i in range(1,3)])
```

* Compiler A: Closures/first class/anonymous functions

This team has implemented closures, nested functions and functions like lambda functions. These should have no conflicts with the comprehensions implementation. They should be automatically handled by their implementation itself. Example program:
```
def f(x:int)->int:
    def g(y:int)->int:
        return y
    return x+g(4)
i:int=0
print([f(2) for i in Range.new(0,2)])
```

* Compiler A: Comprehensions

This is our own implementation!

* Compiler A: Destructuring assignment

This team has handled destructuring assignment nicely. Once we have actually implemented storing comprehensions as lists, then we can so below tests that should work properly based on their implementation:
```
i:int=0
a:bool=True
b:Range=None
a,b=False,[i for i in Range.new(0,2)]
```

* Compiler A: Error reporting

This team has handled error reporting by adding Annotations and Location information in the ast.ts file itself. This will cause a **lot of merge conflicts** due to syntax changes in various files. We plan to correct these in the upcoming week. But other than that, no other conflicts should occur with respect to the code compiling and implementation.

* Compiler A: Fancy calling conventions

The fancy calling implementations should not have any conflicts with comprehensions. Example program:
```
def f(x:int,y:int=5)->int:
    return x+y
i:int=0
print([f(i) for i in Range.new(0,2)])
```

* Compiler A: for loops/iterators

???

* Compiler A: Front-end user interface

Our work is independent of this team's work. Once we store our comprehensions in lists using some code from the lists team, the comprehension result would become a list and the front-end would handle this like normal lists. Thus, no conflicts here.

* Compiler A: Generics and polymorphism

???

* Compiler A: I/O, files

Looking at their PR so far, it does not look like their is much overlap with our implementation here. File read and writes in comprehensions would be handled by their implementation. Example program:
```
i:int=0
f:File=None
f.open(0,3)
f.write(5)
f.seek(0)
print([f.read(1) for i in Range.new(0,2)])
f.close()
```

* Compiler A: Inheritance

There should not be any conflicts with their implementation. If there is an object lookup from a subclass in a comprehension, fetching the correct value would be handled by their inheritance implementation. Example program:
```
class A(object):
    x:int=1
class B(A):
    y:int=2
class C(B):
    z:int=3
c:C=None
c=C()
i:int=0
print([c.x for i in Range.new(0,2)])
```

* Compiler A: Lists

Our implementation should not be affected by the following changes:

- Storing of lists
- Slicing of lists
- Individual list member assignments

Example of code where both our changes should co-exist:
```
a:[int]=None
i:int=0
a=[1]
a[0]=2
print(a[0])
[i for i in Range.new(0,2)]
```
Our implementation will be impacted by the lists team in order to execute the following examples:
For example:
```
i:int=0
a:[int]=[]
a = [i for i in range(8)]
```
```
i:int=0
B:[int] = [i for i in [1,2,3]]
```
Things we need to add in our implementation:

- As of now, we are not storing the comprehension expression anywhere, we are just printing out each individual element.
- We want to be able to store comprehensions as list objects. Once we do so, the original list operations (ex: slicing, individual member assignment) will remain unchanged. We plan to reuse the construct list block from lower.ts to store the comprehension expressions as a list.
- We also want to extend comprehension to more than just range constructs, i.e to lists, sets, tuples and dictionaries. 
- We also want to print comprehensions in the list format.

Design Decisions (Doubts/Collaborations):

As of now, we are only considering lists to have only integers. We need to collaborate with the lists team and the strings team to have a combination of different data types inside a list. We might also need to talk to the memory management team in case we want to store objects inside a list.

* Compiler A: Memory management

We do not think that we would be having a lot of conflicts with the changes made by the memory management team. It seems that code related to comprehensions,lists,sets etc would be using the memory management code in the background.  We are using call and alloc from ir.ts and lower.ts that the memory management team has impacted, but there are no such conflicts so far.

* Compiler A: Optimization

No conflicts here with our comprehensions implementation.

* Compiler A: Sets and/or tuple and/or dictionaries

Our implementation should not be affected by the following changes:

- Parse a simple set expression
- Parse a simple tuple expression
- Parse an empty dictionary

Example of code where both our changes should co-exist:
```
i:int=0
s = {34,True,False}
[i for i in Range.new(0,2)]
```
Our implementation will be impacted by the sets team in order to cover set, tuple and dictionary comprehensions. 
For example:
```
i:int=0
s = {1,2,5,9,8,8}
[i for i in s]
```
This should output ```[1, 2, 5, 8, 9]```
```
i:int=0
s = (1,2,2,2,3,4,4,5)
[i for i in s]
```
This should output ```[1, 2, 2, 2, 3, 4, 4, 5]```
```
i:int=0
courses = {"cse 250A":"fall 2021","cse 231":"spring 2022"}
[i for i in courses]
```
This should output ```['cse 250A', 'cse 231']```

Things we need to add in our implementation:

- We will need to reuse the set, dict and tuple definitions from ast.ts. As only the set data structure has been implemented in detail, we will only focus on set comprehensions for the next week. In case we have time for more collaboration, we can work on tuple and dictionary comprehensions.
- Under set-utils.ts, the sets team has added WASM code to load and store sets from memory. We plan to reuse this code in order to load and access individual elements of the set during comprehension expressions.
- We will be reusing the changes made by the sets team in parser.ts, typecheck.ts and in lower.ts

Design Decisions (Doubts/Collaborations):

- Need to discuss or rather check if strings are being stored in sets or not.

* Compiler A: Strings

Our implementation should not be affected by the following changes:

- String Concatenation
- String concatenation
- Printing of strings
- As of now, I don’t think we are concerned with the implementation of storing strings in memory. We would only need to store each character of the string individually in a list (described below). 

Example of code where both our changes should co-exist:
```
i:int=0
print("abc"+"def")
[i for i in Range.new(0,2)]
```

Our implementation will be impacted by the string team in order to cover string comprehensions.
For example:
```
i:int=0
[i for i in "compilers"]
```
This should output ```['c', 'o', 'm', 'p', 'i', 'l', 'e', 'r', 's']```

```
i:int=0
str = "compilers"
[i for i in str[2:]]
```
This should output ```['m', 'p', 'i', 'l', 'e', 'r', 's']```


Things we need to add in our implementation:

- Use the new string type created in ast
- Use the lists implementation (which will be discussed in more detail under Compiler A: Lists) to store each character inside a string as separate list elements, according to the above examples. 
- We would need to use the getLength expression in the ast, in order to traverse through the string.
- We will be reusing the changes made by the strings team in parser.ts, typecheck.ts and in lower.ts
- We would need to extend string indexing in order to execute the second example.

Design Decisions (Doubts/Collaborations):

- It might be a good idea to add a new char type to store the individual characters of the string (as seen in the above example), and then add suitable code to store individual characters in memory. Or, we can also store individual characters as strings of length 1, although we would prefer the first option.
