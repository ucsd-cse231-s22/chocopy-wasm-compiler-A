# I/O file team's eview to other feature
## Compiler A: Strings
---
\******************************************* \
This is the most important feature that our team's feature interacts with.

Please take a close look! Thanks! 

\********************************************
### Compiler A: string 
This feature has overlap with our feature. Our I/O team needs string to represent the `file name` and `mode` as input. We also need the string team supports us a functionality to allocate an empty string with specific capacity to store what we read back into the memory.
```python
f:File = None
f = open("test.txt", "w")
print(f.read(n)) 
```

```python
def read(n) -> string:
    s = allocString(n)
    __builtinRead__(fd, s, n)
```
### Compiler A: Bignums    
This feature will not interact with our feature. For something like read() and write(), a bignum could be bigger than the whole memory size. 

### Compiler A: Built-in libraries   
This will not overlap with our feature. This group implements `import` statement, but `io` is builtin and do not need to be imported. 
The only concern here is that open() as a free function may be able to add into the builtin functions. However, we need to have more communications with the Built-in groups and see if this is necessary.

```python
f:File = None
f = open("test.txt", "w")
f.write("hello")
f.close()
```

Our builtin `open` function should also follow how they implement their builtin functions, so we will need to update how we implement it.

## Compiler A: Closures/first class/anonymous functions   
This feature will not interact with our feature, since python file API does not use first class functions.    

## Compiler A: comprehensions    
This feature will not interact with our feature. We do not use iterators. There might be a minor interaction when read() return a string, but this might be the String group's concern.   

## Compiler A: Destructuring assignment    
This feature will not interact with our feature. We do not use destructuring assignment in I/O files functions.

## Compiler A: Error reporting

We believe that our IO system will have limited interaction with Error reporting as most of our IOerrors are reported in the Javascript FileSysyem instead of the type-checking process.

## Compiler A: for loops/iterators

We have no interaction with for loops in our current implementation. In the next milestone, methods like readline may use a loop, but we can avoid using for loops at the time. For example, we can use use a while loop and an "if EOF then break" in the implementation,

## Compiler A: Front-end user interface

The implementation is fancy, but the interaction with IO system is limited. We believe the only interaction is that "open" buildin function and "File" buildin object should be added to the keywords.

## Compiler A: Generics and polymorphism

The implementation of Polymorphism and Generics is cool and might be helpful for some buildin functions and classes. But it seems that our open function and File object do not need such features.

## Compiler A: Fancy calling conventions

The implementation gives us an option to add **kwargs in the next step, though most of our parameters of functions are necessary. 

## Compiler A: Inheritance
Overall the design looks good to us. Besides, I think the team really spends time coding in order to make this feature work. My sujjest would be to move some function or feature to their own file since it will help while we try to merge the code and make code inside the file that each of us might need to modify cleaner.
## Compiler A: Lists
I think our feature will not interact much with list because our functions/APIs either take string or number as input and output a string. Thus, if a user tries to use a list as a parameter, this error should be found during typeCheck.
```
l = [1, 2, 3]

# TYPERROR
a: File = None
a = open(l)
```
## Compiler A: Memory management
The only way for our code to interact with memory management is that we have a class called File. However, as long as the memory management can work correctly on other classes (e.g. the Rat class in the test case), they can interact with our File class well since our file class has only 1 field, which can be viewed as a simpler version of Rat.

## Compiler A: Optimization
I think the optimization part will not directly benefit our fileSystem since the opetimization code mainly focused on the Python and WASM parts. However, for our file system, it is mostly implemented in Javacript.

## Compiler A: Sets and/or tuples and/or dictionaries
This data structures are similar to list for us. I think our feature will not interact much with list because our functions/APIs either take string or number as input and output a string. Thus, if a user tries to use a list as a parameter, this error should be found during typeCheck. A similar example can be derivded from the one in List with similar ways.

## Compiler A: I/O, files
This is our own implementation.