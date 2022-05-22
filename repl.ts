import { run, Config, augmentEnv } from "./runner";
// import { GlobalEnv } from "./compiler";
import { GlobalEnv } from "./compiler";
import { tc, defaultTypeEnv, GlobalTypeEnv } from "./type-check";
import { Program } from "./ir";
import { optimizeProgram } from "./optimization";
import { Value, Type, Annotation } from "./ast";
import { parse } from "./parser";
import { lowerProgram } from "./lower";

interface REPL {
  run(source : string) : Promise<any>;
}

export class BasicREPL {
  currentEnv: GlobalEnv
  currentTypeEnv: GlobalTypeEnv
  functions: string
  importObject: any
  memory: any
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
      offset: 1
    };
    this.currentTypeEnv = defaultTypeEnv;
    this.functions = "";
  }
  async run(source : string) : Promise<Value<Annotation>> {
    const config : Config = {importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions};
    const [result, newEnv, newTypeEnv, newFunctions, instance] = await run(source, config);
    this.currentEnv = newEnv;
    this.currentTypeEnv = newTypeEnv;
    this.functions += newFunctions;
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
  optimize(source: string): [ Program<Annotation>, Program<Annotation> ] {
    // console.log(stmt);
    const config : Config = {importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions};
    const parsed = parse(source);
    const [tprogram, tenv] = tc(config.typeEnv, parsed);
    const globalEnv = augmentEnv(config.env, tprogram);
    const irprogram = lowerProgram(tprogram, globalEnv);
    if(!this.importObject.js) {
      const memory = new WebAssembly.Memory({initial:2000, maximum:2000});
      this.importObject.js = { memory: memory };
    }
    return [ irprogram, optimizeProgram(irprogram) ];
  }
  tc(source: string): Type {
    const config: Config = { importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions };
    const parsed = parse(source);
    const [result, _] = tc(this.currentTypeEnv, parsed);
    return result.a.type;
  }
}