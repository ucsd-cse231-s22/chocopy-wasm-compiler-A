Testing
===
## Change of files
#### .github/workflows/main.yml
Add macOS and Windows tests.
#### package.json
The original "npm run test" script cannot be executed on Windows. We updated the script to make testing can be run on Windows.
#### tests/integrated.test.ts
Added 40 test cases for integration and 20 error cases covering most of the error types in Python . Most of them are the combination of two features. Some of them possess functions that haven't been implemented(such as writing string to file), developers won't need to pass all of them.
#### Todo
Working on setting up Selenium
Add more tests and automation testing for browsers.


Browser test: For simplicity, we will use “python3 -m http.server” running in background to host the application for testing in Git Actions. Then, we will implement basic functions like assertPrint(), assertFail(), and assertRepr() with Selenium. With these functions, we can easily add browser test cases. Besides, we will pay more attention to browser testing for I/O considering that I/O can only be tested in the browser tests.


###Tricky Code

#1 Class , Iterators , Strings , Funcs
```
class Node:
   def __init__(self:Node, dataval:str=None):
      self.dataval = dataval
      self.nextval = None

class SLinkedList:
   def __init__(self:SLinkedList):
      self.headval = None
   def listprint(self:SLinkedList):
      printval : Node = self.headval
      while printval is not None:
         print(printval.dataval)
         printval = printval.nextval
   def AtBegining(self:SLinkedList,newdata:str):
      NewNode : Node = Node(newdata)

   NewNode.nextval = self.headval
   self.headval = NewNode

list : SLinkedList= SLinkedList()
list.headval = Node("Mon")
e2 : Node = Node("Tue")
e3 : Node = Node("Wed")
list.headval.nextval = e2
e2.nextval = e3

list.AtBegining("Sun")
list.listprint()
```
Output
```
"Mon"
"Tue"
"Wed"
```

#2 Dictionary , Lists , Sets
```
diction : dict = { 'C1' : [10,20,30] ,'C2' : [20,30,40]}
diction1 : dict = { 'C1' : (10,20,30) ,'C2' : (20,30,40)}
print(diction['C1'][0])
print(diction1['C2'][2])
```
Output
```
10
40
```
#3 Retreiving from List of List and loops
```
A : list = [[10,20,30],[20,30,40]]
sum : int = 0
for i in range(0,len(A)):
  for j in range(0,len(i)):
    sum = sum + A[i][j]
print(sum)
```
Output
```
150
```
#4 Strings and Lists - Retreiving chars from strings
```
A : list = ['abc','bcd','cde','efg','ghi','igh']
print(A[0][1])
```
Output
``` 
b
```

#5 Strings and Error Reporting
```
def printMsg():
  print("""This is 
    a test""")
printMsg()
```
Output
```
This is a test
```

#6 Polymorphism and Inheritence
```
class Shape:
    def __init__(self:Shape, name:str):
        self.name = name

    def area(self:Shape):
        pass

    def fact(self:Shape):
        return "I am a two-dimensional shape."

    def __str__(self:Shape):
        return self.name

class Square(Shape):
    def __init__(self:Square, length:int):
        super().__init__("Square")
        self.length = length

    def area(self):
        return pow(self.length,2)

    def fact(self):
        return "Squares have each angle equal to 90 degrees."

class Circle(Shape):
    def __init__(self:Circle, radius:int):
        super().__init__("Circle")
        self.radius = radius

    def area(self):
        return 3*self.radius**2
		
a : Square = Square(4)
b : Circle = Circle(7)
print(b.fact())
print(a.fact())
print(b.area())
```
Output
```
I am a two-dimensional shape.
Squares have each angle equal to 90 degrees.
147
```
#7 Destructuring Assignments and Lists
```
a: int = 0
b: int = 0
a , b = [0,1]
print(a)
print(b)
```
Output
```
0
1
```
#8 Destructuring Assignments and Dictionary
```
diction : dict = {'x':10 , 'y':20}
a:str = ''
b:str = ''
a , b = diction
print(a)
print(b)
```
Output
```
x
y
```

#9 Input File , Lists and Iterators
```
data : list = []
with open('the-zen-of-python.txt') as f:
    line = f.readline()
    while line:
        line = f.readline()
		data.append(line)
print(data)
```
Output
```
Contents of the file
```
#10 First Class Functions and Destructuring Assignments
```
def shout(text:str):
    print(text)
def shouting(text:str):
    print(text)
yell,yelling = shout,shouting
yell('Fri')
yelling('State')
```
Output
```
Fri
State
```

#11 Comprehensions, Lists and Destructuring Assignments
```
fruits : list = ["apple", "banana", "cherry", "kiwi", "mango"]
days : list = ["Mon","Tues","Wed","Thurs","Fri"]
newlist : list = []
newlist1: list = []
newlist,newlist1 = [x for x in fruits if "a" in x],[x for x in days if "T" in x]
print(newlist)
print(newlist1)
```
Output
```
["apple", "banana","mango"]
["Tues","Thurs"]
```
#12 Multiple Inheritence
```
class Class1:
    def m(self:Class1):
        print("In Class1")
       
class Class2(Class1):
    def m(self:Class2):
        print("In Class2")
 
class Class3(Class1):
    def m(self:Class3):
        print("In Class3") 
        
class Class4(Class2, Class3):
    pass  
     
obj = Class4()
obj.m()
```
Output 
```
In Class2
```


## Difficult Integrated test cases

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
- Currently Working on  automation testing for webApp(Use Selenium or other tools)