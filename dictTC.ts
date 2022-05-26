import { Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, Class } from './ast';
import { NUM, BOOL, NONE, CLASS, DICT } from './utils';
import { emptyEnv } from './compiler';
import { GlobalTypeEnv, LocalTypeEnv, TypeCheckError, tcExpr, equalType,isNoneOrClass } from './type-check';
export function dictMethodTC(env : GlobalTypeEnv, locals : LocalTypeEnv, expr : Expr<null>) : Expr<Type>{
    if (expr.tag !== "method-call"){
      throw new TypeCheckError("Type checking a non-method call for dict")
    }

    var tObj = tcExpr(env, locals, expr.obj);
    var tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
  
    if (tObj.a.tag!="dict"){
      throw new TypeCheckError("Parsing dict method on Non-dict");
    }  
      const keyType:Type = parseKeyValType(tObj.a.key);
      const valType:Type = parseKeyValType(tObj.a.value);
      let args = expr.arguments
      let numArgs = args.length;
      //DICT related Method Call
      switch(expr.method){
        case "add":
          if (numArgs != 2){
            throw new TypeCheckError("Dict.add only takes 2 parameter")
          } else {
            if (!tObj.hasOwnProperty('name')){
              throw new TypeCheckError("The object of Dict.add does not have a name")
            }
          }
          return {...expr,a:NONE,obj:{...expr.obj,a:DICT(args[0].a,args[1].a)}};
        case "pop":
          if (numArgs != 1){
            throw new TypeCheckError("Dict.remove only takes 1 parameter")
          } else {
            if (!tObj.hasOwnProperty('name')){
              throw new TypeCheckError("The object of Dict.pop does not have a name");
            }
          }
          if (tObj.a.tag != "dict"){
              throw new TypeCheckError("Call dict method from non-dict");
          }
          return {...expr,a:valType,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}};
        case "get":
          return {...expr,a:valType,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}}
        case "Dget":
          return {...expr,a:valType,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}}
        case "size":
          return {...expr,a:NUM,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}};
        case "clear":
          if (numArgs != 0){
            throw new TypeCheckError("Dict.clear only takes no parameter")
          }
          return {...expr,a:NONE,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}};
        case "update":
          if(!isIterable(tArgs)){
            throw new TypeCheckError(`Try to update DICT with non-Iterable ${tArgs[0].a}}`)
          }
          return {...expr,a:NONE,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}};
        case "print":
          return {...expr,a:valType,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}};
        case "has":
          return {...expr,a:BOOL,obj:{...expr.obj,a:DICT(tObj.a.key,tObj.a.value)}};
      }
    
  }
export function dictExprTC(env : GlobalTypeEnv, locals : LocalTypeEnv,expr:Expr<null>):Expr<Type>{
            //Type annotation currently only takes 1 argument,
    //Therefore we only allow the dict to store elements of same kind
    
    if (expr.tag !== "dict_expr"){
        throw new TypeCheckError("Type checking a non-dict_expr")
    }
    
    const key_idx = 0;
    const val_idx = 1;
    
    var dictExpr : Array<[Expr<Type>,Expr<Type>]> = [];
    expr.entries.forEach(expr_pair=>{
        dictExpr.push([tcExpr(env, locals, expr_pair[0]),tcExpr(env, locals, expr_pair[1])])
    })
    if (dictExpr.length == 0) {
        // do nothing here, key & value type not declared
    } else {
        //Fetch dict data Type
        var keyType:Type = dictExpr[0][key_idx].a
        var valType:Type = dictExpr[0][val_idx].a
        for (var i = 1; i < dictExpr.length; ++i) {

        var lexprKeyType = dictExpr[i][key_idx].a;

        if (!equalType(lexprKeyType, keyType)) {
            if (equalType(keyType, NONE) && isNoneOrClass(lexprKeyType)) {
                keyType = lexprKeyType;
            } else if (!(equalType(lexprKeyType, NONE) && isNoneOrClass(keyType))) {
            throw new TypeCheckError(`dict statement wants type ${lexprKeyType} as keys, but get type ${keyType}`);
            }
        }

        var lexprValType = dictExpr[i][val_idx].a;
        if (!equalType(lexprValType, valType)) {
            if (equalType(valType, NONE) && isNoneOrClass(lexprValType)) {
                valType = lexprValType;
            } else if (!(equalType(lexprValType, NONE) && isNoneOrClass(valType))) {
            throw new TypeCheckError(`dict statement wants type ${lexprValType} as keys, but get type ${valType}`);
            }
        }
        }
    }
    return {
        ...expr,
        a: { tag: "dict", key: keyType, value: valType},
        entries:dictExpr,
    };
}
export function isIterable(exprs:Expr<Type>[]):boolean{
const iterables = ["set"];
const iter_exprs = ["set_expr"];

if (exprs.length != 1){
    throw new TypeCheckError("Currently, Set.update only allows single input")
}
if (iterables.includes(String(exprs[0].a.tag))){
    return true
}  
if (iter_exprs.includes(exprs[0].tag)){
    return true
}
return false
}
export function parseKeyValType(anno: Type):Type{
    switch(anno.tag){
        case "number":
            return NUM;
        case "bool":
            return BOOL;
        case "none":
            return NONE;
        default:
            throw new TypeCheckError(`Unsupported key/val Type ${anno}`)

    }
}