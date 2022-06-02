// import { assertPrint, assertRunTimeFail, assertTCFail, assertRepl } from './browser.test';


// describe("Simple browser tests", () => {
//     assertPrint('Simple print test', `
//     print(123)
//     print(456)`, ["123", "456"]);

//       assertPrint("Bignums+I/O", `
// f : File = None
// f = open('output', 'wb')
// x: int = 4294967296
// print(f.write(x))`, ["4"]);

//   assertPrint("Set+For loops", `
// x: set = set()
// i : int = 0
// x = {1, 2, 3, 4, 5}
// for i in range(2, 5):
//   x.remove(i)
// print(x)`, ["1", "5"]);
    
//     assertRunTimeFail('Simple runtime fail test', `
// class C(object):
//     x : int = 0        
// c : C = None
// c.x`);

// assertPrint("Nested Loop", `
// i:int = 0
// j:int = 0
// for i in range(1,3):
//    for j in range(1,3):
//       print(i+j)`, ["2", "3","4", "3","4", "5", "4","5", "6"]);

// assertPrint("Sum of Even and Odd Places", `
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
// print(s2)`, ["25", "30"]);

// assertPrint("List+Inheritance", `
// class A(object):
//   a : [int] = None
//   a = [1, 2, 3]
// class B(A):
//   pass
// x : B = None
// x = B()
// print(x.a)`, ["1", "2", "3"]);

// assertPrint("For + Lists + Dict", `
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
// print(s1)`, ["108"]);

// assertPrint("List+Strings", `
// genre : [str]= ['pop', 'rock', 'jazz']
// i: str = None
// for i in range(len(genre)):
//     print("I like", genre[i])`, ["I like pop", "I like rock","I like jazz" ]);

// assertPrint("List+Fancy calling conventions", `
// def test() -> bool:
//    txt : str = "The best things in life are free!"
//    if "expensive" not in txt:
//       return False
//    else:
//       return True
// print(test())`,["False"]);

// assertPrint("String Append", `
// def test(a : str , b : str) -> str:
//    return a+b
// print(test("UCSD","Triton"))`,["UCSDTriton"]);


// assertPrint("String Append1", `
// def test(a : int) -> str:
//    x : str = None
//    if x % 2 == 0:
//       return "Even"
//    else:
//       return "Odd"
// print(test(5)
// print(test(2))`,["Odd","Even"]);

// assertPrint("Reverse A string + Builtin Fncs", `
// x : str = "Hello World"
// print(x[::-1])
// print(x.upper())
// `,["dlroW olleH","HELLO WORLD"]);

// assertPrint("Diff3",`
// A : [[int]]] = None
// sum : int = 0
// i : int = 0
// j : int = 0
// A = [[10,20,30],[20,30,40]]
// for i in range(0,len(A)):
//   for j in range(0,len(i)):
//     sum = sum + A[i][j]
// print(sum)`, ["150"]);

// assertPrint("Diff5",`
// def printMsg():
//   print("""This is 
//     a test""")
// printMsg()`, ["This is a test"]);

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
// print(b.area())`, ["I am a two-dimensional shape.","Squares have each angle equal to 90 degrees.","147"]);

// assertPrint("Diff9",`
// def shout(text:str):
//     print(text)
// def shouting(text:str):
//     print(text)
// yell,yelling = shout,shouting
// yell('Fri')
// yelling('State')`, ["Fri","State"]);

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
// obj.m()`, ["In Class2"]);

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
// print(output_gen)`, ["[2,4,4,6]","{1:1,3:27,5:125,7:343}","(2,4,6)"]);

// assertPrint("Diff14",`
// class Start(object):
//   a : string = ""
//   b : string = ""
//   def set1(self, a : string , b : string):
//      self.a = a
// 	 self.b = b
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
// A.set1("First","Second")
// print(A.concatenate())
// print(A.RAfirst())
// print(A.RBFirst())
// print(A.LengthA + A.LengthB)`, ["FirstSecond","F","S","11"]);

// assertPrint("Diff20",`
// print('Hello, World!', end=' | ')
// print(100, end=' | ')
// print(5 + 5)`, ["Hello, World! | 100 | 10"]);

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
//     print('Invalid Operation!')`, ["210","190","2000","20"]);

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
// print(record['q']))`, ["2","1"]);

