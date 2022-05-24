We have implemented bsic for-loop structure that expects object as an values in[for i in values] with a conditation that the class of the object should have next, hasnext and reset methods with return type of iterator, boolean and none respectively.

Week -7
In the earlier- submitted milestones, we mentioned to work on builtin range class, but post the discussion in the class we implented above functionality.

Week -8 
Test cases to cover the functionality of break, continue in while, for loops are included (single and nested loops). Also, test cases for iterator in for-loop to be a non-integer (boolean) are included.

Design Decisions:
1. As per the comments on ealier pull-request, iterator type is changed to string and using the enviroment type of the iterator is computed. The function to find out the type in type-check.ts and iterator in ast.ts will be extended as when new features are included like tuples, etc.  
2. Every class, which is used as values in the for loop should have reset method whose objective is to reset the current pointer to minimum. This method is called before the loop iteration to ensure the usage of object in multiple parallel loops and nested loops (test cases are presented below).
3. start, body, end labels of while and for loops are appened to the labels of enviroment to use them later for break and continue statements.     
4. Test case 12 is tested in the browser for parser error, as we are not sure if modifications to asserts.test.ts are allowed, hence commented the same test case in forloops.test.ts file as well.

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
  def reset(self:Range) :
    self.current = self.min



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
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
i:int = 0
cls = Range().new(1,3)
for i in cls:
  print(i)

Output: Error: TypeCheck failed (has no method called 'hasnext')

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
   def rest(self:Range) :
     self.current = self.min
 
 
 
 cls:Range = None
 i:int = 0
 cls = Range().new(1,3)
 for i in cls:
   print(i)

 Output: Error: TypeCheck failed (has no method called 'reset')

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
  def has(self:Range)->bool:
    return self.current < self.max
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
i:bool = True
cls = Range().new(1,3)
for i in cls:
  print(i)

Output: Error: TypeCheck failed


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
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
i:int = 0
cls = Range().new(10, 1)
for i in cls:
  print(i)


Output: [""]

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
    def reset(self:Range) :
     self.current = self.min
  
  
  
  cls:Range = None
  i:int = 0
  cls = Range().new(3, 6)
  for i in cls:
    print(i)

Output:[3, 4, 5]

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
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
i:int = 0
cls = Range().new(1, 4)
 
for i in cls:
   print(i)
   i = 10 
   print(i)

Output: 1, 10, 2, 10, 3, 10

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
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
i:int = 0
cls = Range().new(1, 4)
 
for i in cls:
   print(i)
   i = True
   print(i)

Output: Error: TypeCheck error (iterator type changing inside loop)

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
  def reset(self:Range) :
    self.current = self.min



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
 def reset(self:Range) :
    self.current = self.min


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
  def next(self:Range)->int:
    c : int = 0
    c = self.current
    self.current = self.current + 1
    return c
  def hasnext(self:Range)->bool:
    return self.current < self.max
 def reset(self:Range) :
    self.current = self.min

def checkForLoop(n:int):
  c:Range = None
  i:int = 0
  c = Range().new(n,n+5)
  for i in c:
    print(i)
  return

checkForLoop(2)

Output:2, 3, 4, 5, 6

Test case 12:

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
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
i:int = 0
cls = Range().new(1,3)
for 1+2 in cls:
  print(i)

Output: Error: parser error 

Test case 13:

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
  def reset(self:Range) :
    self.current = self.min

i:int = 0
cls: Range = None
cls = Range().new(1,3)

for i in cls:
  print(i)

for i in cls:
  print(i)

Output: 1,2,1,2

Test case 14:

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
  def reset(self:Range) :
    self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 4)
innercls = Range().new(5,7)

for i in cls:
  print(i)
  for j in innercls:
    print(j)

Output: 1, 5, 6, 2, 5, 6, 3, 5 

Test case 15:

Input:
lass Range(object):
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
 def reset(self:Range) :
   self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 3)
innercls = Range().new(5,7)

for i in cls:
 print(i)
 for j in innercls:
   print(j)
   continue
   print(i+1)

Output: 1, 5, 6, 2, 5, 6,

Test case 16:

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
 def reset(self:Range) :
   self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 3)
innercls = Range().new(5,7)

for i in cls:
 print(i)
 for j in innercls:
   print(j)
   break
   print(i+1)

Output: 1, 5, 2, 5

Test case 17:

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
 def reset(self:Range) :
   self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 3)
