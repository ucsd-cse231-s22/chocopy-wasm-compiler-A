// import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
// import { NUM, BOOL, NONE, CLASS ,LIST , SET , TUPLE , DICT , STRING} from "./helpers.test"

// describe("Integrated tests", () => {

//   // 1, 4294967296=2^32 8589934592=2^33
//   assertPrint("Bignums+Built-in", `
// from math import gcd
// x: int = 8589934592
// y: int = 4294967296
// print(gcd(x, y))`, [`4294967296`]);

//   // 2, 4294967296=2^32 8589934592=2^33
//   assertPrint("Bignums+Closures", `
// def print_msg(val: int) -> Callable[[], None]:
//   def printDouble():
//     print(val*2)
//   return printDouble
// x: int = 4294967296
// func: Callable[[], None] = print_msg(x)
// func()
// `, [`8589934592`]);

//   // 3, 4294967296=2^32
//   assertPrint("Bignums+Comprehensions+For loop", `
// i : int = 0
// for i in range(4294967296,4294967298):
//   print(i)`, [`4294967296`, `4294967297`]);

//   // 4, 4294967296=2^32
//   assertPrint("Bignums+Destructuring assignment", `
// x: int = 0
// y: int = 1
// x, y = 4294967295, 4294967296
// print(x)
// print(y)`, [`4294967295`, `4294967296`]);

//   // 5, 4294967296=2^32
//   assertPrint("Bignums+Fancy calling convention", `
// def test(x : int, y : int = 4294967296) -> int:
//   return x + y
// print(test(1))`, [`4294967297`]);

//   // 6, 4294967296=2^32
//   assertPrint("Bignums+Generic", `
// T: TypeVar = TypeVar('T')
// class Printer(Generic[T]):
//   def print(self: Printer, x: T):
//     print(x)
// p: Printer[int] = None
// p = Printer[int]()
// p.print(4294967296)`, [`4294967296`]);

//   // 7, 4294967296=2^32, not sure about the result of this implementation
//   assertPrint("Bignums+I/O", `
// f : File = None
// f = open('output', 'wb')
// x: int = 4294967296
// print(f.write(x))`, [`4`]);

//   // 8, 4294967296=2^32
//   assertPrint("Bignums+Inheritance", `
// class A(object):
//     a : int = 4294967296
// class B(A):
//     pass
// x : B = None
// x = B()
// print(x.a)`, [`4294967296`]);

//   // 9, 4294967296=2^32
//   assertPrint("Bignums+List", `
// a: [int] = None
// a = [4294967296, 2]
// print(a[0])
// print(a[1])`, [`4294967296`, `2`]);

//   // 10, 4294967296=2^32
//   assertPrint("Bignums+Set", `
// x:set = set()
// x = {1,2,4294967296}
// print(4294967296 in x)`, [`True`]);

//   // 11
//   assertPrint("Set+Closures", `
// def print_msg(val: set) -> Callable[[], None]:
//   def printIsIn(element: int):
//     print(element in val)
//   return printIsIn
// x:set = set()
// x = {1,2,3}
// func: Callable[[], None] = print_msg(x)
// func(2)
// func(4)`, [`True`, `False`]);

//   // 12, 
//   assertPrint("Set+Comprehensions", `
// x:set = set()
// i : int = 0
// x = {i for i in range(5)}
// print(3 in x)
// print(5 in x)`, [`True`, `False`]);

//   // 13, 
//   assertPrint("Set+Destructuring assignment", `
// x:set = set()
// y:set = set()
// x, y = {1, 2}, {4}
// print(x)
// print(y)`, [`1`, `2`, `4`]);

//   // 14, 
//   assertPrint("Set+Fancy calling conventions", `
// def test(x : int, y : set = {1, 2, 3}) -> bool:
//   return x in y
// print(test(1))
// print(test(4))`, [`True`, `False`]);

//   // 15, 
//   assertPrint("Set+For loops", `
// x:set = set()
// x = {1, 2, 3, 4, 5}
// i : int = 0
// for i in range(2, 5):
//   x.remove(i)
// print(x)`, [`1`, `5`]);

//   // 16, 
//   assertPrint("Set+Generics", `
// T: TypeVar = TypeVar('T')
// class Printer(Generic[T]):
//   def print(self: Printer, x: T):
//     print(x)
// p: Printer[set] = None
// p = Printer[set]()
// p.print({1, 2})`, [`1`, `2`]);

//   // 17, 
//   assertPrint("Set+Inheritance", `
// class A(object):
//   a : set = set()
//   a = {1, 2, 3}
// class B(A):
//   pass
// x : B = None
// x = B()
// print(x.a)`, [`1`, `2`, `3`]);

//   // 18, 
//   assertPrint("Set+List", `
// a: [set] = None
// a = [{1, 2}, {3}]
// print(a[0])
// print(a[1])`, [`1`, `2`, `3`]);

