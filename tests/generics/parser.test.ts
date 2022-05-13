import * as mocha from 'mocha';
import {expect} from 'chai';
import { parser } from 'lezer-python';
import { traverseExpr, traverseStmt, traverse, parse, traverseLiteral, traverseType, traverseTypeVarInit, traverseGenericParams, traverseClass } from '../../parser';
import { Type, VarInit } from '../../ast';

// We write tests for each function in parser.ts here. Each function gets its 
// own describe statement. Each it statement represents a single test. You
// should write enough unit tests for each function until you are confident
// the parser works as expected. 
describe('traverseLiteral(c, s) function', () => {
  it('parses __ZERO__ as a zero tag literal', () => {
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

    const parsedZero = traverseLiteral(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedZero).to.deep.equal({tag: "zero"});
  })

  it('throws error when using anything but the zero variable as literal', () => {
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
      traverseLiteral(cursor, source);
    }).to.throw('ParseError: Not a literal');
  })
});

describe('traverseType(c, s) function', () => {
  it('parses generic var', () => {
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

    const parsedType = traverseType(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedType).to.deep.equal({tag: "class", name: "Box", params: [{"tag": "number"}]});
  })

  it('parses generic var with multiple type vars', () => {
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

    const parsedType = traverseType(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedType).to.deep.equal({tag: "class", name: "Box", params: [{"tag": "number"}, {"tag": "bool"}]});
  })
});

describe('traverseTypeVarInit(c, s) function', () => {
  it('traverses type var init with no constraints', () => {
    const source = "T = TypeVar('T')";
    const cursor = parser.parse(source).cursor();
    // go to statement
    cursor.firstChild();

    const parsedTypeVarInit = traverseTypeVarInit(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedTypeVarInit).to.deep.equal({ name: "T", canonicalName: "T", types: [] });
  })

  it('traverses type var init with constraints', () => {
    const source = "T = TypeVar('T', int, bool)";
    const cursor = parser.parse(source).cursor();
    // go to statement
    cursor.firstChild();

    const parsedTypeVarInit = traverseTypeVarInit(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedTypeVarInit).to.deep.equal({ name: "T", canonicalName: "T", types: [{tag: "number"}, {tag: "bool"}] });
  })

  it('traverses type var init with canonical name', () => {
    const source = "T = TypeVar('U', int, bool)";
    const cursor = parser.parse(source).cursor();
    // go to statement
    cursor.firstChild();

    const parsedTypeVarInit = traverseTypeVarInit(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedTypeVarInit).to.deep.equal({ name: "T", canonicalName: "U", types: [{tag: "number"}, {tag: "bool"}] });
  })

  it('traverses type var init with constraints with class type', () => {
    const source = "T = TypeVar('T', int, bool, C)";
    const cursor = parser.parse(source).cursor();
    // go to statement
    cursor.firstChild();

    const parsedTypeVarInit = traverseTypeVarInit(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedTypeVarInit).to.deep.equal({ name: "T", canonicalName: "T", 
    types: [{tag: "number"}, {tag: "bool"}, {tag: "class", name: "C", params: []}] });
  })

  it('traverses type var init with constraints with class type (with type params)', () => {
    const source = "T = TypeVar('T', int, bool, C[int])";
    const cursor = parser.parse(source).cursor();
    // go to statement
    cursor.firstChild();

    const parsedTypeVarInit = traverseTypeVarInit(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedTypeVarInit).to.deep.equal({ name: "T", canonicalName: "T", 
    types: [{tag: "number"}, {tag: "bool"}, {tag: "class", name: "C", params: [{tag: "number"}]}] });
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
    const source = `
    class Box(Generic[T]):
      a: int = 0
    `;
    const cursor = parser.parse(source).cursor();
    // go to Class def
    cursor.firstChild();

    const parsedClass = traverseClass(cursor, source);

    // Note: we have to use deep equality when comparing objects
    expect(parsedClass).to.deep.equal({ name: "Box", fields: [{name: "a", type: {tag: "number"}, value: {tag: "num", value: 0}}], 
                                      methods: [{body: [], inits: [], name: "__init__", parameters: [{ name: "self", type: {
                                        name: "Box", params: [{tag: "class", name: "T", params: []}], tag: "class"}}], ret: {tag: "none"}}], typeParams: ["T"] });
  })
});

describe('parse(source) function', () => {
  it('parses a program with a generic class', () => {
    const source = `
    T = TypeVar('T')

    class Box(Generic[T]):
      f : T = __ZERO__

      def getF(self: Box[T]) -> T:
          return self.f

      def setF(self: Box[T], f: T):
          self.f = f

    b : Box[int] = None
    b = Box()
    `;
    const parsed = parse(source);
    const params : Array<Type> = [];
    const inits : Array<VarInit<null>> = [];
    const parsedClasses = [
      {
        name: 'Box',
        typeParams: [ 'T' ],
        fields: [
          {
            name: 'f',
            type: { tag: 'class', name: 'T', params: params },
            value: { tag: 'zero' }
          }
        ],
        methods: [
          {
            name: 'getF',
            parameters: [
              {
                name: 'self',
                type: {
                  tag: 'class',
                  name: 'Box',
                  params: [ { tag: 'class', name: 'T', params: params } ]
                }
              }
            ],
            ret: { tag: 'class', name: 'T', params: params },
            inits: inits,
            body: [
              {
                tag: 'return',
                value: {
                  tag: 'lookup',
                  obj: { tag: 'id', name: 'self' },
                  field: 'f'
                }
              }
            ]
          },
          {
            name: 'setF',
            parameters: [
              {
                name: 'self',
                type: {
                  tag: 'class',
                  name: 'Box',
                  params: [ { tag: 'class', name: 'T', params: params } ]
                }
              },
              {
                name: 'f',
                type: { tag: 'class', name: 'T', params: [] }
              }
            ],
            ret: { tag: 'none' },
            inits: inits,
            body: [
              {
                tag: 'field-assign',
                obj: { tag: 'id', name: 'self' },
                field: 'f',
                value: { tag: 'id', name: 'f' }
              }
            ]
          },
          {
            name: '__init__',
            parameters: [
              {
                name: 'self',
                type: { tag: 'class', name: 'Box', params: [{tag: "class", name: "T", params: []}] }
              }
            ],
            ret: { tag: 'none' },
            inits: [],
            body: []
          }
        ]
      }
    ]
    expect(parsed.classes).to.deep.equal(parsedClasses);
  });  
});