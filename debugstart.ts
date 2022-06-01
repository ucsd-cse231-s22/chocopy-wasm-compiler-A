import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
def fun1() -> int:
  i:int=3
  if(True):
      i=4
  else:
      i=5
  return i

print(fun1())`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source, "3").then(result => {
    console.log(result);    
  })  
}

debug();

