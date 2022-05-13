import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
class A(object):
	x: int = 1

	def increment(self: A, i: int) -> int:
			return self.x + i
	

class B(A):

	y:int = 10
	
a : B = None
a = B()
print(a.increment(1))
`
  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