//   // 19, 
//   assertPrint("Set+Strings", `
// x:set = set()
// x = {"abc", "def"}
// print(x)`, [`abc`, `def`]);

//   // 20, 
//   assertPrint("Destructuring Assignment + I/O", `
// f1 : File, f2: File = None, None
// f1, f2 = open('output1', 'wb'), open('output2', 'wb')
// print(f1.write(4))
// print(f2.write(4))
// f1.close()
// f2.close()`, [`4`, `4`]);

// // 21, 
//   assertPrint("Nested Loop", `
// i:int = 0
// j:int = 0
// for i in range(1,3):
//    for j in range(1,3):
//       print(i+j)`, [`2`, `3`,`4`, `3`,`4`, `5`, `4`,`5`, `6`]);

// //22,
//   assertPrint("Sum of Even and Odd Places", `
// A : [int] = None
// s1 : int = 0
// s2 : int = 0
// i : int = 0
// A = [1,2,3,4,5,6,7,8,9,10]
// for i in range(0,len(A),2):
//    s1 = s1 + A[i]
// for i in range(1,len(A),2):
//    s2 = s2 + A[i]
// print(s1)
// print(s2)`, [`25`, `30`]);

// //23,
//   assertPrint("List+Inheritance", `
// class A(object):
//   a : [int] = None
//   a = [1, 2, 3]
// class B(A):
//   pass
// x : B = None
// x = B()
// print(x.a)`, [`1`, `2`, `3`]);

// //24,
//   assertPrint("Nested While", `
// A : [int] = None
// s1 : int = 0
// i : int = 0
// j : int = 0
// A = [1,2,3]
// while i < len(A):
//   j = 0
//   while j < len(A):
//     s1 = s1 + A[j]
//     j+=1
//   i = i+1
// print(s1)`, [`18`]);

// //25,
//    assertPrint("For + Lists + Dict", `
// A : [int] = None
// B : dict = dict()
// s1 : int = 0
// i : int = 0
// j : int = 0
// A = [1,2,3]
// B = {1:5,2:10,3:15}
// for i in A:
//   for j in B:
//     s1 = s1+ i + j
// print(s1)`, [`108`]);

// //26,
//   assertPrint("For Reverse", `
// A : [int] = None
// i : int = 0
// A = [1,2,3]
// for i in range(len(A)-1,-1,-1):
//   print(A[i])`, [`3`,`2`,`1`]);

// //27
//   assertPrint("List+Destructuring assignment", `
// x:list = None
// t : int = 0
// y = int = 0
// x =[1,2,3]
// t, y = x[0], x[1]
// print(t)
// print(y)`, [`1`, `2`]);

// //28
//   assertPrint("List+Strings", `
// genre : [str]= None
// i: int = 0
// genre = ['pop', 'rock', 'jazz']
// for i in range(len(genre)):
//     print("I like", genre[i])`, [`I like pop`, `I like rock`,`I like jazz` ]);

// //29
//   assertPrint("List+Loops", `
// A : : [int] = None
// i : bool = True
// for i:
//    A.append(1)
//    i = False
// print(A)`, [`1`]);

// //30
//   assertPrint("List+Fancy calling conventions", `
// def test(x : int, y : [int] = [1,2,3]) -> [int]:
//   return y.append(x)
// print(test(5))`,[`1`,`2`,`3`,`5`]);

// //31
//   assertPrint("List+Fancy calling conventions", `
// def test() -> bool:
//    txt : str = "The best things in life are free!"
//    if "expensive" not in txt:
//       return False
//    else:
//       return True
// print(test())`,[`False`]);

//   //32, 
//   assertPrint("String + Lists", `
// f1 : [str] = None
// f1 = ["UCSD","Compiler","Tritons","Library"]
// print(f1[1])
// print(f1[0])
// `, [`Compiler`, `UCSD`]);

// //33
//    assertPrint("String Append", `
// def test(a : str , b : str) -> str:
//    return a+b
// print(test("UCSD","Triton"))`,[`UCSDTriton`]);

// //34
//    assertPrint("String Append", `
// def test(a : str) -> str:
//    x : str = None
//    i : int = 0
//    for i in range(len(a)-1,-1,-1):
//       x = x + a[i]
//    return x
// print(test("UCSD"))`,[`DSCU`]);

// //35
//    assertPrint("String Append1", `
// def test(a : int) -> str:
//    x : str = None
//    if x % 2 == 0:
//       return "Even"
//    else:
//       return "Odd"
// print(test(5)
// print(test(2))`,[`Odd`,`Even`]);

// //36
//   assertPrint("String Append2", `
// x : str = "abcdefghijklmnop"
// i : int = 0
// y : str = ""
// while i < len(x):
//    y = y+x[i]
//    i = i + 2
// `,[`acegilmo`]);

// //37
//   assertPrint("String Operations", `
// x : str = "Hello World"
// y : [str] = []
// y = x.split(" ")
// print(y)
// `,[`Hello`,`World`]);

