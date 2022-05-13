import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import {tc} from './type-check';


// entry point for debugging
async function debug() {
  var source = `
print(1)`
  const ast = parse(source);
  // onsole.log(JSON.stringify(ast, null, 2));

  const repl = new BasicREPL(await addLibs());
  
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

const s = 
`
f:File = None
f = open(0, 3)


f.write(5)
print(f.read(1))
`
