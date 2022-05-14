import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("FOR LOOPS tests", () => {
  // 1
  assertTCFail("for-loop no next", `class Range(object):
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
  print(i)`);
  //2
  assertTCFail("for-loop no hasnext", `class Range(object):
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
  print(i)`)

  //3
  assertTCFail("for-loop different iterator type", `class Range(object):
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
  print(i)`)

  // 4
  assertPrint("for-loop no iterations", `class Range(object):
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
 `, [ "" ]);
  // 5
  assertPrint(
    "for-loop entersloop positive values",
    `
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
    print(i))`,
    [`3`, `4`, `5`]
  );
  // 6
  assertPrint("for-loop chainging iterator inside loop", `
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
   print(i)`, [`1`, 
   `10`,
   `2`,
   `10`,
   `3`,
   `10`]);
  // 7
  assertTCFail("for-loop changing iterator type inside loop", `
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
   print(i)` );

   // 8
  assertPrint("for-loop continue", `
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
print(i)`, [`1`, 
   `2`,
   `3`,
   `20`]);

 // 9
 assertPrint("for-loop break", `
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
print(i)`, [`1`, 
  `20`]);
 //10
  assertPrint("for-loop function", `
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
`, [`2`, 
   `3`,
  `4`,
   `5`,
  `6`]);
  //11
  assertTCFail("for-loop non id iterator", `class Range(object):
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
  print(i)`);
});
