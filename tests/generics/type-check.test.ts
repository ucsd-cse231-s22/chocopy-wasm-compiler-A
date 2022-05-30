import "mocha";
import { expect } from "chai";
import {augmentTEnv, emptyGlobalTypeEnv, tc, resolveClassTypeParams} from  '../../type-check';
import { Annotation, Program, Type, TypeVar, BinOp } from '../../ast';
import { NONE, NUM, BOOL, CLASS, TYPEVAR, PyZero, PyNone, PyInt } from '../../utils';

describe('Generics Type-Checker Tests', () => {
  it('should add type-variables to the global environment', () => {
    let [tcProgram, tcGlobalEnv] = tc(emptyGlobalTypeEnv(), {
      funs: [], inits: [], classes: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}},
    }); 

    expect(tcProgram).to.deep.equal({
      funs: [], inits: [], classes: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      a: {type: NONE, src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}},
    });
    expect(tcGlobalEnv.typevars.get('T')).to.deep.equal(['T']);
  });

  it('should throw an error on duplicate type-var identifier', () => {
    expect(() => tc(emptyGlobalTypeEnv(), {
      funs: [], inits: [], classes: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        {name: 'T', canonicalName: 'T2', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}},
    })).to.throw(); 
  });

  it('should resolve type parameter annotations to type variables in a class - 0', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}},
    };

    const newEnv = augmentTEnv(env, program);

    let resolvedCls = resolveClassTypeParams(newEnv, program.classes[0]);
    expect(resolvedCls).to.deep.equal({
      name: 'Box',
      fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
      methods: [],
      typeParams: ['T'],
      super: new Map(),
      a: {eolLoc: {row: 0, col: 0, srcIdx: 0}},
    });

    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
  });

  it('should resolve type parameter annotations to type variables in a class - 1', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [
            {name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
            {name: 'y', type: CLASS('Rat'), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
          ],
          methods: [],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);

    let resolvedCls = resolveClassTypeParams(newEnv, program.classes[0]);
    expect(resolvedCls).to.deep.equal({
      name: 'Box',
      fields: [
        {name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        {name: 'y', type: CLASS('Rat'), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      methods: [],
      typeParams: ['T'],
      super: new Map(),
      a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });


    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(fieldsTy.get('y')).to.deep.equal(CLASS('Rat'));
  });

  it('should resolve type parameter annotations to type variables in a class - 2', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [
            {name: 'x', type: CLASS('T'), value: PyZero()},
          ],
          methods: [
            {
              name: 'get',
              parameters: [{name: 'self', type: CLASS('Box', [CLASS('T')])}],
              ret: CLASS('T'),
              inits: [],
              body: [{tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}],
              nonlocals: [],
              children: [],
            },
          ],
          typeParams: ['T'],
          super: new Map()
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);

    let resolvedCls = resolveClassTypeParams(newEnv, program.classes[0]);
    expect(resolvedCls).to.deep.equal({
      name: 'Box',
      fields: [
        {name: 'x', type: TYPEVAR('T'), value: PyZero()},
      ],
      methods: [
        {
          name: 'get',
          parameters: [{name: 'self', type: CLASS('Box', [TYPEVAR('T')])}],
          ret: TYPEVAR('T'),
          inits: [],
          body: [{tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}],
          nonlocals: [],
          children: [],
        },
      ],
      typeParams: ['T'],
      super: new Map()
    });

    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
  });

  it('should resolve type parameter annotations to type variables in a class - 3', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [
            {name: 'x', type: CLASS('T'), value: PyZero()},
          ],
          methods: [
            {
              name: 'get',
              parameters: [{name: 'self', type: CLASS('Box', [CLASS('T')])}],
              ret: CLASS('T'),
              inits: [
                {name: 'v', type: CLASS('T'), value: PyZero()},
              ],
              body: [
                {tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}
              ],
              nonlocals: [],
              children: [],
            },
          ],
          typeParams: ['T'],
          super: new Map()
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);

    let resolvedCls = resolveClassTypeParams(newEnv, program.classes[0]);
    expect(resolvedCls).to.deep.equal({
      name: 'Box',
      fields: [
        {name: 'x', type: TYPEVAR('T'), value: PyZero()},
      ],
      methods: [
        {
          name: 'get',
          parameters: [{name: 'self', type: CLASS('Box', [TYPEVAR('T')])}],
          ret: TYPEVAR('T'),
          inits: [
            {name: 'v', type: TYPEVAR('T'), value: PyZero()},
          ],
          body: [{tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}],
          nonlocals: [],
          children: [],
        },
      ],
      typeParams: ['T'],
      super: new Map()
    });

    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
  });

  it('should typecheck generic class with one field and __init__ method', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals:       [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        } 
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
  });

  it('should throw an error when a generic class uses a type-variable that was not in its parameters', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        {name: 'U', canonicalName: 'U', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},{name: 'y', type: CLASS('U'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}} ],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] , nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    expect(() => tc(env, program)).to.throw()
  });

  it('should throw an error when a generic class is parameterized by undefined type-variable', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'U', canonicalName: 'U', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [] }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        },
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    expect(() => tc(env, program)).to.throw()
  });

  it('should typecheck generic class with one field and a method', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [],
            a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        } 
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
  });

  it('should typecheck generic class type annotation', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}},
        } 
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });

  it('should enforce generic class type parameter number', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [BOOL, NUM]), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
      ],
      stmts: [],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    expect(() => tc(env, program)).to.throw();
  });

  it('should ensure generic class fields are initialized with __ZERO__', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: {tag: 'none'}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [BOOL]), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
      ],
      stmts: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    expect(() => tc(env, program)).to.throw();
  });

  it('shouldnt allow "is" operator in generic class fields that are unconstrained', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "isNone", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: BOOL, inits: [], body: [
              {tag: "return", value: {tag: 'binop', op: BinOp.Is, left: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, right: { tag: "literal", value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
      ],
      stmts: [], a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    expect(() => tc(env, program)).to.throw();
  });

  it('should typecheck generic class object creation', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", fn: {tag: "id", name: "Box", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });

  it('should typecheck generic class object field assignment', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} , a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", fn: {tag: "id", name: "Box"}, arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "field-assign", obj: {tag: "id", name: "b", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", value: {tag: "literal", value: {tag: "num", value: 10}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} , a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "field-assign", obj: {tag: "id", name: "b", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", value: {tag: "literal", value: {tag: "num", value: 10}, a: {type: NUM, eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });
    
    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });

  it('should typecheck generic class object field lookup', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0} , a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} , a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", fn: {tag: "id", name: "Box"}, arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "assign", name: "n", value: {tag: "lookup", obj: {tag: "id", name: "b", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(),
          a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0} , a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} , a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "assign", name: "n", value: {tag: "lookup", obj: {tag: "id", name: "b", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: NUM, eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });

  it('should typecheck generic class object method call', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", fn: {tag: "id", name: "Box"}, arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "assign", name: "n", value: {tag: "method-call", obj: {tag: "id", name: "b", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, method: "get", arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'], super: new Map(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "assign", name: "n", value: {tag: "method-call", obj: {tag: "id", name: "b", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, method: "get", arguments: [], a: {type: NUM, eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });

  it('should typecheck generic class object field assignment with generic type constructor', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<Annotation> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero(), a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [CLASS('Box', [NUM])]), value: {tag: "none"}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", fn: {tag: "id", name: "Box"}, arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "field-assign", obj: {tag: "id", name: "b", a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", value: {tag: "call", fn: {tag: "id", name: "Box"}, arguments: [], a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', eolLoc: {row: 0, col: 0, srcIdx: 0}}
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: {type: CLASS('Box', [TYPEVAR('T')]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: TYPEVAR('T'), eolLoc: {row: 0, col: 0, srcIdx: 0}}}
            ], nonlocals: [], children: [], a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}} }
          ],
          typeParams: ['T'],
          super: new Map(),
          a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [CLASS('Box', [NUM])]), value: {tag: "none"}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: {type: CLASS('Box', [CLASS('Box', [NUM])]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
        { tag: "field-assign", obj: {tag: "id", name: "b", a: {type: CLASS('Box', [CLASS('Box', [NUM])]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, field: "x", value: {tag: "construct", name: "Box", a: {type: CLASS('Box', [NUM]), eolLoc: {row: 0, col: 0, srcIdx: 0}}}, a: {type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}},
      ],
      a: {src: 'test', type: NONE, eolLoc: {row: 0, col: 0, srcIdx: 0}}
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [CLASS('Box', [NUM])]));
  })
});
