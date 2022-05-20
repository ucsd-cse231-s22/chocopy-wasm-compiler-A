// import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
// import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

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
// x:set = {1,2,4294967296}
// print(4294967296 in x)`, [`True`]);

//   // 11
//   assertPrint("Set+Closures", `
// def print_msg(val: set) -> Callable[[], None]:
//   def printIsIn(element: int):
//     print(element in val)
//   return printIsIn
// x:set = {1,2,3}
// func: Callable[[], None] = print_msg(x)
// func(2)
// func(4)`, [`True`, `False`]);

//   // 12, 
//   assertPrint("Set+Comprehensions", `
// x:set = {i for i in range(5)}
// print(3 in x)
// print(5 in x)`, [`True`, `False`]);

//   // 13, 
//   assertPrint("Set+Destructuring assignment", `
// x:set = {}
// y:set = {}
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
// x:set = {1, 2, 3, 4, 5}
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
//   a : set = {1, 2, 3}
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
// x:set = {"abc", "def"}
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
// for i in range(1,3):
//    for j in range(1,3):
//       print(i+j)`, [`2`, `3`,`4`, `3`,`4`, `5`, `4`,`5`, `6`]);

// //22,
//   assertPrint("Sum of Even and Odd Places", `
// A : list = [1,2,3,4,5,6,7,8,9,10]
// s1 : int = 0
// s2 : int = 0
// for i in range(0,len(A),2):
//    s1 = s1 + A[i]
// for i in range(1,len(A),2):
//    s2 = s2 + A[i]
// print(s1)
// print(s2)`, [`25`, `30`]);

// //23,
//   assertPrint("List+Inheritance", `
// class A(object):
//   a : list = [1, 2, 3]
// class B(A):
//   pass
// x : B = None
// x = B()
// print(x.a)`, [`1`, `2`, `3`]);

// //24,
//   assertPrint("Nested While", `
// A : list = [1,2,3]
// s1 : int = 0
// i : int = 0
// j : int = 0
// while i < len(A):
//   while j < len(A):
//     s1 = s1 + A[j]
//     j+=1
//   i = i+1
// print(s1)`, [`18`]);

// //25,
//    assertPrint("For + Lists + Dict", `
// A : list = [1,2,3]
// B : dict = {1:5,2:10,3:15}
// s1 : int = 0
// for i in A:
//   for j in B:
//     s1 = s1+ i + j
// print(s1)`, [`108`]);

// //26,
//   assertPrint("For Reverse", `
// A : list = [1,2,3]
// for i in range(len(A)-1,-1,-1):
//   print(A[i])`, [`3`,`2`,`1`]);

// //27
//   assertPrint("List+Destructuring assignment", `
// x:list = [1,2,3]
// t, y = x[0], x[1]
// print(t)
// print(y)`, [`1`, `2`]);

// //28
//   assertPrint("List+Strings", `
// genre : list = ['pop', 'rock', 'jazz']
// for i in range(len(genre)):
//     print("I like", genre[i])`, [`I like pop`, `I like rock`,`I like jazz` ]);

// //29
//   assertPrint("List+Loops", `
// A: list = []
// i : bool = True
// for i:
//    A.append(1)
//    i = False
// print(A)`, [`1`]);

// //30
//   assertPrint("List+Fancy calling conventions", `
// def test(x : int, y : list = [1,2,3]) -> list:
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
// f1 : list = ["UCSD","Compiler","Tritons","Library"]
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
// names : list = ['Steve', 'Bill', 'Ram', 'Mohan', 'Abdul']
// names2 = [s for s in names if 'a' in s]
// print(names2)
// `,[`Ram`,`Mohan`]);
// });
