import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Nested Functions tests", () => {

// 1 - Call nested type check
assertTC("call-nested-tc",`
def g() -> int:
  def f() -> int:
    return 3
  return f()

g()
`, NUM)

// 2 - Call a nexted function
assertPrint("call-nested-func",`
def g() -> int:
  def f() -> int:
    return 3
  return f()

print(g())
`, [`3`])

// 3 - Multiple nested functions
assertPrint("multi-nested-func",`
def g() -> int:
  def f() -> int:
    return 3
  def h():
    print("Hello")
  def p() -> bool:
    print(True)
    return True
  p()
  h()
  return f()

print(g())
`, [`True`, `Hello`, `3`])

// 4 - Nested nested functions
assertPrint("nested-nested-func",`
def g() -> int:
  def h() -> bool:
    def p() -> bool:
      print(True)
      return True
    print("Hello")
    return p()
  h()
  return 5

print(g())
`, [`Hello`, `True`, `5`])

// 5 - Type Check for Nonlocal
assertTC("tc-nonlocal",`
def g(x:int) -> int:
  def f() -> int:
    nonlocal x
    return x
  return f()

g(5)
`, NUM)

// 6 - Type Check Fail without nonlocal
assertTCFail("tc-fail-nonlocal",`
def g(x:int) -> int:
  def f() -> int:
    return x
  return f()

g(5)
`)

// 7 - Duplicate name with nonlocal
assertTC("dup-var-nonlocal",`
x:int = 4
def g(x:int) -> int:
  def f() -> int:
    nonlocal x
    return x
  return f()

g(5)
`, NUM)

// 8 - Nested nested functions with global
assertPrint("nested-nested-func-global",`
x:int = 7
y:bool = False
def g(x:int, y:bool) -> int:
  def f() -> int:
    return x
  if y:
    return x
  else:
    return f()

print(g(5, y))
print(g(5, True))
`, [`7`, `5`])

// 9 - Nested functions call with nonlocal
assertPrint("nested-func-call-nonlocal",`
def g(x:int) -> int:
  def f() -> int:
    nonlocal x
    print(x)
    return x
  return f()

print(g(4))
`, [`4`, `4`])

// 10 - Nested functions call with many nonlocal
assertPrint("nested-func-call-many-nonlocal",`
def g(x:int) -> int:
  y:int = 6
  def f() -> int:
    nonlocal x
    nonlocal y
    print(x)
    print(y)
    return x
  return f()

print(g(4))
`, [`4`, `6`, `4`])

// 11 - Nested method call
assertPrint("nested-func-method-call",`
class B(object):
  x:int = 4
  def printB(self : B, y:int):
    def printB1():
      nonlocal y
      print(y)
    printB1()
    print(self.x)

b:B = None
b = B()
b.printB(12)
`, [`12`, `4`])

});
