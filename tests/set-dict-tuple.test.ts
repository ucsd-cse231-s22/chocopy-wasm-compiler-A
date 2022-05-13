import { assertTC, assertTCFail, assertPrint } from './asserts.test';
import { NUM, BOOL, NONE, TUPLE, SET, DICT } from '../utils';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse } from '../parser';

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
  
describe("proj-set-test", ()=>{

  assertTC("tc-assign-set-int",`
  x:set = {3,76,5}
  x`, SET(NUM));
    
  // assertPrint("pr-set-add-dupl",`
  // x:set = {1,2}
  // x.add(1)
  // print(x)`,["{1,2}"])
});
     
describe("proj-dict-test", ()=>{
  assertPrint("pr-dict-int-bool-key",`
  x:set = set()
  x.add(9)
  x.add(3)
  x.add(13)
  x.add(23)
  x.add(43)
  x.remove(23)
  x.remove(3)
  print(x.has(9))
  `,["True"])
});