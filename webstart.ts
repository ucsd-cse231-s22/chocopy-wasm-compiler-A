import {BasicREPL} from './repl';
import { Type, Value, Annotation } from './ast';
import { defaultTypeEnv, TypeCheckError } from './type-check';
import { NUM, BOOL, NONE, load_bignum, builtin_bignum, binop_bignum, binop_comp_bignum, bigMath  } from './utils';
import { assert_not_none, importObjectErrors } from './errors';


function stringify(typ: Type, arg: any, loader: WebAssembly.ExportValue) : string {
  switch(typ.tag) {
    case "number":
      return load_bignum(arg, loader).toString();
    case "bool":
      return (arg as boolean)? "True" : "False";
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

function print(typ: Type, arg : number, loader: WebAssembly.ExportValue) : any {
  console.log("Logging from WASM: ", arg);
  const elt = document.createElement("pre");
  document.getElementById("output").appendChild(elt);
  elt.innerText = stringify(typ, arg, loader);
  if(typ.tag === "number")
    return load_bignum(arg, loader);
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

    var importObject = {
      imports: {
        assert_not_none: (arg: any) => assert_not_none(arg),
        print_num: (arg: number) => print(NUM, arg, memoryModule.instance.exports.load),
        print_bool: (arg: number) => print(BOOL, arg, null),
        print_none: (arg: number) => print(NONE, arg, null),
        abs:  (arg: number) => builtin_bignum([arg], bigMath.abs, memoryModule.instance.exports),
        min: (arg1: number, arg2: number) => builtin_bignum([arg1, arg2], bigMath.min, memoryModule.instance.exports),
        max: (arg1: number, arg2: number) => builtin_bignum([arg1, arg2], bigMath.max, memoryModule.instance.exports),
        pow: (arg1: number, arg2: number) => builtin_bignum([arg1, arg2], bigMath.pow, memoryModule.instance.exports),
        $add: (arg1: number, arg2: number) => binop_bignum([arg1, arg2], bigMath.add, memoryModule.instance.exports),
        $sub: (arg1: number, arg2: number) => binop_bignum([arg1, arg2], bigMath.sub, memoryModule.instance.exports),
        $mul: (arg1: number, arg2: number) => binop_bignum([arg1, arg2], bigMath.mul, memoryModule.instance.exports),
        $div: (arg1: number, arg2: number) => binop_bignum([arg1, arg2], bigMath.div, memoryModule.instance.exports),
        $mod: (arg1: number, arg2: number) => binop_bignum([arg1, arg2], bigMath.mod, memoryModule.instance.exports),
        $eq: (arg1: number, arg2: number) => binop_comp_bignum([arg1, arg2], bigMath.eq, memoryModule.instance.exports),
        $neq: (arg1: number, arg2: number) => binop_comp_bignum([arg1, arg2], bigMath.neq, memoryModule.instance.exports),
        $lte: (arg1: number, arg2: number) => binop_comp_bignum([arg1, arg2], bigMath.lte, memoryModule.instance.exports),
        $gte: (arg1: number, arg2: number) => binop_comp_bignum([arg1, arg2], bigMath.gte, memoryModule.instance.exports),
        $lt: (arg1: number, arg2: number) => binop_comp_bignum([arg1, arg2], bigMath.lt, memoryModule.instance.exports),
        $gt: (arg1: number, arg2: number) => binop_comp_bignum([arg1, arg2], bigMath.gt, memoryModule.instance.exports),
      },
      errors: importObjectErrors,
      libmemory: memoryModule.instance.exports,
      memory_values: memory,
      js: {memory: memory}
    };
    var repl = new BasicREPL(importObject);

    function renderResult(result : Value<Annotation>) : void {
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
          elt.innerHTML = `<${result.name} object at ${result.address}`
          break
        default: throw new Error(`Could not render value: ${result}`);
      }
    }

    function renderError(result : any) : void {
      // only `TypeCheckError` has `getA` and `getErrMsg`
      if (result instanceof TypeCheckError) {
        console.log(result.getA()); // could be undefined if no Annotation information is passed to the constructor of TypeCheckError
        console.log(result.getErrMsg());
      }

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
