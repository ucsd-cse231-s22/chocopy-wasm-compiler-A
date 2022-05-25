# Compiler A: Bignums - conflicts

Note that whenever it detects a number in our compiler, it will allocate in the memory and pass the address of that memory back.

### Built-in libraries

There will be two things to change: (1) print function and (2) math builtin function.

##### (1) there are more extensions for print()

```python
>>> print()

>>> print(1, 1)
1 1
>>> print(print)
<built-in function print>
```

Since there are more extensions for `print()`, we need to combine the implementation of `print()`. Then, the expected output will be the same as before.

To merge both implementation, we can  add how we allocate memory when a bignum is detected inside the function `codeGenValue` of `compiler.ts` based on the implementation of group built-in. Also, in their `webstart.ts`, we have to add a condition inside the `print()` to load the bignum from our memory when the parameter is a number.


##### (2) math builtin function

```python
>>> from math import factorial
>>> print(factorial(5))
120
```
Those math builtin functions are all defined in WASM in `/stdlib/math.wat`. And, note that we added allocation of bignum in memory based on their implementation. So, when it's calling the math builtin function processing the number parameter(s), it will first allocate the memory for that number and return the address of that memory. Then, we should use this address to load the number from the memory before passing in the math function.

We suggest they write `/stdlib/math` in JavaScript to handle Bignums correctly. They can then call helper functions in `utils.ts` to load and store Bignums. Another option is to use existing binops function calls like `call $$add` so that we can maintain the binop functions for them.

Then, it should output as expected.


### Closures/first class/anonymous functions

As long as they pass the Bignums parameters (address) correctly, the behavior should not change. We are responsible for the operations done on the Bignums.

Below is an example:
```python
def add(a: int, b: int) -> int:
    return a + b
add_ref: Callable[[int, int], int] = None
add_ref = add
print(add_ref(5 + 8))
```
Since our compiler passed the testcases of calling self-defined function and binary operations, it should have worked as expected.



### Comprehensions

Below is an example of comprehension:
```python
a : List = None
a = [i for i in range(10) if i < 5]
print(a)
```

As long as they successfully load the bignum correctly when calling `range` function, it should have expected output since any binary operation with bignum should work fine.

### Destructuring assignment


These are examples of destructuring assignment: `a, b, c = 1, 2, 3`, `a, b, c = 2, f(5), g(3)+10` where `f` and `g` are self-defined functions, and `a, _, b = range(1, 4)` where `range` is a supported function returning an iterator.

##### (1) `a, b, c = 1, 2, 3`

In this case, it is just like `a = 1`. We can add how we allocate memory when a bignum is detected inside the function `codeGenValue` of `compiler.ts` based on their implementation. And, variables will store the address of memory of those bignums. Then, we can use `load_bignum` function from `utils.ts` to load bignum if those variables are used.

##### (2) `a, b, c = f(2), f(5), g(3)+10`

In this case, we can just combine both implementation and don't have to add anything new. It is because our implementation has passed the testcase of calling a self-defined function with a bignum parameter and the testcase of binary operations.


##### (3) `a, _, b = range(1, 4)`

In this case, we have to deal with the number parameters passed in since `range` is a supported function added by group destructuring assignment. Note that our compiler will allocate the memory when it detects a number. Then, with the address of allocated memory, we can use `load_bignum` function to load the bignum back before passing in that `range` function.


With all small changes, it should have the expected output as designed before by group destructuring assignment.

### Error reporting


We will need to add a runtime error when checking if the indices of accessing strings or lists are out of bound or too large to fit in `i32` memory addresses.

```
items: [int] = None
items = [0, 1, 2]
print(items[2**32])
```


### Fancy calling conventions


This should be fine if they are passing the type and parameters correctly, and calling the right variable initialization.


### For loops/iterators

This should be fine since it relies on its own class `Range`. Our implementation can do variable declaration, addition and comparison. Based on our functionalities, the `Range` class should work under Bignums.

```python
class Range(object):
  current : int = 0
  min : int = 0
  max : int = 0
  def new(self:Range, min:int, max:int)->Range:
    self.min = min
    self.current = min
    self.max = max
    return self
  def next(self:Range)->int:
    c : int = 0
    c = self.current
    self.current = self.current + 1
    return c
  def has(self:Range)->bool:
    return self.current < self.max
```

### Front-end user interface

The main difference would be how they output the memory layout of Bignums.

In this testcase, they print `a` and `b` as they were not allocated in memory. If they would like to keep it this way, they could use our helper function `load_bignums` in `utils.ts`. Otherwise, we might need to write another helper function to load the bignums with fields of `{address, length, sign/digits/value}`. It depends a little on how they would like Bignums to be represented.

```python
input:
class C:
    a : int = 1
    b : int = 2
c : C = None
c = C()
// in REPL:
>>> c

output:
{
    address: 100
    a: 1
    b: 2
}
```

### Generics and polymorphism

Based on their `design.md` and the file they changed, there does not seem to be any overlap. Their work are mostly done before `IR` while ours are after.

### I/O, files

There is a conflict in `IO_File/FileSystem.ts`. When reading and writing files from/to Bignums, they will need to use our helper functions `load_bignums` and `store_bignums` in `utils.ts`. Note that the types are `bigint`'s in JavaScript.

### Inheritance

As long as they call the correct variable declaration, the functionality should remain the same.

```python
class A(object):
  x:int = 1
  f:int = 1
      
class B(A):
  y:int = 2
      
class C(B):
  z:int = 2
c: C = None
c = C()
print(c.x)
print(c.y)
print(c.z)
```

### Lists

Below is an example of list indexing:
```python
items: [int] = None
items = [0, 1, 2]
print(items[1])
```
We will need some function to load a Bignum to a `i32` integer and pass it to the lists. When the index is a Bignum we should call a runtime error since it will not fit in the length of a memory address.

### Memory management

We will need to follow how they call `$alloc`, `$load` and `$store` with additional function call to `$ref_lookup` and adding `TypeInfo`. These changes can be done in `compiler.ts` and `utils.ts`.


### Optimization

Below is an example of constant folding transformation:
```python
a = (4+5)
```
to
```python
a = 9
```

They implemented in the way to have binary operations of memory variables be done at compile time, which is same as what we did for our compiler. With no conflicts on constant folding and the fact that we did not changing any IR structure, then our implementation should have no conflicts with their implementation. Also, the output should be the same as expected since the operations of bignum work fine in our implementation.

### Sets and/or tuples and/or dictionaries

One thing that we would need to take care of is `add` and `remove` function of the set object. We need to make sure that the number being added or removed have been allocated in the memory and loaded from the memory, which we can do it by calling `load_bignum` function in `utils.ts`.

```python
s:set = set()
s.add(3)
print(len(s))
```

### Strings

There are two conflicts, (1) When using Bignums as indices, (2) Return type of `len` function.

##### (1) Indices
Similar to lists, we will need some function to load a Bignum to a `i32` integer and pass it to the strings. When the index is a Bignum we should call a runtime error since it will not fit in the length of a memory address.

##### (2) `len` function
Since all numbers are Bignums in our implementation.
Their function `len` should store the length into a Bignum representation and pass back the address. This way we can apply operations on the length.
```
print(len("abc") + 3)

print(len("abc") == 3)
```