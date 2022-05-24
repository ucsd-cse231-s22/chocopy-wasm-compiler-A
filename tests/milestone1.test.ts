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

  assertPrint(`nested-basic`, `y: int = 0
  def f1()->int:
      x: int = 0
      def f2():
          nonlocal x
          global y
          y = 6
          x = 5
      f2()
      return x
  print(f1())
  print(y)`, ['5', '6']);

  assertTCFail(`nested-global-access-with-nonlocal`,`y: int = 0
  def f1():
      def f2():
          nonlocal y
          y = 6
      f2()
  print(y)`);

  assertTCFail(`nested-global-redeclaration`, `y: int = 0
  def f1():
      def f2():
          global y
          y:int = 0
          y = 6
      f2()
  print(y)`);

  assertPrint(`nonlocal-updated`, `y: int = 0
  x: int = 0
  def f1():
      x:int = 0
      def f2():
          nonlocal x
          x = 100
      f2()
      print(x)
  f1()
  print(x)`, [`100`, `0`]);

  assertPrint(`update-global-instead-of-nonlocal`, `y: int = 0
  def f1():
      y:int = 0
      def f2():
          global y
          y = 100
      f2()
      print(y)
  f1()
  print(y)`, [`0`, `100`]);

  assertPrint(`nested-parent-variable-access`, `def f(x:int):
  def f1()->int:
     return x + 5
  print(f1())

f(5)`, [`10`]);

  assertPrint(`nested-ancestor-nonlocal`,`def f():
  x:int = 0
  def f1():
     def f2():
         nonlocal x
         x = 5
     f2()
  f1()
  print(x)

f()`, [`5`]);

assertPrint(`nested-most-recent-nonlocal`, 
`def f():
  x:int = 0
  def f1():
    x:int = 0
    def f2():
        nonlocal x
        x = 5
    f2()
    print(x)
  f1()
  print(x)

f()`, [`5`, `0`]);

assertTCFail(`condition-exp-basic-tcfail`, `x:int = 1
x = (True if 1 > 3 else False) + 5`);

assertPrint(`condition-exp-basic`, `x:int = 1
x = (100 if 1 > 3 else 1000) + 5
print(x)`, [`1005`]);

assertFail(`condition-exp-class-none`, `
class C(object):
  var:int = 10
x:int = 0
c:C = None
c = (C() if x == 1 else None)
print(c.var)`);

assertPrint(`condition-exp-inside-func`, `
def is_multiple_of_two(x:int)->bool:
  return (True if x%2 == 0 else False)

print(is_multiple_of_two(10))
print(is_multiple_of_two(5))`, [`True`, `False`]);

assertTCFail(`inheritance-common-field`, `
class A(object):
  x:int = 0

class B(A):
  x:int = 1`);

assertTCFail(`inheritance-method-different-signature`, `
class A(object):
  x:int = 0
  def getVal(self:A)->int:
    return self.x

class B(A):
  y:int = 1
  def getVal(self:B, z:int)->int:
    return self.y + z`);

assertTCFail(`inheritance-assign-parent-to-child`,
`class A(object):
  x:int = 0

class B(A):
  y:int = 1

a:B = None
a = A()`);

assertPrint(`inheritance-super-class-field-access`, `
class A(object):
  x:int = 100

class B(A):
  y:int = 1

a:A = None
a = B()
print(a.x)`, [`100`]);

assertPrint(`str-print-for-loop`, `
a: str = "abc"
x: str = ""
for x in a:
  print(x)`, ['a','b','c']);

assertPrint(`for-loop-with-if`,`
x : int = 0
for x in [1, 2, 3, 4, 5]:
  if x > 3:
    print(x)`, [`4`, `5`]);

assertPrint(`if-elif-else`, `
x:int = 0
if x < 0:
    print("NEG")
elif x > 0:
    print("POS")
elif x == 0:
    print("ZERO")
else:
    print("INVALID")`, [`ZERO`]);

});
