import {BasicREPL} from './repl';
import { Type, Value } from './ast';
import { defaultTypeEnv } from './type-check';
import { NUM, FLOAT, BOOL, NONE, ELLIPSIS } from './utils';
import { gcd, lcm, factorial } from './stdlib/math';

function stringify(typ: Type, arg: any) : string {
  switch(typ.tag) {
    case "number":
      return (arg as number).toString();
    case "float":
      return (arg as number).toString();
    case "bool":
      return (arg as boolean)? "True" : "False";
    case "none":
      return "None";
    case "...":
      return "Ellipsis";
    case "class":
      return typ.name;
  }
}

// function print(typ: Type, arg : number) : any {
//   console.log("Logging from WASM: ", arg);
//   const elt = document.createElement("pre");
//   document.getElementById("output").appendChild(elt);
//   elt.innerText = stringify(typ, arg);
//   return arg;
// }


var print = (function(){
  var res = ""

  return function(typ?: Type, arg? : number){
    if(typ!==undefined){
      console.log("Logging from WASM: ", arg);
      res += stringify(typ, arg) + " ";
      console.log(typ)
    } else{
      console.log("New Line")
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      if (res.length>0){
        res = res.substring(0, res.length-1)
      }
      elt.innerText = res+"\n";
      res = ""
    }
    return 0
    
  }

  }());



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
        print_num: (arg: number) => print(NUM, arg),
        print_bool: (arg: number) => print(BOOL, arg),
        print_none: (arg: number) => print(NONE, arg),
        print_newline: (arg: number) => print(undefined, arg),
        print_ellipsis: (arg: number) => print(ELLIPSIS, arg),
        print_float: (arg: number) => print(FLOAT, arg),
        int: (arg: any) => arg,
        bool: (arg: any) => arg !== 0,
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        pow: Math.pow,
        // NOTE: keep these files in sync with this
        // - runner.ts WASM
        // - type-check.ts
        // - parser.ts
        // - import-object.test.ts
        gcd: gcd,
        lcm: lcm,
        factorial: factorial,
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
        case "float":
          elt.innerText = String(result.value);
          break;
        case "bool":
          elt.innerHTML = (result.value) ? "True" : "False";
          break;
        case "object":
          elt.innerHTML = `<${result.name} object at ${result.address}`
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
