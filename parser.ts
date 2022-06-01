import { parser } from "@lezer/python";
import { TreeCursor } from "@lezer/common";
import { Program, Expr, Stmt, UniOp, BinOp, Parameter, Type, FunDef, VarInit, Class, Literal, Annotation, Location, NonlocalVarInit, TypeVar, DestructuringAssignment, AssignVar } from "./ast";
import { NUM, BOOL, NONE, CLASS, CALLABLE, LIST } from "./utils";
import { stringifyTree } from "./treeprinter";

const MKLAMBDA = "mklambda";

export type ParserEnv = {
  lineBreakIndices: Array<number>; // index of line break characters in the source code; used to calculate row/col
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

/**
 * Convert a index in source to source `Location` object, which contains row and col information
 * @param srcIdx index in source
 * @param env ParserEnv, uses lineBreakIndices
 * @returns Location object of the corresponding index
 */
export function indToLoc(srcIdx: number, env: ParserEnv): Location {
  const row = binarySearch(env.lineBreakIndices, srcIdx) + 1;
  const col = srcIdx - env.lineBreakIndices[row - 1];
  return { row: row, col: col, srcIdx: srcIdx }
}

export function nextLineBreakLoc(loc: Location, env: ParserEnv): Location {
  // if ending index is at the beginning of a new line, then the line break should be at one row above
  const row = (loc.col === 1) ? loc.row - 1 : loc.row;
  const col = env.lineBreakIndices[row] - env.lineBreakIndices[row - 1];
  return { row: row, col: col, srcIdx: env.lineBreakIndices[row] }
}

/**
 * Wrapper around the regular traverser to give the generated AST node a Location information.
 * This requires each AST node to have its own traverser: 
 *   An AST node should be generated by traversing a collection of 'continuous' lezer tree nodes.
 *   The traverser should start at the highest left-most lezer node, 
 *   and end at the highest right-most lezer node.
 *   Usually, the start and end node are the same: the AST node 
 *   corresponds to a sub-lezer tree rooted at a single node.
 * @param traverser regular lezer tree to AST traverser 
 * @param storeSrc if the location added should contain source string
 * @returns new traverser that adds location information onto the AST node that the regular traverser produces
 */
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
        value: BigInt(s.substring(c.from, c.to))
      }
    case "Boolean":
      return {
        tag: "bool",
        value: s.substring(c.from, c.to) === "True",
      };
    case "None":
      return {
        tag: "none"
      }
    case "VariableName":
      let vname = s.substring(c.from, c.to).trim();
      if (vname !== "__ZERO__") {
        throw new Error("ParseError: Not a literal");
      }
      return { 
        tag: "zero" 
      };
    default:
      throw new Error("Not literal");
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
    case "ArrayComprehensionExpression":
      c.firstChild(); // '['
      c.nextSibling();
      const left = traverseExpr(c, s, env); // left
      c.nextSibling(); // for
      c.nextSibling();
      const elem = traverseExpr(c, s, env); // elem
      c.nextSibling(); // in
      c.nextSibling();
      // conditions for parsing iterable to be added --!!
      const iterable = traverseExpr(c, s, env); // iterable
      c.nextSibling();
      var cond;
      if (s.substring(c.from, c.to) !== ']'){
        if (s.substring(c.from, c.to) !== 'if')
          throw new Error("PARSE TYPE ERROR: only if condition allowed in comprehensions");
        c.nextSibling();
        cond = traverseExpr(c, s, env); // cond which evaluates to a binary expr
      }
      c.parent();
      return {
        tag: "list-comp",
        left,
        elem,
        iterable,
        cond
      }
    case "CallExpression":
      c.firstChild();
      const callExpr = traverseExpr(c, s, env);

      c.nextSibling(); // go to arglist
      if (callExpr.tag === "id" && callExpr.name === MKLAMBDA) {
        c.firstChild();
        c.nextSibling(); 
        const callableType = traverseType(c, s, env);
        if (callableType.tag !== "callable") {
          throw new Error(`First argument to ${MKLAMBDA} must be callable.`);
        }

        c.nextSibling(); // Focus on ,
        c.nextSibling(); // Focus on lambda
        let maybeLambda = c;
        if(maybeLambda.type.name !== "LambdaExpression") {
          throw new Error(`Second argument to ${MKLAMBDA} must be a lamdba.`);
        }
        c.firstChild(); // Focus on object
        c.nextSibling(); // Focus on lambda
        var params = traverseLambdaParams(c, s);
        c.nextSibling(); 
        c.nextSibling(); 
        var expr = traverseExpr(c, s, env);
        c.parent();
        c.parent();
        c.parent();
        return {
          tag: "lambda",
          type: callableType,
          params,
          expr,
        };
      }

      let args = traverseArguments(c, s, env);
      c.parent(); // pop CallExpression

      if (callExpr.tag === "lookup") {
        return {
          tag: "method-call",
          obj: callExpr.obj,
          method: callExpr.field,
          arguments: args,
        };
      } else if (callExpr.tag === "id") {
        const callName = callExpr.name;
        var expr: Expr<Annotation>;
        if (callName === "print" || callName === "abs" || callName === "len") {
          return {
            tag: "builtin1",
            name: callName,
            arg: args[0],
          };
        } else if (callName === "max" || callName === "min" || callName === "pow") {
          return {
            tag: "builtin2",
            name: callName,
            left: args[0],
            right: args[1]
          }
        } 
      } 
      return { tag: "call", fn: callExpr, arguments: args};
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
          break;
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
          throw new Error(
            "Could not parse op at " +
              c.from +
              " " +
              c.to +
              ": " +
              s.substring(c.from, c.to)
          );
      }
      c.nextSibling(); // go to rhs
      const rhsExpr = traverseExpr(c, s, env);
      c.parent();
      return {
        tag: "binop",
        op: op,
        left: lhsExpr,
        right: rhsExpr,
      };
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
          throw new Error(
            "Could not parse op at " +
              c.from +
              " " +
              c.to +
              ": " +
              s.substring(c.from, c.to)
          );
      }
      c.nextSibling(); // go to expr
      var expr = traverseExpr(c, s, env);
      c.parent();
      return {
        tag: "uniop",
        op: op,
        expr: expr,
      };
    case "MemberExpression":
      c.firstChild(); // Focus on object
      var objExpr = traverseExpr(c, s, env);
      c.nextSibling(); // Focus on . or [
      if (s.substring(c.from, c.to) == "[") {
        // Start with :
        c.nextSibling(); // Focus on start index or : or index
        if (s.substring(c.from, c.to) == ":") {
          c.nextSibling(); // Focus on end index or ]
          if (s.substring(c.from, c.to) == "]") {
            c.parent();
            return { tag: "slice", obj: objExpr };
          }
          var endIndex = traverseExpr(c, s, env);
          c.parent();
          return { tag: "slice", obj: objExpr, index_e: endIndex };
        }

        // Start index or index
        var startIndex = traverseExpr(c, s, env);
        c.nextSibling(); // Focus on : or ]
        if (s.substring(c.from, c.to) == "]") {
          c.parent();
          return { tag: "index", obj: objExpr, index: startIndex };
        }

        // Start index and :
        c.nextSibling(); // Focus on end index or ]
        if (s.substring(c.from, c.to) == "]") {
          c.parent();
          return { tag: "slice", obj: objExpr, index_s: startIndex };
        }
        var endIndex = traverseExpr(c, s, env);
        c.parent();
        return {
          tag: "slice",
          obj: objExpr,
          index_s: startIndex,
          index_e: endIndex,
        };
      } else {
        c.nextSibling(); // Focus on property
        var propName = s.substring(c.from, c.to);
        c.parent();
        return {
          tag: "lookup",
          obj: objExpr,
          field: propName,
        };
      }
    case "self":
      return {
        tag: "id",
        name: "self",
      };

    case "ArrayExpression":
      const elements = traverseArray(c, s, env);
      // if there are multiple brackets like [1,a][x], treat first section as array construction and second as index
      return {
        tag: "construct-list",
        items: elements,
      };

    case "TupleExpression": // a, b, c = (1, 2, 3)
      let tupleElements: Expr<Annotation>[] = [];
      c.firstChild();
      c.nextSibling();
      while (s.substring(c.from, c.to).trim() !== ")") {
        tupleElements.push(traverseExpr(c, s, env));
        c.nextSibling();
        c.nextSibling();
      }
      c.parent();
      return {
        tag: "construct-list",
        items: tupleElements,
      };
    case "ConditionalExpression":
      c.firstChild();
      var thn = traverseExpr(c, s, env);
      c.nextSibling();//if
      c.nextSibling();
      var cond:any = traverseExpr(c, s, env);
      c.nextSibling();//else
      c.nextSibling();
      var els = traverseExpr(c, s, env);
      c.parent();
      return {tag:"if-expr", thn, cond, els};

    default:
      throw new Error(
        "Could not parse expr at " +
          c.from +
          " " +
          c.to +
          ": " +
          s.substring(c.from, c.to)
      );
  }
}

