import { STRING } from "../utils";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("PA3 visible tests", () => {
  //0
  assertTC("string",`"abcd"`,STRING);
  //1
  assertTCFail("string - int",`
  x:str = None
  x = 1`);
  //2
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
