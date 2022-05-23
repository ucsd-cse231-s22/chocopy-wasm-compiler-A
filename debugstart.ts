import { parse } from "./parser";
import { tc } from "./type-check";
import { Program } from "./ir";
import { Type } from "./ast";
import { lowerProgram } from './lower';
import { augmentEnv } from "./runner";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import { parser } from "lezer-python";
import { TreeCursor } from "lezer-tree";
var fs = require('fs');

function stringifyTree(t: TreeCursor, source: string, d: number) {
  var str = "";
  var spaces = " ".repeat(d * 2);
  str += spaces + t.type.name;
  if (["Number", "CallExpression", "BinaryExpression", "UnaryExpression", "Boolean"].includes(t.type.name)) {
      str += "-->" + source.substring(t.from, t.to);
  }
  str += "\n";
  if (t.firstChild()) {
      do {
          str += stringifyTree(t, source, d + 1);


      } while (t.nextSibling());
      t.parent();
  }
  return str;
}

function toJson(data: Program<Type>) {
  return JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? `${v}n` : v)
      .replace(/"(-?\d+)n"/g, (_, a) => a));
}

// entry point for debugging
async function debug() {
  var source = `
  class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
      pass
    def new(self:Range,min:int,max:int)->Range:
      self.min=min
      self.max=max
      self.curr=min
      return self
    def hasNext(self:Range)->bool:
      return self.curr<self.max
    def next(self:Range)->int:
      c:int=0
      c=self.curr
      self.curr=self.curr+1
      return c
  a:Range=None
  b:Range=None
  i:int=0
  a=Range().new(0,5)
  b=[i for i in a if i!=2]
  print(b)
  `
  var ast_lz = parser.parse(source);
  // console.log(stringifyTree(ast_lz.cursor(), source, 0));
  fs.writeFileSync("build/ast_lz.txt", stringifyTree(ast_lz.cursor(), source, 0));
  const ast = parse(source);
  // console.log(JSON.stringify(ast, null, 2));
  fs.writeFileSync("build/ast.json", JSON.stringify(ast, null, 2));

  const repl = new BasicREPL(await addLibs());
  const typedAst = tc(repl.currentTypeEnv, ast);
  // console.log(JSON.stringify(typedAst, null, 2));
  fs.writeFileSync("build/typedAst.json", JSON.stringify(typedAst, null, 2));

  const gEnv = augmentEnv(repl.currentEnv, typedAst[0]);
  const ir = lowerProgram(typedAst[0], gEnv);
  // console.log(JSON.stringify(toJson(ir), null, 2));
  fs.writeFileSync("build/ir.json", JSON.stringify(toJson(ir), null, 2));


  // const result = repl.run(source).then(result => {
  //   console.log(result);
  // });
}

debug();

