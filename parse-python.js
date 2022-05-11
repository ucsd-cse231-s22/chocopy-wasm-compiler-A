const python = require("lezer-python");

const input = `
a: [int] = None
x : int = 0
a = [1,2,3]
a[1] = 4

[1, 2, 3][x]
`;

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
  //  console.log(cursor.node);
  console.log(
    cursor.node.type.name,
    input.substring(cursor.node.from, cursor.node.to)
  );
} while (cursor.next());
