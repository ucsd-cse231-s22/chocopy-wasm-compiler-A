import { assertPrint, assertRunTimeFail, assertTCFail, assertRepr } from './browser.test';

describe("if-expr tests", () => {
  //Super Simple tests
  assertPrint("Simple True", `print(True if True else False)`, [`True`]);
  assertPrint("Simple False", `print(True if False else False)`, [`False`]);
  //Tests with nested if-exprs
  assertPrint("Nesting",`print(0 if False else 2 if False else 3 if False else 4 + 0 if False else 2 if True else 3 if False else 4)`, [`2`])
  assertPrint("Nesting2",`print((0 if False else 2 if False else 3 if False else 4) + (0 if False else 2 if True else 3 if False else 4))`,[`6`])
  //Testing type checker
  assertTCFail("Different 'return's",`print(True if False else 10)`)
  assertTCFail("Bad conditional",`print(True if 55 else 10)`)
  assertTCFail("assign to wrong type",
`x : bool = True
 x = 55 if False else 10`)
 //Test it works in a method
 assertPrint("In a Class method",
`
class Foo(object):
  x: int = 10
  def f(self: Foo, q: int) -> bool:
    return True if q > self.x else False
foobar: Foo = None
foobar = Foo()
print(foobar.f(0))
print(foobar.f(20))
`,["False","True"])
assertPrint("In a Class assign",
`
class Foo(object):
  x: int = 0
  def f(self: Foo, q: int):
    print(1)
foobar: Foo = None
foobar = Foo()
print(foobar.x)
foobar.x = 2 if True else 1
print(foobar.x)
foobar.x = 2 if False else 1
print(foobar.x)`,["0","2","1"])
//Test it works in arguments
assertPrint("Functions in if-expr",
`def f(x: int) -> int:
  1+1
  1+1
  return x + 10
def q(x: int) -> int:
  return x - 10
def z() -> bool:
  return True
l : int = 0
l = f(10) if z() else q(10)
print(l)`,["20"])
assertPrint("In method call",
`class Foo(object):
  def f(self: Foo, q: int):
    print(1)
foobar: Foo = None
foobar = Foo()
foobar.f(1 if True else 0)
`,["1"])
//While Loops
assertPrint("If Expr in while loop body",`
def printRetNone(x: int):
  print(x)
i: int = 0
while i<11:
  printRetNone(i) if i % 2 == 0 else None
  i=i+1
`,["0","2","4","6","8","10"])
assertPrint("If Expr in while loop cond",`
def printRetNone(x: int):
  print(x)
i: int = 0
while True if i<11 else False:
  printRetNone(i) if i % 2 == 0 else None
  i=i+1
`,["0","2","4","6","8","10"])
//If expr in IF!!!!
assertPrint("If expr in if cond",`x: int = 0
if False if x>10 else True:
  print(True)
else:
  print(False)
`,["True"])
assertPrint("if expr in if body",`if True:
  print(True if True else False)
else:
  print(10)
`,["True"])
//Test lookup
assertPrint("if expr with id",`
a: int = 10
b: int = 20
c: bool = True
print(a if c else b)
print(a if not c else b)`,["10","20"])

//TODO (Michael Maddy, Closures): Test inheritence when it is added 
});
