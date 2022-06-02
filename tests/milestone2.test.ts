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

});
