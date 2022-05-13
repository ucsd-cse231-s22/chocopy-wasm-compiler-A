import * as mocha from "mocha";
import { expect } from "chai";
import { parser } from "@lezer/python";
import {
  traverseExpr,
  traverseStmt,
  traverse,
  parse,
  traverseType,
} from "../parser";
import { emptyGlobalTypeEnv, tc } from "../type-check";
import { assert } from "console";
import { importObject } from "./import-object.test";
import {run, typeCheck} from "./helpers.test";

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
      tag: "callable",
      params: [{ tag: "number" }, { tag: "bool" }],
      ret: { tag: "callable", params: [], ret: { tag: "bool" } },
    });
  });

  describe("traverseExpr(c, s) function", () => {
    it("lambda", () => {
      const source =
        "mklambda(Callable[[int, bool], None], lambda b, c: print(b))";
      const cursor = parser.parse(source).cursor();

      // go to statement
      cursor.firstChild();
      // go to expression
      cursor.firstChild();

      const expr = traverseExpr(cursor, source);
      expect(expr).deep.equal({
        tag: "lambda",
        type: {
          tag: "callable",
          params: [
            {
              tag: "number",
            },
            {
              tag: "bool",
            },
          ],
          ret: {
            tag: "none",
          },
        },
        params: ["b", "c"],
        expr: {
          tag: "builtin1",
          name: "print",
          arg: {
            tag: "id",
            name: "b",
          },
        },
      });
    });
  });

  describe("traverseProgram(c, s) function", () => {
    it("prog lambda", () => {
      const source =
        "a: Callable[[int, bool], None] = None\na=mklambda(Callable[[int, bool], None], lambda b, c: print(b))";
      const cursor = parser.parse(source).cursor();
      const prog = traverse(cursor, source);
      // console.error(JSON.stringify(prog, null, 2));
    });
  });

  describe("typeCheck(c, s) function", () => {
    it("tc lambda", () => {
      const source =
        "a: Callable[[int, bool], int] = None\na=mklambda(Callable[[int, bool], int], lambda b, c: print(b))";
      const cursor = parser.parse(source).cursor();
      const prog = traverse(cursor, source);
      tc(emptyGlobalTypeEnv(), prog);

      expect(() => {
        const source =
          "a: Callable[[int, bool], None] = None\na=mklambda(Callable[[int, bool], int], lambda b, c: print(b))";
        const cursor = parser.parse(source).cursor();
        const prog = traverse(cursor, source);
        tc(emptyGlobalTypeEnv(), prog);
      }).throws();

      expect(() => {
        const source =
          "a: Callable[[int, bool], int] = None\na=mklambda(Callable[[int, bool], int], lambda b, c: True)";
        const cursor = parser.parse(source).cursor();
        const prog = traverse(cursor, source);
        tc(emptyGlobalTypeEnv(), prog);
      }).throws();
    });
  });

  describe("lower", () => {
    it("run lambda", async () => {
      await run("mklambda(Callable[[], int], lambda: print(5))()");
      console.error(importObject.output);
    });

    it("run lambda reassign", async () => {
      await run(`a: Callable[[], int] = None
      a = mklambda(Callable[[], int], lambda: print(5))
      a()
      a = mklambda(Callable[[], int], lambda: print(7))
      a()`);
      console.error(importObject.output);
    });
  });
});
