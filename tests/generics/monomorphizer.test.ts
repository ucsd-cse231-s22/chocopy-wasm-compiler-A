import { expect } from 'chai';
import { Program, Type } from '../../ast';
import { monomorphizeProgram } from '../../monomorphizer';

describe('monomorphizeProgram(program) function', () => {
    it('monomorphizes a generic class in a program with two var inits with generic type int', () => {
        const tast : Program<Type> = { a: { tag: 'none' }, inits: [{name: 'c1', type: { tag: 'class', name: 'C', params: [ { tag: 'number' } ] }, 
        value: { tag: 'none' }, a: { tag: 'none' }}, {name: 'c3', type: { tag: 'class', name: 'C', params: [ { tag: 'number' } ] }, 
        value: { tag: 'none' }, a: { tag: 'none' }}], funs: [] as any, classes: [
              {a: { tag: 'none' }, name: 'C', fields: [{name: 't',type: { tag: 'typevar', name: 'T' },value: { tag: 'zero' },a: { tag: 'none' }}],
                methods: [
                  {name: 'f',parameters: [{name: 'self',type: {tag: 'class',name: 'C',params: [ { tag: 'typevar', name: 'T' } ]}},
                  {name: 'other',type: {tag: 'class',name: 'C',params: [ { tag: 'typevar', name: 'T' } ]}}],ret: { tag: 'none' },
                    inits: [] as any,
                    body: [{tag: 'field-assign',obj: {a: {tag: 'class',name: 'C',params: [ { tag: 'typevar', name: 'T' } ]},tag: 'id',name: 'other'},
                        field: 't',value: {tag: 'lookup',obj: {a: {tag: 'class',name: 'C',params: [ { tag: 'typevar', name: 'T' } ]},tag: 'id',name: 'self'},
                        field: 't',a: { tag: 'typevar', name: 'T' }},a: { tag: 'none' }}],a: { tag: 'none' }},
                  {name: '__init__',parameters: [{name: 'self',type: {tag: 'class',name: 'C',params: [ { tag: 'typevar', name: 'T' } ]}}],
                  ret: { tag: 'none' },inits: [],body: [],a: { tag: 'none' }}],typeParams: [ 'T' ]}], 
                  stmts: [] as any,typeVarInits: [ { name: 'T', canonicalName: 'T', types: [] as any, a: { tag: 'none' } } ]
        }

        const mast = monomorphizeProgram(tast);
        const expectedmast = {a: { tag: 'none' },inits: [{name: 'c1',type: { tag: 'class', name: 'C$number', params: [] as any },
        value: { tag: 'none' },a: { tag: 'none' }},{name: 'c3',type: { tag: 'class', name: 'C$number', params: [] },value: { tag: 'none' },a: { tag: 'none' }}],
            funs: [] as any,
            classes: [
              {a: { tag: 'none' },name: 'C$number',fields: [{name: 't',type: { tag: 'number' },value: { tag: 'num', value: 0 },a: { tag: 'none' }}],
                methods: [
                  {name: 'f',parameters: [{name: 'self',type: { tag: 'class', name: 'C$number', params: [] as any }},
                  {name: 'other',type: { tag: 'class', name: 'C$number', params: [] }}],ret: { tag: 'none' },inits: [] as any,
                    body: [{tag: 'field-assign',obj: {a: { tag: 'class', name: 'C$number', params: [] as any },tag: 'id',name: 'other'},field: 't',
                    value: {tag: 'lookup',obj: {a: { tag: 'class', name: 'C$number', params: [] as any },tag: 'id',name: 'self'},field: 't',a: { tag: 'number' }},
                    a: { tag: 'none' }}], a: { tag: 'none' }},
                  {name: '__init__',parameters: [{name: 'self',type: { tag: 'class', name: 'C$number', params: [] }}],
                  ret: { tag: 'none' },inits: [],body: [],a: { tag: 'none' }}],typeParams: [] as any}],stmts: [] as any,typeVarInits: [] as any
                }

        expect(mast).to.deep.equal(expectedmast);
    })

    it ('monomorphizes a class with multiple genric types including instantiation with class', () => {
        const tast : Program<Type> = {a: { tag: 'none' },
            inits: [{name: 'b1',type: {tag: 'class',name: 'Box',params: [ { tag: 'number' }, { tag: 'bool' } ]},value: { tag: 'none' },a: { tag: 'none' }},
            {name: 'b2',type: {tag: 'class',name: 'Box',params: [ { tag: 'bool' }, { tag: 'class', name: 'A', params: [] as any } ]},value: { tag: 'none' },a: { tag: 'none' }}],
            funs: [] as any,
            classes: [
              {a: { tag: 'none' },name: 'A',fields: [{name: 'a',type: { tag: 'number' },value: { tag: 'num', value: 20 },a: { tag: 'none' }}],
                methods: [{name: '__init__',parameters: [{name: 'self',type: { tag: 'class', name: 'A', params: [] as any }}],
                ret: { tag: 'none' },inits: [] as any,body: [] as any,a: { tag: 'none' }}],
                typeParams: [] as any},
              {a: { tag: 'none' },name: 'Box',fields: [{name: 't',type: { tag: 'typevar', name: 'T' },value: { tag: 'zero' },
              a: { tag: 'none' }},{name: 'u',type: { tag: 'typevar', name: 'U' },value: { tag: 'zero' },a: { tag: 'none' }}],
                methods: [
                  {name: 'getT',parameters: [{name: 'self',type: {tag: 'class',name: 'Box',params: [{ tag: 'typevar', name: 'T' },{ tag: 'typevar', name: 'U' }]}}],
                    ret: { tag: 'typevar', name: 'T' },
                    inits: [] as any,
                    body: [
                      {a: { tag: 'typevar', name: 'T' },tag: 'return',value: {tag: 'lookup',obj: {a: {tag: 'class',name: 'Box',
                      params: [{ tag: 'typevar', name: 'T' },{ tag: 'typevar', name: 'U' }]},tag: 'id',name: 'self'},field: 't',
                      a: { tag: 'typevar', name: 'T' }}}],a: { tag: 'none' }},{
                    name: 'getU',parameters: [{name: 'self',type: {tag: 'class',name: 'Box',params: [{ tag: 'typevar', name: 'T' },{ tag: 'typevar', name: 'U' }]}}],
                    ret: { tag: 'typevar', name: 'U' },inits: [],
                    body: [{a: { tag: 'typevar', name: 'U' },tag: 'return',value: {tag: 'lookup',obj: {a: {tag: 'class',name: 'Box',
                    params: [{ tag: 'typevar', name: 'T' },{ tag: 'typevar', name: 'U' }]},tag: 'id',name: 'self'},field: 'u',
                    a: { tag: 'typevar', name: 'U' }}}],a: { tag: 'none' }},
                  {
                    name: '__init__',
                    parameters: [{name: 'self',type: {tag: 'class',name: 'Box',params: [{ tag: 'typevar', name: 'T' },{ tag: 'typevar', name: 'U' }]}}],
                    ret: { tag: 'none' },inits: [] as any,body: [] as any,a: { tag: 'none' }}],typeParams: [ 'T', 'U' ]}],
            stmts: [
              {a: { tag: 'none' },tag: 'assign',name: 'b1',value: {a: {tag: 'class',name: 'Box',params: [ { tag: 'number' }, { tag: 'bool' } ]},tag: 'construct',name: 'Box'}},
              {a: { tag: 'none' },tag: 'assign',name: 'b2',value: {a: {tag: 'class',name: 'Box',params: [ { tag: 'bool' }, { tag: 'class', name: 'A', params: [] } ]},tag: 'construct',name: 'Box'}}],
            typeVarInits: [
              { name: 'T', canonicalName: 'T', types: [] as any, a: { tag: 'none' } },
              { name: 'U', canonicalName: 'U', types: [] as any, a: { tag: 'none' } }]}

        const expectedmast = {
            a: { tag: 'none' },
            inits: [{name: 'b1',type: { tag: 'class', name: 'Box$number$bool', params: [] as any },
            value: { tag: 'none' },a: { tag: 'none' }},{name: 'b2',type: { tag: 'class', name: 'Box$bool$A$', params: [] },
            value: { tag: 'none' },a: { tag: 'none' }}], funs: [] as any,
            classes: [
              {a: { tag: 'none' },name: 'A',fields: [{name: 'a',type: { tag: 'number' },value: { tag: 'num', value: 20 },a: { tag: 'none' }}],
              methods: [{name: '__init__',parameters: [{name: 'self',type: { tag: 'class', name: 'A', params: [] }}],ret: { tag: 'none' },
              inits: [],body: [],a: { tag: 'none' }}], typeParams: []},
              {a: { tag: 'none' },name: 'Box$number$bool',fields: [{name: 't',type: { tag: 'number' },value: { tag: 'num', value: 0 },
              a: { tag: 'none' }},{name: 'u',type: { tag: 'bool' },value: { tag: 'bool', value: false },a: { tag: 'none' }}],
                methods: [
                  {name: 'getT',parameters: [{name: 'self',type: { tag: 'class', name: 'Box$number$bool', params: [] as any }}],
                  ret: { tag: 'number' },inits: [] as any,body: [{a: { tag: 'number' },tag: 'return',value: {tag: 'lookup',
                  obj: {a: { tag: 'class', name: 'Box$number$bool', params: [] as any },tag: 'id',name: 'self'},field: 't',
                  a: { tag: 'number' }}}],a: { tag: 'none' }},
                  {name: 'getU',parameters: [{name: 'self',type: { tag: 'class', name: 'Box$number$bool', params: [] }}],
                  ret: { tag: 'bool' },inits: [],body: [{a: { tag: 'bool' },tag: 'return',value: {tag: 'lookup',
                  obj: {a: { tag: 'class', name: 'Box$number$bool', params: [] },tag: 'id',name: 'self'},field: 'u',a: { tag: 'bool' }}}],a: { tag: 'none' }},
                  {name: '__init__',parameters: [{name: 'self',type: { tag: 'class', name: 'Box$number$bool', params: [] }}],
                  ret: { tag: 'none' },inits: [],body: [],a: { tag: 'none' }}],
                typeParams: [] as any
              },
              {a: { tag: 'none' },name: 'Box$bool$A$',fields: [{name: 't',type: { tag: 'bool' },value: { tag: 'bool', value: false },
              a: { tag: 'none' }},{name: 'u',type: { tag: 'class', name: 'A', params: [] as any },value: { tag: 'none' },a: { tag: 'none' }}],
                methods: [
                  {name: 'getT',parameters: [{name: 'self',type: { tag: 'class', name: 'Box$bool$A$', params: [] as any}}],
                  ret: { tag: 'bool' },inits: [] as any,body: [{a: { tag: 'bool' },
                  tag: 'return',value: {tag: 'lookup',obj: {a: { tag: 'class', name: 'Box$bool$A$', params: [] as any },
                  tag: 'id',name: 'self'},field: 't',a: { tag: 'bool' }}}],a: { tag: 'none' }},
                  {name: 'getU',parameters: [{name: 'self',type: { tag: 'class', name: 'Box$bool$A$', params: [] as any }}],
                    ret: { tag: 'class', name: 'A', params: [] as any },
                    inits: [] as any,
                    body: [
                      { a: { tag: 'class', name: 'A', params: [] as any }, tag: 'return', 
                      value: { tag: 'lookup', obj: { a: { tag: 'class', name: 'Box$bool$A$', params: [] as any }, 
                      tag: 'id', name: 'self' }, field: 'u', a: { tag: 'class', name: 'A', params: [] as any } }}],a: { tag: 'none' }},
                  { name: '__init__', parameters: [ { name: 'self', type: { tag: 'class', name: 'Box$bool$A$', params: [] } } ], 
                  ret: { tag: 'none' }, inits: [], body: [], a: { tag: 'none' }}],typeParams: [] as any
              }
            ],
            stmts: [
              {a: { tag: 'none' },tag: 'assign',name: 'b1',
              value: {a: { tag: 'class', name: 'Box$number$bool', params: [] as any },tag: 'construct',name: 'Box$number$bool'}},
              {a: { tag: 'none' },tag: 'assign',name: 'b2',value: {a: { tag: 'class', name: 'Box$bool$A$', params: [] },
              tag: 'construct',name: 'Box$bool$A$'}}],typeVarInits: [] as any
        }

        const mast = monomorphizeProgram(tast);

        expect(mast).to.deep.equal(expectedmast);
    })
});