export function traverseTypeArray(c: TreeCursor, s: string, env: ParserEnv): Array<Type> {
  c.firstChild(); // Focus on [
  c.nextSibling(); // Focus on inside
  var elements = [];
  while (c.type.name !== "]") {
    elements.push(traverseType(c, s, env));
    c.nextSibling(); // Focuses on either "," or ")"
    c.nextSibling(); // Focuses on a VariableName
  }
  c.parent();
  return elements;
}

export function traverseArray(c: TreeCursor, s: string, env: ParserEnv): Array<Expr<Annotation>> {
  c.firstChild(); // Focus on [
  c.nextSibling(); // Focus on inside
  var elements = [];
  while (c.type.name !== "]") {
    elements.push(traverseExpr(c, s, env));
    c.nextSibling(); // Focuses on either "," or ")"
    c.nextSibling(); // Focuses on a VariableName
  }
  c.parent();
  return elements;
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

export function traverseLambdaParams(c : TreeCursor, s : string) : Array<string> {
  let hasNext = c.firstChild();  // Focuses on open paren
  if (!hasNext) {
    return [];
  }
  const params = [];
  while(hasNext) {
    let paramName = s.substring(c.from, c.to);
    params.push(paramName);
    c.nextSibling(); // Focuses on either "," or ":"
    hasNext = c.nextSibling(); 
  } 
  c.parent();       // Pop to ArgList
  return params;
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
      if (c.type.name === "MemberExpression") {
        c.nextSibling();
        // @ts-ignore
        if (c.type.name === "AssignOp") {
          c.prevSibling();
          let target = traverseExpr(c, s, env);
          c.nextSibling(); // go to equals
          c.nextSibling(); // go to value
          let value = traverseExpr(c, s, env);
          if (target.tag === "lookup") {
            c.parent();
            return {
              tag: "field-assign",
              obj: target.obj,
              field: target.field,
              value: value,
            }
          } else if (target.tag === "index") {
            c.parent();
            return {
              tag: "index-assign",
              obj: target.obj,
              index: target.index,
              value: value,
            };
          } else {
            throw new Error("Unknown target while parsing assignment");
          }
        }
        c.prevSibling();
      }
      const destruct = traverseDestructure(c, s, env);
      c.nextSibling(); // go to equals
      c.nextSibling(); // go to value
      var value = traverseExpr(c, s, env);
      if (c.nextSibling()) {
        value = {tag: "array-expr", items: [value]};
        while (c.nextSibling()) {
          value.items.push(traverseExpr(c, s, env));
          c.nextSibling();
        }
      }
      c.parent();
      return {
        tag: "assign",
        destruct: destruct,
        value: value,
      };
   case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s, env);
      c.parent(); // pop going into stmt
      return { tag: "expr", expr: expr };
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
      var els = [];
      while(c.nextSibling()) {  // Focus on thn stmts
        thn.push(traverseStmt(c,s, env));
      }
      // console.log("Thn:", thn);
      c.parent();
      
      if (c.nextSibling()) {  // Focus on else
        c.nextSibling(); // Focus on : els
        c.firstChild(); // Focus on :
        while(c.nextSibling()) { // Focus on els stmts
          els.push(traverseStmt(c, s, env));
        }
        c.parent();  
      }
      c.parent();
      return {
        tag: "if",
        cond: cond,
        thn: thn,
        els: els,
      };
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
        body,
      };
    case "PassStatement":
      return { tag: "pass" }
    case "ContinueStatement":
        return { tag: "continue" }
    case "BreakStatement":
        return { tag: "break" }
    case "ForStatement":
      c.firstChild(); // Focus on for
      c.nextSibling(); // Focus on variablename
      if(c.type.name!="VariableName")
       throw new Error("Iterator must be a variable")
      var iterator = s.substring(c.from, c.to);   // considering iterator as string
      c.nextSibling(); // Focus on in
      c.nextSibling(); // Focus on values/list
      var values = traverseExpr(c, s, env);
      c.nextSibling(); // Focus on Body
      var body = [];
      c.firstChild(); // Focus on :
      while(c.nextSibling()) {
        body.push(traverseStmt(c, s, env));
      }
      c.parent(); 
      c.parent();
      return {tag:"for",iterator,values,body}
    default:
      throw new Error(
        "Could not parse stmt at " +
          c.node.from +
          " " +
          c.node.to +
          ": " +
          s.substring(c.from, c.to)
      );
  }
}

