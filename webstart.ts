import {BasicREPL} from './repl';
import { Type, Value } from './ast';
import { defaultTypeEnv } from './type-check';
import {NUM, BOOL, NONE, STR} from './utils';

function stringify(memory:WebAssembly.Memory, typ: Type, arg: any) : string {
  switch(typ.tag) {
    case "number":
      return (arg as number).toString();
    case "bool":
      return (arg as boolean)? "True" : "False";
    case "str":
      const len = new Uint32Array(memory.buffer, arg, 1)[0];
      return String.fromCharCode.apply(null, new Uint32Array(memory.buffer, arg + 4, len));
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

function print(memory: WebAssembly.Memory, typ: Type, arg : number) : any {
  console.log("Logging from WASM: ", arg);
  const elt = document.createElement("pre");
  document.getElementById("output").appendChild(elt);
  elt.innerText = stringify(memory, typ, arg);
  return arg;
}

function len(memory: WebAssembly.Memory, typ: Type, arg: any): Number {
  switch (typ.tag) {
    case "str":
      return new Uint32Array(memory.buffer, arg, 1)[0];
    default:
      throw new Error(`Undefined function len for type ${typ}`);
  }
}

function assert_not_none(arg: any) : any {
  if (arg === 0)
    throw new Error("RUNTIME ERROR: cannot perform operation on none");
  return arg;
}

function webStart() {
  document.addEventListener("DOMContentLoaded", async function() {

    // https://github.com/mdn/webassembly-examples/issues/5

    const memory = new WebAssembly.Memory({initial:10, maximum:100});
    const memoryModule = await fetch('memory.wasm').then(response => 
      response.arrayBuffer()
    ).then(bytes => 
      WebAssembly.instantiate(bytes, { js: { mem: memory } })
    );

    var importObject = {
      imports: {
        assert_not_none: (arg: any) => assert_not_none(arg),
        print_num: (arg: number) => print(memory, NUM, arg),
        print_bool: (arg: number) => print(memory, BOOL, arg),
        print_str: (arg: number) => print(memory, STR, arg),
        print_none: (arg: number) => print(memory, NONE, arg),
        len: (arg: any) => len(memory, STR, arg),
        len_str: (arg: number) => len(memory, STR, arg),
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        pow: Math.pow
      },
      libmemory: memoryModule.instance.exports,
      memory_values: memory,
      js: {memory: memory}
    };
    var repl = new BasicREPL(importObject);

    function renderResult(result : Value) : void {
      if(result === undefined) { console.log("skip"); return; }
      if (result.tag === "none") return;
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      switch (result.tag) {
        case "num":
          elt.innerText = String(result.value);
          break;
        case "bool":
          elt.innerHTML = (result.value) ? "True" : "False";
          break;
        case "object":
          // handle string as object
          if (result.name === "$strObj") {
            const len = new Uint32Array(memory.buffer, result.address, 1)[0];
            elt.innerHTML = String.fromCharCode.apply(null, new Uint32Array(memory.buffer, result.address + 4, len));
          } else {
            elt.innerHTML = `<${result.name} object at ${result.address}`
          }
          break
        default: throw new Error(`Could not render value: ${result}`);
      }
    }

    function renderError(result : any) : void {
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      elt.setAttribute("style", "color: red");
      elt.innerText = String(result);
    }

    function setupRepl() {
      document.getElementById("output").innerHTML = "";
      const replCodeElement = document.getElementById("next-code") as HTMLTextAreaElement;
      replCodeElement.addEventListener("keypress", (e) => {

        if(e.shiftKey && e.key === "Enter") {
        } else if (e.key === "Enter") {
          e.preventDefault();
          const output = document.createElement("div");
          const prompt = document.createElement("span");
          prompt.innerText = "»";
          output.appendChild(prompt);
          const elt = document.createElement("textarea");
          // elt.type = "text";
          elt.disabled = true;
          elt.className = "repl-code";
          output.appendChild(elt);
          document.getElementById("output").appendChild(output);
          const source = replCodeElement.value;
          elt.value = source;
          replCodeElement.value = "";
          repl.run(source).then((r) => { renderResult(r); console.log ("run finished") })
              .catch((e) => { renderError(e); console.log("run failed", e) });;
        }
      });
    }

    function resetRepl() {
      document.getElementById("output").innerHTML = "";
    }

    document.getElementById("run").addEventListener("click", function(e) {
      repl = new BasicREPL(importObject);
      const source = document.getElementById("user-code") as HTMLTextAreaElement;
      resetRepl();
      repl.run(source.value).then((r) => { renderResult(r); console.log ("run finished") })
          .catch((e) => { renderError(e); console.log("run failed", e) });;
    });
    setupRepl();
  });
}

webStart();
