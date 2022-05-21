import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import { stringifyTree } from "./treeprinter";
import {parser} from 'lezer-python';


// entry point for debugging
async function debug() {
  var source = `
class C(object):
  def f(self: C) -> int:
    if True:
      return 0
    else:
      return`
  source = `
  class C(object):
  x : int = 123
  def getX(self: C) -> int:
    return self.x
  def setX(self: C, x: int):
    self.x = x

c : C = None
c = C()
print(c.getX())
c.setX(42)
print(c.getX())
`;
  console.log(stringifyTree(parser.parse(source).cursor(),source, 0));
  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();
var na = 1
