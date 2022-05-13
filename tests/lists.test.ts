import * as mocha from 'mocha';
import { expect } from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';
import { BinOp } from '../ast';
import { assertTC, assertTCFail } from './asserts.test';
import { NUM, BOOL, NONE } from '../utils';

// // We write tests for each function in parser.ts here. Each function gets its 
// // own describe statement. Each it statement represents a single test. You
// // should write enough unit tests for each function until you are confident
// // the parser works as expected. 
describe('traverseExpr(c, s) for lists', () => {
  // TODO: add additional tests here to ensure traverseExpr works as expected
  it('parses list initialization', () => {
    const source = "[1,2,a]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "construct-list",
      items: [
        { tag: "literal", value: { tag: "num", value: 1 } },
        { tag: "literal", value: { tag: "num", value: 2 } },
        { tag: "id", name: "a" }
      ]
    });
  });
  it('parses list index 1', () => {
    const source = "a[1]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "index",
      obj: { tag: "id", name: "a" },
      index: { tag: "literal", value: { tag: "num", value: 1 } },
    });
  });
  it('parses list index 2', () => {
    const source = "[1,a][x]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "index",
      obj: {
        tag: "construct-list",
        items: [
          { tag: "literal", value: { tag: "num", value: 1 } },
          { tag: "id", name: "a" }
        ]
      },
      index: { tag: "id", name: "x" }
    });
  });
  it('parses function on list', () => {
    const source = "len(a)";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "call",
      name: "len",
      arguments: [{ tag: "id", name: "a" }],
    });
  });
  it('parses list concatenation 1', () => {
    const source = "[1,2] + [3]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "binop",
      op: BinOp.Plus,
      left: {
        tag: "construct-list",
        items: [
          { tag: "literal", value: { tag: "num", value: 1 } },
          { tag: "literal", value: { tag: "num", value: 2 } },
        ]
      },
      right: {
        tag: "construct-list",
        items: [
          { tag: "literal", value: { tag: "num", value: 3 } },
        ]
      }
    });
  });
  it('parses list concatenation 2', () => {
    const source = "a + [3]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "binop",
      op: BinOp.Plus,
      left: { tag: "id", name: "a" },
      right: {
        tag: "construct-list",
        items: [
          { tag: "literal", value: { tag: "num", value: 3 } },
        ]
      }
    });
  });
  it('parses list slicing 1', () => {
    const source = "a[1:x]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "slice",
      obj: { tag: "id", name: "a" },
      index_s: { tag: "literal", value: { tag: "num", value: 1 } },
      index_e: { tag: "id", name: "x" }
    });
  });
  it('parses list slicing 2', () => {
    const source = "a[:3]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "slice",
      obj: { tag: "id", name: "a" },
      index_e: { tag: "literal", value: { tag: "num", value: 3 } },
    });
  });
  it('parses list slicing 3', () => {
    const source = "a[1:]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "slice",
      obj: { tag: "id", name: "a" },
      index_s: { tag: "literal", value: { tag: "num", value: 1 } },
    });
  });
  it('parses list slicing 4', () => {
    const source = "a[:]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "slice",
      obj: { tag: "id", name: "a" },
    });
  });
  it('parses list of lists', () => {
    const source = "[[1], [2], [4,5]]";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({
      tag: "construct-list",
      items: [
        { tag: "construct-list", items: [{ tag: "literal", value: { tag: "num", value: 1 } }] },
        { tag: "construct-list", items: [{ tag: "literal", value: { tag: "num", value: 2 } }] },
        { tag: "construct-list", items: [{ tag: "literal", value: { tag: "num", value: 4 } }, { tag: "literal", value: { tag: "num", value: 5 } }] },
      ]
    });
  });
});

describe('tc for lists', () => {
  assertTC("list of ints", "[1,2,3]", {tag: "list", itemType: NUM });
  assertTC("list of bools", "[True, False]", {tag: "list", itemType: BOOL });
  assertTC("list of lists", "[[1,2,3], [2,3,4]]", {tag: "list", itemType: {tag: "list", itemType: NUM } });
  assertTCFail("construct list with different types", "[1, True]");
  assertTCFail("concatenate lists of different types", "[1] + [True]");
  assertTC("empty-list in assign 1", `
  a : [int] = None
  a = []
  a`, {tag: "list", itemType: NUM });
  assertTC("empty-list in assign 2", `
  a : [[int]] = None
  a = []
  a`, {tag: "list", itemType: {tag: "list", itemType: NUM } });
  assertTC("empty list in declaration", `
  []`, {tag: "empty"});
  assertTC("empty list in list 1", `
  [[], [1]]`, {tag: "list", itemType: {tag: "list", itemType: NUM }});
  assertTC("empty list in list 2", `
  [[1], []]`, {tag: "list", itemType: {tag: "list", itemType: NUM }});
  assertTC("list of empty list in declaration", `
  [[],[],[]]`, {tag: "list", itemType: {tag: "empty"} });
  assertTC("list access 1", "[True, False][0]", BOOL);
  assertTC("list access 2", `
  a : [int] = None
  a = [1,2,3]
  a[0]`, NUM);
  // index assign tests
  assertTC("basic index assign", `
  a : [int] = None
  a = [1,2,3]
  a[0] = 2`, NONE);
  assertTC("list of lists index assign", `
  a : [[int]] = None
  a = [[1,2],[3,4]]
  a[0] = [5,6]
  a[0][0] = 2`, NONE);
  assertTC("index is expr", `
  a : [int] = None
  i : int = 1
  a = [1,2,3]
  a[i] = 2
  a[1+1] = 9`, NONE);
  assertTCFail("item type not match", `
  a : [int] = None
  a = [1,2,3]
  a[0] = True`);
  assertTCFail("index type not integer", `
  a : [int] = None
  a = [1,2,3]
  a[True] = 0`);
  assertTCFail("not a list", `
  a : int = 1
  a[0] = 0`);
  assertTCFail("index into empty list", `[][3]`);
  assertTC("list of nones", `
  [None, None]`, {tag: "list", itemType: {tag: "none"} });
  assertTC("list of nones access", `
  [None, None][0]`, NONE);
  assertTC("concatenate lists 1", `
  [1,2,3]+[2]`, {tag: "list", itemType: NUM });
  assertTC("concatenate lists 2", `
  [1]+[]`, {tag: "list", itemType: NUM });
  assertTC("concatenate lists 3", `
  []+[False]`, {tag: "list", itemType: BOOL });
  assertTC("concatenate lists 4", `
  [[1,2,3],[0]]+[[4,5,6]]`, {tag: "list", itemType: {tag: "list", itemType: NUM } });
  assertTC("concatenate lists 5", `
  [[1],[]]+[[2,3]]`, {tag: "list", itemType: {tag: "list", itemType: NUM } });
  assertTCFail("concatenate lists 6", `1 + [[2,3]]`);
  assertTCFail("concatenate lists 7", `False + [[2,3]]`);
  assertTC("concatenate lists 8", `[] + []`, {tag: "empty" });
  assertTC("concatenate lists 9", `
  a : [int] = None
  a = [1]
  a + [3]`, {tag: "list", itemType: NUM });
  // Different from python
  assertTCFail("concatenate lists 10", `
  a : [[int]] = None
  a = []
  a + [3]`);
  assertTC("concatenate lists 11", `[[1,2,3]]+[]`, {tag: "list", itemType: {tag: "list", itemType: NUM}});
  assertTC("concatenate lists 12", `[]+[]`, {tag: "empty"});
  assertTCFail("concatenate lists 13", `[[1]]+[2]`);
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