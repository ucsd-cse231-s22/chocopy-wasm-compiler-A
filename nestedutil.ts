
import { Stmt, Expr, Type, Literal, Program, FunDef, Class, VarInit } from './ast';
import { duplicateNestedEnv, emptyNestedEnv, generateName, NestedEnv } from './lower';
import { NONE } from './utils';

function lowerNestedRefs(f: FunDef<Type>, nestedEnv: NestedEnv) : [Array<VarInit<Type>>, Array<Stmt<Type>>] {
    const varinits:Array<VarInit<Type>> = [];
    const stmts:Array<Stmt<Type>> = [];
    f.inits.forEach((init) => {
      const [refinits, refstmts] = createNestedRef(init.name, nestedEnv);
      varinits.push(...refinits);
      stmts.push(...refstmts);
    });
    f.parameters.forEach((param) => {
      const [refinits, refstmts] = createNestedRef(param.name, nestedEnv);
      varinits.push(...refinits);
      stmts.push(...refstmts);
    });
    return [varinits, stmts];
}
  
function createNestedRef(name: string, nestedEnv: NestedEnv) : [Array<VarInit<Type>>, Array<Stmt<Type>>] {
    const refName = generateName('funRef');
    nestedEnv.nestedRefs.set(name, refName);
    return [
        [{name: refName, type: {tag: "class", name: 'RefClass'}, value: { tag: "none" }, a: {tag: "class", name: 'RefClass'}}],
        [
        {tag: "assign", name: refName, value: {tag: "construct", name: "RefClass" }, a: NONE},
        {tag: "field-assign", obj: {tag: "id", name: refName, a: {tag: "class", name: "RefClass"} }, field: "value", value: {tag: "id", name: name}, a: NONE},
        ]
    ];
}

export function nested(program : Program<Type>) : Program<Type> {
  const nDefs = program.fundefs.map(fun => nestedDef(fun, emptyNestedEnv()));
  const nClasses = program.classes.map(cls => nestedClass(cls));
  return {...program, fundefs: nDefs, classes: nClasses};
}

export function nestedDef(fun : FunDef<Type>, nestedEnv: NestedEnv, className: string|undefined = undefined) : FunDef<Type> {
  const newNestedEnv = duplicateNestedEnv(nestedEnv);
  const inits: VarInit<Type>[] = [];
  const stmts: Stmt<Type>[] = [];

  if (!((className === "RefClass" || className === "object") && fun.name === "__init__")) {
      const [initvals, stmtvals] = lowerNestedRefs(fun, newNestedEnv);
      inits.push(...initvals);
      stmts.push(...stmtvals);
  }
  fun.fundefs.forEach((fundef) => {
      newNestedEnv.funArgs.set(fundef.name, Array.from(newNestedEnv.nestedRefs.values()));
  });
  fun.nonlocaldecls.forEach((nonlocalDecl) => {
      newNestedEnv.nonlocalDecls.add(nonlocalDecl.name);
  });
  fun.globaldecls.forEach((globalDecl) => {
    newNestedEnv.globalDecls.add(globalDecl.name);
  });
  const nBody = nestedBlock(fun.body, newNestedEnv);
  const nFunDefs = fun.fundefs.map(func => nestedDef(func, newNestedEnv));
  nFunDefs.forEach((fundef) => {
    newNestedEnv.nestedRefs.forEach((ref) => {
      fundef.parameters.push({ name: ref, type: {tag: "class", name: 'RefClass'}});
    });
  });
  
  const nInits = fun.inits;
  nInits.splice(0, 0, ...inits);
  nBody.splice(0, 0, ...stmts);
  return {...fun, fundefs: nFunDefs, body: nBody, inits: nInits};
}

export function nestedClass(cls : Class<Type>) : Class<Type> {
  const nMethods = cls.methods.map(method => nestedDef(method, emptyNestedEnv(), cls.name));
  return {...cls, methods: nMethods};
}

export function nestedBlock(stmts : Array<Stmt<Type>>, nestedEnv: NestedEnv) : Array<Stmt<Type>> {
  return stmts.map(stmt => nestedStmt(stmt, nestedEnv));
}

