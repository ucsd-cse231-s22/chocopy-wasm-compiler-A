import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import {tc} from './type-check';
import {run} from './tests/helpers.test';
// entry point for debugging
async function debug() {
  var source = `
print(5)`
  await run(source);
  const output = importObject.output
  console.log(importObject.output.trim().split("\n"));
  // const ast = parse(source);
  // onsole.log(JSON.stringify(ast, null, 2));

  // const repl = new BasicREPL(await addLibs());
  
  // const result = repl.run(source).then(result => {
  //   console.log(result);    
  // })  
}

/*
const global = require("global")
const window = require("global/window")

function setItem(filePath: string, data:Array<number>) {
  console.log('setItem is called');
}
function getItem(filePath: string): string {
  console.log('getItem is called');
  return "";
}

global.window = {}
window.localStorage = {
  m: new Map<string, Array<number>>(),
  setItem:setItem,
  getItem: getItem
}
global.localStorage
*/
/*
global.localStorage = {
  data: {},
  getItem(key) {
      return this.data[key];
  },
  setItem(key, value) {
      this.data[key] = value;
  },
  removeItem(key) {
      delete this.data[key];
  },
  length: 0,
  clear() {

  },
  key(index: number): string {
      return ""
  }
};
*/
debug();

