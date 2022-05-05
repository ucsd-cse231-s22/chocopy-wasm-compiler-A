import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';

// We write tests for each function in parser.ts here. Each function gets its 
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected. 
describe('traverseExpr(c, s) function', () => {
  it('parses a number in the beginning', () => {
    const source = "987";
    const cursor = parser.parse(source).cursor();

    // go to statement
    cursor.firstChild();
    // go to expression
    cursor.firstChild();

    const parsedExpr = traverseExpr(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedExpr).to.deep.equal({tag: "literal", value: {tag: "num", value: 987}});
  })

  // TODO: add additional tests here to ensure traverseExpr works as expected
});

describe('traverseStmt(c, s) function', () => {
  // TODO: add tests here to ensure traverseStmt works as expected
});

describe('traverse(c, s) function', () => {
  // TODO: add tests here to ensure traverse works as expected
});

describe('parse(source) function', () => {
  it('parse a number', () => {
    const parsed = parse("987");
    expect(parsed.stmts).to.deep.equal([{tag: "expr", expr: {tag: "literal", value: {tag: "num", value: 987}}}]);
  });

  // TODO: add additional tests here to ensure parse works as expected

  // Week6: Project Milestone Tests
  it("parse an empty dict expression", () => {
    const parsed = parse("d = {}");
    expect(parsed).to.deep.equal([
      { tag: "assign", name: "d", value: {tag: "dict_expr", entries: [] }}]);
  });

  it ('parse a set', () =>{
    const parsed = parse("s = {34,False,None}");
    expect(parsed).to.deep.equal([
      {tag: "assign", name: "s", value:{tag: "set_expr", contents: ["int", "bool", "none"] }}]);
  });
  
  it ('parse a tuple', () =>{
    const parsed = parse("t = (34,True,None)");
    expect(parsed).to.deep.equal([
      {tag: "assign", name: "t", value:{tag: "tuple_expr", contents: ["int", "bool", "none"] }}]);
  });
 
});