# Compiler A: Bignums - design

## AST, IR, and Built-in Libraries
- We will change `print` in the `built-in library` to print bignums from the heap.
- We plan to modify the `built-in library` to have Javascript functions support all the unary and binary operations of bignums. This way we can first support the behavior of Python, and then improve the efficiency by writing the functions in WASM.

## New Functions, Datatypes, and/or Files
- We will change `codeGenValue` to allocate bignums in the memory. This will store the bignum in memory and leave the address on the stack.
- We will modify `codeGenUniOp` and `codeGenBinOp` to support operations.
- We will add `codeGenMemoryIndex` to let strings or lists access memory with bignums as indices. This function will take the base address and the bignum index, and return the memory address you want to access.

## Value Representation and Memory Layout

- A bignum stores the underlying number in digits of 2^30-based.
- In memory, it will have the first block containing the number of digits, following chuncks in little-endian order.
    | n digits | digit(0) | digit(1) | ... | digit(n-1) |
    | -------- | -------- | -------- | -------- | -------- |
- The sign of the bignum is determined by the sign of the number of digits. With negative number of digits mean the bignum is negative.




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
print(y > x)
```
expected output: `True\n`

### 4. < (less than)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(y < x)
```
expected output: `False\n`

### 5. >= (greater equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(y >= x)
```
expected output: `True\n`

### 6. <= (less equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(y <= x)
```
expected output: `False\n`

### 7. == (equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000000
print(y == x)
```
expected output: `True\n`

### 8. != (not equal)
```python
x : int = 100000000000000000000000
y : int = 100000000000000000000001
print(y != x)
```
expected output: `False\n`

### 9. - (negate)
```python
x : int = 100000000000000000000000
print(-x)
```
expected output: `-100000000000000000000000\n`

### 10. param and return
```python
def f(c:int) -> int:
    c = 100000000000000000000000
    return c
print(f(0))
```
expected output: `100000000000000000000000\n`