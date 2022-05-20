import { assertTC, assertTCFail, assertPrint } from './asserts.test';
import { NUM, BOOL, NONE, TUPLE, SET, DICT } from '../utils';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';
import { assertFail} from './asserts.test';

describe('parse(source) function', () => {
  // TODO: add additional tests here to ensure parse works as expected
  // Week6: Project Milestone Tests
  it("parse an empty dict expression", () => {
    const parsed = parse("d = {}");
    expect(parsed.stmts).to.deep.equal([
      { tag: "assign", name: "d", value: {tag: "dict_expr", entries: [] }}]);
  });

  it ('parse a set', () =>{
    const parsed = parse("s = {34,False,None}");
    expect(parsed.stmts).to.deep.equal([
      {tag: "assign", name: "s", value: {tag: "set_expr", contents: 
          [{tag: "literal", value: {tag:"num", value:34}},{tag: "literal", value: {tag:"bool", value:false}}, {tag: "literal", value: {tag:"none"}}] }}]);
  });
  
  it ('parse a tuple', () =>{
    const parsed = parse("t = (34,True,None)");
    expect(parsed.stmts).to.deep.equal([
      {tag: "assign", name: "t", value:{tag: "tuple_expr", contents: 
      [{tag: "literal", value: {tag:"num", value:34}},{tag: "literal", value: {tag:"bool", value:true}}, {tag: "literal", value: {tag:"none"}}] }}]);
  });
   
});


// Week6: Project Milestone Tests
// describe("proj-tuple-test", ()=>{
  
//   assertTC("tc-assign-tuple-mixed",`
//   x:tuple = (3,False,None)
//   x`,TUPLE([NUM,BOOL,NONE]));

//   assertPrint("pr-tuple-indexing",`
//   x:tuple = (3,False,None)
//   print(x[0])
//   print(x[1])
//   print(x[2])`,["3","False","None"])
// });

// Week 7:
describe("set-test", ()=>{
  assertTC("tc-assign-set-int",`
  x:set = set()
  x = {3,76,5}
  x`, SET(NUM));
  assertFail("fail-remove-non-exist",`
  x:set = set()
  x.add(1)
  x.remove(2)
  `);
});
     
describe("basic-set-functions", ()=>{
  assertPrint("set-constructor",`
  s:set = set()
  s.add(3)
  print(len(s))`,["1"]);

  assertPrint("set-add-dupl",`
  s:set = set()
  s = {1,2}
  s.add(1)
  print(len(s))`,["2"]);

  assertPrint("set-has",`
  s:set = set()
  s = {1,2,12,5}
  s.remove(12)
  print(12 in s)
  print(2 in s)
  print(1 in s)`,["False","True","True"]);

  assertFail("set-remove",`
  s:set = set()
  s = {1,2,5,7}
  s.remove(6)`);

  assertPrint("set-clear-has",`
  x:set = set()
  x = {1,2,3,7}
  x.add(2)
  x.clear()
  print(x.has(7))
  `,["False"]);

  assertPrint("set-update",`
  x:set = set()
  x.add(2)
  x.update({2,3,12,13})
  print(x.size())`,["4"]);

});