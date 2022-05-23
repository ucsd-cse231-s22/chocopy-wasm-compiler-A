import {parser} from "lezer-python";
import { TreeCursor} from "lezer-tree";
import { Program, Expr, Stmt, UniOp, BinOp, Parameter, Type, FunDef, VarInit, Class, Literal, NonLocalDecl, GlobalDecl } from "./ast";
import { NUM, BOOL, NONE, CLASS, STR } from "./utils";
import { stringifyTree } from "./treeprinter";

export function traverseLiteral(c : TreeCursor, s : string, isVarInit: boolean = false) : Literal {
  switch(c.type.name) {
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
    case "String":
      let stringVal = s.substring(c.from, c.to);
      if (stringVal.length < 2 || stringVal[0] !== '"' || stringVal[stringVal.length-1] !== '"') {
        //TODO:
        throw new Error("Invalid string literal");
      }
      stringVal = stringVal.substring(1, stringVal.length-1);
      return {
        tag: "str",
        value: stringVal
      }
    case "ArrayExpression":
      if (isVarInit) {
        throw new Error("Not literal");
      }
      c.firstChild();
      const value :Array<Expr<null>> = [];
      while (c.nextSibling()) {
        value.push(traverseExpr(c, s));
        c.nextSibling();
      }
      c.parent();
      return {tag: "list", value };
    default:
      throw new Error("Not literal")
  }
}

