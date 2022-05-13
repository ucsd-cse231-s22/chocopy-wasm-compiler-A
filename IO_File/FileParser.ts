import {Class, FunDef} from "../ast"

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
const FileClass: Class<null> = {
    name: "File",
    fields: [{name: "fd", Type: { tag: "num", value: number }, }]
}

const OpenFun: FunDef<null> = {

}