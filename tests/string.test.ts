import { assert } from "console";
import { STRING } from "../utils";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("String tests", () => {

  assertPrint("Print-String",`
  print("abcd")`,['abcd'])

  assertPrint("Print-String-Fun",`
  class C(object):
    x:str = None
    def new(self:C)->C:
        self.x = "abc"
        return self
  c: C = None
  c = C().new()
  print(c.x)
  `,['abc'])

  assertPrint("Print-String-Class",`
  x:str = None
  def test(x:str)->str:
      return x
  x = "abcd"
  print(test(x))`,['abcd'])  

  assertTC("String-In-Fun",`
  def test(x:str)->str:
    return x
  x:str = None
  x = "abcd"
  test(x)
  `,STRING)

  assertTC("String-TC",`"abcd"`,STRING);

  assertTC("String-In-Fun",`
  def test(x:str)->str:
      return x
  test("abcd")
  `,STRING)

  assertTC("String-In-Class-TC",`
  class C(object):
    x:str = None
    def new(self:C)->C:
        self.x = "abc"
        return self
  c: C = None
  c = C().new()
  c.x
  `,STRING)

  assertTCFail("String-Int",`
  x:str = None
  x = 1
  `);

  assertTCFail("String-Int-In-Fun",`
  def test(str:x)->str:
    x = 1
    return x
  test("abcd")  
  `);

  assertTCFail("String-In-Class-TC",`
  class C(object):
    x:str = None
    def new(self:C)->C:
        self.x = "abc"
        return self
  c: C = None
  c = C().new()
  c.x = 1
  `)

  assertPrint("String-Equals-True",`
  print("abcd" == "abcd")
  `,['True'])

  assertPrint("String-Equals-True-In-Fun",`
  def test()->bool:
      return "abcd" == "abcd"
  print(test())
  `,['True'])

  assertPrint("String-Equals-False-1",`
  x:str = None
  y:str = None
  x = "abcd"
  y = "bcde"
  print(x == y)
  `,['False'])
  //3
  assertPrint("String-Equals-False-2",`
  print("abcd" == "bcde")
  `,['False'])

  assertPrint("String-Euals-False-In-Fun",`
  def test(x:str,y:str)->bool:
    return x == y
  print(test("abcd","bcde")) 
  `,['False'])

  assertPrint("String-Equals-False-In-Class",`
  class C(object):
    x:str = None
    def new(self:C)->C:
      self.x = "abc"
      return self
    def compare(self:C, x:str)->bool:
      return self.x == x
  c: C = None
  c = C().new()
  print(c.compare("bcd"))
  `,['False'])

  assertTC("String-Index-TC",`
  "abcd"[1])
  `,STRING)

  assertPrint("String-Index-In-Fun",`
  def test(x:str)->str:
      return x[1]
  print(test("uiop"))
  `,['i'])

  assertPrint("String-Concatenate",`
  print("abcd" + "bcde")
  `,['abcdbcde'])

});
