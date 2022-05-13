import { assert } from "console";
import { STRING } from "../utils";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("String tests", () => {
  assertTC("string",`"abcd"`,STRING);

  assertTC("string-in-fun",`
  def test(x:str)->str:
    return x
  x:str = None
  x = "abcd"
  test(x)
  `,STRING)

  assertTC("string-in-class",`
  class C(object):
    x:str = None
    def new(self:C)->C:
        self.x = "abc"
        return self
  c: C = None
  c = C().new()
  c.x
  `,STRING)

  assertTCFail("string-int",`
  x:str = None
  x = 1
  `);

  assertTCFail("string-int-in-fun",`
  def test(str:x)->str:
    x = 1
    return x
  test("abcd")  
  `);

  assertTCFail("string-in-class",`
  class C(object):
    x:str = None
    def new(self:C)->C:
        self.x = "abc"
        return self
  c: C = None
  c = C().new()
  c.x = 1
  `)

  assertPrint("String-equals-True",`
  print("abcd" == "abcd")
  `,['True'])

  assertPrint("String-equals-True-in-fun",`
  def test()->bool:
      return "abcd" == "abcd"
  print(test())
  `,['True'])

  assertPrint("String-equals-False-1",`
  x:str = None
  y:str = None
  x = "abcd"
  y = "bcde"
  print(x == y)
  `,['False'])
  //3
  assertPrint("String-equals-False-2",`
  print("abcd" == "bcde")
  `,['False'])

  assertPrint("String-equals-False-in-fun",`
  def test(x:str,y:str)->bool:
    return x == y
  print(test("abcd","bcde")) 
  `,['False'])

  assertPrint("String-equals-False-in-class",`
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

});
