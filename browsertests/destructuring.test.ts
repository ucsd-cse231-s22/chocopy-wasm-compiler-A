// import { assertPrint, assertRunTimeFail, assertTCFail, assertRepl } from './browser.test';


// describe("Destructuring Tests", () => {

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y = 1,2,3`)

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,z = 1,2`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y = 1+2`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,z = 1,2+3`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,_ = 1,2`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,_ = 1,2,3,4`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,_ = 1,2+3`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,_ = 1,2,3+4,5`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,_,*c = 2,3`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,*c = 2`);

// assertTCFail("length mismatch left and right hand side of assignment expression", `
// x : bool = True
// y : int = 12
// x,y,_,*c = 5+6`);

// // assertParserFail("Multiple starred", `
// // a : int = 0
// // b : int = 0
// // c : int = 0
// // d : int = 0
// // a, *b,c,*d = 3,4,5,6`)

// // assertParserFail("Unsupported Expr", `
// // a : int = 0
// // b : int = 0
// // a, b + 2 = 5, 6`)

// // assertPrint("basic-destr", `
// // x : int = 0
// // y : int  = 0
// // x, y = 5, 6
// // print(x)
// // print(y)` , ["5", "6"]);

// assertPrint("basic-destr2", `
// x : int = 0
// x,  = 5, 
// print(x)` , ["5"]);

// assertPrint("destr-underscore", `
// x : int = 0
// y : int  = 0
// x,_, y = 5, 6, 7
// print(x)
// print(y)` , ["5", "7"]);

// assertPrint("destr-multiple-types", `
// x : int = 0
// y : bool  = False
// x,_, y = 5, False, True
// print(x)
// print(y)` , ["5", "True"]);

// assertPrint("destr-lookup", `
// class C(object):
//   x : int = 123

// x : int = 0
// y : bool = False
// c : C = None
// c = C()

// x,c.x, y = 5, 10, True
// print(x)
// print(c.x)
// print(y)` , ["5", "10", "True"]);

// assertPrint("destr-expressions", `
// class C(object):
//   x : int = 123

// x : int = 0
// y : bool = False
// c : C = None
// c = C()

// x,c.x, y = c.x, 10 + 20, True or False
// print(x)
// print(c.x)
// print(y)` , ["123", "30", "True"]);

// assertPrint("destr-starred", `
// x : int = 0
// y : int = 0
// z : int = 0

// x, *y, z = 5, 10, 20
// print(x)
// print(y)
// print(z)` , ["5", "10", "20"]);

// assertPrint("destr-fnCallValid", `
// def f() -> int:
//  return 5

// x : int = 0
// y : int = 0
// z : int = 0

// x, y, z = f() + 20 , 10, -20
// print(x)
// print(y)
// print(z)` , ["25", "10", "-20"]);

// assertTCFail("destr-fnCallError", `
// def f() -> bool:
//  return True
 
// x : int = 0
// y : int = 0
// z : int = 0

// x, y, z = f(), 10, 20
// print(x)
// print(y)
// print(z)`)

// const rangeDef =`
// class Range(object):
//   current : int = 0
//   start : int = 0
//   end : int = 0
//   def new(self:Range, start:int, end:int)->Range:
//     self.start = start
//     self.current = start
//     self.end = end
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasNext(self:Range)->bool:
//     return self.current < self.end
// def range(s: int, e: int)->Range:
//   r: Range = None
//   r = Range().new(s,e)
//   return r
// `

// assertPrint("range-test", `
// ${rangeDef}
// a:int = 5
// b:int = 3
// a, b = range(1, 3)
// print(a)
// print(b)
// `, ["1", "2"]
// )

// assertPrint("range-test", `
// ${rangeDef}
// a:int = 5
// b:int = 3
// a, b = 2, range(1, 2)
// print(a)
// print(b)
// `, ["2", "1"]
// )

// assertPrint("destr-fnCallValidParam", `
// def f(a:int):
//     x : int = 0
//     y : int = 0
//     z : int = 0

//     x, y, z = a + 20 , a, -20
//     print(x)
//     print(y)
//     print(z)

// f(5)` , ["25", "5", "-20"]);

// });
