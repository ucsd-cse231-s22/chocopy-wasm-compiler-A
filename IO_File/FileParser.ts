import {Class, FunDef, VarInit, Stmt, Expr, Type} from "../ast"

/*
 * class FileClass:
 *     fd: int = 0
 *     def __init__(self:FileClass):
 *         pass
 *     def read(self: FileClass):
 *        return buildin_read(self.fd)
 *     def close(self: FileClass):
 *        close(self.fd: FileClass)
 *     def write(self: FileClass, c:int):
 *        return buildin_write(self.fd, c: int)
 *     def seek(self: FileClass, pos: int)
 *        return buildin_seek(self.fd)
 */
export const FileClass: Class<Type> = {
    name: "File",
    fields: [{name: "fd", type: { tag: "number"}, value:{tag:"num", value:0}}],
    methods: [
        getFileInit(),
        getFileRead(),
        getFileWrite(),
        getFileSeek(),
        getFileClose()
    ]
}

function getFileInit(): FunDef<Type> {
    return {
        name:"__init__",
        parameters:[{name:"self", type:{tag:"class", name:"File"}}, 
                    {name:"fd", type:{tag:"number"}}],
        ret: {tag:"none"},
        inits:[],
        body:[{tag:"field-assign", obj:{tag:"id", name:"self"}, field:"fd", value:{tag:"id", name:"fd"}}],
    }
}

function getFileRead() :FunDef<Type> {
    return {
        name:"read",
        parameters:[{name:"self", type:{tag:"class", name:"File"}},
                    {name:"byte_num", type:{tag:"number"}}],
        ret:{tag:"number"},
        inits:[],
        body:[{tag:"return", value:{tag:"call", name:"buildin_read", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"},
                          {tag:"id", name:"byte_num"}]}}],
    }
}

function getFileWrite() :FunDef<Type> {
    return {
        name:"write",
        parameters:[{name:"self", type:{tag:"class", name:"File"}},
                    {name:"c", type:{tag:"number"}}],
        ret:{tag:"number"},
        inits:[],
        body:[{tag:"return", value:{tag:"call", name:"buildin_write", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"},
                          {tag:"id", name:"c"}]}}],
    }
}

function getFileSeek() :FunDef<Type> {
    return {
        name:"read",
        parameters:[{name:"self", type:{tag:"class", name:"File"}},
                    {name:"pos", type:{tag:"number"}}],
        ret:{tag:"number"},
        inits:[],
        body:[{tag:"return", value:{tag:"call", name:"buildin_seek", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"},
                          {tag:"id", name:"pos"}]}}],
    }
}

function getFileClose() :FunDef<Type> {
    return {
        name:"close",
        parameters:[{name:"self", type:{tag:"class", name:"File"}}],
        ret:{tag:"none"},
        inits:[],
        body:[{tag:"expr", expr:{tag:"call", name:"buildin_close", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"}]}}],
    }
}

export const OpenFun: FunDef<Type> = {
    name:"open",
    parameters:[{name:"addr", type: {tag:"number"}}],
    ret: {tag:"class", name:"File"},
    inits: getOpenInits(),
    body: getOpenBody(),
}

function getOpenInits(): VarInit<Type>[] {
    return [{name:"f", type:{tag:"class", name:"File"},value: {tag:"none"}},
    {name:"fd", type:{tag:"number"}, value:{tag:"num", value:0}}]
}
function getOpenBody(): Stmt<Type>[] {
    return [
     {tag:"assign", name:"fd",  
                    value:{tag:"call", name:"buildin_open", arguments: [{tag:"id",name:"addr"}]}},
     {tag:"assign", name:"f",
                    value:{tag:"call", name:"File", arguments: [{tag:"id", name:"fd"}]}},
     {tag:"return", value:{tag:"id", name:"f"}}
    ]
}