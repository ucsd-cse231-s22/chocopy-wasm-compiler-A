(module
  (memory (import "js" "mem") 1)
  (global $heap (mut i32) (i32.const 4))

  ;; Take an amount of blocks (4-byte words) to allocate, return an address
  ;; handle suitable for giving to other access methods
  (func $alloc (export "alloc") (param $amount i32) (result i32)
    (local $addr i32)
    (local.set $addr (global.get $heap))
    (global.set $heap (i32.add (global.get $heap) (i32.mul (local.get $amount) (i32.const 4))))
    (local.get $addr))

  ;; Given an address handle, return the value at that address
  (func $load (export "load") (param $addr i32) (param $offset i32) (result i32)
    (i32.load (i32.add (local.get $addr) (i32.mul (local.get $offset) (i32.const 4)))))

  ;; Given an address handle and a new value, update the value at that adress to
  ;; that value
  (func $store (export "store") (param $addr i32) (param $offset i32) (param $val i32)
    (i32.store (i32.add (local.get $addr) (i32.mul (local.get $offset) (i32.const 4))) (local.get $val)))

  ;; Given a target address and an array (expressed as a start address and a length), copy the values of the array to
  ;; the target address. Return the following target address.
  ;; pseudo code:
  ;; int i = 0
  ;; for (; i < length; ++i) {
  ;;    target[i] = source[1 + i]
  ;; }
  ;; return target + length * 4
  (func $copy (export "copy") (param $target i32) (param $source i32) (param $length i32) (result i32)
    ;; int i = 0
    (local $i i32)
    (local.set $i (i32.const 0))

    (loop $my_loop
      ;; i < length
      (i32.lt_s (local.get $i) (local.get $length))
      (if
        (then
          ;; target[i] = source[1 + i]
          (call $store (local.get $target) (local.get $i) (call $load (local.get $source) (i32.add (i32.const 1) (local.get $i))))

          ;; ++i
          (local.set $i (i32.add (local.get $i) (i32.const 1)))
          (br $my_loop)
        )
        (else
          ;; end loop
        )
      )
    )

    ;; return target + length * 4
    (i32.add (local.get $target) (i32.mul (local.get $length) (i32.const 4)))
  )

)