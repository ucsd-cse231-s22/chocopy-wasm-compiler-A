import {BasicREPL} from './repl';
import { Type, Value,Class } from './ast';
import { defaultTypeEnv } from './type-check';
import { NUM, BOOL, NONE } from './utils';

function stringify(typ: Type, arg: any) : string {
  switch(typ.tag) {
    case "number":
      return (arg as number).toString();
    case "bool":
      return (arg as boolean)? "True" : "False";
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

function print(typ: Type, arg : number) : any {
  console.log("Logging from WASM: ", arg);
  const elt = document.createElement("pre");
  document.getElementById("output").appendChild(elt);
  elt.innerText = stringify(typ, arg);
  return arg;
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
    function console_log_class(repl:BasicREPL, pointer:number, classname:string,level:number) : Array<string>{

      var fields_offset_ = repl.currentEnv.classes.get(classname);
      var fields_type = repl.currentTypeEnv.classes.get(classname)[0];
      var mem = new Uint32Array(memory.buffer);
      var display:Array<string> = [];
      var fields_offset = Array.from(fields_offset_.entries());
      fields_offset.sort((a,b) =>{
        return a[1][0] - b[1][0];
      });
      const space = " ";
      display.push(
      `${space.repeat(level)}${classname} object at addr ${pointer}: {`);
      fields_offset.forEach(thisfield =>{
        var thisfield_type = fields_type.get(thisfield[0]);
        if ( thisfield_type.tag ==="class"){
          if(mem[pointer/4 + thisfield[1][0]] === 0){
            display.push(`${space.repeat(level+2)}${thisfield[0]} : none `);
          }else{
            display.push(`${space.repeat(level+2)}${thisfield[0]}:{`)
            display.push(...console_log_class(repl,mem[pointer/4 + thisfield[1][0]],thisfield_type.name,level +5));
            display.push(`${space.repeat(level+2)}}`)
          }
        }else{
          display.push(`${space.repeat(level+2)}${thisfield[0]} : ${stringify(thisfield_type,mem[pointer/4 + thisfield[1][0]])} `);
        }
      }
      )
      display.push(
      `${space.repeat(level+1)}}`);
      return display;
    }
    var importObject = {
      imports: {
        assert_not_none: (arg: any) => assert_not_none(arg),
        print_num: (arg: number) => print(NUM, arg),
        print_bool: (arg: number) => print(BOOL, arg),
        print_none: (arg: number) => print(NONE, arg),
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
          // elt.innerHTML = `${result.name} object at ${result.address}`
          elt.innerHTML = console_log_class(repl,result.address,result.name,0).join("\n");
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
          repl.run(source).then((r) => { renderResult(r); 
            printMem();
            console.log ("run finished") })
              .catch((e) => { renderError(e); console.log("run failed", e) });;
        }
      });
    }

    function resetRepl() {
      document.getElementById("output").innerHTML = "";
    }
    function printMem(){
      var mem = new Uint32Array(memory.buffer);
      for (let i = 0; i < 25; i++) {
        console.log (mem[i]);
      }
      // mem.forEach((x) => console.log(x));
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
