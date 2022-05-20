import { Stmt, Expr, Type, UniOp, BinOp, Literal, Program, FunDef, VarInit, Class } from './ast';
import { NUM, BOOL, NONE, CLASS, SET } from './utils';
import { emptyEnv } from './compiler';
import { GlobalTypeEnv, LocalTypeEnv, TypeCheckError, tcExpr, equalType,isNoneOrClass } from './type-check';
export function setMethodTC(env : GlobalTypeEnv, locals : LocalTypeEnv, expr : Expr<null>) : Expr<Type>{
    if (expr.tag !== "method-call"){
      throw new TypeCheckError("Type checking a non-method call for set")
    }
    var tObj = tcExpr(env, locals, expr.obj);
    var tArgs = expr.arguments.map(arg => tcExpr(env, locals, arg));
  
    if (tObj.a.tag!="set"){
      throw new TypeCheckError("Parsing set method on Non-set");
    }
      let numArgs = expr.arguments.length;
      //Set related Method Call
      switch(expr.method){
        case "add":
          if (numArgs != 1){
            throw new TypeCheckError("Set.remove only takes 1 parameter")
          } else {
            if (!tObj.hasOwnProperty('name')){
              throw new TypeCheckError("The object of Set.remove does not have a name")
            }
          }
          return {...expr,a:{tag:"none"},obj:{...expr.obj,a:SET(NUM)}};
        case "remove":
          if (numArgs != 1){
            throw new TypeCheckError("Set.remove only takes 1 parameter")
          } else {
            if (!tObj.hasOwnProperty('name')){
              throw new TypeCheckError("The object of Set.remove does not have a name")
            }
          }
          return {...expr,a:BOOL,obj:{...expr.obj,a:SET(NUM)}};
        case "size":
          return {...expr,a:NUM,obj:{...expr.obj,a:SET(NUM)}};
        case "clear":
          if (numArgs != 0){
            throw new TypeCheckError("Set.clear only takes no parameter")
          }
          return {...expr,a:{tag:"none"},obj:{...expr.obj,a:SET(NUM)}};
        case "update":
          if(!isIterable(tArgs)){
            throw new TypeCheckError(`Try to update set with non-Iterable ${tArgs[0].a}}`)
          }
          return {...expr,a:{tag:"none"},obj:{...expr.obj,a:SET(NUM)}};
        case "print":
          return {...expr,a:NUM,obj:{...expr.obj,a:SET(NUM)}};
        case "has":
          return {...expr,a:BOOL,obj:{...expr.obj,a:SET(NUM)}};
      }
    
  }
  export function setExprTC(env : GlobalTypeEnv, locals : LocalTypeEnv,expr:Expr<null>):Expr<Type>{
              //Type annotation currently only takes 1 argument,
        //Therefore we only allow the set to store elements of same kind
        
        if (expr.tag !== "set_expr"){
            throw new TypeCheckError("Type checking a non-set_expr")
        }
        
        var commonType = null;
        const setExpr = expr.contents.map((content) => tcExpr(env, locals, content));
        if (setExpr.length == 0) {
          commonType = null;
        } else {
          //Fetch Set data Type
          commonType = setExpr[0].a;
          for (var i = 1; i < setExpr.length; ++i) {
            var lexprType = setExpr[i].a;
            if (!equalType(lexprType, commonType)) {
              if (equalType(commonType, NONE) && isNoneOrClass(lexprType)) {
                commonType = lexprType;
              } else if (!(equalType(lexprType, NONE) && isNoneOrClass(commonType))) {
                throw new TypeCheckError(`set statement wants type ${lexprType}, but get type ${commonType}`);
              }
            }
          }
        }
        return {
          ...expr,
          a: { tag: "set", content_type: commonType },
          contents: setExpr,
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