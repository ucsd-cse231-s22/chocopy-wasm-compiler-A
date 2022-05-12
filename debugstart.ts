import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
idx : int = 0
y : int = 0
x : [int] = None
x = [1,2,3,4,5]

while idx < 5:
  y = y + x[idx]
  idx = idx + 1
print(y)
`
  var source2 = `
x : int = 2
y : int = 3
print(x+y)
`
  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

