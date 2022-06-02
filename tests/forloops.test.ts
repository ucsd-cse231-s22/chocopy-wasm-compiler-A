// import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
// import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

// describe("FOR LOOPS tests", () => {
//   // 1
//   assertTCFail("for-loop no next", `class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next1(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min


// cls:Range = None
// i:int = 0
// cls = Range().new(1,3)
// for i in cls:
//   print(i)`);
//   //2
//   assertTCFail("for-loop no hasnext", `class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def has(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min



// cls:Range = None
// i:int = 0
// cls = Range().new(1,3)
// for i in cls:
//   print(i)`)

// //3
//    assertTCFail("for-loop no reset", `class Range(object):
//    current : int = 0
//    min : int = 0
//    max : int = 0
//    def new(self:Range, min:int, max:int)->Range:
//      self.min = min
//      self.current = min
//      self.max = max
//      return self
//    def next(self:Range)->int:
//      c : int = 0
//      c = self.current
//      self.current = self.current + 1
//      return c
//    def has(self:Range)->bool:
//      return self.current < self.max
//    def rest(self:Range) :
//      self.current = self.min
 
 
 
//  cls:Range = None
//  i:int = 0
//  cls = Range().new(1,3)
//  for i in cls:
//    print(i)`)

//   //4
//   assertTCFail("for-loop different iterator type", `class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def has(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min



// cls:Range = None
// i:bool = True
// cls = Range().new(1,3)
// for i in cls:
//   print(i)`)

//   // 5
//   assertPrint("for-loop no iterations", `class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min



// cls:Range = None
// i:int = 0
// cls = Range().new(10, 1)
// for i in cls:
//   print(i)
//  `, [ "" ]);
//   // 6
//   assertPrint(
//     "for-loop entersloop positive values",
//     `
//     class Range(object):
//     current : int = 0
//     min : int = 0
//     max : int = 0
//     def new(self:Range, min:int, max:int)->Range:
//       self.min = min
//       self.current = min
//       self.max = max
//       return self
//     def next(self:Range)->int:
//       c : int = 0
//       c = self.current
//       self.current = self.current + 1
//       return c
//     def hasnext(self:Range)->bool:
//       return self.current < self.max
//     def reset(self:Range) :
//       self.current = self.min
  
  
  
//   cls:Range = None
//   i:int = 0
//   cls = Range().new(3, 6)
//   for i in cls:
//     print(i))`,
//     [`3`, `4`, `5`]
//   );
//   // 7
//   assertPrint("for-loop chainging iterator inside loop", `
//   class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min


// cls:Range = None
// i:int = 0
// cls = Range().new(1, 4)
 
// for i in cls:
//    print(i)
//    i = 10 
//    print(i)`, [`1`, 
//    `10`,
//    `2`,
//    `10`,
//    `3`,
//    `10`]);
//   // 8
//   assertTCFail("for-loop changing iterator type inside loop", `
//   class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min


// cls:Range = None
// i:int = 0
// cls = Range().new(1, 4)
 
// for i in cls:
//    print(i)
//    i = True
//    print(i)` );

//    // 9
//   assertPrint("for-loop continue", `
//   class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min



// cls:Range = None
// i:int = 0
// cls = Range().new(1, 4)
 
// for i in cls:
//    print(i)
//    continue 
//    print(i)
   
// i = 20
// print(i)`, [`1`, 
//    `2`,
//    `3`,
//    `20`]);

//  // 10
//  assertPrint("for-loop break", `
//  class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// i:int = 0
// cls = Range().new(1, 4)

// for i in cls:
//   print(i)
//   break 
//   print(i)
  
// i = 20
// print(i)`, [`1`, 
//   `20`]);
//  //11
//   assertPrint("for-loop function", `
//   class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min

// def checkForLoop(n:int):
//   c:Range = None
//   i:int = 0
//   c = Range().new(n,n+5)
//   for i in c:
//     print(i)
//   return

// checkForLoop(2)
// `, [`2`, 
//    `3`,
//   `4`,
//    `5`,
//   `6`]);
//   //12
// //   assertPrint("for-loop non id iterator", `class Range(object):
// //   current : int = 0
// //   min : int = 0
// //   max : int = 0
// //   def new(self:Range, min:int, max:int)->Range:
// //     self.min = min
// //     self.current = min
// //     self.max = max
// //     return self
// //   def next1(self:Range)->int:
// //     c : int = 0
// //     c = self.current
// //     self.current = self.current + 1
// //     return c
// //   def hasnext(self:Range)->bool:
// //     return self.current < self.max
// //   def reset(self:Range) :
// //     self.current = self.min



