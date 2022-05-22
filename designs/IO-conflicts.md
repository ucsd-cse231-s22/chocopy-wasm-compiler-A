# I/O file team's eview to other feature
## Compiler A: Strings
---
\******************************************* \
This is the most important feature that our team's feature interacts with.

Please take a close look! Thanks! 

\********************************************
## Compiler A: Bignums
## Compiler A: Built-in libraries
## Compiler A: Closures/first class/anonymous functions
## Compiler A: comprehensions
## Compiler A: Destructuring assignment
## Compiler A: Error reporting
## Compiler A: Fancy calling conventions
## Compiler A: for loops/iterators
## Compiler A: Front-end user interface
## Compiler A: Generics and polymorphism
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