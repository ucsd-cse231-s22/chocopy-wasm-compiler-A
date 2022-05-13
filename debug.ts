import { parser } from "lezer-python";
import { TreeCursor } from "lezer";
import { parse } from "./parser";
import { tc } from './type-check';
import * as compiler from "./compiler";
import { BasicREPL } from "./repl";
import { importObject } from "./tests/import-object.test";
import {run, typeCheck} from "./tests/helpers.test";


export function stringifyTree(t: TreeCursor, source: string, d: number){
    var str = "";
    var spaces = " ".repeat(d*2);
    str += spaces + t.type.name;
    if(["Number", "CallExpression", "BinaryExpression", "UnaryExpression", "ParamList", "VariableName", "TypeDef"].includes(t.type.name)){
        str += "-->" + source.substring(t.from, t.to); 
    }
    str += "\n";
    if(t.firstChild()){
        do{
            str += stringifyTree(t, source, d + 1);
        }while(t.nextSibling());
        t.parent(); 
    }
    return str; 
}

// var source = `s:set = set()\ns.add(3)\ns.remove(3)`;
var source = `
x:set = set()
x = {1,2,3}
x.has(1)
`; // s:set = {3,5,7}\n3 in s
/* DONE:
s = {3,5,7}
s = set()
s:set = {3,5,7}
s:set = set()
s:set = None

*/
// console.log(source.length);
// console.log(source.includes("n)"))
var raw = parser.parse(source)
console.log(stringifyTree(raw.cursor(), source, 0))

let parsed = parse(source);
console.log(parsed);


const result = run(source);

console.log("END");