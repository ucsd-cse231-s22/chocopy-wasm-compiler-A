import {Class, FunDef, VarInit, Stmt, Expr, Type} from "../ast"
import {NUM, NONE,BOOL} from "../utils"
/*
 * class FileClass:
 *     fd: int = 0
 *     def __init__(self:FileClass, fd: int):
 *         self.fd = fd
 *     def read(self: FileClass)-> int:
 *        return buildin_read(self.fdm byte)
 *     def close(self: FileClass):
 *        close(self.fd: FileClass)
 *     def write(self: FileClass, c:int):
 *        return buildin_write(self.fd, c: int)
 *     def seek(self: FileClass, pos: int)
 *        return buildin_seek(self.fd)
 */
/*
export const FileClass: Class<null> = {
    name: "File",
    fields: [{name: "fd", type: NUM, value:{tag:"num", value:0}}],
    methods: [
        getFileInit(),
        getFileRead(),
        getFileWrite(),
        getFileSeek(),
        getFileClose()
    ]
}*/

export function FileClassString(): string  {
    var s = `
    class File:
        fd: int = 0
        def __init__(self:File):
            pass
        def read(self:File, byte_num:int) -> int:
            return buildin_read(self.fd, byte_num)
        def write(self:File, c:int) -> int:
            return buildin_write(self.fd, c)
        def seek(self:File, pos:int):
            buildin_seek(self.fd,pos)
        def close(self:File):
            buildin_close(self.fd)`
        ;
    return s;
}
/** 
function getFileInit(): FunDef<null> {
    return {
        name:"__init__",
        parameters:[{name:"self", type:{tag:"class", name:"File"}}, 
                    {name:"fd", type:NUM}],
        ret: NONE,
        inits:[],
        body:[{tag:"field-assign", obj:{tag:"id", name:"self"}, field:"fd", value:{tag:"id", name:"fd"}}], // self.fd = fd
    }
}
*/
/*
function getFileInit(): FunDef<null> {
    return {
        name:"__init__",
        parameters:[{name:"self", type:{tag:"class", name:"File"}}],
        ret: NONE,
        inits:[],
        body:[{tag:"pass"}], // self.fd = fd
    }
}

function getFileRead() :FunDef<null> {
    return {
        name:"read",
        parameters:[{name:"self", type:{tag:"class", name:"File"}},
                    {name:"byte_num", type:NUM}],
        ret:NUM,
        inits:[],
        body:[{tag:"return", value:{tag:"call", name:"buildin_read", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"},
                          {tag:"id", name:"byte_num"}]}}],
    }
}

function getFileWrite() :FunDef<null> {
    return {
        name:"write",
        parameters:[{name:"self", type:{tag:"class", name:"File"}},
                    {name:"c", type:NUM}],
        ret:NUM,
        inits:[],
        body:[{tag:"return", value:{tag:"call", name:"buildin_write", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"},
                          {tag:"id", name:"c"}]}}],
    }
}

function getFileSeek() :FunDef<null> {
    return {
        name:"seek",
        parameters:[{name:"self", type:{tag:"class", name:"File"}},
                    {name:"pos", type:NUM}],
        ret:NONE,
        inits:[],
        body:[{tag:"expr", expr:{tag:"call", name:"buildin_seek", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"},
                          {tag:"id", name:"pos"}]}}],
    }
}

function getFileClose() :FunDef<null> {
    return {
        name:"close",
        parameters:[{name:"self", type:{tag:"class", name:"File"}}],
        ret:NONE,
        inits:[],
        body:[{tag:"expr", expr:{tag:"call", name:"buildin_close", 
               arguments:[{tag:"lookup", obj:{tag:"id", name:"self"}, field:"fd"}]}}],
    }
}

export const OpenFun: FunDef<null> = {
    name:"open",
    parameters:[{name:"addr", type: NUM,}, {name:"mode", type: NUM,}],
    ret: {tag:"class", name:"File"},
    inits: getOpenInits(),
    body: getOpenBody(),
}
*/
export function OpenFunString(): string {
    return `
    def open(addr: int, mode:int) -> File:
        f: File = None
        fd: int = 0
        fd = buildin_open(addr, mode)
        f = File()
        f.fd = fd
        return f
    `
}
/*
function getOpenInits(): VarInit<null>[] {
    return [{name:"f", type:{tag:"class", name:"File"},value: {tag:"none"}},
    {name:"fd", type:NUM, value:{tag:"num", value:0}}]
}
function getOpenBody(): Stmt<null>[] {
    return [
     {tag:"assign", name:"fd",
                    value:{tag:"call", name:"buildin_open", arguments: [{tag:"id",name:"addr"},{tag:"id",name:"mode"}]}},
     {tag:"assign", name:"f",
                    value:{tag:"call", name:"File", arguments: []}},
     {tag:"field-assign", 
                    obj:{tag:"id", name:"f"}, field:"fd", value:{tag:"id", name:"fd"}},
     {tag:"return", value:{tag:"id", name:"f"}}
    ]
}
*/