// //38
//   assertPrint("Reverse A string + Builtin Fncs", `
// x : str = "Hello World"
// print(x[::-1])
// print(x.upper())
// `,[`dlroW olleH`,`HELLO WORLD`]);

// //39
//   assertPrint("Strings+Inheritance", `
// class A(object):
//     a : str = "A"
// class B(A):
//     pass
// x : B = None
// x = B()
// print(x.a)`, [`A`]);

// //40
//   assertPrint("String + Comprehensions", `
// names : [str] = None
// names2 : [str] = None
// s : str = None
// names = ['Steve', 'Bill', 'Ram', 'Mohan', 'Abdul']
// names2 = [s for s in names if 'a' in s]
// print(names2)
// `,[`Ram`,`Mohan`]);
// });

// //41  Type Errors
//   assertTCFail("call-type-checking-fail", `
// class C(object):
//   def f(self : C, x : int) -> bool:
//     return x * 2
// c : C = None
// c = C()
// if c.f(c.f(2)):
//   pass
// else:
//   pass
//   `);

// //42  Type Errors
//   assertTCFail("List None Type", `
// list1 : [int] = None
// list1 : [1,2]
// list1 = list1.sort(list1)
// temp :int = list1[0]
// print(temp)`);

// //43 Index Errors
//   assertFail("Extra Length", `
// numbers : str = "12345678"
// print(numbers[9])`);

// //44 Index Errors
//   assertFail("Loop and List", `
// numbers : [int] = None
// i : int = 0
// numbers = = [1,2,3]
// for i in range(0,5)
// print(numbers[i])`);

// //45 Value Errors
//   assertFail("Wrong Number of Unpack 1", `
// def getNumbers() -> str,str,str:
//   return 'one', 'two', 'three'
// one : str = None
// two : str = None
// one, two = getNumbers()
// `);

// //46 Value Errors
//    assertFail("Wrong Number of Unpack 2", `
// def getNumbers() -> str,str,str:
//   return 'one', 'two', 'three'
// one : str = None
// two : str = None
// three : str = None
// four : str = None
// one, two , three , four = getNumbers()
// `);

// //47 Syntax Errors
//   assertFail("Syntax 1", `
// def printMsg():
//   print("This is a test)
// printMsg()
// `);

// //48 Syntax Errors
// assertFail("Syntax 2", `
// def printMsg():
//   print("This is 
//     a test")
// printMsg()
// `);

// //49 Indendation Error
//   assertFail("Indendation 1", `
// def method1():
//   numbers : int = 12345678
//   num : int = 0
//      num = numbers[7]
//   print(num)
// method1()
// `);

// //50 Indendation Error
// assertFail("Indendation 2", `
// def method1():
//   for i in range(0,5):
//   print(i)
// method1()
// `);

// //51  Type Errors Conversion
//   assertTCFail("List None Type", `
// days : int = 10
// print("Total number of days: " + days)`);

// //52  Type Errors Conversion
//   assertTCFail("List None Type", `
// days : [int] = None
// days = [10]
// print("Total number of days: " + days[0] + " in a month")`);

// //53 Cant convert to int
//   assertFail("Convert 1", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   y = int(x)
// method1()
// `);

// //54 Cant convert to int
// assertFail("Convert 2", `
// def method1():
//   x : [str] = None
//   y : int = 0
//   x = ["One"]
//   y = int(x)
// method1()
// `);

// // 55 Method Errors
// assertFail("Wrong builtin Methods", `
// def method1():
//   A : [int] = None
//   A = [1,23,5]
//   A.add(50)
// method1()
// `);

// //56  Method Type Errors
//   assertFail("Method Not Found", `
// class C(object):
//   def f(self : C, x : int) -> bool:
//     return x * 2
// c : C = None
// c = C()
// if c.f(c.fi(2)):
//   pass
// else:
//   pass
//   `);

// // 57 Unbound Local Errors
//   assertFail("Wrong builtin Methods", `
// c : int = 0
// def meth():
//   c+=1
// meth()
//   `);

// // 58 TypeError: string indices must be integers
// assertTCFail("List None Type", `
// st : str = "Hello World"
// print(st["Hello"])`);

// //59 TypeError: string indices must be integers
// assertTCFail("List None Type", `
// cars : dict = dict()
// i : str = None
// cars = {"brand": "Ford","model": "Mustang"}
// for i in cars:
//   print("brand: " + i["brand"])
//   print("model: " + i["model"])`);

// // 60 File Not Found Errors

// assertFail("Wrong builtin Methods", `
// f : File = open('filename.ext','r')
// l : str = None
// for l in f:
//   print(l)
// `);


