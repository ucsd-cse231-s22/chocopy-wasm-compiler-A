import { parser } from "lezer-python";
import { TreeCursor } from "lezer-tree";
import { Program, Expr, Stmt, UniOp, BinOp, Parameter, Type, FunDef, VarInit, Class, Literal, Annotation, Location } from "./ast";
import { NUM, BOOL, NONE, CLASS } from "./utils";
import { stringifyTree } from "./treeprinter";

export type ParserEnv = {
  lineBreakIndices: Array<number>; // For calculating row/col
}

/**
 * Binary search on sorted array. 
 * Returns the index at which target should be inserted in arr and the value at that index of arr.
 * 
 * @param arr sorted array
 * @param target target to insert
 * @returns idx to insert target in arr and the value at that index of arr
 */
export function binarySearch(arr: Array<number>, target: number): number{
  var left = 0;
  var right = arr.length;
  var ans = 0;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (arr[mid] < target) {
      ans = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  // console.log(arr, target, ans)
  return ans;
}

export function indToLoc(srcIdx: number, env: ParserEnv): Location {
  const row = binarySearch(env.lineBreakIndices, srcIdx) + 1;
  const col = srcIdx - env.lineBreakIndices[row - 1];
  return { row: row, col: col, srcIdx: srcIdx }
}

export function nextLineBreakLoc(loc: Location, env: ParserEnv): Location {
  const row = loc.row;
  const col = env.lineBreakIndices[row] - env.lineBreakIndices[row - 1];
  return { row: row, col: col, srcIdx: env.lineBreakIndices[row] }
}


function wrap_locs<T extends Function>(traverser: T, storeSrc: boolean = false): T {
  return <any>function (c: TreeCursor, s: string, env: ParserEnv, ...args: any) {
    const fromLoc = indToLoc(c.from, env);
    const node = traverser(c, s, env, ...args);
    const endLoc = indToLoc(c.to, env);
    const eolLoc = nextLineBreakLoc(endLoc, env);
    if (storeSrc) // only store full src in the Program node
      return { ...node, a: { ...node.a, fromLoc: fromLoc, endLoc: endLoc, eolLoc: eolLoc, src: s } }
    else return { ...node, a: { ...node.a, fromLoc: fromLoc, endLoc: endLoc, eolLoc: eolLoc } }
  };
}

export const traverseLiteral = wrap_locs(traverseLiteralHelper);
export function traverseLiteralHelper(c: TreeCursor, s: string, env: ParserEnv): Literal<Annotation> {
  switch (c.type.name) {
    case "Number":
      return {
        tag: "num",
        value: Number(s.substring(c.from, c.to))
      }
    case "Boolean":
      return {
        tag: "bool",
        value: s.substring(c.from, c.to) === "True"
      }
    case "None":
      return {
        tag: "none"
      }
    default:
      throw new Error("Not literal")
  }
}

export const traverseExpr = wrap_locs(traverseExprHelper);
export function traverseExprHelper(c: TreeCursor, s: string, env: ParserEnv): Expr<Annotation> {
  switch (c.type.name) {
    case "Number":
    case "Boolean":
    case "None":
      return {
        tag: "literal",
        value: traverseLiteral(c, s, env)
      }
    case "VariableName":
      return {
        tag: "id",
        name: s.substring(c.from, c.to)
      }
    case "CallExpression":
      c.firstChild();
      const callExpr = traverseExpr(c, s, env);
      c.nextSibling(); // go to arglist
      let args = traverseArguments(c, s, env);
      c.parent(); // pop CallExpression


      if (callExpr.tag === "lookup") {
        return {
          tag: "method-call",
          obj: callExpr.obj,
          method: callExpr.field,
          arguments: args
        }
      } else if (callExpr.tag === "id") {
        const callName = callExpr.name;
        var expr: Expr<Annotation>;
        if (callName === "print" || callName === "abs") {
          expr = {
            tag: "builtin1",
            name: callName,
            arg: args[0]
          };
        } else if (callName === "max" || callName === "min" || callName === "pow") {
          expr = {
            tag: "builtin2",
            name: callName,
            left: args[0],
            right: args[1]
          }
        }
        else {
          expr = { tag: "call", name: callName, arguments: args };
        }
        return expr;
      } else {
        throw new Error("Unknown target while parsing assignment");
      }

    case "BinaryExpression":
      c.firstChild(); // go to lhs 
      const lhsExpr = traverseExpr(c, s, env);
      c.nextSibling(); // go to op
      var opStr = s.substring(c.from, c.to);
      var op;
      switch (opStr) {
        case "+":
          op = BinOp.Plus;
          break;
        case "-":
          op = BinOp.Minus;
          break;
        case "*":
          op = BinOp.Mul;
          break;
        case "//":
          op = BinOp.IDiv;
          break;
        case "%":
          op = BinOp.Mod;
          break
        case "==":
          op = BinOp.Eq;
          break;
        case "!=":
          op = BinOp.Neq;
          break;
        case "<=":
          op = BinOp.Lte;
          break;
        case ">=":
          op = BinOp.Gte;
          break;
        case "<":
          op = BinOp.Lt;
          break;
        case ">":
          op = BinOp.Gt;
          break;
        case "is":
          op = BinOp.Is;
          break;
        case "and":
          op = BinOp.And;
          break;
        case "or":
          op = BinOp.Or;
          break;
        default:
          throw new Error("Could not parse op at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to))
      }
      c.nextSibling(); // go to rhs
      const rhsExpr = traverseExpr(c, s, env);
      c.parent();
      return {
        tag: "binop",
        op: op,
        left: lhsExpr,
        right: rhsExpr
      }
    case "ParenthesizedExpression":
      c.firstChild(); // Focus on (
      c.nextSibling(); // Focus on inside
      var expr = traverseExpr(c, s, env);
      c.parent();
      return expr;
    case "UnaryExpression":
      c.firstChild(); // Focus on op
      var opStr = s.substring(c.from, c.to);
      var op;
      switch (opStr) {
        case "-":
          op = UniOp.Neg;
          break;
        case "not":
          op = UniOp.Not;
          break;
        default:
          throw new Error("Could not parse op at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to))
      }
      c.nextSibling(); // go to expr
      var expr = traverseExpr(c, s, env);
      c.parent();
      return {
        tag: "uniop",
        op: op,
        expr: expr
      }
    case "MemberExpression":
      c.firstChild(); // Focus on object
      var objExpr = traverseExpr(c, s, env);
      c.nextSibling(); // Focus on .
      c.nextSibling(); // Focus on property
      var propName = s.substring(c.from, c.to);
      c.parent();
      return {
        tag: "lookup",
        obj: objExpr,
        field: propName
      }
    case "self":
      return {
        tag: "id",
        name: "self"
      };
    default:
      throw new Error("Could not parse expr at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseArguments(c: TreeCursor, s: string, env: ParserEnv): Array<Expr<Annotation>> {
  c.firstChild();  // Focuses on open paren
  const args = [];
  c.nextSibling();
  while (c.type.name !== ")") {
    let expr = traverseExpr(c, s, env);
    args.push(expr);
    c.nextSibling(); // Focuses on either "," or ")"
    c.nextSibling(); // Focuses on a VariableName
  }
  c.parent();       // Pop to ArgList
  return args;
}

export const traverseStmt = wrap_locs(traverseStmtHelper);
export function traverseStmtHelper(c: TreeCursor, s: string, env: ParserEnv): Stmt<Annotation> {
  switch (c.node.type.name) {
    case "ReturnStatement":
      c.firstChild();  // Focus return keyword

      var value: Expr<Annotation>;
      if (c.nextSibling()) // Focus expression
        value = traverseExpr(c, s, env);
      else
        value = { tag: "literal", value: { tag: "none" } };
      c.parent();
      return { tag: "return", value };
    case "AssignStatement":
      c.firstChild(); // go to name
      const target = traverseExpr(c, s, env);
      c.nextSibling(); // go to equals
      c.nextSibling(); // go to value
      var value = traverseExpr(c, s, env);
      c.parent();

      if (target.tag === "lookup") {
        return {
          tag: "field-assign",
          obj: target.obj,
          field: target.field,
          value: value
        }
      } else if (target.tag === "id") {
        return {
          tag: "assign",
          name: target.name,
          value: value
        }
      } else {
        throw new Error("Unknown target while parsing assignment");
      }
    case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s, env);
      c.parent(); // pop going into stmt
      return { tag: "expr", expr: expr }
    // case "FunctionDefinition":
    //   c.firstChild();  // Focus on def
    //   c.nextSibling(); // Focus on name of function
    //   var name = s.substring(c.from, c.to);
    //   c.nextSibling(); // Focus on ParamList
    //   var parameters = traverseParameters(c, s)
    //   c.nextSibling(); // Focus on Body or TypeDef
    //   let ret : Type = NONE;
    //   if(c.type.name === "TypeDef") {
    //     c.firstChild();
    //     ret = traverseType(c, s);
    //     c.parent();
    //   }
    //   c.firstChild();  // Focus on :
    //   var body = [];
    //   while(c.nextSibling()) {
    //     body.push(traverseStmt(c, s));
    //   }
    // console.log("Before pop to body: ", c.type.name);
    //   c.parent();      // Pop to Body
    // console.log("Before pop to def: ", c.type.name);
    //   c.parent();      // Pop to FunctionDefinition
    //   return {
    //     tag: "fun",
    //     name, parameters, body, ret
    //   }
    case "IfStatement":
      c.firstChild(); // Focus on if
      c.nextSibling(); // Focus on cond
      var cond = traverseExpr(c, s, env);
      // console.log("Cond:", cond);
      c.nextSibling(); // Focus on : thn
      c.firstChild(); // Focus on :
      var thn = [];
      while (c.nextSibling()) {  // Focus on thn stmts
        thn.push(traverseStmt(c, s, env));
      }
      // console.log("Thn:", thn);
      c.parent();

      c.nextSibling(); // Focus on else
      c.nextSibling(); // Focus on : els
      c.firstChild(); // Focus on :
      var els = [];
      while (c.nextSibling()) { // Focus on els stmts
        els.push(traverseStmt(c, s, env));
      }
      c.parent();
      c.parent();
      return {
        tag: "if",
        cond: cond,
        thn: thn,
        els: els
      }
    case "WhileStatement":
      c.firstChild(); // Focus on while
      c.nextSibling(); // Focus on condition
      var cond = traverseExpr(c, s, env);
      c.nextSibling(); // Focus on body

      var body = [];
      c.firstChild(); // Focus on :
      while (c.nextSibling()) {
        body.push(traverseStmt(c, s, env));
      }
      c.parent();
      c.parent();
      return {
        tag: "while",
        cond,
        body
      }
    case "PassStatement":
      return { tag: "pass" }
    default:
      throw new Error("Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseType(c: TreeCursor, s: string, env: ParserEnv): Type {
  // For now, always a VariableName
  let name = s.substring(c.from, c.to);
  switch (name) {
    case "int": return NUM;
    case "bool": return BOOL;
    default: return CLASS(name);
  }
}

export const traverseParameter = wrap_locs(traverseParameterHelper);
export function traverseParameterHelper(c: TreeCursor, s: string, env: ParserEnv): Parameter<Annotation> {
  let name = s.substring(c.from, c.to);
  c.nextSibling(); // Focuses on "TypeDef", hopefully, or "," if mistake
  let nextTagName = c.type.name; // NOTE(joe): a bit of a hack so the next line doesn't if-split
  if (nextTagName !== "TypeDef") { throw new Error("Missed type annotation for parameter " + name) };
  c.firstChild();  // Enter TypeDef
  c.nextSibling(); // Focuses on type itself
  let typ = traverseType(c, s, env);
  c.parent();
  return { name, type: typ };
}


export function traverseParameters(c: TreeCursor, s: string, env: ParserEnv): Array<Parameter<Annotation>> {
  c.firstChild();  // Focuses on open paren
  const parameters = [];
  c.nextSibling(); // Focuses on a VariableName
  while (c.type.name !== ")") {
    parameters.push(traverseParameter(c, s, env));
    c.nextSibling(); // Move on to comma or ")"
    c.nextSibling(); // Focuses on a VariableName or 
  }
  c.parent();       // Pop to ParamList
  return parameters;
}

export const traverseVarInit = wrap_locs(traverseVarInitHelper);
export function traverseVarInitHelper(c: TreeCursor, s: string, env: ParserEnv): VarInit<Annotation> {
  c.firstChild(); // go to name
  var name = s.substring(c.from, c.to);
  c.nextSibling(); // go to : type

  if (c.type.name !== "TypeDef") {
    c.parent();
    throw Error("invalid variable init");
  }
  c.firstChild(); // go to :
  c.nextSibling(); // go to type
  const type = traverseType(c, s, env);
  c.parent();

  c.nextSibling(); // go to =
  c.nextSibling(); // go to value
  var value = traverseLiteral(c, s, env);
  c.parent();

  return { name, type, value }
}

export const traverseFunDef = wrap_locs(traverseFunDefHelper);
export function traverseFunDefHelper(c: TreeCursor, s: string, env: ParserEnv): FunDef<Annotation> {
  c.firstChild();  // Focus on def
  c.nextSibling(); // Focus on name of function
  var name = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on ParamList
  var parameters = traverseParameters(c, s, env)
  c.nextSibling(); // Focus on Body or TypeDef
  let ret: Type = NONE;
  if (c.type.name === "TypeDef") {
    c.firstChild();
    ret = traverseType(c, s, env);
    c.parent();
    c.nextSibling();
  }
  c.firstChild();  // Focus on :
  var inits = [];
  var body = [];

  var hasChild = c.nextSibling();

  while (hasChild) {
    if (isVarInit(c, s, env)) {
      inits.push(traverseVarInit(c, s, env));
    } else {
      break;
    }
    hasChild = c.nextSibling();
  }

  while (hasChild) {
    body.push(traverseStmt(c, s, env));
    hasChild = c.nextSibling();
  }

  // console.log("Before pop to body: ", c.type.name);
  c.parent();      // Pop to Body
  // console.log("Before pop to def: ", c.type.name);
  c.parent();      // Pop to FunctionDefinition
  return { name, parameters, ret, inits, body }
}

export const traverseClass = wrap_locs(traverseClassHelper);
export function traverseClassHelper(c: TreeCursor, s: string, env: ParserEnv): Class<Annotation> {
  const fields: Array<VarInit<Annotation>> = [];
  const methods: Array<FunDef<Annotation>> = [];
  c.firstChild();
  c.nextSibling(); // Focus on class name
  const className = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on arglist/superclass
  c.nextSibling(); // Focus on body
  c.firstChild();  // Focus colon
  while (c.nextSibling()) { // Focuses first field
    if (isVarInit(c, s, env)) {
      fields.push(traverseVarInit(c, s, env));
    } else if (isFunDef(c, s, env)) {
      methods.push(traverseFunDef(c, s, env));
    } else {
      throw new Error(`Could not parse the body of class: ${className}`);
    }
  }
  c.parent();
  c.parent();

  if (!methods.find(method => method.name === "__init__")) {
    methods.push({ name: "__init__", parameters: [{ name: "self", type: CLASS(className) }], ret: NONE, inits: [], body: [] });
  }
  return {
    name: className,
    fields,
    methods
  };
}

export function traverseDefs(c: TreeCursor, s: string, env: ParserEnv): [Array<VarInit<Annotation>>, Array<FunDef<Annotation>>, Array<Class<Annotation>>] {
  const inits: Array<VarInit<Annotation>> = [];
  const funs: Array<FunDef<Annotation>> = [];
  const classes: Array<Class<Annotation>> = [];

  while (true) {
    if (isVarInit(c, s, env)) {
      inits.push(traverseVarInit(c, s, env));
    } else if (isFunDef(c, s, env)) {
      funs.push(traverseFunDef(c, s, env));
    } else if (isClassDef(c, s, env)) {
      classes.push(traverseClass(c, s, env));
    } else {
      return [inits, funs, classes];
    }
    c.nextSibling();
  }

}

export function isVarInit(c: TreeCursor, s: string, env: ParserEnv): Boolean {
  if (c.type.name === "AssignStatement") {
    c.firstChild(); // Focus on lhs
    c.nextSibling(); // go to : type

    const isVar = c.type.name as any === "TypeDef";
    c.parent();
    return isVar;
  } else {
    return false;
  }
}

export function isFunDef(c: TreeCursor, s: string, env: ParserEnv): Boolean {
  return c.type.name === "FunctionDefinition";
}

export function isClassDef(c: TreeCursor, s: string, env: ParserEnv): Boolean {
  return c.type.name === "ClassDefinition";
}

export const traverse = wrap_locs(traverseHelper, true);
export function traverseHelper(c: TreeCursor, s: string, env: ParserEnv): Program<Annotation> {
  switch (c.node.type.name) {
    case "Script":
      const inits: Array<VarInit<Annotation>> = [];
      const funs: Array<FunDef<Annotation>> = [];
      const classes: Array<Class<Annotation>> = [];
      const stmts: Array<Stmt<Annotation>> = [];
      var hasChild = c.firstChild();

      while (hasChild) {
        if (isVarInit(c, s, env)) {
          inits.push(traverseVarInit(c, s, env));
        } else if (isFunDef(c, s, env)) {
          funs.push(traverseFunDef(c, s, env));
        } else if (isClassDef(c, s, env)) {
          classes.push(traverseClass(c, s, env));
        } else {
          break;
        }
        hasChild = c.nextSibling();
      }

      while (hasChild) {
        stmts.push(traverseStmt(c, s, env));
        hasChild = c.nextSibling();
      }
      c.parent();
      return { funs, inits, classes, stmts };
    default:
      throw new Error("Could not parse program at " + c.node.from + " " + c.node.to);
  }
}

export function parse(source: string): Program<Annotation> {
  const env: ParserEnv = {
    lineBreakIndices: [],
  }
  source += "\n";
  env.lineBreakIndices = [-1];
  for (var i = 0; i < source.length; i++) {
    if (source[i] == '\n') {
      env.lineBreakIndices.push(i);
    }
  }
  const t = parser.parse(source);
  const str = stringifyTree(t.cursor(), source, 0);
  const ast = traverse(t.cursor(), source, env);
  return ast;
}