function traverseDestructure(c: TreeCursor, s: string, env: ParserEnv): DestructuringAssignment<Annotation> {
  const vars: AssignVar<Annotation>[] = [];
  if (c.type.name === "ArrayExpression" || c.type.name === "TupleExpression") {
    c.firstChild();
    c.nextSibling();
    vars.push(traverseAssignVar(c, s, env));
    c.nextSibling();
    while (c.name !== "]" && c.name !== ")") {
      c.nextSibling();
      if (c.name === "]" || c.name === ")") break;
      let variable = traverseAssignVar(c, s, env);
      vars.push(variable);
      c.nextSibling();
    }
    c.parent();
    return {
      isSimple: false,
      vars,
    };
  } else {
    vars.push(traverseAssignVar(c, s, env));
    let isSimple = true;
    c.nextSibling();
    while (c.name !== "AssignOp") {
      isSimple = false;
      c.nextSibling();
      if (c.name === "AssignOp") break;
      let variable = traverseAssignVar(c, s, env);
      vars.push(variable);
      c.nextSibling();
    }
    c.prevSibling();
    return {
      isSimple,
      vars,
    };
  }
}

function traverseAssignVar(c: TreeCursor, s: string, env: ParserEnv): AssignVar<Annotation> {
  // todo check if target is *
  let target = traverseExpr(c, s, env);
  let ignorable = false;
  if (target.tag !== "id" && target.tag !== "lookup" && target.tag !== "index") {
    throw new Error("Unknown variable expression");
  }
  if (target.tag === "id" && target.name === "_") {
    ignorable = true;
  }
  return {
    target,
    ignorable,
    star: false,
  };
}

