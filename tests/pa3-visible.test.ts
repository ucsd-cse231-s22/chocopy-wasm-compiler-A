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
});
