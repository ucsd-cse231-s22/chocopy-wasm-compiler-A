import { dataOffset, debugId, refNumOffset, sizeOffset, typeOffset } from "../memory";
import { assertPrint, assertTCFail, assertTC, assertFail, assertMemState } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Memory tests", () => {

assertMemState("classes-from-object", `
class Rat(object):
    id: int = 123
    y: int = 0
    def __init__(self: Rat):
        self.y = 1

x: Rat = None
x = Rat()
  `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference in the program where object id is 123
    [123, dataOffset + 1, 1], // x.y = 1
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references
});
