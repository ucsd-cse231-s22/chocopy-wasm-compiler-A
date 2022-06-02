import { run, Config } from "./runner";
// import { GlobalEnv } from "./compiler";
import { GlobalEnv } from "./compiler";
import { tc, defaultTypeEnv, GlobalTypeEnv } from "./type-check";
import { Value, Type } from "./ast";
import { parse } from "./parser";
import { Vtable } from "./ir";

export let addInBuiltClass: boolean = true;

interface REPL {
  run(source : string) : Promise<any>;
}

export class BasicREPL {
  currentEnv: GlobalEnv
  currentTypeEnv: GlobalTypeEnv
  functions: string
  vTable: Vtable
  importObject: any
  memory: any
  addClassFlag: number
  constructor(importObject : any) {
    this.importObject = importObject;
    if(!importObject.js) {
      const memory = new WebAssembly.Memory({initial:2000, maximum:2000});
      const view = new Int32Array(memory.buffer);
      view[0] = 4;
      this.importObject.js = { memory: memory };
    }
    this.currentEnv = {
      globals: new Map(),
      classes: new Map(),
      locals: new Set(),
      labels: [],
      offset: 1,
      vtable: new Map(),
      methodMap: new Map(),
      fieldMap: new Map(),
      stringVTable: new Map(),
      typedata: new Map(),
    };
    this.currentTypeEnv = defaultTypeEnv;
    this.functions = "";
    this.vTable = new Map();
    this.addClassFlag = 0;
  }
  async run(source : string) : Promise<Value> {
    if (this.addClassFlag === 0) {
      this.addClassFlag = 1;
      addInBuiltClass = true;
    } else {
      addInBuiltClass = false;
    }
    const config : Config = {importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions, vTable: this.vTable};
    const [result, newEnv, newTypeEnv, newFunctions, instance] = await run(source, config);
    this.currentEnv = newEnv;
    this.currentTypeEnv = newTypeEnv;
    this.functions += newFunctions;
    this.vTable = config.vTable;
    const currentGlobals = this.importObject.env || {};
    console.log(instance);
    Object.keys(instance.instance.exports).forEach(k => {
      console.log("Consider key ", k);
      const maybeGlobal = instance.instance.exports[k];
      if(maybeGlobal instanceof WebAssembly.Global) {
        currentGlobals[k] = maybeGlobal;
      }
    });
    this.importObject.env = currentGlobals;
    return result;
  }
  tc(source: string): Type {
    const config: Config = { importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions, vTable: this.vTable };
    const parsed = parse(source);
    const [result, _] = tc(this.currentTypeEnv, parsed);
    return result.a;
  }
}