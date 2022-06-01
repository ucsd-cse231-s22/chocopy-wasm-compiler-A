// import { assertPrint, assertRunTimeFail, assertTCFail, assertRepl } from './browser.test';

// describe("Generic tests", () => {
//   // 1
//   assertPrint("simple-one-generic", `T: TypeVar = TypeVar('T')

// class Printer(Generic[T]):
//     def print(self: Printer[T], x: T):
//       print(x)

// pInt: Printer[int] = None
// pInt = Printer[int]()
// pInt.print(10)`, [`10`]);

//   assertPrint("simple-two-generic", `T: TypeVar = TypeVar('T')

// class Printer(Generic[T]):
//     def print(self: Printer[T], x: T):
//         print(x)

// pInt: Printer[int] = None
// pBool: Printer[bool] = None

// pInt = Printer[int]()
// pInt.print(10)

// pBool = Printer[bool]()
// pBool.print(True)`, [`10`, `True`]);

//   /* NOTE(jpolitz): removing a failing test to get CI back
//   assertTCFail("invalid-specialization", `T: TypeVar = TypeVar('T')

//   class Box(object):
//       val: int = 10
  
//   class Printer(Generic[T]):
//      def print(self: Printer[T], x: T):
//          print(x)
  
//   p: Printer[Box] = None
//   p = Printer[Box]()
//   p.print(Box())`);
// */
//   assertTCFail("invalid-binop", `T: TypeVar = TypeVar('T')

// class Adder(Generic[T]):
//     def add(self: Adder[T], x: T, y: T) -> T:
//         return x + y

// a: Adder[int] = None
// a = Adder[int]()
// print(a.add(True, False))`);

//   assertPrint("valid-binop", `T: TypeVar = TypeVar('T')

// class Adder(Generic[T]):
//     def add(self: Adder[T], x: T, y: T) -> T:
//         return x + y

// a: Adder[int] = None
// a = Adder[int]()
// print(a.add(4, 6))`, ['10']);

//   assertTCFail("invalid param", `T: TypeVar = TypeVar('T')

// class Box(object):
//     val: int = 10
  
// class Printer(Generic[T]):
//     def print(self: Printer[T], x: T):
//         print(x)
  
// p: Printer[int] = None
// p = Printer[int]()
// p.print(Box())`);

//   assertTCFail("conflicting-global", `T: int = 0
// T: TypeVar = TypeVar('T')

// class Printer(Generic[T]):
//     def print(self: Printer[T], x: T):
//         print(x)
  
// p: Printer[int] = None
// p = Printer[int]()
// p.print(10)`);

// //   assertTCFail("conflicting-class", `
// // T: TypeVar = TypeVar('T')
// // class T(object):
// //     def __init__(self: T):
// //         pass

// // class Printer(Generic[T]):
// //     def print(self: Printer[T], x: T):
// //         print(x)
  
// // p: Printer[int] = None
// // p = Printer[int]()
// // p.print(10)`);

//   assertPrint("generics-as-args", `
//   T: TypeVar = TypeVar('T')
  
//   class Printer(Generic[T]):
//     def print(self: Printer[T], x: T):
//         print(x)

//   def print_ten(p: Printer[int]):
//     p.print(10)
    
//   p: Printer[int] = None
//   p = Printer[int]()
//   print_ten(p)`, ['10']);

//   assertPrint("generics-as-fields", `
//   T: TypeVar = TypeVar('T')
  
//   class IntPrinterWrapper(object):
//     intPrinter: Printer[int] = None

//     def print_int(self: IntPrinterWrapper, x: int):
//         self.intPrinter.print(x)

//   class Printer(Generic[T]):
//     def print(self: Printer[T], x: T):
//         print(x)
    
//   ip: IntPrinterWrapper = None
//   ip = IntPrinterWrapper()
//   ip.intPrinter = Printer[int]()
//   ip.print_int(10)`, ['10']);

// });