import { Type } from '../ast';
import { NUM, BOOL, NONE, CALLABLE } from '../utils';


export function addFileBuildinFuns(funs: Map<string, [Array<Type>, Type]>): Map<string, [Array<Type>, Type]> {
    funs.set("buildin_open", [[NUM, NUM], NUM]);
    funs.set("buildin_read", [[NUM, NUM], NUM]);
    funs.set("buildin_write", [[NUM, NUM], NUM]);
    funs.set("buildin_close", [[NUM], NONE]);
    funs.set("buildin_seek", [[NUM, NUM], NONE]);
    return funs;
}

export function addCallable(vars: Map<string, Type>): Map<string, Type> {
    vars.set("buildin_open", { tag: "callable", params: [NUM, NUM], ret: NUM });
    vars.set("buildin_read", { tag: "callable", params: [NUM, NUM], ret: NUM });
    vars.set("buildin_write", { tag: "callable", params: [NUM, NUM], ret: NUM });
    vars.set("buildin_close", { tag: "callable", params: [NUM], ret: NONE });
    vars.set("buildin_seek", { tag: "callable", params: [NUM, NUM], ret: NONE });
    return vars;
}

export function addFileBuildinClass(cls: Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>]>): Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>]> {
    const field = new Map();
    field.set("fd", NUM);
    const methods = new Map();
    methods.set("__init__", [[{ tag: "class" }], NONE]);
    methods.set("read", [[{ tag: "class" }, NUM], NUM]);
    methods.set("write", [[{ tag: "class" }, NUM], NUM]);
    methods.set("close", [[{ tag: "class" }], NONE]);
    methods.set("seek", [[{ tag: "class" }, NUM], NONE]);
    const filecls: [Map<string, Type>, Map<string, [Array<Type>, Type]>] = [field, methods];
    cls.set("File", filecls);
    return cls;

}
/**
 * program.classes.forEach(cls => {
    const fields = new Map();
    const methods = new Map();
    cls.fields.forEach(field => fields.set(field.name, field.type));
    cls.methods.forEach(method => methods.set(method.name, [method.parameters.map(p => p.type), method.ret]));
    newClasses.set(cls.name, [fields, methods]);
  });
 */