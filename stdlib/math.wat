(;
Math library for ChocoPy.
Currently implemented:
    - factorial : int -> int
    - gcd       : int -> int -> int
    - lcm       : int -> int -> int
More to come!
;)

;; TODO: All of these fns require positive input.
;; For now, since we don't have error handling, we just
;; use the `unreachable` kword. Exception folks, please
;; change this!

(module

  ;; ;; wasm implementation of abs, in case it's needed or handy
  ;; (func $$abs (param $n i32) (result i32)
  ;;   (if (result i32) (i32.lt_s (local.get $n) (i32.const 0))
  ;;     (then
  ;;       (local.get $n)
  ;;       (i32.const -1)
  ;;       (i32.mul)
  ;;     )
  ;;     (else
  ;;       (local.get $n)
  ;;     )
  ;;   )
  ;;   return
  ;; )

  (func $abs (import "imports" "abs") (param i32) (result i32))

  (func $importedFrom$math$factorial (param $n i32) (result i32)
    (if (result i32) (i32.lt_s (local.get $n) (i32.const 0))
      (then 
        unreachable
      )
      (else 
        (if (result i32) (i32.eqz (local.get $n))
          (then 
            (i32.const 1)
            (return)
          )
          (else 
            (local.get $n)
            (i32.const 1)
            (i32.sub)
            (call $importedFrom$math$factorial)
            (local.get $n)
            (i32.mul)
            (return)
          )
        )
      )
    )
  )
;; https://en.wikipedia.org/wiki/Euclidean_algorithm
  (func $importedFrom$math$gcd (param $a i32) (param $b i32) (result i32)
    ;; ensure neither number is negative
    (i32.lt_s (local.get $a) (i32.const 0))
    (i32.lt_s (local.get $b) (i32.const 0))
    (if (result i32) (i32.or)
      (then
        unreachable
      )
      (else
        (if (result i32) (i32.eqz (local.get $b))
          (then 
            (local.get $a)
            (return)
          )
          (else
            (local.get $b)
            (local.get $a)
            (local.get $b)
            (i32.rem_s)
            (call $importedFrom$math$gcd)
            (return)
          )
        )
      )
    )
  )

  ;; also used wikipedia for this
  (func $importedFrom$math$lcm (param $a i32) (param $b i32) (result i32)
	local.get $a
    local.get $b
    i32.mul
    call $abs
    local.get $a
    local.get $b
    call $importedFrom$math$gcd
    i32.div_u
  )
)