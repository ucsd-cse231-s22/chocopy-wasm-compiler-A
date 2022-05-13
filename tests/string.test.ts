import { assert } from "console";
import { STRING } from "../utils";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("PA3 visible tests", () => {
  assertTC("string",`"abcd"`,STRING);

  assertTC("string-in-funs",`
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
  def test(str:x)->str:
    x = 1
    return x
  test("abcd")  
  `);
  assertPrint("String equals True 1",`
  print("abcd" == "abcd")
  `,['True'])
  assertPrint("String equals False 1",`
  x:str = None
  y:str = None
  x = "abcd"
  y = "bcde"
  print(x == y)
  `,['False'])
  //3
  assertPrint("String equals False 2",`
  print("abcd" == "bcde")
  `,['False'])
});
