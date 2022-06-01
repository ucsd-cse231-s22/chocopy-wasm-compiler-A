import { Annotation, Type, Value } from "./ast";
// import { GlobalEnv } from "./compiler";
import { GlobalEnv } from "./compiler";
import { Program } from "./ir";
import { lowerProgram } from "./lower";
import { optimizeProgram } from "./optimization";
import { parse } from "./parser";
import { augmentEnv, Config, run } from "./runner";
import { defaultTypeEnv, GlobalTypeEnv, tc } from "./type-check";

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
      classIndices: new Map(),
      functionNames: new Map(),
      locals: new Set(),
      labels: [],
      offset: 1,
      vtableMethods: []
    };
    this.currentTypeEnv = defaultTypeEnv;
    this.functions = "";
  }
  async run(source : string, optimizationSwitch: "0" | "1" | "2") : Promise<Value<Annotation>> {
    const config : Config = {importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions};
    const [result, newEnv, newTypeEnv, newFunctions, instance] = await run(source, config, optimizationSwitch);
    this.currentEnv = newEnv;
    this.currentTypeEnv = newTypeEnv;
    this.functions += newFunctions;
    const currentGlobals = this.importObject.env || {};
    Object.keys(instance.instance.exports).forEach(k => {
      const maybeGlobal = instance.instance.exports[k];
      if(maybeGlobal instanceof WebAssembly.Global) {
        currentGlobals[k] = maybeGlobal;
      }
    });
    this.importObject.env = currentGlobals;
    return result;
  }
  optimize(source: string, optimizationSwitch: "0" | "1" | "2"): [ Program<Annotation>, Program<Annotation> ] {
    const config : Config = {importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions};
    const parsed = parse(source);
    const [tprogram, tenv] = tc(config.typeEnv, parsed);
    const globalEnv = augmentEnv(config.env, tprogram);
    const irprogram = lowerProgram(tprogram, globalEnv);
    if(!this.importObject.js) {
      const memory = new WebAssembly.Memory({initial:2000, maximum:2000});
      this.importObject.js = { memory: memory };
    }
    return [ irprogram, optimizeProgram(irprogram, optimizationSwitch) ];
  }
  tc(source: string): Type {
    const config: Config = { importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions };
    const parsed = parse(source);
    const [result, _] = tc(this.currentTypeEnv, parsed);
    return result.a.type;
  }
}