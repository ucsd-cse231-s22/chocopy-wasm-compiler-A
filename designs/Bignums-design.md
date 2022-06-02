# Compiler A: Bignums - design

## AST, IR, and Built-in Libraries
- All integer numbers are bignums.
- We use `load`, `alloc` and `store` from `memory.wat` to interact with the memory.
- We change `print` in the `built-in library` to print bignums from the heap.
- We modify the `built-in library` to have JavaScript functions support all the unary and binary operations of bignums. This way we can emulate the behavior of Python.

## New Functions, Datatypes, and/or Files
### `utils.ts`
- We create multiple helper functions to allow memory access of bignums, including `alloc_bignum`, `load_bignum`, `store_bignum`, and `store_bignum` (a wrapper function that allocates and stores digits into memory).
- We add a `bigMath` library for builtin functions and binary operations of bignums.
- We add `i32_to_bignum` to convert the return value of `len(list_var)` from i32 number to bignum, so it supports the binary operations of `len` with other bignums (ex. `len(list_var) + 2`).
- We add `bignum_to_i32` to convert bignum to i32 to allow list indexing (ex. `print(list_var[0])`).
### `compiler.ts`
- We change `codeGenValue` to allocate bignums in the memory. This will store the bignum in memory and leave the address on the stack.
- We modify `codeGenUniOp` and `codeGenBinOp` to support operations.

## Value Representation and Memory Layout

- A bignum stores the underlying number in digits of 2^31-based.
- In memory, it will have the first block containing the number of digits, following chuncks in little-endian order.
    | n digits | digit(0) | digit(1) | ... | digit(n-1) |
    | -------- | -------- | -------- | -------- | -------- |
- The sign of the bignum is determined by the sign of the number of digits. With negative number of digits means the bignum is negative.
- Zero is as `None`, which is a reserved address `0`. This allows error reporting of division of zero simplier to detect by just observing the address.

## Code References
- BigInt builtin functions:
https://stackoverflow.com/a/64953280


## Bignums Testcases
### 1. print
```python
print(100000000000000000000000)
```
expected output: `100000000000000000000000\n`

### 2. init and assign
```python
x : int = 0
y : int = 10
y = x
print(y)
x = 100000000000000000000000 # y is not modified by this assignment
print(x)
print(y)
```
expected output: `0\n100000000000000000000000\n0\n`

### 3. > (greater than)
```python
def f(x:int, y:int):
    print(x > y)
f(100000000000000000000000, 100000000000000000000001)
```
expected output: `False\n`

### 4. < (less than)
```python
def f(x:int, y:int):
    print(x < y)
f(100000000000000000000000, 100000000000000000000001)
```
expected output: `True\n`

### 5. >= (greater equal)
```python
def f(x:int, y:int):
    print(x >= y)
f(100000000000000000000000, 100000000000000000000001)
```
expected output: `False\n`

### 6. <= (less equal)
```python
def f(x:int, y:int):
    print(x <= y)
f(100000000000000000000000, 100000000000000000000001)
```
expected output: `True\n`

### 7. <= (less equal / equal)
```python
def f(x:int, y:int):
    print(x <= y)
f(100000000000000000000000, 100000000000000000000000)
```
expected output: `True\n`

### 8. >= (greater equal / equal)
```python
def f(x:int, y:int):
    print(x >= y)
f(100000000000000000000000, 100000000000000000000000)
```
expected output: `True\n`


### 9. == (equal)
```python
def f(x:int, y:int):
    print(x == y)
f(100000000000000000000000, 100000000000000000000000)
```
expected output: `True\n`

### 10. == (equal, negate)
```python
def f(x:int, y:int):
    print(x == y)
f(-123456789012345678901234567890, -123456789012345678901234567890)
```
expected output: `True\n`

### 11. == (equal, negate)
```python
def f(x:int, y:int):
    print(x == y)
f(-2147483648, 2147483648)
```
expected output: `False\n`

### 12. != (not equal)
```python
def f(x:int, y:int):
    print(x != y)
f(100000000000000000000000, 100000000000000000000001)
```
expected output: `True\n`

### 13. != (not equal)
```python
def f(x:int, y:int):
    print(x != y)
f(123456789012345678901234567890, 123456789012345678901234567890)
```
expected output: `False\n`


