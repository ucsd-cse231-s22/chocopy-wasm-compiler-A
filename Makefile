
stdlib: build/memory.wasm

build/%.wasm: stdlib/%.wat
	mkdir -p build/
	npx wat2wasm $< -o $@