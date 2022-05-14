import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
class Single(object):
  a : int = 1

  def sum1(self: Single) -> int: 
    return self.a

class Two(Single):
  b : int = 2

  def sum2(self: Two) -> int: 
    return self.a + self.b

l : Two = None 
l = Two()
print(l.sum2())`
console.log()
  const ast = parse(source);
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

