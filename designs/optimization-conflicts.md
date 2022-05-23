# Conflict with other feature optimizations

Currently, we have implemented constant propagation and folding for the initial optimizations. These optimizations are implemented at 
the IR level as a function which takes an the program generated IR as input, and returns the optimized IR as output. For this reason, 
we tend to not have much conflicts with the other feature implementations unless the other feature implementations require changes in
the IR structure types.

## Bignums

<ul>
<li>One of the major assumption of the bignum implementation for milestone 1 is that all integer numbers are considered to be big integers. We have the same assumption inplace for constant folding. And, hence this should not create a conflict with our current implementation of constant folding.
<li>The team also does not have any changes to the existing IR structures and optimization primarily deals with the IR representation. Hence, it will not interfere with the implementation of optimization for the given milestone
<li>Most of the changes required for implementation of big integers as a primitive type for the team is to how it generates WASM code and, how the code is generated to use big integers. Optimization implementation currently does not interact with the code generation at this point and hence, the current implementation of big integers will not have any conflicts with the current implementation of optimization.

Consider the program:
```
a: int = 57
b: int = 0
b = a + 6
print(b)
```
The above program after optimization will have an IR which translates to:
```
a: int = 57
b: int = 0
b = 63
print(63)
```
For the above program, all of the integers, such as `63` / `57` are represented as big integers within the IR (the assumptiion remaining the same for both BigNums and Optimizations). Now, Bignums implementation works on implementing big integers in terms of storing it in the memory and then reading it from a memory address during code generation (this part of the implementation does not interact with the implementation for optimization)

</ul>

## Built-in libraries

As mentioned, Optimization interacts with the IR structures alone and the builtin libraries implementation has additional IR structures for Value with types `...` and `float`. Another change made within the IR is that there is an additional expression type `builtinarb` added to the IR.

Hence, with constant folding there will be changes required to deal with float variables, such as the case where now most of the arithmetic binary operations and arithmetic unary operations will now support float for the type of the arguments. Additionaly, in cases such as binary operators, we will also have to handle cases of constant folding with one of the operator being an integer and the other operator being a float variable. 







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