// assertPrint("Diff1",`
// class Node(object):
//    def __init__(self:Node, dataval:str=None):
//       self.dataval = dataval
//       self.nextval = None
// class SLinkedList(object):
//    def __init__(self:SLinkedList):
//       self.headval = None
//    def listprint(self:SLinkedList):
//       printval : Node = self.headval
//       while printval is not None:
//          print(printval.dataval)
//          printval = printval.nextval
//    def AtBegining(self:SLinkedList,newdata:str):
//       NewNode : Node = Node(newdata)
//    NewNode.nextval = self.headval
//    self.headval = NewNode
// list : SLinkedList = SLinkedList()
// list.headval = Node("Mon")
// e2 : Node = Node("Tue")
// e3 : Node = Node("Wed")
// list.headval.nextval = e2
// e2.nextval = e3
// list.AtBegining("Sun")
// list.listprint()`, [`Mon`,`Tue`,`Wed`]);

// assertPrint("Diff2",`
// diction : dict = dict()
// diction1 : dict = dict()
// diction = { 'C1' : [10,20,30] ,'C2' : [20,30,40]}
// diction1= { 'C1' : (10,20,30) ,'C2' : (20,30,40)}
// print(diction['C1'][0])
// print(diction1['C2'][2])`, [`10`,`40`]);

// assertPrint("Diff3",`
// A : [[int]] = None
// sum : int = 0
// i : int = 0
// j : int = 0
// A = [[10,20,30],[20,30,40]]
// for i in range(0,len(A)):
//   for j in range(0,len(i)):
//     sum = sum + A[i][j]
// print(sum)`, [`150`]);

// assertPrint("Diff4",`
// A : [str] = None
// A = ['abc','bcd','cde','efg','ghi','igh']
// print(A[0][1])`, [`b`]);

// assertPrint("Diff5",`
// def printMsg():
//   print("""This is 
//     a test""")
// printMsg()`, [`This is a test`]);

// assertPrint("Diff6",`
// class Shape(object):
//     def __init__(self:Shape, name:str):
//         self.name = name
//     def area(self:Shape):
//         pass
//     def fact(self:Shape):
//         return "I am a two-dimensional shape."
//     def __str__(self:Shape):
//         return self.name
// class Square(Shape):
//     def __init__(self:Square, length:int):
//         super().__init__("Square")
//         self.length = length
//     def area(self):
//         return pow(self.length,2)
//     def fact(self):
//         return "Squares have each angle equal to 90 degrees."
// class Circle(Shape):
//     def __init__(self:Circle, radius:int):
//         super().__init__("Circle")
//         self.radius = radius
//     def area(self):
//         return 3*self.radius**2
		
// a : Square = Square(4)
// b : Circle = Circle(7)
// print(b.fact())
// print(a.fact())
// print(b.area())`, [`I am a two-dimensional shape.`,`Squares have each angle equal to 90 degrees.`,`147`]);

// assertPrint("Diff7",`
// a: int = 0
// b: int = 0
// a , b = [0,1]
// print(a)
// print(b)`, [`0`,`1`]);

// assertPrint("Diff8",`
// diction : dict = dict()
// a:str = None
// b:str = None
// diction = {'x':10 , 'y':20}
// a , b = diction
// print(a)
// print(b)`, [`x`,`y`]);

// assertPrint("Diff9",`
// def shout(text:str):
//     print(text)
// def shouting(text:str):
//     print(text)
// yell,yelling = shout,shouting
// yell('Fri')
// yelling('State')`, [`Fri`,`State`]);

// assertPrint("Diff10",`
// fruits : [str] = None
// days : [str] = None
// newlist : [str] = None
// newlist1: [str] = None
// x : str = None
// fruits = ["apple", "banana", "cherry", "kiwi", "mango"]
// days = ["Mon","Tues","Wed","Thurs","Fri"]
// newlist,newlist1 = [x for x in fruits if "a" in x],[x for x in days if "T" in x]
// print(newlist)
// print(newlist1)`, [`["apple", "banana","mango"]`,`["Tues","Thurs"]`]);

// assertPrint("Diff11",`
// class Class1(object):
//     def m(self:Class1):
//         print("In Class1")
       
// class Class2(Class1):
//     def m(self:Class2):
//         print("In Class2")
 
// class Class3(Class1):
//     def m(self:Class3):
//         print("In Class3") 
        
// class Class4(Class2, Class3):
//     pass  
     
// obj = Class4()
// obj.m()`, [`In Class2`]);



// assertPrint("Diff12",`
// input_list : [int] = None
// list_using_comp : [int] = None
// dict_using_comp : dict = dict()
// output_gen : set = set()
// var : int : = 0
// input_list = [1, 2, 3, 4, 4, 5, 6, 7, 7]
// list_using_comp = [var for var in input_list if var % 2 == 0]
// dict_using_comp = {var:var ** 3 for var in input_list if var % 2 != 0}
// output_gen = (var for var in input_list if var % 2 == 0)
// print(list_using_comp)
// print(dict_using_comp)
// print(output_gen)`, [`[2,4,4,6]`,`{1:1,3:27,5:125,7:343}`,`(2,4,6)`]);


// assertPrint("Diff13",`
// class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self, min : int, max : int = 10):
//     self.min = min
//     self.current = min
//     self.max = max
	