export function traverseType(c : TreeCursor, s : string, env: ParserEnv) : Type {
  switch (c.type.name) {
    case "ArrayExpression":
      const elements = traverseTypeArray(c, s, env);
      // if there are multiple brackets like [1,a][x], treat first section as array construction and second as index
      return {
        tag: "list",
        itemType: elements[0],
      };
    case "VariableName":
      let name = s.substring(c.from, c.to);
      switch(name) {
        case "int": return NUM;
        case "bool": return BOOL;
        default: return CLASS(name);
      }
    case "None": // None is mentionable in Callable types
      return NONE;
    case "MemberExpression":
      c.firstChild(); // focus on class
      let cname = s.substring(c.from, c.to).trim();
      if(cname === "Callable") {
          c.nextSibling();
          c.nextSibling();
          const params = traverseTypeList(c, s, env);
          c.nextSibling();
          c.nextSibling();
          const ret = traverseType(c, s, env);
          c.parent();
          // return NONE;
          return CALLABLE(params, ret);
      }
      c.nextSibling(); // focus on [
      c.nextSibling(); // focus on VariableName or ]
      const params : Array<Type> = [];
      while (c.type.name as any !== "]") {
        params.push(traverseType(c, s, env));
        c.nextSibling(); // focus on , or ]
        c.nextSibling(); // focus on VariableName or ]
      }
      c.parent();
      return { tag: "class", name: cname, params }
    default:
      throw new Error("ParseError : Could not parse type");
  }
}

export function traverseTypeList(c: TreeCursor, s: string, env: ParserEnv): Array<Type> {
  // console.error(s.substring(c.from, c.to));
  c.firstChild(); // Focuses on open paren
  const types = [];
  c.nextSibling(); // Focuses on a VariableName
  while (c.type.name !== "]") {
    let typ = traverseType(c, s, env);
    c.nextSibling(); // Focuses on "TypeDef", hopefully, or "," if mistake
    c.nextSibling(); // Move on to comma or ")"
    types.push(typ);
  }
  c.parent(); // Pop to ParamList
  return types;
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
  c.parent(); // Pop to ParamList
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

  return { name, type, value };
}

export const traverseTypeVarInit = wrap_locs(traverseTypeVarInitHelper);
export function traverseTypeVarInitHelper(c : TreeCursor, s : string, env: ParserEnv) : TypeVar<Annotation> {
  c.firstChild(); // focus on type var name
  var name = s.substring(c.from, c.to).trim();
  c.nextSibling(); // focus on AssignOp
  c.nextSibling(); // focus on CallExpression

  c.firstChild(); // focus on TypeVar
  c.nextSibling(); // focus on ArgList

  c.firstChild();  // Focuses on open parens
  c.nextSibling(); // Focuses on a String | close parens
  let canonicalName : string = name;
  if (c.type.name === "String") {
    canonicalName = s.substring(c.from + 1, c.to - 1).trim();
    c.nextSibling(); // Focus on or close parens
  }

  if (c.type.name !== ")") {
    throw Error("ParseError : constrained type variables are not supported.");
  }

  c.parent(); // go to ArgList
  c.parent(); // go to CallExpression
  c.parent(); // go to AssigmentStatement

  // TODO : Need to delete this once we have removed types from AST
  const types : Array<Type> = [];
  return { name, canonicalName, types};
}

