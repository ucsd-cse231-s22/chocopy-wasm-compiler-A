import { assertPrint, assertRunTimeFail, assertTCFail, assertRepr } from './browser.test';
  
  describe("Closure tests", () => {
    assertPrint(
      "Nested Function Simple",
      `
def f(x: int) -> int:
    def g(y: int) -> int:
        return y 
    return x + g(4)
print(f(2))`,
      ["6"]
    );
  
  //   assertPrint(
  //     "Nonlocal Design doc #1",
  //     `def f(x: int):
  //   def g():
  //     nonlocal x
  //     x = x + 1
  //     print(x)
  //   g()
  //   g()
  // f(5)`,
  //     ["6", "7"]
  //   );
  
    assertPrint(
      "Assign a function to var and call - Design doc #6",
      `
def g(y: int) -> int:
    return y
x : Callable[[int], int] = None
x = g
print(x(2))
  `,
      ["2"]
    );
  
    assertPrint(
      "Multiple args",
      `
def g(y: int, z: int) -> int:
    return y + z
x : Callable[[int, int], int] = None
x = g
print(x(2, 2))
`,
      ["4"]
    );
  
    assertPrint(
      "Return a function and call it",
      `def f() -> Callable[[int], int]:
    def g(y: int) -> int:
      return y
    return g
  x : Callable[[int], int] = None
  x = f()
  print(x(2))
  `,
      ["2"]
    );
  
  //   assertPrint(
  //     "Global refrence - Design doc #10",
  //     `a: int = 4
  // def f():
  //   def g():
  //     print(a + 1)
  //   print(a)
  //   return g
  // f()()`,
  //     ["4", "5"]
  //   );
  
    assertPrint(
      "is check",
      `
def g(y: int) -> int:
    return y
x : Callable[[int], int] = None
y : Callable[[int], int] = None
x = g
y = g
print(x is y)`,
      ["True"]
    );
  
    assertPrint(
      "is check",
      `
def g(y: int) -> int:
    return y
x : Callable[[int], int] = None
y : Callable[[int], int] = None
x = g
y = mklambda(Callable[[int], int], lambda a: a+2)
print(x is y)`,
      ["False"]
    );
  
  //   assertPrint(
  //     "Currying - Design doc #5",
  //     `add: Callable[[int], Callable[[int], int]] = None
  // add_5: Callable[[int], int] = None
  // add = mklambda(
  //   Callable[[int], Callable[[int], int]],
  //   lambda a: mklambda(
  //     Callable[[int], int],
  //     lambda b: a + b
  //   )
  // )
  // add_5 = add(5)
  // print(add_5(6))`,
  //     ["11"]
  //   );
        
  
    assertPrint(
      "Lambda as argument - Design doc #2",
      `
def apply(func: Callable[[int], bool], arg: int) -> bool:
    return func(arg)
isEven: Callable[[int], bool] = None
isEven = mklambda(
Callable[[int], bool],
lambda num: num % 2 == 0
)
print(apply(isEven, 9))`,
      ["False"]
    );
  
    assertPrint(
      "lambda No arguments, none - Design doc #9",
      `
noop: Callable[[], None] = None
    noop = mklambda(
    Callable[[], None],
    lambda: None
  )
    print(noop() is None)`,
      ["True"]
    );
  
    assertPrint(
      "Reassign callable - Design doc #7",
      `
def add(a: int, b: int) -> int:
    return a + b
add_ref: Callable[[int, int], int] = None
add_ref = add
print(add_ref(5, 8))
add_ref = mklambda(
Callable[[int, int], int],
lambda a, b: a + b + 1
)
print(add_ref(5, 8))`,
      ["13", "14"]
    );
  
    // assertPrint(
    //   "Loop in function with call in body",
    //   `class Range(object):
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
     
    //  def foreach(r : Range, f : Callable[[int], int]):
    //    i : int = 0
    //    for i in r:
    //      print(f(i))
     
    //  n : int = 0
         
    //  def add_n(x : int) -> int:
    //    return x + n
    //  def double(x : int) -> int:
    //    return x * 2
    //  n = 99
     
    //  foreach(Range().new(2, 7), add_n)
    //  foreach(Range().new(2, 7), double)`,[
    //    "101",
    //    "102",
    //    "103",
    //    "104",
    //    "105",
    //    "4",
    //    "6",
    //    "8",
    //    "10",
    //    "12"
    //  ]
    // )
  
  //   assertPrint(
  //     "Fixed-point Combinator - Design doc #11",
  //     `def fix(f: Callable[[Callable[[int], int]], Callable[[int], int]]) -> Callable[[int], int]:
  //   def f1(x: int) -> int:
  //     return f(fix(f))(x)
  //   return f1
  // def fact_to_fix(rec: Callable[[int], int]) -> Callable[[int], int]:
  //   def fact(x: int) -> int:
  //     return 1 if x == 0 else rec(x - 1) * x
  //   return fact
  // fact = fix(fact_to_fix)
  // print(fact(5))`,
  //     ["120"]
  //   );
  
    //Type checking
    assertTCFail(
      "Assign function to var of wrong type",
      `
def g(y: int) -> int:
    return y
x : Callable[[int, int], int] = None
x = g
print(x(2))
  `
    );
  
    assertTCFail(
      "Wrong type in function call",
      `
def g(y: int, z: int) -> int:
    return y + z
x : Callable[[int, int], int] = None
x = g
print(x(2, True))
  `
    );
  
    assertTCFail(
      "Wrong return type",
  `
def g(y: int, z: int) -> int:
    return y + z
x : Callable[[int, int], int] = None
q: bool = False
x = g
q = x(2, 2)
  `
    );
  
    //This should already be checked, but just in case.
    assertTCFail(
      "Function returns wrong type",
      `
def g(y: int) -> int:
    return True
x : Callable[[int], int] = None
x = g
print(x(2))
  `
    );
  
    //TC Lambdas
    assertTCFail(
      "TC Error in lambda - Design doc #3",
      `
isEven: Callable[[int], bool] = None
isEven = mklambda(
Callable[[int], bool],
lambda num: num + None == 0
)`
    );
  
    assertTCFail(
      "TC Error on assign - Design doc #4",
      `
isEven: Callable[[int], bool] = None
isEven = mklambda(
Callable[[int], int],
lambda num: num
)`
    );
   });
  