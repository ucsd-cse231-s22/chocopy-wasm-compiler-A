import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";

describe("Milestone-2 tests", () => {

assertPrint(`for-loop-in-function`, 
`def f():
  x:int = 0
  y:str = ""
  for x in [1,2,3]:
    print(x)
  print(x)

  for y in "ABC":
    print(y)
  print(y)
f()`, ['1', '2', '3', '3', 'A', 'B', 'C', 'C']);

assertPrint(`inheritance-parent-init`, 
`class A(object):
  x:int = 0
  def __init__(self:A):
    self.x = 100

class B(A):
  y:int = 0

b:B = None
b = B()
print(b.x)`, [`100`]);

assertPrint(`inheritance-parent-init-not-called`, 
`class A(object):
  x:int = 0
  def __init__(self:A):
    self.x = 100

class B(A):
  y:int = 0
  def __init__(self:B):
    self.x = 10

b:B = None
b = B()
print(b.x)`, [`10`]);

assertPrint(`comprehensive-test-binary-search`, 
`def binary_search(a:[int], k:int)->bool:
  def get_mid(l:int, r:int)->int:
    return (l+r)//2
  l:int = 0
  r:int = 0
  mid:int = 0
  l = 0
  r = len(a)-1
  while l <= r:
      mid = get_mid(l, r)
      if (a[mid] == k):
          return True
      elif a[mid] > k:
          r = mid - 1
      else:
          l = mid + 1
  return False

a:[int] = None
a = [1,2,3,10,12,15]
print(binary_search(a,15))
print(binary_search(a,10))
print(binary_search(a,0))
print(binary_search(a,11))
`, [`True`, `True`, `False`, `False`]);

assertTCFail(`inheritance-different-signature`, 
`class A(object):
  val:int = 0
  def getVal(self:A, x:int)->int:
      return self.val + x

class B(A):
  y:int = 0
  def getVal(self:B, x:bool)->int:
      return self.val + self.y
`);

assertTCFail(`tc-operands`, 
`class A(object):
  val:int = 0
  def getVal(self:A, x:int)->int:
      return self.val + x

class B(A):
  y:int = 0
  def getVal(self:B, x:int)->int:
      return (not self.val) + x
`);

 // 1
 assertPrint("virtual-function-basic", `class A(object):
 def test(self:A)->int:
     return 1//0

class B(A):
 def test(self:B)->int:
     return 1


a:A = None
a = B()
print(a.test())
`, [`1`]);
 // 2
 assertPrint("virtual-function-complex", `class Vehicle(object):
 basePrice:int = 100
 def getBasePrice(self:Vehicle)->int:
     return self.basePrice
 def getPrice(self:Vehicle, dist:int)->int:
     return 1//0

class Aeroplane(Vehicle):
 pricePerDistance:int = 20
 ticket_type:str = "economy"
 def getPrice(self:Aeroplane, dist:int)->int:
     return self.pricePerDistance*dist + self.getBasePrice() + self.getClassFare()
 
 def getClassFare(self:Aeroplane)->int:
     if self.ticket_type == "economy":
         return 10
     else:
         return 100

class Bus(Vehicle):
 pricePerDistance:int = 5
 def getPrice(self:Bus, dist:int)->int:
     return self.pricePerDistance*dist + self.getBasePrice()


vehicles:[Vehicle] = None
vehicle:Vehicle = None
vehicles = [Aeroplane(), Bus()]
for vehicle in vehicles:
 print(vehicle.getPrice(20))
`, [`510`, `105`]);

assertTCFail(`inheritance-list-assign-fail`, 
`class A(object):
 x:int = 0

class B(A):
 y:int = 0

class C(B):
 z:int = 0

b:[B] = None
b = [A(), B(), C()]`);

assertPrint(`multi-assign-basic`, `a:int = 0
b:int = 1
b = a = 100
print(a)
print(b)`, [`100`, `100`]);

assertPrint(`multi-assign-complex`, 
`class A(object):
 temp:str = "123"

a:A = None
b:str = "abc"
a = A()
b = a.temp = "STRING"
print(b)
print(a.temp)`, [`STRING`, `STRING`]);

assertPrint(`comprehensive-test`, 
`def merge(a:[int], l:int, r:int):
 copy:[int] = None
 idx:int = 0
 i:int = 0
 j:int = 0
 i = l
 j = (l+r)//2 + 1
 copy = []
 while i <= (l+r)//2 and j <= r:
     if a[i] <= a[j]:
         copy = copy + [a[i]]
         i = i + 1
     else:
         copy = copy + [a[j]]
         j = j + 1
 while i <= (l+r)//2:
     copy = copy + [a[i]]
     i = i + 1

 while j <= r:
     copy = copy + [a[j]]
     j = j + 1
 idx = l
 while idx <= r:
     a[idx] = copy[idx]
     idx = idx + 1

def mergesort(a:[int], l:int, r:int):
 temp1:int = 0
 temp2:int = 0
 copy:[int] = None
 if (l == r):
     return
 if (l + 1 == r):
     if a[l] <= a[r]:
       return
     temp1 = a[l]
     temp2 = a[r]
     a[l] = min(temp1, temp2)
     a[r] = max(temp1, temp2)
     return
 mergesort(a,l,(l+r)//2)
 mergesort(a,(l+r)//2+1,r)
 merge(a,l,r)

a:[int] = None
x:int = 0
a = [213,21,2,1]
mergesort(a,0,len(a)-1)
for x in a:
 print(x)`, [`1`, `2`, `21`, `213`]);

});
