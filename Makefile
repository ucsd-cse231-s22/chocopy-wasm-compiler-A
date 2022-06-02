
stdlib: build/memory.wasm

build/%.wasm: stdlib/%.wat
	mkdir -p build/
	npx wat2wasm $< -o $@
clean:
	rm IO_File/*.js
	rm ast.js
	rm compiler.js
	rm ir.js
	rm lower.jsr
	rm parser.js 
	rm repl.js 
	rm runner.js 
	rm treeprinter.js
	rm type-check.js
	rm utils.js
	rm tests/import-object.test.js