//   def hasnext(self):
//     return self.current < self.max
//   def next(self)->int:
//     s : int = 0
// 	  while self.hasnext():
// 	     s = s + self.current
//        self.current = self.current + 1
//     return s
// ra1 : Range = None
// ra1 = Range()
// ra1.new(5,25)
// print(ra1.next())
// ra1.new(5)
// print(ra1.next())`, [`290`,`35`]);


// assertPrint("Diff14",`
// class Start(object):
//   a : string = ""
//   b : string = ""
//   def set(self, a : string , b : string):
//      self.a = a
// 	   self.b = b
//   def concatenate(self)-> str:
//      return self.a + self.b
//   def RAfirst(self) -> str:
//      return self.a[0]
//   def RBFirst(self) -> str:
//      return self.b[0]
//   def LengthA(self) -> int:
//      return len(self.a)
//   def LengthB(self) -> int:
//      return len(self.b)
// A : Start = None
// A = Start()
// A.set("First","Second")
// print(A.concatenate())
// print(A.RAfirst())
// print(A.RBFirst())
// print(A.LengthA + A.LengthB)`, [`FirstSecond`,`F`,`S`,`11`]);

// assertPrint("Diff15",`
// def Checking(n : int)-> dict,set:
//   A : dict = dict()
//   B : set = set()
//   i :int = 0
//   c : int = 0
//   i = -n
//   while i <= n:
//     c = pow(i,2)
//     A[i] = c
//     B.add(c)
//   return A,B
// a : dict = dict()
// b : set = set()
// a,b = Checking(3)
// print(a)
// print(b)`, [`{-3:9,-2:4,1:1,0:0,1:1,2:4,3:9}`,`(0,1,4,9)`]);

// assertPrint("Diff16",`
// class Number(object):
//     x: int = 5
//     def getVal(self : Number) -> int:
//         return self.x
// class AddOne(Number):
//     def __init__(self: AddOne):
//         self.x = 0
//     def getVal(self: AddOne) -> int:
//         return self.x+1
// class AddTwo(Number):
//     def __init__(self: AddTwo):
//         self.x = 0
//     def getVal(self: AddTwo) -> int:
//         return self.x+2
// num1 : Number = None
// num2 : Number = None
// num1 = AddOne()
// print(num1.getVal())
// num2 = AddTwo()
// print(num2.getVal())`, [`1`,`2`]);

// assertPrint("Diff17",`
// def print_msg(val: int) -> Callable[[], None]:
//     def printDouble():
//         print(val*2)
//     return printDouble
// iterations: [int] = None
// i : int = 0
// iterations = [1, 2, 3, 4]
// for i in iterations:
//     func: Callable[[], None] = print_msg(i)
//     func()`, [`2`,`4`,`6`,`8`]);

// assertPrint("Diff18",`
// python=
// def print_msg(arr: [int]) -> Callable[[], None]:
//     def printFirstTwo():
//         itr = iter(arr)
//         print(next(itr))
//         print(next(itr))
//     return printFirstTwo
// printTwo: Callable[[], None] = print_msg([3, 4, 5])
// printTwo()`, [`3`,`4`]);


// assertPrint("Diff19",`
// isEvenLength: Callable[[string], bool] = lambda str:string: len(str)%2==0 
// print(isEvenLength("abc"))
// print(isEvenLength("abcd"))`, [`False`,`True`]);

// assertPrint("Diff20",`
// print('Hello, World!', end=' | ')
// print(100, end=' | ')
// print(5 + 5)`, [`Hello, World! | 100 | 10`]);


// assertPrint("Case 1",`
// a : int = 200
// b : int = 10
// ops : [int] = None
// i : int = 0
// ops = [1,2,3,4,5]
// for i in ops:
//   if i == 1:
//     print(a+b)
//   elif i == 2:
//     print(a-b)
//   elif i == 3:
//     print(a*b)
//   elif i == 4:
//     print({a//b)
//   else:
//     print('Invalid Operation!')`, [`210`,`190`,`2000`,`20`]);

//     assertPrint("Case 2",`
// vowels : [str] = None
// i : int = 0
// k : str = None
// vowels = ['a', 'e']
// vowels.append('i')
// vowels.extend(['o', 'u'])
// k = vowels.pop()
// print(k)
// for i in range(len(vowels),-1,-1):
//   print(vowels[i])`, [`u`,`o`,`i`,`e`,`a`]);

//   assertPrint("Case 3",`
// sentence : str = 'the quick brown fox jumped over the lazy dog'
// record : dict = dict()
// letter : str = None 
// for letter in sentence:
//     if letter in record:
//         record[letter] = record[letter] + 1
//     else:
//         record[letter] = 1 
// print(record['t']
// print(record['q']))`, [`2`,`1`]);

// assertPrint("Case 4 - Checking if it ignores comments",`
// class employee(object):
//   def __init__(self : employee, name : str, age : int , salary : int):     //Hierarchical Inheritance
//     self.name = name
//     self.age = age
//     self.salary = salary

