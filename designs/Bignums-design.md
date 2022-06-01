# Compiler A: Bignums - design

## AST, IR, and Built-in Libraries
- All integer numbers are bignums.
- We use `load`, `alloc` and `store` from `memory.wat` to interact with the memory.
- We change `print` in the `built-in library` to print bignums from the heap.
- We modify the `built-in library` to have JavaScript functions support all the unary and binary operations of bignums. This way we can first support the behavior of Python, and then improve the efficiency by writing the functions in WASM.

## New Functions, Datatypes, and/or Files
- We change `codeGenValue` to allocate bignums in the memory. This will store the bignum in memory and leave the address on the stack.
- We modify `codeGenUniOp` and `codeGenBinOp` to support operations.
- We could either write a WASM or JavaScript function to assist the memory management group to access a list or string lookup with bignums as indices, or leave it to them to calculate the offset themselves.

## Value Representation and Memory Layout

- A bignum stores the underlying number in digits of 2^31-based.
- In memory, it will have the first block containing the number of digits, following chuncks in little-endian order.
    | n digits | digit(0) | digit(1) | ... | digit(n-1) |
    | -------- | -------- | -------- | -------- | -------- |
- The sign of the bignum is determined by the sign of the number of digits. With negative number of digits means the bignum is negative.
- Zero is as `None`, which is a reserved address `0`.

## Code References
- Converting scientific notation to string (and then cast to BigInt): https://stackoverflow.com/a/10944025
- BigInt builtin functions:
https://stackoverflow.com/a/64953280


## Testcases
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
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(x > y)
```
expected output: `False\n`

### 4. < (less than)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(x < y)
```
expected output: `True\n`

### 5. >= (greater equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(x >= y)
```
expected output: `False\n`

### 6. <= (less equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(x <= y)
```
expected output: `True\n`

### 7. <= (less equal / equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000000
print(x <= y)
```
expected output: `True\n`

### 8. >= (greater equal / equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000000
print(x >= y)
```
expected output: `True\n`


### 9. == (equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000000
print(x == y)
```
expected output: `True\n`

### 10. == (equal, negate)
```python
x : int = -123456789012345678901234567890
y : int = -123456789012345678901234567890
print(x == y)
```
expected output: `True\n`

### 11. == (equal, negate)
```python
x : int = -2147483648
y : int = 2147483648
print(x == y)
```
expected output: `False\n`

### 12. != (not equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(x != y)
```
expected output: `True\n`

### 13. != (not equal)
```python
x : int = 123456789012345678901234567890
y : int = 123456789012345678901234567890
print(x != y)
```
expected output: `False\n`


### 14. * (mul)
```python
x : int = 4294967291
y : int = 4294967291
print(x * y)
```
expected output: `18446744030759878681\n`

### 15. * (mul, negate)
```python
x : int = 4294967291
y : int = -4294967291
print(x * y)
```
expected output: `-18446744030759878681\n`

### 16. // (div)
```python
x : int = 42949672910
y : int = 4294967291
print(x // y)
```
expected output: `10\n`

### 17. // (div, negate)
```python
x : int = -42949672910
y : int = -4294967291
print(x // y)
```
expected output: `10\n`

### 18. // (div, neg_denom)
```python
x : int = 42949672910
y : int = -4294967291
print(x // y)
```
expected output: `-10\n`

### 19. // (div, neg_num)
```python
x : int = -42949672910
y : int = 4294967291
print(x // y)
```
expected output: `-10\n`

### 20. + (add)
```python
x : int = 2147483648
y : int = 40
print(x + y)
```
expected output: `2147483688\n`

### 21. + (add, negate)
```python
x : int = 2147483648
y : int = -2147483648
print(x + y)
```
expected output: `0\n`

### 22. - (sub)
```python
x : int = 2147483648
y : int = 2
print(x - y)
```
expected output: `2147483646\n`

### 23. - (sub, negate)
```python
x : int = 2147483648
y : int = -2
print(x - y)
```
expected output: `2147483650\n`

### 24. - (sub, negate)
```python
x : int = -2147483648
y : int = 2
print(x - y)
```
expected output: `-2147483650\n`

### 25. % (mod)
```python
x : int = 42949672910
y : int = 4294967290
print(x % y)
```
expected output: `10\n`

### 26. % (mod, neg_denom)
```python
x : int = 42949672910
y : int = -4294967290
print(x % y)
```
expected output: `10\n`

### 27. % (mod, neg_num)
```python
x : int = -42949672910
y : int = 4294967290
print(x % y)
```
expected output: `-10\n`

### 28. - (negate)
```python
x : int = 100000000000000000000000
print(-x)
```
expected output: `-100000000000000000000000\n`

### 29. - (double negate)
```python
x : int = -2147483648
print(-x)
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