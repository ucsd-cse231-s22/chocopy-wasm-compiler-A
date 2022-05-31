(module
  (memory (import "js" "mem") 1)
  (func $mem_gen_ref (import "libmemory" "memGenRef") (param i32) (result i32))
  (global $heap (mut i32) (i32.const 4))
  (global $metadata_amt (mut i32) (i32.const 4))

  ;; Take an amount of blocks (4-byte words) to allocate, return an address
  ;; handle suitable for giving to other access methods
  (func (export "alloc") (param $amount i32) (result i32)
    (call $alloc_size (i32.add (local.get $amount) (i32.const 1)) (i32.const 0) (local.get $amount)))


  ;; Take an amount of blocks (4-byte words) to allocate, return an address
  ;; handle suitable for giving to other access methods
  (func $alloc_size (export "alloc_size") (param $amount i32) (param $types i32) (param $size i32) (result i32)
    (local $addr i32)
    (local.set $addr (global.get $heap))
    ;; num reference is zero
    (i32.store (i32.add (local.get $addr) (i32.mul (i32.const 0) (i32.const 4))) (i32.const 0))
    ;; store types
    (i32.store (i32.add (local.get $addr) (i32.mul (i32.const 1) (i32.const 4))) (local.get $amount))
    ;; store amount
    (i32.store (i32.add (local.get $addr) (i32.mul (i32.const 2) (i32.const 4))) (local.get $types))
    ;; store size
    (i32.store (i32.add (local.get $addr) (i32.mul (i32.const 3) (i32.const 4))) (local.get $size))
    ;; increment heap addr
    (global.set $heap (i32.add (global.get $heap) (i32.mul (i32.add (local.get $amount) (global.get $metadata_amt)) (i32.const 4))))
    (local.get $addr)
    (call $mem_gen_ref))

  ;; Given an address handle, return the value at that address
  (func (export "load") (param $addr i32) (param $offset i32) (result i32)
    (i32.load (i32.add (local.get $addr) (i32.mul (i32.add (local.get $offset) (global.get $metadata_amt)) (i32.const 4)))))

  ;; Given an address handle and a new value, update the value at that adress to
  ;; that value
  (func (export "store") (param $addr i32) (param $offset i32) (param $val i32)
    (i32.store (i32.add (local.get $addr) (i32.mul (i32.add (local.get $offset) (global.get $metadata_amt)) (i32.const 4))) (local.get $val)))

)
