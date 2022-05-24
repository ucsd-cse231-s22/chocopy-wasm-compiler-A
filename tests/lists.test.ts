import * as mocha from "mocha";
import { expect } from "chai";
import { parser } from "lezer-python";
import { traverseExpr, traverseStmt, traverse, parse, ParserEnv } from "../parser";
import { BinOp } from "../ast";
import { assertFail, assertPrint, assertTC, assertTCFail } from "./asserts.test";
import { NUM, BOOL, NONE } from "../utils";

// // We write tests for each function in parser.ts here. Each function gets its
// // own describe statement. Each it statement represents a single test. You
// // should write enough unit tests for each function until you are confident
// // the parser works as expected.

// describe("traverseExpr(c, s) for lists", () => {
//   // TODO: add additional tests here to ensure traverseExpr works as expected
//   it("parses list initialization", () => {
//     const source = "[1,2,a]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "construct-list",
//       items: [
//         { tag: "literal", value: { tag: "num", value: 1 } },
//         { tag: "literal", value: { tag: "num", value: 2 } },
//         { tag: "id", name: "a" },
//       ],
//     });
//   });
//   it("parses list index 1", () => {
//     const source = "a[1]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "index",
//       obj: { tag: "id", name: "a" },
//       index: { tag: "literal", value: { tag: "num", value: 1 } },
//     });
//   });
//   it("parses list index 2", () => {
//     const source = "[1,a][x]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "index",
//       obj: {
//         tag: "construct-list",
//         items: [
//           { tag: "literal", value: { tag: "num", value: 1 } },
//           { tag: "id", name: "a" },
//         ],
//       },
//       index: { tag: "id", name: "x" },
//     });
//   });
//   it("parses function on list", () => {
//     const source = "len(a)";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "call",
//       name: "len",
//       arguments: [{ tag: "id", name: "a" }],
//     });
//   });
//   it("parses list concatenation 1", () => {
//     const source = "[1,2] + [3]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "binop",
//       op: BinOp.Plus,
//       left: {
//         tag: "construct-list",
//         items: [
//           { tag: "literal", value: { tag: "num", value: 1 } },
//           { tag: "literal", value: { tag: "num", value: 2 } },
//         ],
//       },
//       right: {
//         tag: "construct-list",
//         items: [{ tag: "literal", value: { tag: "num", value: 3 } }],
//       },
//     });
//   });
//   it("parses list concatenation 2", () => {
//     const source = "a + [3]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "binop",
//       op: BinOp.Plus,
//       left: { tag: "id", name: "a" },
//       right: {
//         tag: "construct-list",
//         items: [{ tag: "literal", value: { tag: "num", value: 3 } }],
//       },
//     });
//   });
//   it("parses list slicing 1", () => {
//     const source = "a[1:x]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "slice",
//       obj: { tag: "id", name: "a" },
//       index_s: { tag: "literal", value: { tag: "num", value: 1 } },
//       index_e: { tag: "id", name: "x" },
//     });
//   });
//   it("parses list slicing 2", () => {
//     const source = "a[:3]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "slice",
//       obj: { tag: "id", name: "a" },
//       index_e: { tag: "literal", value: { tag: "num", value: 3 } },
//     });
//   });
//   it("parses list slicing 3", () => {
//     const source = "a[1:]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "slice",
//       obj: { tag: "id", name: "a" },
//       index_s: { tag: "literal", value: { tag: "num", value: 1 } },
//     });
//   });
//   it("parses list slicing 4", () => {
//     const source = "a[:]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "slice",
//       obj: { tag: "id", name: "a" },
//     });
//   });
//   it("parses list of lists", () => {
//     const source = "[[1], [2], [4,5]]";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();
//     // go to expression
//     cursor.firstChild();

//     const parsedExpr = traverseExpr(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedExpr).to.deep.equal({
//       tag: "construct-list",
//       items: [
//         {
//           tag: "construct-list",
//           items: [{ tag: "literal", value: { tag: "num", value: 1 } }],
//         },
//         {
//           tag: "construct-list",
//           items: [{ tag: "literal", value: { tag: "num", value: 2 } }],
//         },
//         {
//           tag: "construct-list",
//           items: [
//             { tag: "literal", value: { tag: "num", value: 4 } },
//             { tag: "literal", value: { tag: "num", value: 5 } },
//           ],
//         },
//       ],
//     });
//   });
// });

// describe("traverseStmt(c, s) for lists", () => {
//   it("parses list assign", () => {
//     const source = "a[1] = 2";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();

