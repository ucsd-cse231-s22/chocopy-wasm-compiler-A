
stdlib: build/memory.wasm build/list.wasm

build/%.wasm: stdlib/%.wat
	mkdir -p build/
	npx wat2wasm $^ -o $@