(module
  (memory (import "js" "mem") 1)

  ;; Take an list, return its length
  (func (export "len") (param $list i32) (result i32)
    (i32.load (local.get $list)))

)