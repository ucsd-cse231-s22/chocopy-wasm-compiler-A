import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
a:[int] = None
a = [1,3,3*4+4,7,9]
a[3] = 6
print(a[3])
`

  var source1 = `
class C(object):
  x:int = 3
  y:int = 4
aclass:C = None
aclass = C()
aclass.x = 4
print(aclass.x)`
  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

