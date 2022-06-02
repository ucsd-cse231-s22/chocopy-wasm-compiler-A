import {BasicREPL} from './repl';
import { Type, Value, Annotation, Class } from './ast';
import { defaultTypeEnv, TypeCheckError } from './type-check';
import { NUM, BOOL, NONE, load_bignum, builtin_bignum, binop_bignum, binop_comp_bignum, bigMath, des_check, bignum_to_i32, save_bignum } from './utils';
import { importObjectErrors } from './errors';

import CodeMirror from 'codemirror';
import "codemirror/addon/edit/closebrackets";
import "codemirror/mode/python/python";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/lint/lint";

import "codemirror/addon/scroll/simplescrollbars";
import "./style.scss";

import { autocompleteHint } from "./autocomplete";
import { default_keywords, default_functions } from "./const";

function stringify(typ: Type, arg: any, loader: WebAssembly.ExportValue) : string {
  switch(typ.tag) {
    case "number":
      return load_bignum(arg, loader).toString();
    case "bool":
      return (arg as boolean) ? "True" : "False";
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

export function print_class(memory: WebAssembly.Memory, repl: BasicREPL, pointer: number, classname: string, level: number, met_object: Map<number, number>, object_number: number, loader : WebAssembly.ExportValue): Array<string> {

  var fields_offset_ = repl.currentEnv.classes.get(classname);
  var fields_type = repl.currentTypeEnv.classes.get(classname)[0];
  var mem = new Uint32Array(memory.buffer);
  var display: Array<string> = [];
  // A[1][0] refers to the offset value of field A, sorted by the offset value to ensure the iteration has a consistent order. 
  var fields_offset = Array.from(fields_offset_.entries());
  fields_offset.sort((a, b) => {
    return a[1][0] - b[1][0];
  });
  // the reason why pointer beacuse mem is u32 array(4 byte addressing) and the pointer value returned by the run method is in raw address(byte adress)
  // surprisingly(since there is also i64 in wasm), the offset stored int the currentenv is in 4 byte addressing.
  const space = " ";
  if (met_object.has(pointer)) {
    display.push(`${space.repeat(level)}displayed ${met_object.get(pointer)}:${classname} object at addr ${pointer}: ...`);
    return display;
  }
  display.push(
    `${space.repeat(level)}${object_number}:${classname} object at addr ${pointer}: {`);
  met_object.set(pointer, object_number)
  fields_offset.forEach(thisfield => {
    var thisfield_type = fields_type.get(thisfield[0]);
    if (thisfield_type.tag === "class") {
      if (mem[pointer / 4 + thisfield[1][0]] === 0) {
        display.push(`${space.repeat(level + 2)}${thisfield[0]} : none `);
      } else {
        display.push(`${space.repeat(level + 2)}${thisfield[0]}:{`)
        display.push(...print_class(memory, repl, mem[pointer / 4 + thisfield[1][0]], thisfield_type.name, level + 5, met_object, object_number + 1, loader));
        display.push(`${space.repeat(level + 2)}}`)
      }
    } else {
      display.push(`${space.repeat(level + 2)}${thisfield[0]} : ${stringify(thisfield_type, mem[pointer / 4 + thisfield[1][0]], loader)} `);
    }
  }
  )
  display.push(
    `${space.repeat(level + 1)}}`);
  return display;
}

function print(typ: Type, arg : number, loader: WebAssembly.ExportValue) : any {
  console.log("Logging from WASM: ", arg);
  const elt = document.createElement("pre");
  document.getElementById("output").appendChild(elt);
  elt.innerText = stringify(typ, arg, loader);
  return arg;
}

function assert_not_none(arg: any): any {
  if (arg === 0)
    throw new Error("RUNTIME ERROR: cannot perform operation on none");
  return arg;
}

function get_code_example(name: string): string {
  if (name === "basic class") {
    return "class C:\n" +
      "    a : int = 1\n" +
      "    b : int = 2\n" +
      "c : C = None\n" +
      "c = C()"
  } else if (name === "nested class") {
    return "class E(object):\n" +
      "    a : int = 1\n" +
      "class C(object):\n" +
      "    a : bool = True\n" +
      "    e : E = None\n" +
      "    def __init__(self: C):\n" +
      "        self.e = E()\n" +
      "    def d(self: C) -> int:\n" +
      "        return 1\n" +
      "c : C = None\n" +
      "c = C()"
  } else if (name === "cyclic linkedlist class") {
    return `class C(object):
  next:C = None
c1:C = None
c2:C = None
c3:C = None
c1 = C()
c2 = C()
c3 = C()
c1.next = c2
c2.next = c3
c3.next = c1
    `
  } else if (name === "linkedlist class") {
    return `class C(object):
  next:C = None
c1:C = None
c2:C = None
c3:C = None
c1 = C()
c2 = C()
c3 = C()
c1.next = c2
c2.next = c3
    `
  }

  else if (name === "uninitialized member variable") {
    return "class E(object):\n" +
      "    a : int = 1\n" +
      "\n" +
      "class C(E):\n" +
      "    a : int = 2\n" +
      "    e : E = None\n" +
      "    def d(self: C) -> int:\n" +
      "        return 1\n" +
      "c : C = None\n" +
      "c = C()"
  }

  return "";
}
// setup codeMirror instance and events

function webStart() {
  document.addEventListener("DOMContentLoaded", async function () {

    // https://github.com/mdn/webassembly-examples/issues/5
    var codeContent: string | ArrayBuffer
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
    const memoryModule = await fetch('memory.wasm').then(response =>
      response.arrayBuffer()
    ).then(bytes =>
      WebAssembly.instantiate(bytes, { js: { mem: memory } })
    );
    function initCodeMirror() {

      let isClassMethod = false;

      const userCode = document.getElementById("user-code") as HTMLTextAreaElement;
      const editorBox = CodeMirror.fromTextArea(userCode, {
        mode: "python",
        theme: "default",
        lineNumbers: true,
        autoCloseBrackets: true,
        lint: true,
        gutters: ["error"],
        extraKeys: {
          "Ctrl+Space": "autocomplete",
        },
        hintOptions: {
          alignWithWord: false,
          completeSingle: false,
        },
        scrollbarStyle: "simple",
      });
      editorBox.on("change", () => {
        userCode.value = editorBox.getValue();
      });
      editorBox.on("inputRead", function onChange(editor, input) {
        if (input.text[0] === ";" || input.text[0] === " " || input.text[0] === ":") {
          isClassMethod = false;
          return;
        } else if (input.text[0] === "." || isClassMethod) {
          //autocomplete class methods
          isClassMethod = true;
          editor.showHint({
            hint: () =>
              autocompleteHint(editor, [], function (e: any, cur: any) {
                return e.getTokenAt(cur);
              }),
          });
        } else {
          //autocomplete variables, names, top-level functions
          editor.showHint({
            hint: () =>
              autocompleteHint(
                editor,
                default_keywords.concat(default_functions),
                function (e: any, cur: any) {
                  return e.getTokenAt(cur);
                }
              ),
          });
        }
      });

      editorBox.on("keydown", (cm, event) => {
        switch (event.code) {
          //reset isClassMethod variable based on enter or space or backspace
          case "Enter":
            isClassMethod = false;
            return;
          case "Space":
            isClassMethod = false;
            return;
          case "Backspace":
            isClassMethod = false;
            return;
        }
      });

      return editorBox;
    }
    const editorBox = initCodeMirror();

    const loader = memoryModule.instance.exports.load;
    var importObject = {
      imports: {
        assert_not_none: (arg: any) => assert_not_none(arg),
        print_num: (arg: number) => print(NUM, arg, loader),
        print_bool: (arg: number) => print(BOOL, arg, null),
        print_none: (arg: number) => print(NONE, arg, null),
        destructure_check: (hashNext: boolean) => des_check(hashNext),
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
        $bignum_to_i32: (arg: number) => bignum_to_i32(arg, loader), 
        $i32_to_bignum: (arg: number) => save_bignum(BigInt(arg), memoryModule.instance.exports), 
      },
      errors: importObjectErrors,
      libmemory: memoryModule.instance.exports,
      memory_values: memory,
      js: { memory: memory }
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
          // elt.innerHTML = `${result.name} object at ${result.address}`
          elt.innerHTML = print_class(memory, repl, result.address, result.name, 0, new Map(), 1, loader).join("\n");
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

        if (e.shiftKey && e.key === "Enter") {
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
          repl.run(source).then((r) => {
            renderResult(r);
            printMem();
            console.log("run finished")
          })
            .catch((e) => { renderError(e); console.log("run failed", e) });;
        }
      });
    }

    function resetRepl() {
      document.getElementById("output").innerHTML = "";
    }
    function printMem() {
      var mem = new Uint32Array(memory.buffer);
      for (let i = 0; i < 25; i++) {
        console.log(mem[i]);
      }
      // mem.forEach((x) => console.log(x));
    }

    function setupCodeExample() {
      const sel = document.querySelector("#exampleSelect") as HTMLSelectElement;
      console.log('editorBox: ', editorBox);
      sel.addEventListener("change", (e) => {
        const code = get_code_example(sel.value);
        if (code !== "") {
          // const usercode = document.getElementById("user-code") as HTMLTextAreaElement;
          editorBox.setValue(code);
        }
      })
    }
    document.getElementById("clear").addEventListener("click", function (e) {
      //repl code disapper (on the right side)
      resetRepl()

      //reset environment
      repl = new BasicREPL(importObject)

      //clear editor code
      var element = document.querySelector(".CodeMirror") as any
      var editor = element.CodeMirror
      editor.setValue("")
      editor.clearHistory()

    })

    document.getElementById("load").addEventListener("change", function (e) {
      resetRepl()
      repl = new BasicREPL(importObject)

      var input: any = e.target
      var reader = new FileReader()

      var editorBox = document.querySelector(".CodeMirror") as any;
      const codeNode = editorBox.CodeMirror;

      codeNode.setValue("")
      reader.onload = function () {

        if (codeNode.value != "") {
          codeNode.setValue("")
          codeNode.setValue(reader.result)
        } else {
          codeNode.setValue(reader.result)
        }

      }
      reader.readAsText(input.files[0])

    })
    // window.onload = function(e: Event){
    //   var f = document.getElementById("load")
    //   var reader = new FileReader();
    //   var readerContent
    //   f.onchange = function(){
    //     readerContent = reader.result
    //   }
    //   var contentToLoad = readerContent as string

    //   var codeNode= document.getElementById("user-code") as HTMLTextAreaElement
    //   codeNode.value = contentToLoad
    // }

    document.getElementById("save").addEventListener("click", function (e) {
      var FileSaver = require("file-saver");
      var title = prompt("please input file name: ", "untitled")

      //If we click "cancel", the title returned is null
      if (title != null) {
        var codeNode = document.getElementById("user-code") as HTMLTextAreaElement
        var code = codeNode.value
        var blob = new Blob([code], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, title)
      }
    })

    document.getElementById("run").addEventListener("click", function (e) {
      repl = new BasicREPL(importObject);
      const source = document.getElementById("user-code") as HTMLTextAreaElement;
      resetRepl();
      repl.run(source.value).then((r) => { renderResult(r); console.log("run finished") })
        .catch((e) => { renderError(e); console.log("run failed", e) });;
    });
    setupRepl();
    setupCodeExample();
  });
}

webStart();
