import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("inheritance test", () => {
    assertPrint("basic-two-class-read-field", `
class A(object):
  x:int = 0
      
class B(A):
  y:int = 1

b : B = None
b = B()
print(b.x)
print(b.y)
`, ["0", "1"]);
    assertPrint("two-level-inheritance-read-field", `
class A(object):
  x:int = 1
      
class B(A):
  y:int = 2
      
class C(B):
  z:int = 3

c: C = None
c = C()
print(c.x)
print(c.y)
print(c.z)
`, ["1", "2", "3"]);
    assertPrint("update-field", `
class A(object):
  x:int = 1
      
class B(A):
  y:int = 2
      
class C(B):
  z:int = 3

c: C = None
c = C()
c.x = 4
c.y = 5
c.z = 6
print(c.x)
print(c.y)
print(c.z)
`, ["4", "5", "6"]);
    assertPrint("assign-super-class", `
class A(object):
	x : int = 1

class B(A):
	y : int = 2

class C(B):
	z : int = 3

b : B = None
b = C()
print(b.x)
print(b.y)
`, ["1", "2"]);
    assertTCFail("read-field-of-subclass", `
class A(object):
	x : int = 1

class B(A):
	y : int = 2

class C(B):
	z : int = 3

b : B = None
b = C()
print(b.z)
`);
    assertPrint("basic-method-call", `
class A(object):
    x : int = 1
    def fa(self: A) -> int:
        return 1

class B(A):
    y : int = 1
    def fb(self: B) -> int:
        return 2

b : B = None 
b = B()
print(b.fa())
print(b.fb())
`, ["1", "2"]);
    assertPrint("two-level-inheritance-method-call", `
class A(object):
    x : int = 1
    def fa(self: A) -> int:
        return 1

class B(A):
    y : int = 1
    def fb(self: B) -> int:
        return 2

class C(B):
    z : int = 2
    def fc(self: C) -> int:
        return 3
        
c : C = None 
c = C()
print(c.fa())
print(c.fb())
print(c.fc())
`, ["1", "2", "3"]);
    assertPrint("method-call-super-field", `
class A(object):
	x : int = 1
	def sum_a(self: A) -> int: 
		return self.x

class B(A):
	y : int = 2
	def sum_b(self: B) -> int: 
		return self.x + self.y

class C(B):
    z : int = 3
    def sum_c(self: C) -> int:
        return self.x + self.y + self.z
        
c : C = None 
c = C()
print(c.sum_c())
`, ["6"]);
    assertPrint("method-call-super-method", `
class A(object):
	x : int = 1
	def sum_a(self: A) -> int: 
		return self.x

class B(A):
	y : int = 2
	def sum_b(self: B) -> int: 
		return self.sum_a() + self.y

class C(B):
    z : int = 3
    def sum_c(self: C) -> int:
        return self.sum_b() + self.z
        
c : C = None 
c = C()
print(c.sum_c())
`, ["6"]);
    assertPrint("assign-base-method-call", `
class A(object):
    x : int = 1
    def add(self: A, i: int) -> int:
        return self.x + i

class B(A):
    y : int = 3
    
a : A = None
a = B()
print(a.add(5))
`, ["6"]);
    assertPrint("override", `
class A(object):
    x : int = 1
    def add(self: A) -> int:
        return self.x + 1

class B(A):
    y : int = 3
    def add(self: B) -> int:
        return self.y+1
    
b : B = None
b = B()
print(b.add())
`, ["4"]);
    assertPrint("change-order", `
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

b : B = None 
b = B()
print(b.get_a_minus_1())
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
	def get_a(self: A) -> int:
		return self.a
	def get_b(self: B) -> int: 
		return self.b
		
b : B = None
b = B()
print(b.get_a())
print(b.get_b())
`, [`1`,`4`]);
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
		
b : B = None
b = B()
print(b.get_c())
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
		
b : B = None
b = B()
print(b.get_b())
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
		
b : B = None
b = B()
print(b.get_c())
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
		
b : B = None
b = A()
print(b.get_c())
`);
});
