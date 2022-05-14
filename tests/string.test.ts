import { assert } from "console";
import { STRING } from "../utils";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("String tests", () => {

  assertPrint("String-Equals-True",`
  print("abc")
  print(1)
  print("def")
  `,['abc', '1','def'])

});