export function traverseExpr(c : TreeCursor, s : string) : Expr<null> {
  switch(c.type.name) {
    case "Number":
    case "Boolean":
    case "ArrayExpression":
    case "String":
    case "None":
      return { 
        tag: "literal", 
        value: traverseLiteral(c, s)
      }
    case "VariableName":
      return {
        tag: "id",
        name: s.substring(c.from, c.to)
      }
    case "CallExpression":
      c.firstChild();
      const callExpr = traverseExpr(c, s);
      c.nextSibling(); // go to arglist
      let args = traverseArguments(c, s);
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
        var expr : Expr<null>;
        if (callName === "print" || callName === "abs" || callName === "len") {
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
          expr = { tag: "call", name: callName, arguments: args};
        }
        return expr;  
      } else {
        throw new Error("Unknown target while parsing assignment");
      }

    case "BinaryExpression":
      c.firstChild(); // go to lhs 
      const lhsExpr = traverseExpr(c, s);
      c.nextSibling(); // go to op
      var opStr = s.substring(c.from, c.to);
      var op;
      switch(opStr) {
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
      const rhsExpr = traverseExpr(c, s);
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
      var expr = traverseExpr(c, s);
      c.parent();
      return expr;
    case "UnaryExpression":
      c.firstChild(); // Focus on op
      var opStr = s.substring(c.from, c.to);
      var op;
      switch(opStr) {
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
      var expr = traverseExpr(c, s);
      c.parent();
      return {
        tag: "uniop",
        op: op,
        expr: expr
      }
    case "MemberExpression":
      c.firstChild(); // Focus on object
      var objExpr = traverseExpr(c, s);
      c.nextSibling(); // Focus on .
      if (c.node.type.name === '.') {
        c.nextSibling(); // Focus on property
        var propName = s.substring(c.from, c.to);
        c.parent();
        return {
          tag: "lookup",
          obj: objExpr,
          field: propName
        }
      } else if (c.node.type.name === '[') {
        c.nextSibling();
        var indexExpr = traverseExpr(c, s);
        c.nextSibling();
        //@ts-ignore
        if (c.node.type.name !== ']') {
          //TODO:
          throw new Error("PARSE ERROR: ");
        }
        c.parent();
        return {"tag": "index", index: indexExpr, object: objExpr};
      } else {
        //TODO:
        throw new Error("PARSE ERROR: ");
      }
    case "self":
      return {
        tag: "id",
        name: "self"
      };
    case "ConditionalExpression":
      c.firstChild(); // variable name
      const ifobj = traverseExpr(c, s);
      c.nextSibling(); // if
      c.nextSibling(); // condition
      const condObj = traverseExpr(c, s);
      c.nextSibling(); //else
      c.nextSibling();
      const elseobj = traverseExpr(c, s);
      c.parent();
      return {tag: "cond-expr", ifobj, elseobj, cond: condObj};
    default:
      throw new Error("Could not parse expr at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseArguments(c : TreeCursor, s : string) : Array<Expr<null>> {
  c.firstChild();  // Focuses on open paren
  const args = [];
  c.nextSibling();
  while(c.type.name !== ")") {
    let expr = traverseExpr(c, s);
    args.push(expr);
    c.nextSibling(); // Focuses on either "," or ")"
    c.nextSibling(); // Focuses on a VariableName
  } 
  c.parent();       // Pop to ArgList
  return args;
}

export function traverseIfBody(c: TreeCursor, s : string) : Stmt<null> {
  c.nextSibling(); // Focus on cond
  var cond = traverseExpr(c, s);
  // console.log("Cond:", cond);
  c.nextSibling(); // Focus on : thn
  c.firstChild(); // Focus on :
  var thn = [];
  while(c.nextSibling()) {  // Focus on thn stmts
    thn.push(traverseStmt(c,s));
  }
  // console.log("Thn:", thn);
  c.parent();
  if (c.nextSibling()) {
    if (s.substring(c.from, c.to) === "elif") {
    var elifStmt = traverseIfBody(c , s);
    return {tag: "if", cond: cond, els: elifStmt, thn: thn};
    } else if (s.substring(c.from, c.to) === "else") {
      var [elsestmts] = traverseElseBody(c, s);
      return {tag: "if", cond: cond, els: elsestmts, thn: thn};
    }
  }
  return {tag: "if", cond: cond, thn: thn};
}

export function traverseElseBody(c: TreeCursor, s : string) : [Stmt<null>[]] {
  c.nextSibling(); // Focus on : thn
  c.firstChild(); // Focus on :
  var thn = [];
  while(c.nextSibling()) {  // Focus on thn stmts
    thn.push(traverseStmt(c,s));
  }
  // console.log("Thn:", thn);
  c.parent();
  return [thn];
}

export function traverseStmt(c : TreeCursor, s : string) : Stmt<null> {
  switch(c.node.type.name) {
    case "ReturnStatement":
      c.firstChild();  // Focus return keyword
      
      var value : Expr<null>;
      if (c.nextSibling()) // Focus expression
        value = traverseExpr(c, s);
      else
        value = { tag: "literal", value: { tag: "none" } };
      c.parent();
      return { tag: "return", value };
    case "AssignStatement":
      c.firstChild(); // go to name
      const target = traverseExpr(c, s);
      c.nextSibling(); // go to equals
      c.nextSibling(); // go to value
      var value = traverseExpr(c, s);
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
      } else if (target.tag === "index") {
        return {
          tag: "index-assign",
          obj: target.object,
          index: target.index,
          value: value
        }
      } else {
        throw new Error("Unknown target while parsing assignment");
      }
    case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s);
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
      var stmt = traverseIfBody(c ,s);
      c.parent();
      return stmt;
    case "WhileStatement":
      c.firstChild(); // Focus on while
      c.nextSibling(); // Focus on condition
      var cond = traverseExpr(c, s);
      c.nextSibling(); // Focus on body

      var body = [];
      c.firstChild(); // Focus on :
      while(c.nextSibling()) {
        body.push(traverseStmt(c, s));
      }
      c.parent(); 
      c.parent();
      return {
        tag: "while",
        cond,
        body
      }
    case "ForStatement":
      c.firstChild(); // for
      c.nextSibling(); // itertor
      const iterator = s.substring(c.from, c.to);
      c.nextSibling(); // in
      c.nextSibling(); // iterable
      const iterexpr = traverseExpr(c, s);
      c.nextSibling(); // Body
      var body = [];
      c.firstChild(); // Focus on :
      while(c.nextSibling()) {
        body.push(traverseStmt(c, s));
      }
      c.parent();
      c.parent();
      return {
        tag: "for",
        iterator: iterator,
        iterable: iterexpr,
        body: body
      }
    case "PassStatement":
      return { tag: "pass" }
    default:
      throw new Error("Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseType(c : TreeCursor, s : string) : Type {
  // For now, always a VariableName
  if (c.node.type.name === "ArrayExpression") {
    c.firstChild(); // [
    c.nextSibling();
    const listType = traverseType(c, s);
    c.nextSibling();
    //@ts-ignore
    if (c.node.type.name !== ']') {
      //TODO: throw error
      throw Error("PARSE ERROR");
    }
    c.parent();
    return {"tag": "list", type: listType};
  }
  let name = s.substring(c.from, c.to);
  switch(name) {
    case "int": return NUM;
    case "bool": return BOOL;
    case "str": return STR;
    case "None": {
      //TODO
      throw new Error("Parse error NONE not allowed");
    }
    default: return CLASS(name);
  }
}

export function traverseParameters(c : TreeCursor, s : string) : Array<Parameter<null>> {
  c.firstChild();  // Focuses on open paren
  const parameters = [];
  c.nextSibling(); // Focuses on a VariableName
  while(c.type.name !== ")") {
    let name = s.substring(c.from, c.to);
    c.nextSibling(); // Focuses on "TypeDef", hopefully, or "," if mistake
    let nextTagName = c.type.name; // NOTE(joe): a bit of a hack so the next line doesn't if-split
    if(nextTagName !== "TypeDef") { throw new Error("Missed type annotation for parameter " + name)};
    c.firstChild();  // Enter TypeDef
    c.nextSibling(); // Focuses on type itself
    let typ = traverseType(c, s);
    c.parent();
    c.nextSibling(); // Move on to comma or ")"
    parameters.push({name, type: typ});
    c.nextSibling(); // Focuses on a VariableName
  }
  c.parent();       // Pop to ParamList
  return parameters;
}

export function traverseVarInit(c : TreeCursor, s : string) : VarInit<null> {
  c.firstChild(); // go to name
  var name = s.substring(c.from, c.to);
  c.nextSibling(); // go to : type

  if(c.type.name !== "TypeDef") {
    c.parent();
    throw Error("invalid variable init");
  }
  c.firstChild(); // go to :
  c.nextSibling(); // go to type
  const type = traverseType(c, s);
  c.parent();
  
  c.nextSibling(); // go to =
  c.nextSibling(); // go to value
  var value = traverseLiteral(c, s, true);
  c.parent();

  return { name, type, value }
}

export function traverseFunDef(c : TreeCursor, s : string) : FunDef<null> {
  c.firstChild();  // Focus on def
  c.nextSibling(); // Focus on name of function
  var name = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on ParamList
  var parameters = traverseParameters(c, s)
  c.nextSibling(); // Focus on Body or TypeDef
  let ret : Type = NONE;
  if(c.type.name === "TypeDef") {
    c.firstChild();
    ret = traverseType(c, s);
    c.parent();
    c.nextSibling();
  }
  c.firstChild();  // Focus on :
  var inits = [];
  var body = [];
  var fundefs :FunDef<null>[] = [];
  const globaldecls : Array<GlobalDecl<null>> = [];
  const nonlocaldecls : Array<NonLocalDecl<null>> = [];
  
  var hasChild = c.nextSibling();

  while(hasChild) {
    if (isVarInit(c, s)) {
      inits.push(traverseVarInit(c, s));
    } else if (isFunDef(c, s)) {
      fundefs.push(traverseFunDef(c, s));
    } else if (isDecl(c, s)) {
      c.firstChild(); // 
      if (s.substring(c.from, c.to) === "global") {
        c.nextSibling();
        globaldecls.push({name: s.substring(c.from, c.to)});
      } else if (s.substring(c.from, c.to) === "nonlocal") {
        c.nextSibling();
        nonlocaldecls.push({name: s.substring(c.from, c.to)});
      } else {
        //TODO:
        throw new Error("PARSE ERROR: unknown scope statement");
      }
      c.parent();
    } else {
      break;
    }
    hasChild = c.nextSibling();
  }

  while(hasChild) {
    body.push(traverseStmt(c, s));
    hasChild = c.nextSibling();
  } 
  
  // console.log("Before pop to body: ", c.type.name);
  c.parent();      // Pop to Body
  // console.log("Before pop to def: ", c.type.name);
  c.parent();      // Pop to FunctionDefinition
  return { name, parameters, ret, inits, body, fundefs, globaldecls, nonlocaldecls }
}

export function traverseClass(c : TreeCursor, s : string) : Class<null> {
  const fields : Array<VarInit<null>> = [];
  const methods : Array<FunDef<null>> = [];
  c.firstChild();
  c.nextSibling(); // Focus on class name
  const className = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on arglist/superclass
  c.firstChild(); // '('
  c.nextSibling();
  let superclassName = '';
  if (c.node.type.name !== ')') {
    superclassName = s.substring(c.from, c.to);
  }
  if (superclassName === '' && className !== 'object') {
    //TODO:
    throw new Error("Invalid class signature");
  }
  c.parent();
  c.nextSibling(); // Focus on body
  c.firstChild();  // Focus colon
  while(c.nextSibling()) { // Focuses first field
    if (isVarInit(c, s)) {
      fields.push(traverseVarInit(c, s));
    } else if (isFunDef(c, s)) {
      methods.push(traverseFunDef(c, s));
    } else {
      throw new Error(`Could not parse the body of class: ${className}` );
    }
  } 
  c.parent();
  c.parent();

  // if (!methods.find(method => method.name === "__init__")) {
    // const parentInitStmt :Stmt<null> = {tag: "expr", expr: {tag: "call", name: `${superclassName}$__init__`, arguments: [{tag: "id", name: "self"}]}};
    // methods.push({ name: "__init__", parameters: [{ name: "self", type: CLASS(className) }], ret: NONE, inits: [], body: [parentInitStmt], fundefs: [], globaldecls: [], nonlocaldecls: [] });
    // methods.push({ name: "__init__", parameters: [{ name: "self", type: CLASS(className) }], ret: NONE, inits: [], body: [], fundefs: [], globaldecls: [], nonlocaldecls: [] });
  // }
  // if (className !== "object") {
  //   fields.push({name: "super", type: CLASS(superclassName), value: { tag: "none" } });
  // }
  return {
    name: className,
    fields,
    methods,
    superclass: superclassName
  };
}

export function traverseDefs(c : TreeCursor, s : string) : [Array<VarInit<null>>, Array<FunDef<null>>, Array<Class<null>>] {
  const inits : Array<VarInit<null>> = [];
  const funs : Array<FunDef<null>> = [];
  const classes : Array<Class<null>> = [];

  while(true) {
    if (isVarInit(c, s)) {
      inits.push(traverseVarInit(c, s));
    } else if (isFunDef(c, s)) {
      funs.push(traverseFunDef(c, s));
    } else if (isClassDef(c, s)) {
      classes.push(traverseClass(c, s));
    } else {
      return [inits, funs, classes];
    }
    c.nextSibling();
  }

}

export function isVarInit(c : TreeCursor, s : string) : Boolean {
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

export function isFunDef(c : TreeCursor, s : string) : Boolean {
  return c.type.name === "FunctionDefinition";
}

export function isDecl(c : TreeCursor, s : string) : Boolean {
  return c.type.name === "ScopeStatement";
}

export function isClassDef(c : TreeCursor, s : string) : Boolean {
  return c.type.name === "ClassDefinition";
}

export function traverse(c : TreeCursor, s : string) : Program<null> {
  switch(c.node.type.name) {
    case "Script":
      const inits : Array<VarInit<null>> = [];
      const fundefs : Array<FunDef<null>> = [];
      const classes : Array<Class<null>> = [];
      const stmts : Array<Stmt<null>> = [];
      var hasChild = c.firstChild();

      while(hasChild) {
        if (isVarInit(c, s)) {
          inits.push(traverseVarInit(c, s));
        } else if (isFunDef(c, s)) {
          fundefs.push(traverseFunDef(c, s));
        } else if (isClassDef(c, s)) {
          classes.push(traverseClass(c, s));
        } else {
          break;
        }
        hasChild = c.nextSibling();
      }

      while(hasChild) {
        stmts.push(traverseStmt(c, s));
        hasChild = c.nextSibling();
      } 
      c.parent();
      return { fundefs, inits, classes, stmts };
    default:
      throw new Error("Could not parse program at " + c.node.from + " " + c.node.to);
  }
}

export function parse(source : string) : Program<null> {
  source = `
  class object():
    def __init__(self: object):
      pass\n
  class RefClass(object):
    value:int = 0\n` + source;
  const t = parser.parse(source);
  const str = stringifyTree(t.cursor(), source, 0);
  console.log(str);
  return traverse(t.cursor(), source);
}
