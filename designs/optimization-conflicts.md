# Conflict with other feature optimizations

Currently, we have implemented constant propagation and folding for the initial optimizations. These optimizations are implemented at the IR level as a function which takes an the program generated IR as input, and returns the optimized IR as output. For this reason, we tend to not have much conflicts with the other feature implementations unless the other feature implementations require changes in the IR structure types.

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

Since comprehensions are effectively expanded to for loops with if-else conditions and assignments, the IR produced conforms to the usage of 'ifjmp' and 'jmp' to deal with loops and conditional statements. Since the optimizations are simply an IR to IR transformation, it properly performs constant folding and propagation on the current IR structure, which remains unchanged by the comprehensions PR.

Consider the program:
```
a : List = None
b: int = 3
a = [i+b for i in range(10) if i < 5]
print(a)
```
The above program after optimization will have an IR which translates to:
```
a : List = None
b: int = 3
a = [i+3 for i in range(10) if i < 5]
print(a)
```



## Destructuring assignment








## Error reporting








## Fancy calling conventions








## For loops/iterators






## Front-end user interface






## Generics and polymorphism






## I/O, files







## Inheritance





## Lists

The lists group have currently implemented fixed length lists and are performing indexes and index-assigns through loads and stores. There are no conflicts at this stage as we constant fold and propagate for all instructions, including loads and stores (offset, value).

Example Cases:

```
a: int = None
b: [int] = None
a = 3
b = [1,2,3,9,10]
b[a] = 3
print(b[a-2] + 1)
```
The above program after optimization will have an IR which translates to:

```
a: int = None
b: [int] = None
a = 3
b = [1,2,3,9,10]
b[3] = 3
print(b[1] + 1)
```

For further optimizations like folding lists, we need only add the initialized list variable to our basic-block environment variable.

Example Cases:

```
a: int = None
b: [int] = None
a = 3
print([a, 2*a, 3*a][2])
b = [1,2,3]
print(b[0])
```
The above program after optimization may have an IR which translates to:

```
a: int = None
b: [int] = None
a = 3
print(9)
b = [1,2,3]
print(1)
```

We may consider tracking individual array elements to propagate indices that are never changed during the course of the program - 

Example Cases:

```
a: int = 3
b: [int] = None
b = [1,2,3]
if a>4:
    b[2] = 4
else:
    b[2] = 5
print(b[1])
print(b[2])
```
The above program after optimization may have an IR which translates to:

```
a: int = 3
b: [int] = None
b = [1,2,3]
if a>4:
    b[2] = 4
else:
    b[2] = 5
print(2)    // Propagated as b[1] does not change
print(b[2]) // Not propagated as b[2] is 'nac'
```

## Memory management






## Sets and/or tuples and/or dictionaries

The sets PR currently only adds a 'set' type to the Value type in the IR. Their hashtable implementation uses the modulo operator, and loads and stores to/from a linked-list on the heap. Since all the above operators are a part of our constant propagation and folding scheme, there are presently no conflicts.

Example Cases:

```
a: int = 3
s:set = set()
s.add(a)
print(len(s))
```
The above program after optimization may have an IR which translates to:

```
a: int = 3
s:set = set()
s.add(3)
print(len(s))
```

For future work, we are considering folding certain aspects of sets/dicts/tuples like - tuple member access, set membership, dict key indexing etc. The scheme would be similar to that of lists, i.e. maintain the data structure in the environment variable until it attains the 'nac' status.

Example Cases:

```
a: int = 3
s:set = set()
s.add(a)
s.add(a+2)
s.add(a+4)
print(5 in s)
```

The above program after optimization may have an IR which translates to:

```
a: int = 3
s:set = set()
s.add(3)
s.add(5)
s.add(6)
print(True)
```

## Strings

Although the strings group has made changes to the IR, there are no conflicts with the current optimization features as we are only folding and propagating numbers and booleans.

For the next milestone, we are considering folding and propagating strings as well.

Example optimizations are very similar to those of lists and sets/tuples/dict and involve only numbers and booleans for the current PR.


