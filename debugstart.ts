import { parse } from "./parser";
import { Type } from "./ast"
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
class B(object):
  x:int = 4
  def printB(self : B, y:int):
    def printB1():
      nonlocal y
      print(y)
    printB1()
    print(self.x)

b:B = None
b = B()
b.printB(12)
`
  const ast = parse(source);
  console.log(JSON.stringify(ast, null, 4));
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

// export type test = { a: boolean, b:number }
// let g = [{a: true, b:1}, {a: false, b:2}];
// console.log(g.map(t => {
//   if (t.a)
//     return t.b
// }).filter(r => r !== undefined));

