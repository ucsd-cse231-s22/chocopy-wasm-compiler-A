(module
    (import "js" "memory" (memory 1))
    (func $assert_not_none (import "imports" "assert_not_none") (param i32) (result i32))
    (func $print_num (import "imports" "print_num") (param i32) (result i32))
    (func $print_bool (import "imports" "print_bool") (param i32) (result i32))
    (func $print_str (import "imports" "print_str") (param i32) (result i32))
    (func $print_none (import "imports" "print_none") (param i32) (result i32))
    (func $abs (import "imports" "abs") (param i32) (result i32))
    (func $min (import "imports" "min") (param i32) (param i32) (result i32))
    (func $max (import "imports" "max") (param i32) (param i32) (result i32))
    (func $pow (import "imports" "pow") (param i32) (param i32) (result i32))
    (func $alloc (import "libmemory" "alloc") (param i32) (result i32))
    (func $load (import "libmemory" "load") (param i32) (param i32) (result i32))
    (func $store (import "libmemory" "store") (param i32) (param i32) (param i32))




    (func (export "exported_func") (result i32)
      (local $$last i32)
(local $$selector i32)
(local.set $$selector (i32.const 0))
(loop $loop
(block $startProg4
              (local.get $$selector)
(br_table $startProg4)
            ) ;; end $startProg4
            (i32.const 97)
(call $print_str)
(local.set $$last)
            ) ;; end $loop
      (local.get $$last)
    )
  )