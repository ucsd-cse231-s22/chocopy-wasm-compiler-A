(module
  (memory (import "js" "mem") 1)
  (func $print_str (import "imports" "print_str") (param i32) (result i32))
  (global $heap (mut i32) (i32.const 4))


  ;; Take an amount of blocks (4-byte words) to allocate, return an address
  ;; handle suitable for giving to other access methods
  (func (export "alloc") (param $amount i32) (result i32)
    (local $addr i32)
    (local.set $addr (global.get $heap))
    (global.set $heap (i32.add (global.get $heap) (i32.mul (local.get $amount) (i32.const 4))))
    (local.get $addr))

  ;; Given an address handle, return the value at that address
  (func (export "load") (param $addr i32) (param $offset i32) (result i32)
    (i32.load (i32.add (local.get $addr) (i32.mul (local.get $offset) (i32.const 4)))))

  ;; Given an address handle and a new value, update the value at that adress to
  ;; that value
  (func (export "store") (param $addr i32) (param $offset i32) (param $val i32)
    (i32.store (i32.add (local.get $addr) (i32.mul (local.get $offset) (i32.const 4))) (local.get $val)))

  (func (export "read_str") (param $addr i32) (result i32)
    (local $length i32)
    (local $i i32)
    (local $$last i32)
    (local.set $i (i32.const 0))
    (local.set $length (i32.add (i32.load (i32.add (local.get $addr) (i32.mul (local.get $i) (i32.const 4)))) (i32.const 1)))
    (local.set $i (i32.const 1))
    (i32.const 256)
    call $print_str
    (local.set $$last)
    (loop $my_loop
      (i32.load (i32.add (local.get $addr) (i32.mul (local.get $i) (i32.const 4))))
      call $print_str
      (local.set $$last)
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (local.get $i)
      (local.get $length)
      (i32.lt_s)
      br_if $my_loop
    )
    (local.get $addr)
  )
)