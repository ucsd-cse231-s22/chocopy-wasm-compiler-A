import { dataOffset, debugId, refNumOffset, sizeOffset, typeOffset } from "../memory";
import { assertPrint, assertTCFail, assertTC, assertFail, assertMemState, assertMemAlloc, assertDebug } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Memory tests", () => {

assertMemState("classes-from-object", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    x: Rat = None
    x = Rat()
  `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference at the end of the program where object id is 123
    [123, dataOffset + 1, 1], // x.y = 1
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references


assertMemState("multiple-references", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
    x: Rat = None
    y: Rat = None
    z: Rat = None
    x = Rat()
    y = x
    z = y
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 3], // 3 references at the end of the program where object id is 123
    [123, dataOffset + 1, 1], // x.y = 1
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references

assertMemState("removing-references", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
    x: Rat = None
    y: Rat = None
    x = Rat()
    y = x
    y = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference at the end of the program where object id is 123
    [123, dataOffset + 1, 1], // x.y = 1
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references

assertMemState("remove-references-out-of-scope", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
        def someFunc(self: Rat):
            r: Rat = None
            r = self
            r.y = 100

    x: Rat = None
    y: Rat = None
    x = Rat()
    x.someFunc()
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference at the end of the program where object id is 123
    [123, dataOffset + 1, 100], // x.y = 100
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references

assertMemState("created-in-non-local-scope", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    def someFunc() -> Rat:
        r: Rat = None
        r = Rat()
        r.y = 100
        return r

    x: Rat = None
    x = someFunc()
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference at the end of the program where object id is 123
    [123, dataOffset + 1, 100], // x.y = 100
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references

assertMemState("access-not-assignment", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    x: Rat = None
    x = Rat()
    x.y
    print(x.y)
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference at the end of the program where object id is 123
    [123, dataOffset + 1, 1], // x.y = 100
    [123, sizeOffset, 2], // size is stored in 4-byte units
    [123, typeOffset, 0]]); // all types are values or non-references

assertMemState("objects-as-fields", `
    class Link(object):
        id: int = 0
        next: Link = None
        def __init__(self: Link):
            self.id = 123
        def add(l: Link, val: int) -> Link:
            m: Link = None
            m = Link()
            m.id = val
            l.next = m
            return m

    x: Link = None
    y: Link = None
    x = Link()
    y = x.add(456)
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 reference at the end of the program where object id is 123
    [456, refNumOffset, 2], // 2 reference at the end of the program where object id is 456
    [123, typeOffset, 2] // first field is a value, the next is a reference 
    ]);

assertMemState("anon-object-deletion", `
    class Link(object):
        id: int = 123
        next: Link = None

        def add(l: Link) -> Link:
            l.next = Link()
            l.id = 456
            return l.next

    x: Link = None
    x = Link()
    x.add()
    x = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 0], // 0 references at the end of the program where object id is 123
    [456, refNumOffset, 0], // 0 references at the end of the program where object id is 456
    ]);

assertMemState("simple-cycle", `
    class Link(object):
        id: int = 0
        next: Link = None

    x: Link = None
    y: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    x.next = y
    y.next = x
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 2], // 2 references at the end of the program where object id is 123
    [456, refNumOffset, 2], // 2 references at the end of the program where object id is 456
    ]); 

assertMemState("simple-cycle-deletion", `
    class Link(object):
        id: int = 0
        next: Link = None

    x: Link = None
    y: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    x.next = y
    y.next = x

    x = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 references at the end of the program where object id is 123
    [456, refNumOffset, 1], // 1 references at the end of the program where object id is 456
    ]);

assertMemState("less-simple-cycle", `
    class Link(object):
        id: int = 0
        next: Link = None
        prev: Link = None

    x: Link = None
    y: Link = None
    z: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    z = Link()
    z.id = 789
    x.next = y
    y.next = z
    z.next = x
    x.prev = z
    y.prev = x
    z.prev = y
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 3], // 3 references in the program where object id is 123
    [456, refNumOffset, 3], // 3 references in the program where object id is 456
    [789, refNumOffset, 3], // 3 references in the program where object id is 789
    ]); // all types are values or non-references