//     const parsedStmt = traverseStmt(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedStmt).to.deep.equal({
//       tag: "index-assign",
//       obj: {tag: "id", name: "a"},
//       index: {tag: "literal", value: {tag: "num", value: 1}},
//       value: {tag: "literal", value: {tag: "num", value: 2}}
//     });
//   });
//   it("parses list of list assign", () => {
//     const source = "a[1][2] = 3";
//     const cursor = parser.parse(source).cursor();

//     // go to statement
//     cursor.firstChild();

//     const parsedStmt = traverseStmt(cursor, source, {lineBreakIndices: []});

//     // Note: we have to use deep equality when comparing objects
//     expect(parsedStmt).to.deep.equal({
//       tag: "index-assign",
//       obj: {tag: "index", obj: {tag: "id", name: "a"}, index: {tag: "literal", value: {tag: "num", "value": 1}}},
//       index: {tag: "literal", value: {tag: "num", value: 2}},
//       value: {tag: "literal", value: {tag: "num", value: 3}}
//     });
//   });
// });

describe("tc for lists", () => {
  assertTC("list of ints", "[1,2,3]", { tag: "list", itemType: NUM });
  assertTC("list of bools", "[True, False]", { tag: "list", itemType: BOOL });
  assertTC("list of lists", "[[1,2,3], [2,3,4]]", {
    tag: "list",
    itemType: { tag: "list", itemType: NUM },
  });
  assertTCFail("construct list with different types", "[1, True]");
  assertTCFail("concatenate lists of different types", "[1] + [True]");
  assertTC(
    "empty-list in assign 1",
    `
  a : [int] = None
  a = []
  a`,
    { tag: "list", itemType: NUM }
  );
  assertTC(
    "empty-list in assign 2",
    `
  a : [[int]] = None
  a = []
  a`,
    { tag: "list", itemType: { tag: "list", itemType: NUM } }
  );
  assertTC(
    "empty list in declaration",
    `
  []`,
    { tag: "empty" }
  );
  assertTC(
    "empty list in list 1",
    `
  [[], [1]]`,
    { tag: "list", itemType: { tag: "list", itemType: NUM } }
  );
  assertTC(
    "empty list in list 2",
    `
  [[1], []]`,
    { tag: "list", itemType: { tag: "list", itemType: NUM } }
  );
  assertTC(
    "list of empty list in declaration",
    `
  [[],[],[]]`,
    { tag: "list", itemType: { tag: "empty" } }
  );
  assertTC(
    "empty list index 1",
    `
  [][0]`,
  {tag: "empty"}
  );
  assertTC(
    "empty list index 2",
    `
  [[], [1,2]][0][1]`, NUM
  );
  assertTC("list access 1", "[True, False][0]", BOOL);
  assertTC(
    "list access 2",
    `
  a : [int] = None
  a = [1,2,3]
  a[0]`,
    NUM
  );
  // index assign tests
  assertTC(
    "basic index assign",
    `
  a : [int] = None
  a = [1,2,3]
  a[0] = 2`,
    NONE
  );
  assertTC(
    "list of lists index assign",
    `
  a : [[int]] = None
  a = [[1,2],[3,4]]
  a[0] = [5,6]
  a[0][0] = 2`,
    NONE
  );
  assertTC(
    "index is expr",
    `
  a : [int] = None
  i : int = 1
  a = [1,2,3]
  a[i] = 2
  a[1+1] = 9`,
    NONE
  );
  assertTCFail(
    "item type not match",
    `
  a : [int] = None
  a = [1,2,3]
  a[0] = True`
  );
  assertTCFail(
    "index type not integer",
    `
  a : [int] = None
  a = [1,2,3]
  a[True] = 0`
  );
  assertTCFail(
    "not a list",
    `
  a : int = 1
  a[0] = 0`
  );
  assertTC(
    "list of nones",
    `
  [None, None]`,
    { tag: "list", itemType: { tag: "none" } }
  );
  assertTC(
    "list of nones access",
    `
  [None, None][0]`,
    NONE
  );
  assertTC(
    "concatenate lists 1",
    `
  [1,2,3]+[2]`,
    { tag: "list", itemType: NUM }
  );
  assertTC(
    "concatenate lists 2",
    `
  [1]+[]`,
    { tag: "list", itemType: NUM }
  );
  assertTC(
    "concatenate lists 3",
    `
  []+[False]`,
    { tag: "list", itemType: BOOL }
  );
  assertTC(
    "concatenate lists 4",
    `
  [[1,2,3],[0]]+[[4,5,6]]`,
    { tag: "list", itemType: { tag: "list", itemType: NUM } }
  );
  assertTC(
    "concatenate lists 5",
    `
  [[1],[]]+[[2,3]]`,
    { tag: "list", itemType: { tag: "list", itemType: NUM } }
  );
  assertTCFail("concatenate lists 6", `1 + [[2,3]]`);
  assertTCFail("concatenate lists 7", `False + [[2,3]]`);
  assertTC("concatenate lists 8", `[] + []`, { tag: "empty" });
  assertTC(
    "concatenate lists 9",
    `
  a : [int] = None
  a = [1]
  a + [3]`,
    { tag: "list", itemType: NUM }
  );
  // Different from python
  assertTCFail(
    "concatenate lists 10",
    `
  a : [[int]] = None
  a = []
  a + [3]`
  );
  assertTC("concatenate lists 11", `[[1,2,3]]+[]`, {
    tag: "list",
    itemType: { tag: "list", itemType: NUM },
  });
  assertTC("concatenate lists 12", `[]+[]`, { tag: "empty" });
  assertTCFail("concatenate lists 13", `[[1]]+[2]`);
  assertTC("list slicing 1", `[1,2,3][:3]`, { tag: "list", itemType: NUM });
  assertTC("list slicing 2", `[][:3]`, { tag: "empty" });
  assertTC("list slicing 3", `[[1,2,3], [3]][:1]`, {
    tag: "list",
    itemType: { tag: "list", itemType: NUM },
  });
  assertTC("list slicing 4", `[1,2,3][:]`, { tag: "list", itemType: NUM });
  assertTC("list slicing 5", `[1,2,3][1:]`, { tag: "list", itemType: NUM });
});

