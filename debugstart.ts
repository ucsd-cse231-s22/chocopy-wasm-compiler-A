import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import * as fs from 'fs';

// entry point for debugging
async function debug() {
  var source = fs.readFileSync('source.py','utf8').toString();
  const ast = parse(source);
  
  const repl = new BasicREPL(importObject);
  const result = repl.optimize(source)
  // .then(result => {
  //   console.log(result);    
  // })  
}

debug();

