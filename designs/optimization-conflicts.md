# Conflict with other feature optimizations

Currently, we have implemented constant propagation and folding for the initial optimizations. These optimizations are implemented at 
the IR level as a function which takes an the program generated IR as input, and returns the optimized IR as output. For this reason, 
we tend to not have much conflicts with the other feature implementations unless the other feature implementations require changes in
the IR structure types.

## Bignums







## Built-in libraries







## Closures/first class/anonymous functions






## Comprehensions







## Destructuring assignment








## Error reporting








## Fancy calling conventions








## For loops/iterators






## Front-end user interface






## Generics and polymorphism






## I/O, files







## Inheritance





## Lists






## Memory management






## Sets and/or tuples and/or dictionaries








## Strings