describe("runner for lists", () => {
  assertPrint(`list access 1`, `
  print([1,2,3][0])
  `, [`1`]);
  assertPrint(`list access 2`, `
  print([False, False, True][2])
  `, [`True`]);
  assertFail(`list access 3`, `[False, False, True][-1]`);
  assertFail(`list access 4`, `[False, False, True][3]`);
  assertFail(`list access 5`, `[][3])`);
  assertFail(`list access 6`, `[][0]`);
  assertFail(`list access 7`, `[1,2][2]`);
  assertFail(`list access 8`, `[[], [1,2,3]][0][0]`);
  assertFail(`list access 9`, `[[], []][0][0]`);
  assertPrint(`list access 10`, `print([[1,2], [2,3]][0][1])`, [`2`]);
  assertPrint(`list assign 1`, `
  a : [int] = None
  a = [1]
  a[0] = 2
  print(a[0])
  `, [`2`]);
  assertPrint(`list assign 2`, `
  a : [[int]] = None
  a = [[1]]
  a[0][0] = 2
  print(a[0][0])
  `, [`2`]);
  assertPrint(`list assign 3`, `
  a : [[int]] = None
  a = [[1], []]
  a[1] = [2,3,4]
  print(a[1][2])
  `, [`4`]);

  assertPrint(`list len 1`, `
  a : [int] = None
  a = [1,2,3]
  print(len(a))
  print(len([]))
  print(len([1,2,3,4,5]))
  `, [`3`, `0`, `5`]);

  assertPrint(`list in function 1`, `
  def first3(a: [int]):
    print(len(a))
    print(a[0])
    print(a[1])
    print(a[2])
  first3([1,2,3])
  `, [`3`, `1`, `2`, `3`]);
  assertPrint(`list in function 2`, `
  def get_list() -> [int]:
    return [1,2,3]
  a: [int] = None
  a = get_list()
  print(len(a))
  print(a[0])
  print(a[1])
  print(a[2])
  `, [`3`, `1`, `2`, `3`]);
  // assertPrint(`list in function 3`, `
  // def get_list(start: int) -> [int]:
  //   return [start,start+1,start+2]
  // def append(a: [int], b: [int]) -> [[int]]:
  //   return [a, b]
  // a: [int] = None
  // b: [int] = None
  // c: [[int]] = None
  // a = get_list(1)
  // b = get_list(5)
  // c = append(a, b)
  // print(len(c))
  // print(len(c[0]))
  // print(len(c[1]))
  // print(c[0][0])
  // print(c[1][0])
  // `, [`2`, `3`, `3`, `1`, `5`]);
  // assertPrint(
  //   `list print`,
  //   `
  // a : [int] = None
  // a = [1,2,3]
  // print(a)
  // `,
  //   ["[1,2,3]"]
  // );
});

// describe('traverseStmt(c, s) function', () => {
//   // TODO: add tests here to ensure traverseStmt works as expected
// });

// describe('traverse(c, s) function', () => {
//   // TODO: add tests here to ensure traverse works as expected
// });

// describe('parse(source) function', () => {
//   it('parse a number', () => {
//     const parsed = parse("987");
//     expect(parsed).to.deep.equal([{tag: "expr", expr: {tag: "num", value: 987}}]);
//   });

//   // TODO: add additional tests here to ensure parse works as expected
// });