assertMemState("less-simple-cycle-deletion", `
    class Link(object):
        id: int = 0
        next: Link = None
        prev: Link = None

    x: Link = None
    y: Link = None
    z: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    z = Link()
    z.id = 789
    x.next = y
    y.next = z
    z.next = x
    x.prev = z
    y.prev = x
    z.prev = y
    
    y = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 2], // 2 references in the program where object id is 123
    [456, refNumOffset, 2], // 2 references in the program where object id is 456
    [789, refNumOffset, 2], // 2 references in the program where object id is 789
    ]); // all types are values or non-references

assertMemState("less-simple-cycle-complete-deletion", `
    class Link(object):
        id: int = 0
        next: Link = None
        prev: Link = None

    x: Link = None
    y: Link = None
    z: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    z = Link()
    z.id = 789
    x.next = y
    y.next = z
    z.next = x
    x.prev = z
    y.prev = x
    z.prev = y

    y = None
    x.next = None
    z.prev = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 2], // 2 references in the program where object id is 123
    [456, refNumOffset, 0], // 0 references in the program where object id is 456
    [789, refNumOffset, 2], // 2 references in the program where object id is 789
    ]); // all types are values or non-references

assertMemState("simple-inherited-reference", `
    class Link(Object):
        id: int = 0
        next: Link = None

        def addB(l: Link, val: int) -> BLink:
            m: Link = None
            m = BLink()
            m.id = val
            l.next = m
            return m

    class ALink(Link):
        def __init__(self: ALink):
            super().__init__()

    class BLink(Link):
        other_id: int = 0

        def __init__(self: BLink):
            super().__init__()

    x: Link = None
    y: Link = None
    x = ALink()
    x.id = 123
    y = x.addB(456)
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 1], // 1 references in the program where object id is 123
    [123, typeOffset, 2], // first field is a value, the next is a reference
    [456, refNumOffset, 2], // 2 references in the program where object id is 456
    [456, typeOffset, 2] // first field is a value, the next is a reference
    ]); // all types are values or non-references

assertPrint("simple-inherited-reference-print", `
    class Link(Object):
        id: int = 0
        next: Link = None

        def addB(l: Link, val: int) -> BLink:
            m: Link = None
            m = BLink()
            m.id = val
            l.next = m
            return m

    class ALink(Link):
        def __init__(self: ALink):
            super().__init__()
        def add(l: Link, val: int) -> BLink:
            m: Link = None
            m = ALink()
            m.id = val
            l.next = m
            print("hello from Alink")
            return m

    x: Link = None
    y: Link = None
    x = ALink()
    x.id = 123
    y = x.addB(456)
    `, [
        "hello from Alink"
    ]); // assert print "hello from Alink"  

assertMemState("simple-global-reference", `
    class Link(object):
        id: int = 0

        def assign_global(self: Link):
            global global_link
            global_link = self

    global_link: Link = None
    x: Link = None
    x = Link()
    x.id = 123
    x.assign_global()
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 2], // 2 references in the program where object id is 123
    [123, typeOffset, 2] // first field is a value, the next is a reference
    ]); // all types are values or non-references

assertMemState("simple-global-reference-deletion", `
    class Link(object):
        id: int = 0
        next: Link = None

        def assign_global(self: Link):
            global global_link
            global_link = self

    global_link: Link = None
    x: Link = None
    x = Link()
    x.id = 123
    x.next = Link()
    x.next.id = 456
    x.assign_global()
    x = None
    global_link = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 0], // 0 references in the program where object id is 123
    [123, typeOffset, 2], // first field is a value, the next is a reference
    [456, refNumOffset, 0], // 0 references in the program where object id is 456
    [456, typeOffset, 2] // first field is a value, the next is a reference
    ]); // all types are values or non-references

assertMemState("simple-global-reference-reassign", `
    class Link(object):
        id: int = 0
        next: Link = None

        def assign_global(self: Link):
            global global_link
            global_link = self

    global_link: Link = None
    x: Link = None
    x = Link()
    x.id = 123
    x.assign_global()
    x.next = Link()
    x.next.id = 456
    x.next.assign_global()
    x = None
    `, [
    // first value in the tuple denotes id, NOTE: this is a hack since we dont have access to object names
    [123, refNumOffset, 0], // 0 references in the program where object id is 123
    [123, typeOffset, 2], // first field is a value, the next is a reference
    [456, refNumOffset, 1], // 1 references in the program where object id is 456
    [456, typeOffset, 2] // first field is a value, the next is a reference
    ]); // all types are values or non-references

assertMemAlloc("gc-out-of-scope", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
        def someFunc(self: Rat):
            r: Rat = None
            r = Rat()

    x: Rat = None
    y: Rat = None
    x = Rat()
    x.someFunc()
`, 6); // Expect amount of memory allocated for this code to be 2 ints + 4 metadata blocks

assertMemAlloc("list-integration", `
    a: [int] = [1,2,3,4]
    b: [int] = [4, 6, 7]
    a = a + b
    a = None
    b = None
`, 0); // Expect amount of memory allocated to be 0 blocks

assertMemAlloc("self-assign-not-gc", `
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    x: Rat = None
    x = Rat()
    x = x
`, 6); // Expect memory not to be garbage collected and to still be allocated (2 ints + 4 metadata blocks)

});