// class childemployee1(employee):
//   def __init__(self : childemployee1, name : str, age : int , salary : int):
//   self.name = name
//   self.age = age
//   self.salary = salary
 
// class childemployee2(employee):
//   def __init__(self : childemployee2, name : str, age : int , salary : int):
//     self.name = name
//     self.age = age
//     self.salary = salary
// emp1 : employee = employee('harshit',22,1000)
// emp2 : employee = employee('arjun',23,2000)
 
// print(emp1.age)
// print(emp2.age)`, [`22`,`23`]);

// assertPrint("Case 5",`
// class employee1(object):
//     def __init__(self : employee1, name : str, age : int, salary : int):  
//         self.name = name
//         self.age = age
//         self.salary = salary
 
// class employee2(object):
//     def __init__(self : employee2, name : str, age : int, salary : int, id : int):
//      self.name = name
//      self.age = age
//      self.salary = salary
//      self.id = id
 
// class childemployee(employee1,employee2):
//     def __init__(self : childemployee, name : str, age : int, salary : int, id : int):
//      self.name = name
//      self.age = age
//      self.salary = salary
//      self.id = id
// emp1 = employee1('harshit',22,1000)
// emp2 = employee2('arjun',23,2000,1234)
 
// print(emp1.age)
// print(emp2.id)`, [`22`,`1234`]);

// assertPrint("Case 6",`
// class Vehicle(object):
//     def message(self:Vehicle):
//         print("Parent class method")

// class Cab(Vehicle):
//     def message(self:Cab):
//         print("Child Cab class method")

// class Bus(Vehicle):
//     def message(self:Bus):
//         print("Child Bus class method")
// x = Vehicle()
// x.message()
// y= Cab()
// y.message()
// z = Bus()
// z.message()`, [`Parent class method`,`Child Cab class method`,`Child Bus class method`]);

// assertPrint("Case 7",`
// class Message(object):
//     def details(self: Message, phrase:str=None): 
//         if phrase is not None:
//             print('My message - ' + phrase)
//         else:
//             print('Welcome to Python World')
// x = Message()
// x.details()
// x.details('Life is beautiful')`, [`Welcome to Python World`,`My message - Life is beautiful`]);

// assertPrint("Case 8",`
// def intRev(val : int) -> int:
//     inverse : int = 0
//     Remi : int = 0
//     while(val > 0):
//         Remi = val % 10
//         inverse = (inverse * 10) + Remi
//         val = val // 10
//     return inverse
// rev : int = 0
// val : int = 1001
// rev = intRev(val)

// if(val == rev):
//     print("True")
// else:
//     print("False")`, [`True`]);

// assertPrint("Case 9",`
// class Person(object):
//     def __init__(self:Person, name:str, age:int):
//         self.name = name
//         self.age = age
//     def show_salary(self:Person):
//         print("Salary is unknown")

// class Employee(Person):
//     def __init__(self:Employee, name:str, age:int, salary:int):
//         super().__init__(name, age)
//         self.salary = salary
//     def show_salary(self:Employee):
//         print(self.salary)

// p = Person("y", 23)
// x = Employee("x", 20, 100000)
// p.show_salary()
// x.show_salary()`, [`Salary is unknown`,`100000`]);

// assertPrint("Case 10",`
// def binarySearch(arr : [int], l : int, r: int, x : int) -> int:
//     if r >= l:
//         mid : int = l + (r - l) // 2
//         if arr[mid] == x:
//             return mid
//         elif arr[mid] > x:
//             return binarySearch(arr, l, mid-1, x)
//         else:
//             return binarySearch(arr, mid + 1, r, x)
//     else:
//         return -1
// arr : [int]= [2, 3, 4, 10, 40]
// x : int = 10
// y : int = 50
// result1 : int = 0
// result2 : int = 0
// result1 = binarySearch(arr, 0, len(arr)-1, x)
// result2 = binarySearch(arr, 0, len(arr)-1, x)
// print(result1)
// print(result2)`, [`3`,`-1`]);

// assertPrint("Case 11",`
// def fact(n : int, a : int = 1) -> int:
//     if (n == 1):
//         return a
//     return fact(n - 1, n * a)
// print(fact(5))`, [`120`]);

// assertPrint("Case 12",`
// def UncommonWords(A : str, B : str) -> [str]:
//     count : dict = dict()
//     word : str = None
//     for word in A.split():
//         count[word] = count.get(word, 0) + 1
//     for word in B.split():
//         count[word] = count.get(word, 0) + 1
//     return [word for word in count if count[word] == 1]
// A : str = "Peeks for Peeks"
// B : str = "Learning from Peeks for Peeks"
// C : [str] = None
// i : int = 0
// C = UncommonWords(A, B)
// for i in range(0,len(C):
//   print(C[i]))`, [`from`,`Learning`]);

//   assertPrint("Case 13",`
// def findLen(str1 : str)-> int:
//   counter : int = 0  
//   i : str = None  
//   for i in str1:
//       counter = counter + 1
//   return counter
// str1 : str = "Creepy Stuff"
// print(findLen(str))`, [`11`]);

