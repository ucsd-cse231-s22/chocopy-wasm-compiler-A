(module
  (memory (import "js" "mem") 1)
  (import "js" "heap" (global $heap (mut i32)))
  (import "imports" "print_char" (func $print_char (param $arg i32)))

  ;; Take an iterable, return its length
  (func (export "len") (param $iter i32) (result i32)
    (i32.load (local.get $iter)))

  ;; Take two iterable, compare the value
  (func (export "iter_cmp") (param $iter1 i32) (param $iter2 i32) (result i32)
    (local $len1 i32)
    (local $len2 i32)
    (local $i i32)

    (i32.eq (local.get $iter1) (local.get $iter2))
    (if
      (then
        (i32.const 1)
        return
      )
      (else
        (local.set $len1 (i32.load (local.get $iter1)))
        (local.set $len2 (i32.load (local.get $iter2)))
        (i32.ne (local.get $len1) (local.get $len2))
        (if
          (local.set $i (i32.const 1))
          (then
            (i32.const 0)
            return
          )
          (else
            (loop $iter_cmping
              (i32.le_s (local.get $i) (local.get $len1))
              if
                (i32.load (i32.add (local.get $iter1) (i32.mul (local.get $i) (i32.const 4))))
                (i32.load (i32.add (local.get $iter2) (i32.mul (local.get $i) (i32.const 4))))
                (local.set $i (i32.add (local.get $i) (i32.const 1)))
                (i32.eq)
                if
                  br $iter_cmping
                end
              end
            )
            (i32.gt_s (local.get $i) (local.get $len1))
            return
          )
        )
      )
    )
    (i32.const 0)
    return
  )

  ;; Take an iterable string, print it
  (func (export "print_str") (param $addr i32) (result i32)
    (local $len i32)
    (local $i i32)

    (local.set $len (i32.load (local.get $addr)))
    (local.set $i (i32.const 1))
  
    ;; Iterate and call print_char
    (loop $printingstr
      (i32.le_s (local.get $i) (local.get $len))
      if
        (i32.load (i32.add (local.get $addr) (i32.mul (local.get $i) (i32.const 4))))
        call $print_char
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        br $printingstr
      end
    )

    ;; Add \0 to tell it ends
    (i32.const 0)
    call $print_char
    
    (local.get $addr))

  ;; Load a char in a string
  (func (export "load_char") (param $addr i32) (param $ind i32) (result i32)
    (i32.add (local.get $addr) (i32.mul (local.get $ind) (i32.const 4)))
  )

  ;; Take two iterable object, concatenate them and return new address
  (func (export "concat") (param $iter1 i32) (param $iter2 i32) (result i32)
    (local $addr1 i32)
    (local $addr2 i32)
    (local $i1 i32)
    (local $i2 i32)
    (local $val i32)
    (local $len1 i32)
    (local $len2 i32)
    (local $addr i32)
    (local $newlen i32)

    ;; Get New length of the iterable object
    (local.set $addr1 (local.get $iter1))
    (local.set $addr2 (local.get $iter2))
    (local.set $len1 (i32.load (local.get $addr1)))
    (local.set $len2 (i32.load (local.get $addr2)))
    (local.set $i1 (i32.const 1))
    (local.set $i2 (i32.const 1))
    (local.set $newlen (i32.add (local.get $len1) (local.get $len2)))

    ;; Alloc new space
    (local.set $addr (global.get $heap))
    (global.set $heap (i32.add (global.get $heap) (i32.mul (i32.add (local.get $newlen) (i32.const 1)) (i32.const 4))))

    ;; Store length
    (i32.store (i32.add (local.get $addr) (i32.const 0)) (local.get $newlen))

    ;; Store the other element by order
    (loop $merge_iterable1
      (i32.le_s (local.get $i1) (local.get $len1))
      if
        (local.set $val (i32.load (i32.add (local.get $addr1) (i32.mul (local.get $i1) (i32.const 4)))))
        (i32.store (i32.add (local.get $addr) (i32.mul (local.get $i1) (i32.const 4))) (local.get $val))
        (local.set $i1 (i32.add (local.get $i1) (i32.const 1)))
        br $merge_iterable1
      end
    )

    (loop $merge_iterable2
      (i32.le_s (local.get $i2) (local.get $len2))
      if
        (local.set $val (i32.load (i32.add (local.get $addr2) (i32.mul (local.get $i2) (i32.const 4)))))
        (i32.store (i32.add (local.get $addr) (i32.mul (i32.add (local.get $len1) (local.get $i2)) (i32.const 4))) (local.get $val))
        (local.set $i2 (i32.add (local.get $i2) (i32.const 1)))
        br $merge_iterable2
      end
    )
    
    (local.get $addr))

)