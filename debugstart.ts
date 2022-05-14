import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
class C(object):
  def f(self: C) -> int:
    if True:
      return 0
    else:
      return`
//   var source = `
//  a:int = 10
//  if a:
//    print(a)
//   `
const ast = parse(source);
console.log(ast);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