export function traverseScopeDef(c : TreeCursor, s : string, env: ParserEnv) : NonlocalVarInit<null> {
  c.firstChild(); // go to scope
  if(c.type.name !== "nonlocal") {
    c.parent();
    throw Error("invalid variable scope");
  }
  c.nextSibling(); // go to name
  const name = s.substring(c.from, c.to);
  c.parent();

  return { name };
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
  c.firstChild(); // Focus on :
  var inits = [];
  var nonlocals: Array<NonlocalVarInit<Annotation>> = [];
  var children: Array<FunDef<Annotation>> = [];
  var body = [];

  var hasChild = c.nextSibling();

  while(hasChild) {
    if (isVarInit(c, s, env)) {
      inits.push(traverseVarInit(c, s, env));
    } else if (isScopeDef(c, s)) {
      nonlocals.push(traverseScopeDef(c, s, env));
    } else if (isFunDef(c, s, env)) {
      children.push(traverseFunDef(c, s, env));
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
  c.parent(); // Pop to Body
  // console.log("Before pop to def: ", c.type.name);
  c.parent();      // Pop to FunctionDefinition
  return { name, parameters, ret, inits, body, nonlocals, children };
}

export function traverseGenericParams(c : TreeCursor, s : string) : Array<string> {
  const typeParams : Array<string> = [];
  if (c.type.name !== "ArgList") {
    return typeParams;
  }

  c.firstChild(); // Focus on (
  c.nextSibling(); // Focus on first argument
  let arg1C = c; 
  if (arg1C.type.name !== "MemberExpression") {
    c.parent();
    return typeParams;
  }

  c.firstChild();
  if (s.substring(c.from, c.to).trim() !== "Generic") {
    c.parent();
    c.parent();
    return typeParams;
  }

  c.nextSibling(); // Focus on [
  c.nextSibling(); // Focus on VariableName or ]
  let typeVarC = c;
  while (typeVarC.type.name !== "]") {
    typeParams.push(s.substring(typeVarC.from, typeVarC.to).trim());
    typeVarC.nextSibling(); // Focus on , or ]
    typeVarC.nextSibling(); // Focus on VariableName
  }

  c.parent(); // / Go back to MemberExpression
  c.parent(); // Go back to ArgList

  return typeParams;
}

export const traverseClass = wrap_locs(traverseClassHelper);
export function traverseClassHelper(c: TreeCursor, s: string, env: ParserEnv): Class<Annotation> {
  const fields: Array<VarInit<Annotation>> = [];
  const methods: Array<FunDef<Annotation>> = [];
  c.firstChild();
  c.nextSibling(); // Focus on class name
  const className = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on arglist/superclass/generic type vars(s)

  const typeParams : Array<string> = traverseGenericParams(c, s);

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
    const typeVars : Type[] = typeParams.map(tp => {
      return CLASS(tp);
    })
    methods.push({ name: "__init__", parameters: [{ name: "self", type: CLASS(className, typeVars) }], ret: NONE, inits: [], body: [], nonlocals: [], children: [] });
  }
  return {
    name: className,
    typeParams,
    fields,
    methods,
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

    const isVar = (c.type.name as any) === "TypeDef";
    c.parent();
    return isVar;
  } else {
    return false;
  }
}

export function isTypeVarInit(c : TreeCursor, s : string) : Boolean {
  if (c.type.name === "AssignStatement") {
    c.firstChild(); // Focus on lhs
    c.nextSibling(); // go to AssignOp
    c.nextSibling(); // go to CallExpression

    if (c.type.name as any !== "CallExpression") {
      c.parent();
      return false;
    }

    c.firstChild(); // Focus on TypeVar
    if (c.type.name as any !== "VariableName" || s.substring(c.from, c.to).trim() !== "TypeVar") {
      c.parent();
      c.parent();
      return false;
    }

    c.parent();
    c.parent();
    return true;  
  } else {
    return false;
  }
}

export function isScopeDef(c : TreeCursor, s : string) : Boolean {
  return c.type.name === "ScopeStatement";
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
      const typeVarInits : Array<TypeVar<Annotation>> = [];
      var hasChild = c.firstChild();

      while (hasChild) {
        if (isVarInit(c, s, env)) {
          inits.push(traverseVarInit(c, s, env));
        } else if (isTypeVarInit(c, s)) {
          typeVarInits.push(traverseTypeVarInit(c, s, env));
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
      return { funs, inits, typeVarInits, classes, stmts };
    default:
      throw new Error(
        "Could not parse program at " + c.node.from + " " + c.node.to
      );
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
