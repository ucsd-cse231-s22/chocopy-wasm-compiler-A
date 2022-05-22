import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Milestone-1 tests", () => {
  // 1
  assertPrint("list-declare-and-assign-known-data-type", `a : [int] = None
  a = [11,40,20,21]
  
  print(a[3])
  `, [`21`]);
  // 2
  assertTCFail("list-declare-and-assign-unknown-data-type", `a : [cat] = None
  a = [1,2,3,4]
  
  print(a[3])  
  `);
  // 3
  assertTCFail("list-declare-and-assign-wrong-data-type", `a : [int] = None
  a = [True, False, True, 1]
  
  print(a[0])
  `);
  // 4
  assertPrint("list-index-valid", `a : [int] = None
  a = [99, 88, 77, 66, 55]
  
  a[2] = 11
  print(a[2])
  `, [`11`]);
  // 5
  assertFail("list-index-run-time-error", `a : [int] = None
  a = [22,40,50,33,22]
  
  print(a[6])  
  `);
  // 6
  assertPrint("list-length", `a : [int] = None
  a = [1,2,3,4,5]
  print(len(a))
  `, [`5`]);
  // 7
  assertPrint("list-length-last-element", `a : [int] = None
  a = [1,2,3,4,5]
  print(a[len(a)-1])  
  `, [`5`]);
  // 8
  assertPrint("list-concat-same-types", `a : [int] = None
  a = [1, 2, 3] + [4, 5, 6]
  
  print(a[3])`, [`4`]);
  // 9
  assertTCFail("list-concat-different-types", `a:[int] = None
  a = [1, 2, 3] + [True, False, True]
  print(a[3])`);
  // 10
  assertPrint("list-concat-object-none-types", `class Cat(object):
  x:int = 0

c:[Cat] = None
c = [None, None] + [Cat(), Cat()]
print(c[2].x)`, [`0`]);

  assertPrint("string-basic", `myStr: str = "abc"
  print(myStr)  
  `, [`abc`]);
  assertPrint("string-indexing", `myStr: str = "abc"
  print(myStr[2])  
  `, [`c`]);
  assertFail("string-index-error", `myStr: str = "abc"
  print(myStr[6])  
  `);
  assertPrint("string-size", `myStr: str = "abc"
  print(len(myStr))  
  `, [`3`]);
  assertPrint("string-size-operation", `myStr: str = "abc"
  print(myStr[len(myStr)-1])  
  `, [`c`]);
  assertPrint("string-basic-concat", `a: str = ""
  a = "abc" + "edf"
  print(a)  
  `, [`abcedf`]);
  assertTCFail("string-basic-concat-tc-fail", `a: str = ""
  b: [int] = None
  b = [10, 20, 30]
  print(a+b)`);

  assertPrint("for-loop-basic", `a: [int] = None
  x: int = 0
  a = [1,2,3]
  for x in a:
    print(x)
  `, [`1`,`2`,`3`]);
  assertTCFail("for-iterator-not-defined", `a: str = "abc"
  for x in a:
    print(x)    
  `);
  assertTCFail("iterator-iterable-mismatch", `a: str = "abc"
  x: int = 0
  for x in a:
    print(x)    
  `);

});