// assertPrint("Case 14",`
// test_dict : dict = dict()
// res : dict = dict()
// key : str = None
// test_dict = {'gfg': [7, 6, 3], 'is': [2, 10, 3], 'best': [19, 4]}
// for key in sorted(test_dict):
//     res[key] = sorted(test_dict[key])
// print(res)`, [`{‘best’: [4, 19], ‘gfg’: [3, 6, 7], ‘is’: [2, 3, 10]}`]);

// assertPrint("Case 15",`
// def Sort_Tuple(tup : [tuple]) -> [tuple]:
//     lst : int= len(tup)
//     i : int = 0
//     j : int = 0
//     temp : tuple = tuple()
//     for i in range(0, lst):
//         for j in range(0, lst-i-1):
//             if (tup[j][1] > tup[j + 1][1]):
//                 temp = tup[j]
//                 tup[j]= tup[j + 1]
//                 tup[j + 1]= temp
//     return tup
// tup : [tuple]
// tup =[('for', 24), ('is', 10), ('Prop', 28),('Frown', 5), ('portal', 20), ('a', 15)]
       
// print(Sort_Tuple(tup))`, [`[('Frown', 5), ('is', 10), ('a', 15), ('portal', 20), ('for', 24), ('Prop', 28)]`]);

// assertPrint("Case 16",`
// A : [int] = None
// i : int = 0
// min_idx : int = 0
// j : int = 0 
// A = [64, 25, 12, 22, 11]
// for i in range(len(A)):
//     min_idx = i
//     for j in range(i+1, len(A)):
//         if A[min_idx] > A[j]:
//             min_idx = j   
//     A[i], A[min_idx] = A[min_idx], A[i]

// for i in range(len(A)):
//     print(A[i])`, [`11`,`12`,`22`,`25`,`64`]);


// assertPrint("Case 17",`
// def check_if_substring(string : str , substr : str) -> bool :
//     if substr in string:
//         return True
//     else:
//         return False
// mystring = "IndoPacific"
// substr = "Pac"
// if check_if_substring(mystring, substr):
//     print("YES")
// else:
//     print("NO")`, [`Yes`]);

// assertPrint("Case 18",`
// A : [[int]] = None
// B : [[int]] = None 
// result : [[int]] = None
// i : int = 0
// j : int = 0
// k : int = 0
// r : [int] = None
// A = [[12, 7, 3],[4, 5, 6],[7, 8, 9]] 
// B = [[5, 8, 1, 2],[6, 7, 3, 0],[4, 5, 9, 1]]
// result = [[0, 0, 0, 0],[0, 0, 0, 0],[0, 0, 0, 0]]
// for i in range(len(A)):
//     for j in range(len(B[0])):
//         for k in range(len(B)):
//             result[i][j] += A[i][k] * B[k][j]
// for r in result:
//     print(r)`, [`[114, 160, 60, 27]`,`[74, 97, 73, 14]`,`[119, 157, 112, 23]`]);


// assertPrint("Case 19",`
// from collections import Counter
// l : [int] = None
// x : int = 3
// d : dict = dict()
// l = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5] 
// d = Counter(l)
// print(d[x])`, [`2`]);

// assertPrint("Case 20",`
// import math
// list1 : [int] = None
// list2 : [int] = None
// result1 : int = 0
// result2 : int = 0
// list1  = [1, 2, 3]
// list2  = [3, 2, 4]
// result1 = math.prod(list1)
// result2 = math.prod(list2)
// print(result1)
// print(result2)`, [`6`,`24`]);


// assertTCFail("Fail1", `
// spam : [str] = None 
// spam = ['cat', 'dog', 'mouse']
// i : int = 0
// for i in range(spam):
//     print(spam[i])`);

// assertFail("Fail2", `
// def method1():
//   x : str == "One"
//   y : int == 0
//   y = int(x)
// method1()`);

// assertFail("Fail3", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   if y = 0:
//     print("Yes")
// method1()`);

// assertTCFail("Fail4", `
// spam : str = 'I have a pet cat.'
// spam[13] = 'r'
// print(spam)`);

// assertFail("Fail5", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   if y == 0:
//     print(z)
// method1()`);

// assertFail("Fail6", `
// from math import cube
// print(cube(10))`);

// assertFail("Fail7", `
// print(10 //0 )`);

// assertFail("Fail8", `
// print 10`);

// assertFail("Fail9", `
// def method1():
//   x : str = "One"
//   if y == 0:
//     print(x)
//   else:
//     print("Fake")
// method1()`);

// assertFail("Fail10", `
// def method1() -> int:
//   x : str = "One"
//   y : int = 0
//   if y == 0:
//     return x
//   else:
//     return "Fake"
// method1()`);

// assertFail("Fail11", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   if y == 0:
//     return x
//   else:
//     return "Fake"
// method1()`);


