import "mocha";
import { expect } from "chai";
import {augmentTEnv, emptyGlobalTypeEnv, tc, resolveClassTypeParams} from  '../../type-check';
import { Program, Type, TypeVar, BinOp } from '../../ast';
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
    expect(tcGlobalEnv.typevars.get('T')).to.deep.equal(['T']);
  });

  it('should throw an error on duplicate type-var identifier', () => {
    expect(() => tc(emptyGlobalTypeEnv(), {
      funs: [], inits: [], classes: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []},
        {name: 'T', canonicalName: 'T2', types: []}
      ],
    })).to.throw(); 
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

  it('should throw an error when a generic class uses a type-variable that was not in its parameters', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []},
        {name: 'U', canonicalName: 'U', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()},{name: 'y', type: CLASS('U'), value: PyZero()} ],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] }
          ],
          typeParams: ['T']
        }
      ]
    }; 

    expect(() => tc(env, program)).to.throw()
  });

  it('should throw an error when a generic class is parameterized by undefined type-variable', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [], inits: [], stmts: [],
      typeVarInits: [
        {name: 'U', canonicalName: 'U', types: []},
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

    expect(() => tc(env, program)).to.throw()
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

  it('should typecheck constrained generic class type annotation', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [NUM, BOOL]}
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
        {name: 'T', canonicalName: 'T', types: [NUM, BOOL], a: NONE},
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

  /*it('should allow generic field field access based on constrains', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [CLASS('A'), CLASS('B')]}
      ],
      classes: [
        {
          name: 'A',
          fields: [{name: 'x', type: NUM, value: {tag: "num", value: 0}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('A') }], ret: NONE, inits: [], body: [] },
          ],
          typeParams: []
        },
        {
          name: 'B',
          fields: [{name: 'x', type: NUM, value: {tag: "num", value: 0}}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('B') }], ret: NONE, inits: [], body: [] },
          ],
          typeParams: []
        },
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: PyZero()}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NONE, inits: [], body: [] },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: NUM, inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}, field: "x"}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [],
      stmts: []
    }; 

    let [tcProgram, tcGlobalEnv] = tc(env, program);
    expect(tcProgram).to.deep.equal({
      a: NONE,
      funs: [], stmts: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [CLASS('A'), CLASS('B')], a: NONE}
      ],
      classes: [
        {
          name: 'A',
          fields: [{name: 'x', type: NUM, value: {tag: "num", value: 0}, a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('A') }], ret: NONE, inits: [], body: [], a: NONE },
          ],
          typeParams: [],
          a: NONE,
        },
        {
          name: 'B',
          fields: [{name: 'x', type: NUM, value: {tag: "num", value: 0}, a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('B') }], ret: NONE, inits: [], body: [], a: NONE },
          ],
          typeParams: [],
          a: NONE,
        },
        {
          name: 'Box',
          fields: [{name: 'x', type: TYPEVAR('T'), value: PyZero(), a: NONE}],
          methods: [
            { name: "__init__", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NONE, inits: [], body: [], a: NONE },
            { name: "get", parameters: [{ name: "self", type: CLASS('Box', [TYPEVAR('T')]) }], ret: NUM, inits: [], body: [
              {tag: "return", value: {tag: "lookup", obj: {tag: "lookup", obj: {tag: "id", name: "self", a: CLASS('Box', [TYPEVAR('T')])}, field: "x", a: TYPEVAR('T')}, field: "x", a: NUM}, a: NUM }
            ], a: NONE }
          ],
          typeParams: ['T'],
          a: NONE,
        } 
      ],
      inits: [
      ],
    });

    //const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    //expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    //expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    //expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    //const globals = tcGlobalEnv.globals.get('b');
    //expect(globals).to.deep.equal(CLASS('Box', [NUM]));
  });*/

  /*it('should enforce generic class type parameter constraints', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: [NUM, NONE]}
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
        { name: "b", type: CLASS('Box', [BOOL]), value: {tag: "none"} },
      ],
      stmts: []
    }; 

    expect(() => tc(env, program)).to.throw();
  });*/

  it('should enforce generic class type parameter number', () => {
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
        { name: "b", type: CLASS('Box', [BOOL, NUM]), value: {tag: "none"} },
      ],
      stmts: []
    }; 

    expect(() => tc(env, program)).to.throw();
  });

  it('should ensure generic class fields are initialized with __ZERO__', () => {
    let env = emptyGlobalTypeEnv();
    let program: Program<null> = {
      funs: [],
      typeVarInits: [
        {name: 'T', canonicalName: 'T', types: []}
      ],
      classes: [
        {
          name: 'Box',
          fields: [{name: 'x', type: CLASS('T'), value: {tag: 'none'}}],
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
        { name: "b", type: CLASS('Box', [BOOL]), value: {tag: "none"} },
      ],
      stmts: []
    }; 

    expect(() => tc(env, program)).to.throw();
  });

  it('shouldnt allow "is" operator in generic class fields that are unconstrained', () => {
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
            { name: "isNone", parameters: [{ name: "self", type: CLASS('Box', [CLASS('T')]) }], ret: BOOL, inits: [], body: [
              {tag: "return", value: {tag: 'binop', op: BinOp.Is, left: {tag: "lookup", obj: {tag: "id", name: "self"}, field: "x"}, right: { tag: "literal", value: {tag: "none"}}}}
            ] }
          ],
          typeParams: ['T']
        }
      ],
      inits: [
      ],
      stmts: []
    }; 

    expect(() => tc(env, program)).to.throw();
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

  it('should typecheck generic class object field assignment with generic type constructor', () => {
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
        { name: "b", type: CLASS('Box', [CLASS('Box', [NUM])]), value: {tag: "none"} },
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "call", name: "Box", arguments: []}},
        { tag: "field-assign", obj: {tag: "id", name: "b"}, field: "x", value: {tag: "call", name: "Box", arguments: []}},
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
        { name: "b", type: CLASS('Box', [CLASS('Box', [NUM])]), value: {tag: "none"}, a: NONE},
      ],
      stmts: [
        { tag: "assign", name: "b", value: {tag: "construct", name: "Box", a: CLASS('Box', [CLASS('Box', [NUM])])}, a: NONE},
        { tag: "field-assign", obj: {tag: "id", name: "b", a: CLASS('Box', [CLASS('Box', [NUM])])}, field: "x", value: {tag: "construct", name: "Box", a: CLASS('Box', [NUM])}, a: NONE},
      ]
    });

    const [fieldsTy, methodsTy, _] = tcGlobalEnv.classes.get('Box');
    expect(fieldsTy.get('x')).to.deep.equal(TYPEVAR('T'));
    expect(methodsTy.get('__init__')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], NONE]);
    expect(methodsTy.get('get')).to.deep.equal([[CLASS('Box', [TYPEVAR('T')])], TYPEVAR('T')]);
    const globals = tcGlobalEnv.globals.get('b');
    expect(globals).to.deep.equal(CLASS('Box', [CLASS('Box', [NUM])]));
  })
});
