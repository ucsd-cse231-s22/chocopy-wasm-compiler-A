import * as mocha from 'mocha';
import { expect } from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';
import { BinOp } from '../ast';

// // We write tests for each function in parser.ts here. Each function gets its 
// // own describe statement. Each it statement represents a single test. You
// // should write enough unit tests for each function until you are confident
// // the parser works as expected. 
describe('traverseExpr(c, s) function', () => {
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
      arguments: { tag: "id", name: "a" },
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
  it('parses list slicing', () => {
    const source = "a[1:2]";
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