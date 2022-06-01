import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Inheritance tests", () => {

// 1 - Inheir same father
assertPrint("inheir-field-and-func", `
class A(object):
  x:int = 3
  y:int = 4
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def f(self : B) -> int:
    self.x = 12
    return 8

class C(A):
  z:int = 12
  def f(self : C) -> int:
    return 55

a : A = None
b : A = None
c : A = None
a = A()
b = B()
c = C()

print(a.x)
print(c.x)
print(b.f())
print(c.f())
print(b.x)

`, [`3`, `3`, `8`, `55`, `12`]);

// 2 - False Inheir : call inheir method with parent
assertTCFail("call-child-method-in-parent", `
class A(object):
  x:int = 3
  y:int = 4
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def f(self : B) -> int:
    self.x = 12
    return 8

  def g(self : B) -> bool:
    return True

b : A = None
b = B()

print(b.g())

`);

// 3 - Link list example
assertPrint("linklist-eg", `
class CL(object):
  def sum(self : CL) -> int:
    return 1
  def count(self : CL) -> int:
    return 1

class Empty(CL):
  def sum(self : Empty) -> int:
    return 0
  def count(self : Empty) -> int:
    return 0

class Single(CL):
  val : int = 0
  def new(self : Single, val : int) -> Single:
    self.val = val
    return self

  def count(self : Single) -> int:
    return 1

  def sum(self : Single) -> int:
    return self.val

  def getval(self : Single) -> int:
    return self.val

class Concat(CL):
  left : CL = None
  right : CL = None
  def sum(self : Concat) -> int:
    return self.left.sum() + self.right.sum()

  def count(self : Concat) -> int:
    return self.left.count() + self.right.count()

  def new(self : Concat, l : CL, r : CL) -> Concat:
    self.left = l
    self.right = r
    return self

l : CL = None
l = Concat().new(Single().new(5), Empty())
print(l.count())
print(Single().getval())
print(l.sum())

`, [`1`, `0`, `5`]);

// 4 - Lots of Inheritance : Fail
assertFail("lots-of-inheritance", `
class A(object):
  s:str = "HelloWorld"
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def f(self : B) -> int:
    return 8

  def g(self : B) -> bool:
    return True

class C(object):
  a:[int] = None
  def p(self : C) -> int:
    self.a = [1, 2, 3]
    return self.a[1]

class D(C):
  def p(self : D) -> int:
    return self.a[2]

d : C = None
d = D()
d.p()

`);

// 5 - Lots of Inheritance
assertPrint("lots-of-inheritance-2", `
class A(object):
  s:str = "HelloWorld"
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def f(self : B) -> int:
    return 8

  def g(self : B) -> bool:
    return True

class C(object):
  a:[int] = None
  def p(self : C) -> int:
    self.a = [1, 2, 3]
    return self.a[1]

class D(C):
  def p(self : D) -> int:
    return self.a[2]

d : C = None
a : A = None
b : A = None
a = A()
b = B()
d = C()
print(d.p())
print(a.f())
print(a.s[4])
print(b.s + a.s)

`, [`2`, `9`, `o`, `HelloWorldHelloWorld`]);

// 6 - Calling parent methods
assertPrint("call-parent-methods", `
class A(object):
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def g(self : B) -> bool:
    return True

a : A = None
b : B = None
a = A()
b = B()
print(b.t)
print(b.f())

`, [`5`, `9`]);

// 7 - Parent accessing child
assertTCFail("parent-access-child", `
class A(object):
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def g(self : B) -> bool:
    return True

a : A = None
b : B = None
a = A()
b = B()
print(a.t)

`);

// 7 - Multiple Inheritance
assertPrint("multiple-inheir", `
class A(object):
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def g(self : B) -> bool:
    return True

class C(B):
  fi:int = 94
  def g(self : C) -> bool:
    return False

a : A = None
ac : A = None
b : B = None
c : B = None
a = A()
ac = C()
b = B()
c = C()
print(ac.f())
print(c.f())
print(c.g())
print(b.g())

`, [`9`, `9`, `False`, `True`]);

// 8 - Non-align Parent Methods
assertTCFail("non-align-parent-methods", `
class A(object):
  def f(self : A) -> int:
    return 9
    
class B(A):
  t:int = 5
  def f(self : B) -> bool:
    return True

class C(B):
  fi:str = "940"
  def g(self : C) -> bool:
    return False

a : A = None
ac : A = None
b : B = None
c : B = None
a = A()
ac = C()

`);

// 9 - Composition with Inheritance
// assertPrint("composition-inheir", `
// class A(object):
//   def f(self : A) -> int:
//     return 9
    
// class B(A):
//   t:int = 5
//   a:A = None
//   def superM(self : B) -> int:
//     self.a = A()
//     return self.a.f()
//   def f(self : B) -> int:
//     return 16

// class C(B):
//   fi:int = 94
//   def g(self : C) -> bool:
//     return False

// a : A = None
// ac : A = None
// b : B = None
// c : B = None
// a = A()
// ac = C()
// b = B()
// c = C()

// print(b.superM())
// print(b.f())
// print(c.superM())
// print(ac.superM())

// `, [`9`, `16`, `9`]);

// 10 - Changing parent fields
assertPrint("change-parent-fields", `
class A(object):
  p : str = "CompilerIsTheBest"
  def f(self : A) -> str:
    return self.p
    
class B(A):
  def change(self : B) -> str:
    self.p = self.p + "Y"
    return self.f()

a : A = None
b : B = None
a = B()
b = B()

print(a.f())
print(b.f())
print(b.change())
print(b.change())
print(b.p)

`, [`CompilerIsTheBest`, `CompilerIsTheBest`, `CompilerIsTheBestY`, `CompilerIsTheBestYY`, `CompilerIsTheBestYY`]);


// 11 - Same method name for different inheritance
assertPrint("same-method-name", `
class A(object):
  def f(self : A) -> int:
    return 1
    
class B(A):
  t:int = 2
  def g(self : B) -> bool:
    return False

class C(object):
  def h(self : C):
    pass
  
  def x(self : C):
    pass  

  def f(self : C, y : int) -> int:
    return 3
    
class D(C):
  t:int = 4
  def g(self : D) -> bool:
    return True

b : B = None
d : D = None
b = B()
d = D()
print(b.t)
print(b.f())
print(b.g())
print(d.t)
print(d.f(3+3))
print(d.g())

`, [`2`, `1`, `False`, `4`, `3`, `True`]);




});
