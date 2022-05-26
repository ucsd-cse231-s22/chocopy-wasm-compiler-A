import {expect} from 'chai';
import { parser } from '@lezer/python';
import { parse, traverseLiteral, traverseType, traverseTypeVarInit, traverseGenericParams, traverseClass, ParserEnv } from '../../parser';
import { Type, VarInit } from '../../ast';

// We write tests for each function in parser.ts here. Each function gets its 
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected. 
describe('Generics Parser Tests',() => {
  describe('traverseLiteral(c, s) function', () => {
    it('parses __ZERO__ as a zero tag literal', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "x : T = __ZERO__";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();
      // go to lhs var name
      cursor.firstChild();
      // go to TypeDef
      cursor.nextSibling();
      // go to =
      cursor.nextSibling();
      // go to VariableName
      cursor.nextSibling();

      const parsedZero = traverseLiteral(cursor, source, env);

      // Note: we have to use deep equality when comparing objects
      expect(parsedZero.tag).to.deep.equal("zero");
    })

    it('throws error when using anything but the zero variable as literal', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "x : T = y";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();
      // go to lhs var name
      cursor.firstChild();
      // go to TypeDef
      cursor.nextSibling();
      // go to =
      cursor.nextSibling();
      // go to VariableName
      cursor.nextSibling();

      expect(function(){
        traverseLiteral(cursor, source, env);
      }).to.throw('ParseError: Not a literal');
    })
  });

  describe('traverseType(c, s) function', () => {
    it('parses generic var', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "b : Box[int] = None";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();
      // go to lhs var name
      cursor.firstChild();
      // go to TypeDef
      cursor.nextSibling();
      // go to :
      cursor.firstChild();
      // go to MemberExpression
      cursor.nextSibling();

      const parsedType = traverseType(cursor, source, env);

      // Note: we have to use deep equality when comparing objects
      expect(parsedType.tag).to.deep.equal("class");
      if (parsedType.tag === "class") {
        expect(parsedType.name).to.deep.equal("Box");
        expect(parsedType.params).to.deep.equal([{"tag": "number"}]);
      }
    })

    it('parses generic var with multiple type vars', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "b : Box[int, bool] = None";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();
      // go to lhs var name
      cursor.firstChild();
      // go to TypeDef
      cursor.nextSibling();
      // go to :
      cursor.firstChild();
      // go to MemberExpression
      cursor.nextSibling();

      const parsedType = traverseType(cursor, source, env);

      // Note: we have to use deep equality when comparing objects
      expect(parsedType.tag).to.deep.equal("class");
      if (parsedType.tag === "class") {
        expect(parsedType.name).to.deep.equal("Box");
        expect(parsedType.params).to.deep.equal([{"tag": "number"}, {"tag": "bool"}]);
      }
    })
  });

  describe('traverseTypeVarInit(c, s) function', () => {
    it('traverses type var init with no constraints', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "T = TypeVar('T')";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();

      const parsedTypeVarInit = traverseTypeVarInit(cursor, source, env);

      // Note: we have to use deep equality when comparing objects
      expect(parsedTypeVarInit.name).to.deep.equal("T");
      expect(parsedTypeVarInit.canonicalName).to.deep.equal("T");
      expect(parsedTypeVarInit.types).to.deep.equal([]);
    })

    it('traverses type var init with constraints should fail', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "T = TypeVar('T', int, bool)";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();

      expect(() => traverseTypeVarInit(cursor, source, env)).to.throw()
    })

    it('traverses type var init with constraints with class type should fail', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = "T = TypeVar('T', int, bool, C)";
      const cursor = parser.parse(source).cursor();
      // go to statement
      cursor.firstChild();

      expect(() => traverseTypeVarInit(cursor, source, env)).to.throw()
    })
  });

  describe('traverseGenericParams(c, s) function', () => {
    it('traverses generic params', () => {
      const source = `
      class Box(Generic[T]):
        a: int = 0
      `;
      const cursor = parser.parse(source).cursor();
      // go to Class def
      cursor.firstChild();
      // go to class
      cursor.firstChild();
      // go to class name
      cursor.nextSibling();
      // go to arg list
      cursor.nextSibling();

      const parsedGenericTypes = traverseGenericParams(cursor, source);

      // Note: we have to use deep equality when comparing objects
      expect(parsedGenericTypes).to.deep.equal(["T"]);
    })

    it('traverses multiple Generic type parameters', () => {
      const source = `
      class Box(Generic[T, U]):
        a: int = 0
      `;
      const cursor = parser.parse(source).cursor();
      // go to Class def
      cursor.firstChild();
      // go to class
      cursor.firstChild();
      // go to class name
      cursor.nextSibling();
      // go to arg list
      cursor.nextSibling();

      const parsedGenericTypes = traverseGenericParams(cursor, source);

      // Note: we have to use deep equality when comparing objects
      expect(parsedGenericTypes).to.deep.equal(["T", "U"]);
    })

    it('traverses no Generic type parameters', () => {
      const source = `
      class Box():
        a: int = 0
      `;
      const cursor = parser.parse(source).cursor();
      // go to Class def
      cursor.firstChild();
      // go to class
      cursor.firstChild();
      // go to class name
      cursor.nextSibling();
      // go to arg list
      cursor.nextSibling();

      const parsedGenericTypes = traverseGenericParams(cursor, source);

      // Note: we have to use deep equality when comparing objects
      expect(parsedGenericTypes).to.deep.equal([]);
    })
  });

  describe('traverseClass(c, s) function', () => {
    it('traverses generic class', () => {
      const env: ParserEnv = {
        lineBreakIndices: [],
      }
      const source = `
      class Box(Generic[T]):
        a: int = 0
      `;
      const cursor = parser.parse(source).cursor();
      // go to Class def
      cursor.firstChild();

      const parsedClass = traverseClass(cursor, source, env);

      // Note: we have to use deep equality when comparing objects
      expect(parsedClass.name).to.deep.equal("Box");
      expect(parsedClass.fields.length).to.equal(1);
      expect(parsedClass.fields[0].name).to.deep.equal("a");
      expect(parsedClass.fields[0].value.tag).to.deep.equal("num");
      expect(parsedClass.methods.length).to.equal(1);
      expect(parsedClass.methods[0].body).to.deep.equal([]);
      expect(parsedClass.methods[0].inits).to.deep.equal([]);
      expect(parsedClass.methods[0].name).to.deep.equal("__init__");
      expect(parsedClass.methods[0].parameters.length).to.equal(1);
      expect(parsedClass.methods[0].parameters[0].name).to.deep.equal("self");
      expect(parsedClass.methods[0].parameters[0].type.tag).to.deep.equal("class");
      expect(parsedClass.typeParams).to.deep.equal(["T"]);
    })
  }); 
});
