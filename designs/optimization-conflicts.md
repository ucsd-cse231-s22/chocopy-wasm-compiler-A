# Conflict with other feature optimizations

Currently, we have implemented constant propagation and folding for the initial optimizations. These optimizations are implemented at 
the IR level as a function which takes an the program generated IR as input, and returns the optimized IR as output. For this reason, 
we tend to not have much conflicts with the other feature implementations unless the other feature implementations require changes in
the IR structure types.

## Bignums

One of the major assumption of the bignum implementation for milestone 1 is that all integer numbers are considered to be big integers. We have the same assumption inplace for constant folding. And, hence this should not create a conflict with our current implementation of constant folding.
The team also does not have any changes to the existing IR structures and optimization primarily deals with the IR representation. Hence, it will not interfere with the implementation of optimization for the given milestone
Most of the changes required for implementation of big integers as a primitive type for the team is to how it generates WASM code and, how the code is generated to use big integers. Optimization implementation currently does not interact with the code generation at this point and hence, the current implementation of big integers will not have any conflicts with the current implementation of optimization.

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

## Built-in libraries

As mentioned, Optimization interacts with the IR structures alone and the builtin libraries implementation has additional IR structures for Value with types `...` and `float`. Another change made within the IR is that there is an additional expression type `builtinarb` added to the IR.

Hence, with constant folding there will be changes required to deal with float variables, such as the case where now most of the arithmetic binary operations and arithmetic unary operations will now support float for the type of the arguments. Additionaly, in cases such as binary operators, we will also have to handle cases of constant folding with one of the operator being an integer and the other operator being a float variable. 

For example, consider the below program:
```
def f(a: int) ->  float:
    a = 4
    return a + 3.5
```
Although the above program should have been constant folded to the below version:
```
def f(a: int) -> float:
    return 7.5
```

This mode of constant folding will not be supported due to 2 reasons, we do not support float operations for any of the binary operations at this point. And secondly, the above program involves applying the addition operator on 2 arguments, one of which is an integer and the second one being a float value. Additional support for this should also be added to optimizations during evaluating an arithmetic operation.

Additionally, builtins are optmimized using the existing structure `builtin1` and `builtin2` within the current implementation of optimization. Additional support for `builtinarb` should be added to optimization (which should be a relatively straightforward change).

At this point, I am not exactly sure about the value with tag `...`, as the design document for the PR does not specify anything around this change.

## Closures/first class/anonymous functions

As mentioned previously, optimization primarily interacts with the IR. And for implementation for first class functions the primary change is that, they have an additional expression which calls a function identified by an expression. To support this, we would need to additionally fold the `fn` attribute of the expression of type additionally `call_indirect` and to also fold each of the arguments as we do for other call expressions.

In the current scenario, we do not support optimizations which involve first class functions and the steps required to support constant propagation and folding with first class functions are described above. (No specific program, as constant propagation and folding has not been implemented for first class functions at this stage)

## Comprehensions







## Destructuring assignment








## Error reporting








## Fancy calling conventions








## For loops/iterators






## Front-end user interface






## Generics and polymorphism






## I/O, files







## Inheritance

Constant propagation and folding have been implemented at the IR level and hence, only changes within the IR structures can interact (or break the existing implementation of constant propagation and folding). One of the changes are that an additional expression type has been added with type `call_indirect` where the function called is identified by an index in the vtable (this can also tend to conflict with the `call_indirect` implementation from first class functions). Constant propagationa and folding has not been implemented for expressions of type `call_indirect`, but to support the same in this case, the only change to be added to the compiler is to fold and propagate each of the arguments as is done for other call expressions. 

The other change at the IR level within `class` type is adding the list of super classes inherited by the class as an array of strings. This is something that should not break the existing implementation of constant propagation and folding through classes (as there is nothing to be propagated/folded through the list of super classes of a class).

Consider the example program:
```
class Rat(Object):
    def f(self: Rat, c: int) -> int:
        return 2
class Int(Rat):
    def f(self: Int, c: int) -> int:
        return 3

a: Int = None
b: int = 3
a = Int()
a.f(b)
```

Here, the function reference invoked is resolved at runtime using the vtable, and the function reference will be resolved at runtime using the vtable and at the IR level, it is implemented using the expression type `call_indirect` which does not support constant propagation and folding at this stage (and steps to add support for this is described above).v




## Lists






## Memory management






## Sets and/or tuples and/or dictionaries








## Strings




