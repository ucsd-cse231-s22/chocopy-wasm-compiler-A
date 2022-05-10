import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("PA3 hidden tests", () => {

assertPrint("list-access", `
 a:[int] = None
 x:int = 5
 a = [1,2,3,4]
 print(a[x - 3])
 print(a[1])`, [`3`, `2`]);

});