// assertPrint("Case 7",`
// class Message(object):
//     def details(self: Message, phrase:str=None): 
//         if phrase is not None:
//             print('My message - ' + phrase)
//         else:
//             print('Welcome to Python World')
// x = Message()
// x.details()
// x.details('Life is beautiful')`, ["Welcome to Python World","My message - Life is beautiful"]);

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
//     print("False")`, ["True"]);

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
// x.show_salary()`, ["Salary is unknown","100000"]);


// assertRunTimeFail("Fail2", `
// def method1():
//   x : str == "One"
//   y : int == 0
//   y = int(x)
// method1()`);

// assertRunTimeFail("Fail3", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   if y = 0:
//     print("Yes")
// method1()`);

// assertRunTimeFail("Fail5", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   if y == 0:
//     print(z)
// method1()`);

//   assertRunTimeFail("Convert 1", `
// def method1():
//   x : str = "One"
//   y : int = 0
//   y = int(x)
// method1()
// `);


// assertRunTimeFail("Convert 2", `
// def method1():
//   x : [str] = ["One"]
//   y : int = int(x)
// method1()
// `);


// assertRunTimeFail("Wrong builtin Methods", `
// def method1():
//   A : [int] = None
//   A = [1,23,5]
//   A.add(50)
// method1()
// `);

// assertRunTimeFail("Wrong Number of Unpack 1", `
// def getNumbers() -> str,str,str:
//   return 'one', 'two', 'three'
// one : str = None
// two : str = None
// one, two = getNumbers()
// `);


//    assertRunTimeFail("Wrong Number of Unpack 2", `
// def getNumbers() -> str,str,str:
//   return 'one', 'two', 'three'
// one : str = None
// two : str = None
// three : str = None
// four : str = None
// one, two , three , four = getNumbers()
// `);

//   assertRunTimeFail("Syntax 1", `
// def printMsg():
//   print("This is a test)
// printMsg()
// `);


// assertRunTimeFail("Syntax 2", `
// def printMsg():
//   print("This is 
//     a test")
// printMsg()
// `);
//     assertTCFail('Simple typecheck fail test', `
// a: int = True`);

// assertTCFail("List None Type", `
// days : int = 10
// print("Total number of days: " + days)`);

//   assertTCFail("List None Type", `
// days : [int] = None
// days = [10]
// print("Total number of days: " + days[0] + " in a month")`);

// assertTCFail("Fail1", `
// spam : [str] = ['cat', 'dog', 'mouse']
// for i in range(spam):
//     print(spam[i])`);

// assertTCFail("Fail4", `
// spam : str = 'I have a pet cat.'
// spam[13] = 'r'
// print(spam)`);

// assertTCFail("List None Type", `
// st : str = "Hello World"
// print(st["Hello"])`);

// assertTCFail("List None Type", `
// cars : dict = dict()
// i : str = None
// cars = {"brand": "Ford","model": "Mustang"}
// for i in cars:
//   print("brand: " + i["brand"])
//   print("model: " + i["model"])`);

// assertTCFail("call-type-checking-fail", `
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

//   assertTCFail("List None Type", `
// list1 : [int] = None
// temp : int = 0
// list1 = [1, 2]
// list1 = list1.sort(list1)
// temp = list1[0]
// print(temp)`);

//     assertRepr("Simple repr", `print(123)`, [`print(456)`, `print(789)`], [["123"], ["456"], ["789"]])

//     assertRepr("Simple repr", `
// A : int = 50
// print(A)`, [`A`, `print(A + 2)`,`A = A + 2`,`A`], [["50"], ["50"], ["52"],["52"]])

//     assertRepr("Simple repr", `
// A : [int] = None
// A = [1,2,3]
// s1 : int = 0
// i : int = 0
// j : int = 0
// while i < len(A):
//   j = 0
//   while j < len(A):
//     s1 = s1 + A[j]
//     j+=1
//   i = i+1
// print(s1)`, [`s1`, `i`,`j`], [["18"], ["18"], ["4"], ["4"]])

//     assertRepr("Simple repr", `
// class A(object):
//     a : int = 4294967296
//     b : int = 4455885658
// class B(A):
//     pass
// x : B = None
// x = B()`, [`print(x.a)`, `print(x.b)`], [["4294967296"], ["4455885658"]])

//     assertRepr("Simple repr", `
// a: [int] = None
// a = [4294967296, 2]
// `, [`print(a[0])`, `print(a[1])`], [["4294967296"], ["2"]])
// });