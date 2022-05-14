import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Inheritance tests", () => {
  assertPrint("field-read", `
class A(object):
  x:int = 1
  f:int = 1
      
class B(A):
  y:int = 2
      
class C(B):
  z:int = 2

c: C = None
c = C()
print(c.x)
print(c.y)
print(c.z)
`, [`1`,'2','2']);
assertPrint("field-update-read", `
class A(object):
  x:int = 1
  f:int = 1
      
class B(A):
  y:int = 2
      
class C(B):
  z:int = 2

c: C = None
c = C()
c.x = 10
c.y = 11
c.z = 12
c.f = 13
print(c.x)
print(c.y)
print(c.z)
print(c.f)
`, [`10`,'11','12','13']);
assertPrint("field-update-read-multiple-classes", `
class A(object):
  x:int = 1
  f:int = 1
      
class B(A):
  y:int = 2
      
class C(B):
  z:int = 2

class D(object):
  x:int = 10
      
class E(D):
  y:int = 20

c: C = None
e: E = None
e = E()
c = C()
print(c.x)
print(c.y)
print(c.z)
print(e.x)
print(e.y)
`, [`1`,'2','2','10','20']);
assertPrint("field-no-method-classes", `
class Single(object):
	a : int = 1


class Two(Single):
	b : int = 2

class Three(Two):
	c : int = 3


l : Three = None 
l = Three()
print(l.c)
`, [`3`]);
assertPrint("simple-method-call", `
class Single(object):
	a : int = 1

	def sum1(self: Single) -> int: 
		return self.a

class Two(Single):
	b : int = 2

	def sum2(self: Two) -> int: 
		return self.a + self.b

class Three(Two):
	c : int = 3

	def sum3(self: Three) -> int: 
		return self.a + self.b + self.c

l : Three = None 
l = Three()
print(l.sum3())
`, [`6`]);
assertPrint("base-class-method-call", `
class A(object):
    x: int = 1

    def increment(self: A, i: int) -> int:
        return self.x + i
    

class B(A):

    y:int = 10
    
a : B = None
a = B()
print(a.increment(1))
`, [`2`]);
assertPrint("method-doesnt-exist-in-super-class", `
class A(object):
	a : int = 1

	def get_a(self: A) -> int: 
		return self.a

class B(A):
	b : int = 2

	def sum_a_b(self: B) -> int: 
		return self.a + self.b

l : B = None 
l = B()
print(l.sum_a_b())
`, [`3`]);
assertPrint("order-of-parsing", `
class A(object):
	a : int = 3

	def get_a(self: A) -> int: 
		return self.a
	def get_a_minus_1(self: A) -> int:
		return self.a - 1

class B(A):
	b : int = 2

	def get_a_minus_1(self: B) -> int: 
		return self.a - 1
	def get_a(self: B) -> int:
		return self.a

l : B = None 
l = B()
print(l.get_a_minus_1())
`, [`2`]);
assertPrint("constructor", `
class A(object):
	a : int = 1

	def __init__(self: A):
		self.a = 2
	def get_a(self: A) -> int:
		return self.a

class B(A):
	b : int = 3
	
	def __init__(self: B):
		self.b = 4
	def get_b(self: B) -> int: 
		return self.b
		
l : B = None
l = B()
print(l.get_a())
print(l.get_b())
`, [`1`,`4`]);
assertPrint("method-overriding", `
class List(object):
	def sum(self: List) -> int: 
		return 0

class Empty(List):
	def sum(self: Empty) -> int: 
		return 0

class Link(List):
	val : int = 0
	next : List = None

	def sum(self: Link) -> int: 
		return self.next.sum() + self.val
	
	def new(self : Link, val : int, next : List) -> Link:
		self.val = val
		self.next = next
		return self

l : List = None 
l = Link().new(5, Link().new(13, Empty()))
print(l.sum())
`, [`18`]);
assertPrint("method-doesnt-exist-in-superclass", `
class A(object):
	a : int = 1

	def get_a(self: A) -> int: 
		return self.a

class B(A):
	b : int = 2

	def sum_a_b(self: B) -> int: 
		return self.a + self.b

l : B = None 
l = B()
print(l.sum_a_b())
`, [`3`]);
assertTCFail("method-doesnt-exist-in-any-class", `
class A(object):
	a : int = 1

	def __init__(self: A): pass
		
	def get_a(self: A) -> int:
		return self.a

class B(A):
	b : int = 3
	
	def __init__(self: B): pass
		
	def get_b(self: B) -> int: 
		return self.b
		
l : B = None
l = B()
print(l.get_c())
`);
assertTCFail("redefined-field-in-subclass", `
class A(object):
	a : int = 1

	def __init__(self: A): pass
		
	def get_a(self: A) -> int:
		return self.a

class B(A):
	a : int = 3
	
	def __init__(self: B): pass
		
	def get_b(self: B) -> int: 
		return self.b
		
l : B = None
l = B()
print(l.get_b())
`);
assertTCFail("superclass-doesnt-exist", `
class A(object):
	a : int = 1

	def __init__(self: A): pass
		
	def get_a(self: A) -> int:
		return self.a

class B(C):
	b : int = 3
	
	def __init__(self: B): pass
		
	def get_b(self: B) -> int: 
		return self.b
		
l : B = None
l = B()
print(l.get_c())
`);
assertTCFail("subclass-type-initializing-superclass-object", `
class A(object):
	a : int = 1

	def __init__(self: A): pass
		
	def get_a(self: A) -> int:
		return self.a

class B(A):
	b : int = 3
	
	def __init__(self: B): pass
		
	def get_b(self: B) -> int: 
		return self.b
		
l : B = None
l = A()
print(l.get_c())
`);
});
