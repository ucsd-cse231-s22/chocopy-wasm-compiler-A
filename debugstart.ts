import { FunDef, Parameter, Program, Type, VarInit } from "./ast";
import { monomorphizeProgram } from "./monomorphizer";
import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T', int, bool)

  class Box(Generic[T]):
      f : T = __ZERO__
      a : Box[T] = __ZERO__

      def getF(self: Box[T]) -> T:
          return self.f

      def setF(self: Box[T], f: T):
          self.f = f

  b : Box[int] = None
  b = Box()`
  const ast = parse(source);
  const util = require('util')
  console.log(util.inspect(ast, false, null, true /* enable colors */)) 

  const tast = {
    funs: [] as Array<FunDef<Type>>,
    inits: [
      {
        name: 'b',
        type: { tag: 'class', name: 'Box', params: [ { tag: 'number' } ] },
        value: { tag: 'none' }
      }
    ],
    typeVarInits: [
      {
        name: 'T',
        canonicalName: 'T',
        types: [ { tag: 'number' }, { tag: 'bool' } ]
      }
    ],
    classes: [
      {
        name: 'Box',
        typeParams: [ 'T' ],
        fields: [
          {
            name: 'f',
            type: { tag: 'typevar', name: 'T' },
            value: { tag: 'zero' }
          },
          {
            name: 'a',
            type: {
              tag: 'class',
              name: 'Box',
              params: [ { tag: 'typevar', name: 'T' } ]
            },
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
                  params: [ { tag: 'typevar', name: 'T' } ]
                }
              }
            ],
            ret: { tag: 'typevar', name: 'T' },
            inits: [] as Array<VarInit<Type>>,
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
                  params: [ { tag: 'typevar', name: 'T' } ]
                }
              },
              {
                name: 'f',
                type: { tag: 'typevar', name: 'T' }
              }
            ],
            ret: { tag: 'none' },
            inits: [] as Array<VarInit<Type>>,
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
                type: {
                  tag: 'class',
                  name: 'Box',
                  params: [ { tag: 'typevar', name: 'T' } ]
                }
              }
            ],
            ret: { tag: 'none' },
            inits: [],
            body: []
          }
        ]
      }
    ],
    stmts: [
      {
        tag: 'assign',
        name: 'b',
        value: { tag: 'call', name: 'Box', arguments: [] as Array<Parameter<Type>> }
      }
    ]
  }

  const mast = monomorphizeProgram(tast as Program<Type>);
  console.log(util.inspect(mast, false, null, true /* enable colors */)) 
  
  // const repl = new BasicREPL(await addLibs());
  // const result = repl.run(source).then(result => {
  //   console.log(result);    
  // })  
}

debug();

