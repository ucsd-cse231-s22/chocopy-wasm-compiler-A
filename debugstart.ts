import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  f:File = None
  f = open(0, 3)`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  const repl = new BasicREPL(await addLibs());
  
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
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

debug();