### 14. * (mul)
```python
def f(x:int, y:int):
    print(x * y)
f(4294967291, 4294967291)
```
expected output: `18446744030759878681\n`

### 15. * (mul, negate)
```python
def f(x:int, y:int):
    print(x * y)
f(4294967291, -4294967291)
```
expected output: `-18446744030759878681\n`

### 16. // (div)
```python
def f(x:int, y:int):
    print(x // y)
f(42949672910, 4294967291)
```
expected output: `10\n`

### 17. // (div, negate)
```python
def f(x:int, y:int):
    print(x // y)
f(-42949672910, -4294967291)
```
expected output: `10\n`

### 18. // (div, neg_denom)
```python
def f(x:int, y:int):
    print(x // y)
f(42949672910, -4294967291)
```
expected output: `-10\n`

### 19. // (div, neg_num)
```python
def f(x:int, y:int):
    print(x // y)
f(-42949672910, 4294967291)
```
expected output: `-10\n`

### 20. + (add)
```python
def f(x:int, y:int):
    print(x + y)
f(2147483648, 40)
```
expected output: `2147483688\n`

### 21. + (add, negate)
```python
def f(x:int, y:int):
    print(x + y)
f(2147483648, -2147483648)
```
expected output: `0\n`

### 22. - (sub)
```python
def f(x:int, y:int):
    print(x - y)
f(2147483648, 2)
```
expected output: `2147483646\n`

### 23. - (sub, negate)
```python
def f(x:int, y:int):
    print(x - y)
f(2147483648, -2)
```
expected output: `2147483650\n`

### 24. - (sub, negate)
```python
def f(x:int, y:int):
    print(x - y)
f(-2147483648, 2)
```
expected output: `-2147483650\n`

### 25. % (mod)
```python
def f(x:int, y:int):
    print(x % y)
f(42949672910, 4294967290)
```
expected output: `10\n`

### 26. % (mod, neg_denom)
```python
def f(x:int, y:int):
    print(x % y)
f(42949672910, -4294967290)
```
expected output: `10\n`

### 27. % (mod, neg_num)
```python
def f(x:int, y:int):
    print(x % y)
f(-42949672910, 4294967290)
```
expected output: `-10\n`

### 28. - (negate)
```python
def f(x: int):
    print(-x)
f(100000000000000000000000)
```
expected output: `-100000000000000000000000\n`

### 29. - (double negate)
```python
def f(x: int):
    print(-x)
f(-2147483648)
```
expected output: `2147483648\n`


### 30. param and return
```python
def f(c:int) -> int:
    c = 100000000000000000000000
    return c
print(f(0))
```
expected output: `100000000000000000000000\n`

### 31. param and return (negate)
```python
def f(c:int) -> int:
    c = -100000000000000000000000
    return c
print(f(0))
```
expected output: `-100000000000000000000000\n`

## Bignums Interaction with Other Feature Testcases
### 1. Recursive function and builtin (abs)
```python
def gcd(x : int, y : int) -> int:
    if x == 0:
      	return abs(y)
    return gcd(y%x, x)
print(gcd(24,9))
print(gcd(5,8))
print(gcd(-4,8))
```
expected output: ``[`3`, `1`, `4`]\n``

### 2. List (len) and if condition
```python
def f(a : [int]):
    i:int = 0
    if len(a) > 0:
      print(a[0])
    else:
      print(None)
f([])
f([-1,-1,-1])
```
expected output: ``[`None`, `-1`]\n``

### 3. List (len + binop in index) and while loop
```python
def f(a : [int]):
    i : int = 0
    while i < len(a) - 1:
        print(a[i + 1])
        i = i + 1
f([1, 2, 3])
```
expected output: ``[`2`, `3`]\n``

### 4. For loop (list access + binop + class + function)
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
    def hasnext(self:Range)->bool:
        return self.current < self.max
    def reset(self:Range) :
        self.current = self.min
  
def f(a : [int]):
    i : int = 0
    cls : Range = None
    cls = Range().new(0, len(a))
    for i in cls:
        print(a[i] + 1)
f([1, 2, 3])
```
expected output: ``[`2`, `3`, `4`]\n``

