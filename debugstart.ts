import { parse } from "./parser";
import { Type } from "./ast"
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
a:[bool] = None
i:bool = False
a = [True, False, True, True]
  
for i in a:
  print(i)`
  const ast = parse(source);
  console.log(JSON.stringify(ast, null, 4));
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

