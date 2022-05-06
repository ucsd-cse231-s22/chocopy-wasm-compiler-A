Testing
===
##  Integrated test cases. 
We will come up with more integrated test cases next week and make sure that the syntex of our test cases align with the design documents of other groups.  
#### Inheritance+Polymorphism
```python=
class Number(object):
    x: int = 5
    def getVal(self : Number) -> int:
        return self.x
class AddOne(Number):
    def __init__(self: AddOne):
        self.x = 0
    def getVal(self: AddOne) -> int:
        return self.x+1
class AddTwo(Number):
    def __init__(self: AddTwo):
        self.x = 0
    def getVal(self: AddTwo) -> int:
        return self.x+2

num1 : Number = None
num2 : Number = None
num1 = AddOne()
print(num1.getVal())
num2 = AddTwo()
print(num2.getVal())
```
Expected output:
```
1
2
```
#### Closures+For Loops+List
```python=
def print_msg(val: int) -> Callable[[], None]:
    def printDouble():
        print(val*2)
    return printDouble

iterations: [int] = [1, 2, 3, 4]
for i in iterations:
    func: Callable[[], None] = print_msg(i)
    func()
```
Expected output:
```
2
4
6
8
```

#### Destructuring Assignment + I/O
```python=
f1 : File, f2: File = None, None
f1 = open('output1', 'wb')
f2 = open('output2', 'wb')

f1.write(4)
f1.write(5)
f1.write(5)
f1.write(4)

f1.close()
f2.close()
```
Expected output:
```
# The test should result in two new files `output1` and `output2`
# with the following content:
output1: \x00000004\x00000005
output2: \x00000005\x00000004
```
#### Closures+Iterators+List
```python=
def print_msg(arr: [int]) -> Callable[[], None]:
    def printFirstTwo():
        itr = iter(arr)
        print(next(itr))
        print(next(itr))
    return printFirstTwo
printTwo: Callable[[], None] = print_msg([3, 4, 5])
printTwo()
```
Expected output:
```
3
4
```
#### Anonymous function + String

```python=
isEvenLength: Callable[[string], bool] = lambda str:string: len(str)%2==0 
print(isEvenLength("abc"))
print(isEvenLength("abcd"))

```
Expected output:
```
False
True
```

## Changes we want to make
#### changes in tests/
- Add more integrated test cases
- Add tests on different os(macOS and windows)
- Add automation testing for webApp(Use Selenium or other tools)