// // cls:Range = None
// // i:int = 0
// // cls = Range().new(1,3)
// // for 1+2 in cls:
// //   print(i)`,[`Iterator must be a variable`])}),
// //13
// assertPrint("for-loop multiple-loops for same object", `
//   class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min

// i:int = 0
// cls: Range = None
// cls = Range().new(1,3)

// for i in cls:
//   print(i)

// for i in cls:
//   print(i)
// `, [`1`, 
//    `2`,
//   `1`,
//    `2`]);
// //14
// assertPrint("for-loop nested-for-loops", `
// class Range(object):
//   current : int = 0
//   min : int = 0
//   max : int = 0
//   def new(self:Range, min:int, max:int)->Range:
//     self.min = min
//     self.current = min
//     self.max = max
//     return self
//   def next(self:Range)->int:
//     c : int = 0
//     c = self.current
//     self.current = self.current + 1
//     return c
//   def hasnext(self:Range)->bool:
//     return self.current < self.max
//   def reset(self:Range) :
//     self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 4)
// innercls = Range().new(5,7)

// for i in cls:
//   print(i)
//   for j in innercls:
//     print(j)
// `, [`1`, `5`,`6`,`2`,`5`,`6`,`3`,`5`,`6`]);
// //15
// assertPrint("for-loop continue-inner loop", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 3)
// innercls = Range().new(5,7)

// for i in cls:
//  print(i)
//  for j in innercls:
//    print(j)
//    continue
//    print(i+1)
// `, [`1`, `5`,`6`,`2`,`5`,`6`]);
// //16
// assertPrint("for-loop break-inner loop", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 3)
// innercls = Range().new(5,7)

// for i in cls:
//  print(i)
//  for j in innercls:
//    print(j)
//    break
//    print(i+1)
// `, [`1`, `5`,`2`,`5`]);
// //17
// assertPrint("for-loop break-outer loop", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 3)
// innercls = Range().new(5,7)

// for i in cls:
//  print(i)
//  break
//  for j in innercls:
//    print(j)  
// `, [`1`]);

// //18
// assertPrint("for-loop continue-outer loop", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 3)
// innercls = Range().new(5,7)

// for i in cls:
//  print(i)
//  continue
//  for j in innercls:
//    print(j)  
// `, [`1`,`2`]);

// //19
// assertPrint("for-loop break-outer loop", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 3)
// innercls = Range().new(5,7)

// for i in cls:
//  print(i)
//  break
//  for j in innercls:
//    print(j)  
// `, [`1`]);

// //20
// assertPrint("for-loop statements-post-inner-loop", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min



// cls:Range = None
// innercls:Range = None
// i:int = 0
// j:int = 0
// cls = Range().new(1, 3)
// innercls = Range().new(5,7)

// for i in cls:
//  print(i)
//  for j in innercls:
//    print(j-1)
//  print(i+1)  
// `, [`1`,`4`,`5`,`2`,`2`,`4`,`5`,`3`]);

// //21
// assertPrint("for-loop continue-whileloop", `
// i:int = 0

// while(i<10):
//  i = i+1
//  if(i==5):
//   continue
//  print(i)
 
// `, [`1`,`2`,`3`,`4`,`6`,`7`,`8`,`9`,`10`]);

// //22
// assertPrint("for-loop continue-nested-inner-whileloop", `
// i:int = 0
// j:int = 5
// while(i<3):
//  i = i+1
//  print(i)
//  while(j >0):
//   j = j-1
//   if(j==4):
//    continue
//   print(j)
//  j = 5
 
// `, [`1`,`3`,`2`,`1`,`0`, `2`,`3`,`2`,`1`,`0`,`3`,`3`,`2`,`1`,`0`]);

// //23
// assertPrint("for-loop continue-nested-outer-whileloop", `
// i:int = 0
// j:int = 5
// while(i<3):
//  i = i+1
//  if(i==1):
//   continue
//  print(i)
//  while(j >0):
//   j = j-1
//   print(j)
//  j = 5 
// `, [`2`,`4`,`3`,`2`,`1`,`0`, `3`,`4`,`3`,`2`,`1`,`0`]);

