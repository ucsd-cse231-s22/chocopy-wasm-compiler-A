We have implemented bsic for-loop structure that expects object as an values in[for i in values] with a conditation that the class of the object should have next and hasnext methods with return type of iterator and boolean respectively. 

In the earlier- submitted milestones, we mentioned to work on builtin range class, but post the discussion in the class we implented above functionality.

Below are the test cases we tried for the above-mentioned functionality. 

Test case 1:

Input:class Range(object):
  current : int = 0
  min : int = 0
  max : int = 0
  def new(self:Range, min:int, max:int)->Range:
    self.min = min
    self.current = min
    self.max = max
    return self
  def next1(self:Range)->int:
    c : int = 0
    c = self.current
    self.current = self.current + 1
    return c
  def hasnext(self:Range)->bool:
    return self.current < self.max




cls:Range = None
i:int = 0
cls = Range().new(1,3)
for i in cls:
  print(i)

Output: Error: TypeCheck failed (has no method called 'next1')


Test case 2:

Input:
class Range(object):
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
  def has(self:Range)->bool:
    return self.current < self.max




cls:Range = None
i:int = 0
cls = Range().new(1,3)
for i in cls:
  print(i)

Output: Error: TypeCheck failed (has no method called 'has')

Test case 3:

Input:
class Range(object):
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
  def has(self:Range)->bool:
    return self.current < self.max




cls:Range = None
i:bool = True
cls = Range().new(1,3)
for i in cls:
  print(i)

Output: Error: TypeCheck failed

Test case 4:

Input:
class Range(object):
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




cls:Range = None
i:int = 0
cls = Range().new(10, 1)
for i in cls:
  print(i)


Output: [""]

Test case 5:

Input:
class Range(object):
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
  
  
  
  
  cls:Range = None
  i:int = 0
  cls = Range().new(3, 6)
  for i in cls:
    print(i)

Output:[3, 4, 5]

Test case 6:

Input:
class Range(object):
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




cls:Range = None
i:int = 0
cls = Range().new(1, 4)
 
for i in cls:
   print(i)
   i = 10 
   print(i)

Output: 1, 10, 2, 10, 3, 10

Test case 7:

Input:
class Range(object):
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




cls:Range = None
i:int = 0
cls = Range().new(1, 4)
 
for i in cls:
   print(i)
   i = True
   print(i)

Output: Error: TypeCheck error (iterator type changing inside loop)

Test case 8:

Input:
class Range(object):
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




cls:Range = None
i:int = 0
cls = Range().new(1, 4)
 
for i in cls:
   print(i)
   continue 
   print(i)
   
i = 20
print(i)

Output: 1, 2, 3, 20

Test case 9:

Input:
class Range(object):
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




cls:Range = None
i:int = 0
cls = Range().new(1, 4)

for i in cls:
  print(i)
  break 
  print(i)
  
i = 20
print(i)

Output:1, 20

Test case 10:

Input:
class Range(object):
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
 
def checkForLoop(n:int):
  c:Range = None
  i:int = 0
  c = Range().new(n,n+5)
  for i in c:
    print(i)
  return

checkForLoop(2)

Output:2, 3, 4, 5, 6

Test case 11:

Input:
class Range(object):
  current : int = 0
  min : int = 0
  max : int = 0
  def new(self:Range, min:int, max:int)->Range:
    self.min = min
    self.current = min
    self.max = max
    return self
  def next1(self:Range)->int:
    c : int = 0
    c = self.current
    self.current = self.current + 1
    return c
  def hasnext(self:Range)->bool:
    return self.current < self.max




cls:Range = None
i:int = 0
cls = Range().new(1,3)
for 1+2 in cls:
  print(i)

Output: Error: TypeCheck 
