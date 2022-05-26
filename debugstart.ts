import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  
  var source = `
def f(x:int, y:int):
    print(x + y)
f(100000000000000000000000, 100000000000000000000001)`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();


