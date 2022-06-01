import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  def printRetNone(x: int):
  print(x)
i: int = 0
while i<11:
   printRetNone(i) if i % 2 == 0 else None
   i=i+1`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source, "4").then(result => {
    console.log(result);    
  })  
}

debug();

