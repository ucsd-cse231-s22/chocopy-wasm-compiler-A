import { Type} from "./ast";
import { Stmt, Expr, Value, VarInit } from "./ir";

type Env = {
    vars: Map<string, Value<Type>>;
}

export function initializeDefinitions(inits: Array<VarInit<Type>>, env: Env){
    inits.forEach(init => {
        env.vars.set(init.name, init.value);
    });
}

export function foldValue(val: Value<Type>, env: Env): Value<Type>{
    if (val.tag !== "id"){
        return val;
    }
    if (env.vars.has(val.name)){
        val = env.vars.get(val.name);
    }
    return val;
}

export function foldExpression(e: Expr<Type>, env: Env): Expr<Type>{
    switch(e.tag) {
        case "value":
           e.value = foldValue(e.value, env);
           return e;
        case "binop":
            var left = foldValue(e.left, env);
            var right = foldValue(e.right, env);
            if (left.tag === "id" || right.tag === "id")
                return e;
            
    }
}