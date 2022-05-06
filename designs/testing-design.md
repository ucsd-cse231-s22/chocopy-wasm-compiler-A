Testing
===
##  Integrated test cases
Note : We will come up with more integrated test cases next week and make sure that the syntax of our test cases align with the design documents of other groups.  
#### Test Case 1 ( I/O , Lists , For Loops , Strings)
```
n: int = 0
in: int = 0
fo: File = None
A : List[int] = None
n = int(input("Enter number of values"))
for i in range(0,n+1):
   in = int(input("Values"))
   A.append(in)
fo = open("ABC.txt","w")
for i in A:
   fo.write(str(i) + "\n")
fo.close()
```
Expected output:
```
A file with should be created with user provided inputs
```
#### Test Case 2 ( Comprehensions , Lists , Dictionary , Sets)
```
input_list : List[int] = [1, 2, 3, 4, 4, 5, 6, 7, 7]
  
list_using_comp : List[int] = None
dict_using_comp : Dict[int , int] = None
output_gen : Set[int , int] = None
list_using_comp = [var for var in input_list if var % 2 == 0]
dict_using_comp = {var:var ** 3 for var in input_list if var % 2 != 0}
output_gen = (var for var in input_list if var % 2 == 0)
print(list_using_comp)
print(dict_using_comp)
print(output_gen)
```
Expected output:
```
[2,4,4,6]
{1:1,3:27,5:125,7:343}
(2,4,6)
```

#### Test Case 3 ( Classes , Fancy Calls , Loops , If)
```
class Range:
  current : int = 0
  min : int = 0
  max : int = 0
  def new(self, min : int, max : int = 10):
    self.min = min
    self.current = min
    self.max = max
	
  def hasnext(self):
    return self.current < self.max
  def next(self)->int:
    s : int = 0
	  while self.hasnext():
	     s = s + self.current
       self.current = self.current + 1
    return s

ra1 : Range = None
ra1 = Range()
ra1.new(5,25)
print(ra1.next())
ra1.new(5)
print(ra1.next())
ra1.new(5,25,5)
print(ra1.next())
```
Expected output:
```
290
35
Error expected 2 args got 3
```

#### Test Case 4  (Classes, Strings , Builtin Fncs)
```
class Start:
  a : string = ""
  b : string = ""
  def set(self, a : string , b : string):
     self.a = a
	 self.b = b
  def concatenate(self)-> str:
     return self.a + self.b
  def RAfirst(self) -> str:
     return self.a[0]
  def RBFirst(self) -> str:
     return self.b[0]
  def LengthA(self) -> int:
     return len(self.a)
  def LengthB(self) -> int:
     return len(self.b)
A : Start = None
A = Start()
A.set("First","Second")
print(A.concatenate())
print(A.RAfirst())
print(A.RBFirst())
print(A.LengthA + A.LengthB)
```
Expected output:
```
FirstSecond
F
S
11
```
#### Test Case 5 (Dictionary , Loops , Sets , Multiple Unpacking)
```
def Checking(n : int)-> Dict[int,int],Set[int]:
  A = Dict[int,int] = None
  B = Set[int] = None
  i :int = 0
  c : int = 0
  i = -n
  while i <= n:
    c = pow(i,2)
    A[i] = c
    B.add(c)
  return A,B
a : Dict[int , int] = None
b : Set[int] = None
a,b = Checking(3)
print(a)
print(b)
```
Expected output:
```
{-3:9,-2:4,1:1,0:0,1:1,2:4,3:9}
(0,1,4,9)
```
#### Test Case 6 (Inheritance+Polymorphism)
```
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
#### Test Case 7 (Closures+For Loops+List)
```
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

#### Test Case 8 (Destructuring Assignment + I/O)
```
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
#### Test Case 9 (Closures+Iterators+List)
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
#### Test Case 10 (Anonymous function + String)
```
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