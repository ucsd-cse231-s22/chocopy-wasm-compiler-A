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
<ul>
<li> We shouldn't be having conflicts with the for loops/iterators team in terms of code conflicts since the files they changed were lower.ts(not changed by us), ast.ts(we changed this but not conflicting), parser.ts(not changed by us), type-check.ts(not changed by us). 
<li> We need not make any changes to our implementation of constant folding since the changes made by for loops team is mainly in the code structure for for blocks in that inserting ifjmp and jmp instructions in appropriate places. We would be stll correctly constant folding inspte of addition of those instructions.
<li> We also need not make any changes to our implementation of constant propogation as well as we have tested the compiler with ifjmp and jmp instructions(even nested if instructions). Constant propogation would work as intended since for loops is essentially adding jump instructions, continue and break add jmp instructions too.

Consider the program given by For loop team in their test:
```
cls:Range = None
i:int = 0
cls = Range().new(1, 4)

for i in cls:
   print(i)
   i = 10 
   print(i)
```
Our optimization would convert this program into:

```
cls:Range = None
i:int = 0
cls = Range().new(1, 4)

for i in cls:
   print(i)
   i = 10 
   print(10)
```

For the above program, i is constant propogated inside the for loop. But the outside 'i' isn't propogated in the first print statement inside the for block.
</ul>

## Front-end user interface
<ul>
<li> We won't be having any conflicts with the Frond-end team's codebase. The main changes they made were to the index.html and webstart.ts. The constant folding and propogation optimizations would work as intended since front-end changes are tangential to us.

</ul>





## Generics and polymorphism






## I/O, files
We wouldn't be having any conflicts with I/O team. The main common file(s) that we have changes with them is runner.ts. Our changes in this file does not intersect with them. Rest of the functionality of optimizations would work the same since there is no intersection betweeen optimization and file I/O.

Consider the program given by I/O team in their tests:
```
f:File = None
f = open(0, 0)
f.write()
f.close()
```
We won't be optimizaing anything here and hence the program would remain the same.



## Inheritance






## Lists






## Memory management






## Sets and/or tuples and/or dictionaries








## Strings




