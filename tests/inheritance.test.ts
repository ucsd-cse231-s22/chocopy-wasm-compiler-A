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
    
a : A = None
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
	def get_a(self: A) -> int:
		return self.a
	def get_b(self: B) -> int: 
		return self.b
		
l : B = None
l = B()
print(l.get_a())
print(l.get_b())
`, [`1`,`4`]);
assertPrint("simple-method-overriding", `
class Single(object):
	a : int = 1
	def sum(self: Single) -> int: 
		return self.a
class Two(Single):
	b : int = 2
	def sum(self: Two) -> int: 
		return self.a + self.b
class Three(Two):
	c : int = 3
	def sum(self: Three) -> int: 
		return self.a + self.b + self.c
l : Three = None 
l = Three()
print(l.sum())
`, [`6`]);
assertPrint("dynamic-dispatch", 
`
class List(object):
    def sum(self : List) -> int:
        return 1 // 0
class Empty(List):
    def sum(self : Empty) -> int:
        return 0
class Link(List):
    val : int = 0
    next : List = None
    def sum(self : Link) -> int:
        return self.val + self.next.sum()
    def new(self : Link, val : int, next : List) -> Link:
        self.val = val
        self.next = next
        return self
l : List = None
l = Link().new(5, Link().new(13, Empty()))
print(l.sum())
`,[`18`]);
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
assertPrint("superclass-type-initializing-subclass-object", `
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
		
l : A = None
l = B()
print(l.get_a())
`,[`1`]);
assertPrint("multiple-inheritance-method-access", `
class Pet(object):
    def speak(self : Pet):
        print(0)

class Cat(object):
    def speak(self : Cat):
        print(1)

class Kitten(Pet, Cat):
    a : int = 6

kitten : Kitten = None
kitten = Kitten()
kitten.speak()
`,[`0`]);
assertPrint("multiple-inheritance-field-access", `
class Pet(object):
	y : int = 1
	def speak(self : Pet):
		print(0)

class Cat(object):
	x : int = 0
	def speak(self : Cat):
		print(1)

class Kitten(Pet, Cat):
	z : int = 3

kitten : Kitten = None
kitten = Kitten()
print(kitten.y)
print(kitten.x)
`,[`1`, `0`]);
assertTCFail("dynamic-dispatch-error", `
class Pet(object):
	def speak(self : Pet):
		print(0)

class Cat(Pet):
	def speak(self: Cat):
		print(1)

class Dog(object):
	def speak(self: Dog):
		print(2)


def speak(pet : Pet):
	pet.speak()

dog : Dog = None
dog = Dog()
speak(dog)
`);
assertPrint("inheritance-with-generics", `
L = TypeVar('L')
R = TypeVar('R')

class A():
  a: int = 5
  def __init__(self : A):
    pass

class Pair(Generic[L, R], A):
  left: L = __ZERO__
  right: R = __ZERO__

p1 : Pair[int, int] = None
p1 = Pair()
p1.left = 10
p1.right = 20

print(p1.left)
print(p1.right)
print(p1.a)
`,[`10`, `20`, `5`]);
assertPrint("inheritance-with-for-loops", `
class Range():
	current : int = 0
	min : int = 0
	max : int = 0
	def new(self:Range, min:int, max:int)->Range:
	    self.min = min
	    self.current = min
	    self.max = max
	    return self
	def next(self:Range)->int:
	    c : int = 0
	    c = self.current
	    self.current = self.current + 1
	    return c
	def hasnext(self:Range)->bool:
	    return self.current < self.max
	def reset(self: Range):
		return

class NumberIterator(Range):
	len: int = 0

	def new(self:NumberIterator, len: int)->NumberIterator:
	    self.len = len
	    self.min = 0
	    self.current = 0
	    self.max = len
	    return self



cls:NumberIterator = None
i:int = 0
cls = NumberIterator().new(8)

for i in cls:
	print(i)
	continue 
   	print(i)
`,[`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`]);
assertPrint("multiple-multilevel-field-access", `
class F(object):
  g:int = 9

class A(object):
  a:int = 1
  f:int = 2
      
class B(A, F):
  b:int = 3

class D(object):
  d:int = 4
      
class E(D):
  e:int = 5

class Pet(B):
	y : int = 6
	def speak(self : Pet):
		print(0)

class Cat(E):
	x : int = 7
	def speak(self : Cat):
		print(1)

class Kitten(Pet, Cat):
	z : int = 8

kitten : Kitten = None
kitten = Kitten()
print(kitten.a)
print(kitten.f)
print(kitten.b)
print(kitten.d)
print(kitten.e)
print(kitten.y)
print(kitten.x)
print(kitten.z)
print(kitten.g)
`, ["1","2","3","4","5","6","7","8", "9"]);
assertPrint("multiple3-multilevel-field-access", `
class F(object):
  g:int = 9

class A(object):
  a:int = 1
  f:int = 2
      
class B(A):
  b:int = 3

class D(object):
  d:int = 4
      
class E(D):
  e:int = 5

class Pet(B):
	y : int = 6
	def speak(self : Pet):
		print(0)

class Cat(E):
	x : int = 7
	def speak(self : Cat):
		print(1)

class Kitten(Pet, Cat, F):
	z : int = 8

kitten : Kitten = None
kitten = Kitten()
print(kitten.a)
print(kitten.f)
print(kitten.b)
print(kitten.d)
print(kitten.e)
print(kitten.y)
print(kitten.x)
print(kitten.z)
print(kitten.g)
`, ["1","2","3","4","5","6","7","8", "9"]);
assertPrint("comprehension-class-field-lookup", `
class Range(object):
	min:int=0
	max:int=0
	curr:int=0
	def __init__(self:Range):
			pass
	def new(self:Range,min:int,max:int)->Range:
			self.max=max
			self.min=min
			self.curr=min
			return self
	def hasNext(self:Range)->bool:
			return self.curr<self.max
	def next(self:Range)->int:
			c:int=0
			c=self.curr
			self.curr=self.curr+1
			return c

class A(object):
    x:int=1
class B(A):
    y:int=2
class C(B):
    z:int=3

a:Range=None
i: int = 0
c:C=None
c=C()
a=Range().new(0,2)
[c.y for i in a]
`, ['2','2']);
assertPrint("list-field-with-inheritance", `
class A(object):
  a : int = 1
  def __init__(self: A):
    pass

class B(A):
		b : int = 2
		def __init__(self: B):
			pass

l : B = None 
m : B = None
class_list : [B] = None
l = B()
m = B()
class_list = [l, m]
print(class_list[0].a)
print(class_list[1].b)
`, ['1','2']);
});