// assertFail("Fail12", `
// d1 : dict = dict()
// d1 = {20:50,30:60,40:70}
// print(d1[50])`);

// assertFail("Fail13", `
// in : int = 20
// print(in)`);

// assertFail("Fail14", `
// in : int = 20
// print(in)`);


// assertFail("Fail15",`
// class Class1(object):
//     x : int = 50
//     def m(self:Class1):
//         print("In Class1")
       
// obj : Class1 = None    
// obj = Class1()
// obj.m2()`);

// assertFail("Fail16",`
// class Class1(object):
//     x : int = 50
//     def m(self:Class1):
//         print("In Class1")
       
// obj : Class1 = None    
// obj = Class1()
// print(obj.c)`);

// assertFail("Fail17",`
// li : [int] = None
// li2 : [int] = None
// e1 : int = 0
// li =  [8,4,0,18,24]
// li2 = [1/e1 for e1 in li]`);

// assertFail("Fail18",`
// a1 : stt = 'THIS IS IN LOWERCASE.'
// a1 = a1.lowerr()`);

// assertFail("Fail19",`
// numEggs : int = 12
// print('I have ' + numEggs + ' eggs.')`);

// assertFail("Fail20",`
// class A(object):
//     a : str = "A"
// class B(D):
//     pass
// x : B = None
// x = B()
// print(x.a)`);

// assertTC("Type 1", `
// class Var(object):
//   da : Dep = None
  
// class Dep(object):
//   cd : Var = None
// c : Var = None
// c.da
//   `, CLASS("Dep"));

// assertTC("Type 2", `
// li : [int] = None
// i : int = 0
// li2 : [int] = None
// li = [8,4,0,18,24]
// for i in li:
//   li2.append(i)
// li2`, LIST);

// assertTC("Type 3", `
// class CA(object):
//   cj : int = 0
// c : CA = None
// c = None`, NONE);

// assertTC("Type 4", `
// def test(x : int, y : set = {1, 2, 3}) -> bool:
//   return x in y
// x : bool = test(1))
// x`, BOOL);

// assertTC("Type 4", `
// x:set = set()
// i : int = 0
// x = {1, 2, 3, 4, 5}
// for i in range(2, 5):
//   x.remove(i)
// x`, SET);

// assertTC("Type 5", `
// class CA(object):
//   d : DA = None
//   def new(self: C, d : D) -> C:
//     self.d = d
//     return self
    
// class DA(object):
//   c : CA = None
//   def new(self: D, c: C) -> D:
//     self.c = c
//     return self
    
// c : CA = None
// d : DA = None
// c = CA().new(d)
// c.d.c`, CLASS("C"));

// assertTC("Type 6", `
// li : [int] = None
// i : int = 0
// li2 : [int] = None
// li = [8,4,0,18,24]
// for i in li:
//   li2.append(i)
// li2[2]`, NUM);

// assertTC("Type 7", `
// li : str = "Hello World"
// li2 : str = li[3:5]
// li2[2]`, STRING);

// assertTC("Type 8", `
// A : [int] = None
// B : dict = dict()
// s1 : int = 0
// i : int = 0
// j : int = 0
// A = [1,2,3]
// B = {1:5,2:10,3:15}
// for i in A:
//   for j in B:
//     s1 = s1+ i + j
// B`, DICT);

// assertTC("Type 9", `
// li : [int] = None
// i : int = 0
// li2 : tuple = tuple()
// li = [8,4,0,18,24]
// for i in li:
//   li2.append(i)
// li2`, TUPLE);

// assertTC("Type 10", `
// A : [int] = None
// B : dict = dict()
// s1 : int = 0
// i : int = 0
// j : int = 0
// A = [1,2,3]
// B = {1:[5,65],2:[10,56],3:[15,34]}
// for i in A:
//   for j in B:
//     s1 = s1+ i + j
// B[1]`, LIST);

// assertTC("Type 11", `
// li : [[int]] = None
// i : int = 0
// li2 : tuple = tuple()
// li = [[8,4],[0,18],[24]]
// for i in li:
//   li2.append(i)
// li`, LIST);

// assertTC("Type 12", `
// li : [[int]] = None
// i : int = 0
// li2 : tuple = tuple()
// li = [[8,4],[0,18],[24]]
// for i in li:
//   li2.append(i)
// li[0]`, LIST);

// assertTC("Type 13", `
// A : [int] = None
// B : dict = dict()
// s1 : int = 0
// i : int = 0
// j : int = 0
// A = [1,2,3]
// B = {1:"abss",2:"bvf",3:"cdf}
// for i in A:
//   for j in B:
//     s1 = s1+ i + j
// B[1]`, STRING);

// assertTC("Type 14",`
// class C(object):
//   xp :str = "Hello"
// c: C = None
// c = C()
// c.xp
// `,STRING)

// assertTC("Type 15",`
// def method(x:str)->str:
//   return x
// x:str = "Hello"
// method(x)
// `,STRING)