// //24
// assertPrint("for-loop break-nested-outer-whileloop", `
// i:int = 0
// j:int = 5
// while(i<3):
//  i = i+1
//  print(i)
//  if(i==2):
//   break
//  while(j >0):
//   j = j-1
//   print(j)
//  j = 5
 
// `, [`1`,`4`,`3`,`2`,`1`,`0`,`2`]);

// //25
// assertPrint("for-loop break-nested-inner-whileloop", `
// i:int = 0
// j:int = 5
// while(i<3):
//  i = i+1
//  print(i)
//  while(j >0):
//   j = j-1
//   if(j==4):
//    break
//   print(j)
//  j = 5
//  `, [`1`,`2`,`3`]);

//  //26
// assertPrint("for-loop break-function-whileloop", `
// def breakInFunction(n:int, b:int)->int:
//  i:int = 0
//  sum:int = 0
//  while(i<n):
//   if(i==b):
//     break
//   sum = sum+i
//   i = i+1
//  return sum

// print(breakInFunction(10,5))
//  `, [`10`]);

//   //27
// assertPrint("for-loop continue-function-whileloop", `
// def breakInFunction(n:int, b:int)->int:
//  i:int = 0
//  sum:int = 0
//  while(i<n):
//   i = i+1
//   if(i==b):
//     continue
//   sum = sum+i 
//  return sum

// print(breakInFunction(10,5))
//  `, [`50`]);

//  //28
//  assertPrint("for-loop binary-iterator", `
//  class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->bool:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c%2==0
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min

// i:bool = True
// cls:Range = None
// cls = Range().new(1, 5)

// for i in cls:
//  print(i)
    
// `, [`False`,`True`,`False`,`True`]);

// //29
// assertPrint("for-loop function-nestedloops", `
// class Range(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:Range, min:int, max:int)->Range:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:Range)->int:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c
//  def hasnext(self:Range)->bool:
//    return self.current < self.max
//  def reset(self:Range) :
//    self.current = self.min

// class BoolRange(object):
//  current : int = 0
//  min : int = 0
//  max : int = 0
//  def new(self:BoolRange, min:int, max:int)->BoolRange:
//    self.min = min
//    self.current = min
//    self.max = max
//    return self
//  def next(self:BoolRange)->bool:
//    c : int = 0
//    c = self.current
//    self.current = self.current + 1
//    return c%2==0
//  def hasnext(self:BoolRange)->bool:
//    return self.current < self.max
//  def reset(self:BoolRange) :
//    self.current = self.min

// def checkMultiLoopFunction(min:int, max:int) ->int:
//  j:bool = True
//  innerCls :BoolRange = None
//  i:int = 0
//  sum:int = 0
//  cls:Range = None
//  cls = Range().new(min,max)
//  innerCls = BoolRange().new(min,max)
//  for j in innerCls:
//   print(j)
//   if(j):
//    for i in cls:
//      print(i)
//      sum = sum+i     
//  return sum


// print(checkMultiLoopFunction(1,6))
   
// `, [`False`,`True`,`1`,`2`,`3`,`4`,`5`,`False`,`True`, `1`,`2`,`3`,`4`,`5`,`False`,`30`]);

// assertPrint("generic for loop",
// `
// T = TypeVar("T")

// class Iter2(Generic[T]):
//   field1 : T = __ZERO__
//   field2 : T = __ZERO__
//   count : int = 0
//   def __init__(self : Iter2[T]):
//     pass
//   def new(self : Iter2[T], f1 : T, f2 : T) -> Iter2[T]:
//     self.field1 = f1
//     self.field2 = f2
//     return self
//   def hasnext(self : Iter2[T]) -> bool:
//     return self.count < 2
//   def next(self : Iter2[T]) -> T:
//     if self.count == 0:
//       self.count = self.count + 1
//       return self.field1
//     if self.count == 1:
//       self.count = self.count + 1
//       return self.field2
//     return self.field1
//   def reset(self : Iter2[T]):
//     self.count = 0

// i:bool = False
// cls: Iter2[bool] = None
// cls = Iter2()

// cls = cls.new(True, False)

// for i in cls:
//   print(i)

// None`,
// [`True`,`False`]
// );




// });