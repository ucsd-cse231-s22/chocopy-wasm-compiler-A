import { parser } from "lezer-python";
import { TreeCursor } from "lezer";
import { parse } from "./parser";
import { tc } from './type-check';
import * as compiler from "./compiler";

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

var source = `s:set = set()\ns.add(3)\ns.remove(3)`;
// console.log(source.length);
// console.log(source.includes("n)"))
var raw = parser.parse(source)
console.log(stringifyTree(raw.cursor(), source, 0))

let ast = parse(source);
console.log(ast);
// ast = tc(ast);
// console.log("???\n", ast);
// console.log("END", ast[1])

// const out = compiler.compile(source)
// console.log(out)