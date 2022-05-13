import "mocha";
import { expect } from "chai";
import {addUnconstrainedTEnv, augmentTEnv, emptyGlobalTypeEnv, tc, combineTypeBounds, resolveClassTypeParams, UNCONSTRAINED} from  '../../type-check';
import { Program, Type, TypeVar } from '../../ast';
import { NONE, NUM, BOOL, CLASS, TYPEVAR, PyZero, PyNone, PyInt } from '../../utils';

describe('Generics Type-Checker Tests', () => {
  it('should add type-variables to the global environment', () => {
    let [tcProgram, tcGlobalEnv] = tc(emptyGlobalTypeEnv(), {
      funs: [], inits: [], classes: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
    }); 

    expect(tcProgram).to.deep.equal({
      funs: [], inits: [], classes: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE}
      ],
      a: NONE,
    });
    expect(tcGlobalEnv.typevars.get('T')).to.deep.equal(['T', [], CLASS(UNCONSTRAINED)]);
  });

  it('should combine type-bounds for all type-variables - 0', () => {
    let env = emptyGlobalTypeEnv();
    env.typevars.set('T', ['T', [NUM], CLASS(UNCONSTRAINED)]);
    env.typevars.set('U', ['U', [NUM, BOOL], CLASS(UNCONSTRAINED)]);

    const combinedBounds = combineTypeBounds(env, {name: 'Box', fields: [], methods: [], typeParams: ['T', 'U']});
    expect(combinedBounds.map(m => Array.from(m.entries()))).to.deep.equal([
      [['T', NUM], ['U', NUM]],
      [['T', NUM], ['U', BOOL]]
    ]);
  });

  it('should combine type-bounds for all type-variables - 1', () => {
    let env = emptyGlobalTypeEnv();
    env.typevars.set('T', ['T', [NONE, CLASS('Addable')], CLASS(UNCONSTRAINED)]);
    env.typevars.set('U', ['U', [NUM, BOOL], CLASS(UNCONSTRAINED)]);

    const combinedBounds = combineTypeBounds(env, {name: 'Box', fields: [], methods: [], typeParams: ['T', 'U']});
    expect(combinedBounds.map(m => Array.from(m.entries()))).to.deep.equal([
      [['T', NONE], ['U', NUM]],
      [['T', NONE], ['U', BOOL]],
      [['T', CLASS('Addable')], ['U', NUM]],
      [['T', CLASS('Addable')], ['U', BOOL]],
    ]);
  });

  it('should combine type-bounds for all type-variables - 2', () => {
    let env = emptyGlobalTypeEnv();
    env.typevars.set('T', ['T', [], CLASS(UNCONSTRAINED)]);
    env.typevars.set('U', ['U', [NUM, BOOL], CLASS(UNCONSTRAINED)]);

    const combinedBounds = combineTypeBounds(env, {name: 'Box', fields: [], methods: [], typeParams: ['T', 'U']});
    expect(combinedBounds.map(m => Array.from(m.entries()))).to.deep.equal([
      [['T', CLASS(UNCONSTRAINED)], ['U', NUM]],
      [['T', CLASS(UNCONSTRAINED)], ['U', BOOL]],
    ]);
  });

  it('should resolve type parameter annotations to type variables in a class - 0', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<null> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [],
          typeParams: ['T']
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);
    addUnconstrainedTEnv(newEnv);

    let resolvedCls = resolveClassTypeParams(newEnv, program.classes[0]);
    expect(resolvedCls).to.deep.equal({
      name: 'Box',
      fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero()}],
      methods: [],
      typeParams: ['T'],
    });

    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
  });

  it('should resolve type parameter annotations to type variables in a class - 1', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<null> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [
            {name: 'x', type: CLASS('T'), value: PyZero()},
            {name: 'y', type: CLASS('Rat'), value: {tag: "none"}},
          ],
          methods: [],
          typeParams: ['T']
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);
    addUnconstrainedTEnv(newEnv);

    let resolvedCls = resolveClassTypeParams(newEnv, program.classes[0]);
    expect(resolvedCls).to.deep.equal({
      name: 'Box',
      fields: [
        {name: 'x', type: TYPEVAR('T'), value: PyZero()},
        {name: 'y', type: CLASS('Rat'), value: {tag: "none"}},
      ],
      methods: [],
      typeParams: ['T'],
    });


    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(fieldsTy.get('y')).to.deep.equal(CLASS('Rat'));
  });

  it('should resolve type parameter annotations to type variables in a class - 2', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<null> = {
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
              body: [{tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}]},
          ],
          typeParams: ['T']
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);
    addUnconstrainedTEnv(newEnv);

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
          body: [{tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}]},
      ],
      typeParams: ['T']
    });

    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
  });

  it('should resolve type parameter annotations to type variables in a class - 2', () => {
    let env = emptyGlobalTypeEnv(); 

    let program: Program<null> = {
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
              ]
            },
          ],
          typeParams: ['T']
        }
      ]
    };

    const newEnv = augmentTEnv(env, program);
    addUnconstrainedTEnv(newEnv);

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
          body: [{tag: 'return', value: {'tag': 'lookup', obj: {tag: 'id', name: 'self'}, field: 'x'}}]},
      ],
      typeParams: ['T']
    });

    const [fieldsTy, methodsTy, _] = newEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
  });

  it('should typecheck generic class with one field and __init__ method', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] }
          ],
          typeParams: ['T']
        }
      ]
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ]
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
  });

  it('should typecheck generic class with one field and a method', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ]
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, a: TYPEVAR('T')}
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ]
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
  });

  it('should typecheck generic class type annotation', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} },
      ],
      stmts: []
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, a: TYPEVAR('T')}
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"},  a: NONE},
      ],
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });

  it('should typecheck generic class object creation', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", name: "Box", arguments: []}},
      ]
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, a: TYPEVAR('T')}
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"},  a: NONE},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: CLASS('Box', [NUM])}, a: NONE},
      ]
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
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", name: "Box", arguments: []}},
        { tag: "field-assign", obj: {tag: "id", name: "b"}, field: "x", value: {tag: "literal", value: {tag: "num", value: 10}}},
      ]
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, a: TYPEVAR('T')}
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ],
      inits: [
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"},  a: NONE},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: CLASS('Box', [NUM])}, a: NONE},
        { tag: "field-assign", obj: {tag: "id", name: "b", a: CLASS('Box', [NUM])}, field: "x", value: {tag: "literal", value: {tag: "num", value: 10}, a: NUM}, a: NONE},
      ]
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
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0} },
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", name: "Box", arguments: []}},
        { tag: "assign", name: "n", value: {tag: "lookup", obj: {tag: "id", name: "b"}, field: "x"}},
      ]
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, a: TYPEVAR('T')}
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0}, a: NONE},
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"},  a: NONE},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: CLASS('Box', [NUM])}, a: NONE},
        { tag: "assign", name: "n", value: {tag: "lookup", obj: {tag: "id", name: "b", a: CLASS('Box', [NUM])}, field: "x", a: NUM}, a: NONE},
      ]
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
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: CLASS('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0} },
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", name: "Box", arguments: []}},
        { tag: "assign", name: "n", value: {tag: "method-call", obj: {tag: "id", name: "b"}, method: "get", arguments: []}},
      ]
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [], a: NONE},
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: TYPEVAR('T'), inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, a: TYPEVAR('T')}
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ],
      inits: [
        { name: "n", type: NUM, value: {tag: "num", value: 0}, a: NONE},
        { name: "b", type: CLASS('Box', [NUM]), value: {tag: "none"},  a: NONE},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: CLASS('Box', [NUM])}, a: NONE},
        { tag: "assign", name: "n", value: {tag: "method-call", obj: {tag: "id", name: "b", a: CLASS('Box', [NUM])}, method: "get", arguments: [], a: NUM}, a: NONE},
      ]
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });
});