export function nestedStmt(stmt : Stmt<Type>, nestedEnv: NestedEnv) : Stmt<Type> {
  switch(stmt.tag) {
    case "assign":
      if (nestedEnv.nestedRefs.has(stmt.name)&& !nestedEnv.globalDecls.has(stmt.name)) {
        return {
          tag: "field-assign",
          obj: {tag: "id", name: nestedEnv.nestedRefs.get(stmt.name), a: {tag: "class", name: "RefClass"}},
          a: NONE,
          field: "value", 
          value: stmt.value
        };
      }
      const tValExpr = nestedExpr(stmt.value, nestedEnv);
      return {...stmt, value: tValExpr};
    case "expr":
      const tExpr = nestedExpr(stmt.expr, nestedEnv);
      return {...stmt, expr: tExpr};
    case "if":
      var tCond = nestedExpr(stmt.cond, nestedEnv);
      const tThn = nestedBlock(stmt.thn, nestedEnv);
      let tEls = undefined; 
      if (stmt.els) {
        if (Array.isArray(stmt.els)) {
          tEls = nestedBlock(stmt.els, nestedEnv);
        } else {
          tEls = nestedStmt(stmt.els, nestedEnv);
        }
      }
      return {...stmt, cond: tCond, thn: tThn, els: tEls};
    case "return":
      const tRet = nestedExpr(stmt.value, nestedEnv);
      return {...stmt, value:tRet};
    case "while":
      var tCond = nestedExpr(stmt.cond, nestedEnv);
      var tBody = nestedBlock(stmt.body, nestedEnv);
      return {...stmt, cond: tCond, body: tBody};
    case "for-str":
    case "for":
      var nIterable = nestedExpr(stmt.iterable, nestedEnv);
      var itBody = nestedBlock(stmt.body, nestedEnv);
      return {...stmt, iterable: nIterable, body: itBody};
    case "pass":
      return stmt;
    case "field-assign":
      var tObj = nestedExpr(stmt.obj, nestedEnv);
      const tVal = nestedExpr(stmt.value, nestedEnv);
      return {...stmt, obj: tObj, value: tVal};
    case "index-assign":
      var iObj = nestedExpr(stmt.obj, nestedEnv);
      var iVal = nestedExpr(stmt.value, nestedEnv);
      var index = nestedExpr(stmt.index, nestedEnv);
      return {...stmt, obj: iObj, index, value: iVal };
  }
}

export function nestedExpr(expr : Expr<Type>, nestedEnv: NestedEnv) : Expr<Type> {
  switch(expr.tag) {
    case "literal": 
      return {...expr, value: nestedLiteral(expr.value, nestedEnv)};
    case "binop":
      const tLeft = nestedExpr(expr.left, nestedEnv);
      const tRight = nestedExpr(expr.right, nestedEnv);
      return {...expr, left: tLeft, right: tRight};
    case "uniop":
      const tExpr = nestedExpr(expr.expr, nestedEnv);
      return {...expr, expr: tExpr}
    case "id":
      if (nestedEnv.nestedRefs.has(expr.name) && !nestedEnv.globalDecls.has(expr.name)) {
        return {
          tag: "lookup", 
          obj: {tag: "id", name: nestedEnv.nestedRefs.get(expr.name), a: {tag: "class", name: "RefClass"} },
          a: expr.a,
          field: "value"
        };
      }
      return expr;
    case "builtin1":
      return {...expr, arg: nestedExpr(expr.arg, nestedEnv)};
    case "builtin2":
      return {...expr, }
    case "call":
      var nArguments = expr.arguments.map((arg) => nestedExpr(arg, nestedEnv));
      if (nestedEnv.funArgs.has(expr.name)) {
        nestedEnv.funArgs.get(expr.name).forEach((x) => {
          nArguments.push({ tag: "id", name: x, a: {tag: "class", name: "RefClass"} });
        });
      }
      return {...expr, arguments: nArguments};
    case "lookup":
      var tObj = nestedExpr(expr.obj, nestedEnv);
      return {...expr, obj: tObj};
    case "method-call":
      var tObj = nestedExpr(expr.obj, nestedEnv);
      var nArguments = expr.arguments.map((arg) => nestedExpr(arg, nestedEnv));
      return {...expr, obj: tObj, arguments: nArguments};
    case "index-str":
    case "index":
      var tObj = nestedExpr(expr.object, nestedEnv);
      var index = nestedExpr(expr.index, nestedEnv);
      return {...expr, index: index, object: tObj};
    case "cond-expr":
      var ifobj = nestedExpr(expr.ifobj, nestedEnv);
      var elseobj = nestedExpr(expr.elseobj, nestedEnv);
      var condObj = nestedExpr(expr.cond, nestedEnv);
      return {...expr, cond: condObj, ifobj, elseobj};
    case "construct":
      return expr;
  }
}

export function nestedLiteral(literal: Literal, nestedEnv: NestedEnv): Literal {
    switch(literal.tag) {
      case "bool": return literal;
      case "num": return literal;
      case "none": return literal;
      case "str": return literal;
      case "list": 
          const values = literal.value as Array<Expr<Type>>;
          const nValue = values.map(value => nestedExpr(value, nestedEnv));
          return {...literal, value: nValue};
    }
}