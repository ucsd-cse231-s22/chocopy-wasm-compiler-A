(module
  (memory (import "js" "mem") 1)
  (func $print_str (import "imports" "print_str") (param i32) (result i32))
  (global $heap (mut i32) (i32.const 4))


  ;; Take an amount of blocks (4-byte words) to allocate, return an address
  ;; handle suitable for giving to other access methods
  (func $alloc (export "alloc") (param $amount i32) (result i32)
    (local $addr i32)
    (local.set $addr (global.get $heap))
    (global.set $heap (i32.add (global.get $heap) (i32.mul (local.get $amount) (i32.const 4))))
    (local.get $addr))

  (func $duplicate_str(export "duplicate_str") (param $source i32) (param $dest i32)
    (local $length i32)
    (local $i i32)
    (local $j i32)
    (local $val i32)
    (local.set $i (i32.const 0))
    (local.set $length (i32.add (i32.load (i32.add (local.get $source) (i32.mul (local.get $i) (i32.const 4)))) (i32.const 1)))
    (local.set $i (i32.const 1))
    (loop $my_loop
      (local.set $val (i32.load (i32.add (local.get $source) (i32.mul (local.get $i) (i32.const 4)))))
      (local.set $j (i32.sub (local.get $i) (i32.const 1)))
      (i32.store (i32.add (local.get $dest) (i32.mul (local.get $j) (i32.const 4))) (local.get $val))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (local.get $i)
      (local.get $length)
      (i32.lt_s)
      br_if $my_loop
    )
  )

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

    (func (export "get_Length") (param $addr1 i32) (param $addr2 i32) (result i32)
  (i32.add (i32.load (local.get $addr1)) (i32.load (local.get $addr2)))
  )

  (func (export "str-concatenation") (param $left i32) (param $right i32) (result i32)
    (local $leftlength i32)
    (local $rightlength i32)
    (local $lengthsum i32)
    (local $stringaddr i32)
    (local $tooladdr i32)

    (local.set $leftlength (i32.load (local.get $left)))
    (local.set $rightlength (i32.load (local.get $right)))
    (local.set $lengthsum (i32.add (i32.load (local.get $left)) (i32.load (local.get $right))))
    ;; get the addr of length
    (i32.const 1)
    (call $alloc)
    (local.set $stringaddr)
    ;;store the lengthsum
    (i32.store (i32.add (local.get $stringaddr) (i32.mul (i32.const 0) (i32.const 4))) (local.get $lengthsum))

    ;;alloc leftlength
    (local.get $leftlength)
    (call $alloc)
    (local.set $tooladdr)

    ;;duplicate left
    (local.get $left)
    (local.get $tooladdr)
    (call $duplicate_str)

    ;;alloc rightlength
    (local.get $rightlength)
    (call $alloc)
    (local.set $tooladdr)

    ;;duplicate right
    (local.get $right)
    (local.get $tooladdr)
    (call $duplicate_str)    

    (local.get $stringaddr)
  )


  (func (export "str_comparison") (param $addr1 i32) (param $addr2 i32) (result i32)
    (local $len1 i32)
    (local $len2 i32)
    (local $i i32)
    (local $str1 i32)
    (local $str2 i32)
    (local $$res i32)
    (local.set $len1 (i32.load (local.get $addr1)))
    (local.set $len2 (i32.load (local.get $addr2)))
    (local.set $i (i32.const 1))

    (local.set $$res (i32.const 0))
    
    (i32.eq (local.get $len1) (local.get $len2))
    (if
      (then
        (local.set $len1 (i32.add (local.get $len1) (i32.const 1)))
        (loop $my_loop
        (i32.load (i32.add (local.get $addr1) (i32.mul (local.get $i) (i32.const 4))))
        (i32.load (i32.add (local.get $addr2) (i32.mul (local.get $i) (i32.const 4))))
        (i32.eq)
        (if (then) (else (local.get $$res) (return)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (local.get $i)
        (local.get $len1)
        (i32.lt_s)
        br_if $my_loop 
        )
        (local.set $$res (i32.const 1))
      )
    )
    
    (local.get $$res)
  )
)