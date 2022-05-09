import * as mocha from "mocha";
import { expect } from "chai";
import { parser } from "lezer-python";
import {
  traverseExpr,
  traverseStmt,
  traverse,
  parse,
  traverseType,
} from "../parser";

// We write tests for each function in parser.ts here. Each function gets its
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected.
describe("traverseType(c, s) function", () => {
  it("number", () => {
    const source = "int";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const type = traverseType(cursor, source);
    expect(type.tag).equal("number");
  });

  it("callable", () => {
    const source = "Callable[[int, bool], Callable[[], bool]]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const type = traverseType(cursor, source);
    expect(type).deep.equal({
        tag: 'callable',
        params: [ { tag: 'number' }, { tag: 'bool' } ],
        ret: { tag: 'callable', params: [], ret: { tag: 'bool' } }
      });
  });
});