innercls = Range().new(5,7)

for i in cls:
 print(i)
 break
 for j in innercls:
   print(j) 

Output: 1

Test case 18:

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
 def reset(self:Range) :
   self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 3)
innercls = Range().new(5,7)

for i in cls:
 print(i)
 continue
 for j in innercls:
   print(j)  

Output: 1, 2

Test case 19:

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
 def reset(self:Range) :
   self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 3)
innercls = Range().new(5,7)

for i in cls:
 print(i)
 break
 for j in innercls:
   print(j)  

Output: 1

Test case 20:

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
 def reset(self:Range) :
   self.current = self.min



cls:Range = None
innercls:Range = None
i:int = 0
j:int = 0
cls = Range().new(1, 3)
innercls = Range().new(5,7)

for i in cls:
 print(i)
 for j in innercls:
   print(j-1)
 print(i+1)  

Output: 1, 4, 5, 2, 2, 4, 5, 3 

Test case 21:

Input:

i:int = 0

while(i<10):
 i = i+1
 if(i==5):
  continue
 print(i)

Output: 1, 2, 3, 4, 6, 7, 8, 9, 10 

Test case 22:

Input:

i:int = 0
j:int = 5
while(i<3):
 i = i+1
 print(i)
 while(j >0):
  j = j-1
  if(j==4):
   continue
  print(j)
 j = 5
 

Output: 1, 3, 2, 1, 0, 2, 3, 2, 1, 0, 3, 3, 2, 1, 0

Test case 23:

Input:
i:int = 0
j:int = 5
while(i<3):
 i = i+1
 if(i==1):
  continue
 print(i)
 while(j >0):
  j = j-1
  print(j)
 j = 5 

Output: 2, 4, 3, 2, 1, 0, 3, 4, 3, 2, 1, 0 

Test case 24:

Input:

i:int = 0
j:int = 5
while(i<3):
 i = i+1
 print(i)
 if(i==2):
  break
 while(j >0):
  j = j-1
  print(j)
 j = 5

Output: 1, 4, 3, 2, 1, 0, 2

Test case 25:

Input:
i:int = 0
j:int = 5
while(i<3):
 i = i+1
 print(i)
 while(j >0):
  j = j-1
  if(j==4):
   break
  print(j)
 j = 5

Output: 1, 2, 3

Test case 26:

Input:
def breakInFunction(n:int, b:int)->int:
 i:int = 0
 sum:int = 0
 while(i<n):
  if(i==b):
    break
  sum = sum+i
  i = i+1
 return sum

print(breakInFunction(10,5))

Output: 10

Test case 27:

Input:

def breakInFunction(n:int, b:int)->int:
 i:int = 0
 sum:int = 0
 while(i<n):
  i = i+1
  if(i==b):
    continue
  sum = sum+i 
 return sum

print(breakInFunction(10,5))

Output: 50

Test case 28:

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
 def next(self:Range)->bool:
   c : int = 0
   c = self.current
   self.current = self.current + 1
   return c%2==0
 def hasnext(self:Range)->bool:
   return self.current < self.max
 def reset(self:Range) :
   self.current = self.min

i:bool = True
cls:Range = None
cls = Range().new(1, 5)

for i in cls:
 print(i)
    

Output: False, True, False, True

Test case 29:

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
 def reset(self:Range) :
   self.current = self.min

class BoolRange(object):
 current : int = 0
 min : int = 0
 max : int = 0
 def new(self:BoolRange, min:int, max:int)->BoolRange:
   self.min = min
   self.current = min
   self.max = max
   return self
 def next(self:BoolRange)->bool:
   c : int = 0
   c = self.current
   self.current = self.current + 1
   return c%2==0
 def hasnext(self:BoolRange)->bool:
   return self.current < self.max
 def reset(self:BoolRange) :
   self.current = self.min

def checkMultiLoopFunction(min:int, max:int) ->int:
 j:bool = True
 innerCls :BoolRange = None
 i:int = 0
 sum:int = 0
 cls:Range = None
 cls = Range().new(min,max)
 innerCls = BoolRange().new(min,max)
 for j in innerCls:
  print(j)
  if(j):
   for i in cls:
     print(i)
     sum = sum+i     
 return sum


print(checkMultiLoopFunction(1,6))

Output: False, True, 1, 2, 3, 4, 5, False, True, 1, 2, 3, 4, 5, False, 30