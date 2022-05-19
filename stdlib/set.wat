;; Clear all set entries using a for loop
;; Set counter i to 0 and stop the loop when i equals 10 (hash size)
(func $set$clear (param $baseAddr i32) (result i32)
(local $i i32)
(loop $my_loop

;; Find the address of the ith entry
(local.get $baseAddr)
(local.get $i)
(i32.mul (i32.const 4))
(i32.add)

;; Clear the entry
(i32.const 0)
(i32.store)

;; Update counter i and check if need to stop the loop
(local.get $i)
(i32.const 1)
(i32.add)
(local.set $i)
(local.get $i)
(i32.const 10)
(i32.lt_s)
(br_if $my_loop)
)

;; Return a dump value
(i32.const 0)
(return))



;; Basic idea is to iterate through all set entries and aggregate the number of elements followed by each entry
(func $set$size (param $baseAddr i32) (result i32)
(local $i i32)
(local $size i32)
(local $nodePtr i32)

;; Use a for loop (i from 0 to 10)
(loop $my_loop

;; Find the address of the entry
(local.get $baseAddr)
(local.get $i)
(i32.mul (i32.const 4))
(i32.add)

;; Check if there is a follwing linkedlist
(i32.load)
(i32.const 0)
(i32.eq)
;; If there's no follwing element, do nothing
(if
(then
)
;; Else, iterate the list
(else ;; Opening else
;; There is an element, size++
(local.get $size)
(i32.const 1)
(i32.add)
(local.set $size)
(local.get $baseAddr) ;; Recomputing the bucketAddress to follow the linkedList.
(local.get $i)
(i32.mul (i32.const 4))
(i32.add) ;; Recomputed bucketAddress
(i32.load) ;; Loading head of linkedList
(i32.const 4)
(i32.add) ;; Next pointer
(local.set $nodePtr)
(block
;; While loop till we find a node whose next is None
(loop
(local.get $nodePtr)
(i32.load) ;; Traversing to head of next node
(i32.const 0) ;; None
(i32.ne) ;; If nodePtr not None
(if
(then
;; There is an element, size++
(local.get $size)
(i32.const 1)
(i32.add)
(local.set $size)
(local.get $nodePtr)
(i32.load) ;; Loading head of linkedList
(i32.const 4)
(i32.add) ;; Next pointer
(local.set $nodePtr)
) ;; Closing then
) ;; Closing if
(br_if 0 ;; Opening br_if
(local.get $nodePtr)
(i32.load) ;; Traversing to head of next node
(i32.const 0) ;; None
(i32.ne) ;; If nodePtr not None
) ;; Closing br_if
(br 1)
) ;; Closing loop
) ;; Closing Block
) ;; Closing else
) ;; Closing if

;; Update the counter and go to the next entry
(local.get $i)
(i32.const 1)
(i32.add)
(local.set $i)
(local.get $i)
(i32.const 10)
(i32.lt_s)
(br_if $my_loop)
)

;; Return the $size
(local.get $size)
(return))



(func $set$CreateEntry (param $val i32) (result i32)
(local $$allocPointer i32)

;; Allocate a node at the end of the heap
;; Need 2, 1 for value and 1 for pointer
(i32.const 2)   ;; size in bytes
(call $alloc)
(local.tee $$allocPointer)

;; Store the value
(local.get $val)
(i32.store)

;; Store the pointer to 0 (None) because it is the last element
(local.get $$allocPointer)
(i32.const 4)
(i32.add)
(i32.const 0)
(i32.store)
(local.get $$allocPointer)
(return))



;; Iterate through all hash entries and check if the specified element is in the set
(func $set$has (param $baseAddr i32) (param $val i32) (result i32)
(local $nodePtr i32) ;; Local variable to store the address of nodes in linkedList
(local $tagHitFlag i32) ;; Local bool variable to indicate whether tag is hit
(local $$allocPointer i32)

(i32.const 0)
(local.set $tagHitFlag) ;; Initialize tagHitFlag to False
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u) ;; Compute hash
(i32.mul (i32.const 4)) ;; Multiply by 4 for memory offset
(i32.add) ;; Reaching the proper bucket. Call this bucketAddress
(i32.load)
(i32.const 0) ;; None
(i32.eq)
(if
(then ;; if the literal in bucketAddress is None
;; Do Nothing
) ;; Closing then

(else ;; Opening else
(local.get $baseAddr) ;; Recomputing the bucketAddress to follow the linkedList.
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.load)
(local.get $val)
(i32.eq)
(if
(then
(i32.const 1)
(local.set $tagHitFlag)
)
)

(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
(block
(loop
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
(if
(then
(local.get $nodePtr)
(i32.load)
(i32.load)
(local.get $val)
(i32.eq)
(if
(then
(i32.const 1)
(local.set $tagHitFlag)
)
)
(local.get $nodePtr)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
)
)
(br_if 0
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
)
(br 1)
)
)
)
)

(local.get $tagHitFlag)
(return))



(func $set$add (param $baseAddr i32) (param $val i32) (result i32)
(local $nodePtr i32)
(local $tagHitFlag i32)
(local $$allocPointer i32)

(i32.const 0)
(local.set $tagHitFlag)
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 0)
(i32.eq)
(if
(then
(local.get $val)
(call $set$CreateEntry)
(local.set $$allocPointer)
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(local.get $$allocPointer)
(i32.store)
)

(else
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.load)
(local.get $val)
(i32.eq)
(if
(then
(i32.const 1)
(local.set $tagHitFlag)
)
)

(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
(block
(loop
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
(if
(then
(local.get $nodePtr)
(i32.load)
(i32.load)
(local.get $val)
(i32.eq)
(if
(then
(i32.const 1)
(local.set $tagHitFlag)
)
)
(local.get $nodePtr)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
)
)
(br_if 0
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
)
(br 1)
)
)
(local.get $tagHitFlag)
(i32.const 0)
(i32.eq)
(if
(then
(local.get $val)
(call $set$CreateEntry)
(local.set $$allocPointer)
(local.get $nodePtr)
(local.get $$allocPointer)
(i32.store)
)
)
)
)

(i32.const 0)
(return))



;; Remove a specified element from the set
(func $set$remove (param $baseAddr i32) (param $val i32) (result i32)
(local $prePtr i32)
(local $dump i32)
(local $nodePtr i32)
(local $tagHitFlag i32)
(local $$allocPointer i32)

(i32.const 0)
(local.set $tagHitFlag)
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 0)
(i32.eq)
(if
(then
)

(else
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(local.set $prePtr)
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.load)
(local.get $val)
(i32.eq)
(if
(then
(i32.const 1)
(local.set $tagHitFlag)
(local.get $prePtr)
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 4)
(i32.add)
(i32.load)
(i32.store)
)
)
(local.get $baseAddr)
(local.get $val)
(i32.const 10)
(i32.rem_u)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
(block
(loop
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
(if
(then
(local.get $nodePtr)
(i32.load)
(i32.load)
(local.get $val)
(i32.eq)
(if
(then
(i32.const 1)
(local.set $tagHitFlag)
(local.get $nodePtr)
(local.get $nodePtr)
(i32.load)
(i32.const 4)
(i32.add)
(i32.load)
(i32.store)
)
)
(local.get $nodePtr)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
)
)
(br_if 0
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
)
(br 1)
)
)
)
)

(local.get $tagHitFlag)
(call $ele_not_found)
(local.get $tagHitFlag)
(return))



;; Given a set A and set B, add all elements in B to A
(func $set$update (param $baseAddr$new i32) (param $baseAddr i32) (result i32)
(local $i i32)
(local $nodePtr i32)
(local $dump i32)

;; Iterate all elements in set B
(loop $my_loop

(local.get $baseAddr)
(local.get $i)
(i32.mul (i32.const 4))
(i32.add)

(i32.load)
(i32.const 0)
(i32.eq)
(if
(then
;; No element under current entry, do nothing
)
(else

;; Add the element found in set B to set A
(local.get $baseAddr$new)
(local.get $baseAddr)
(local.get $i)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.load)
(call $set$add)
(local.set $dump)

;; ;; Move to next element
(local.get $baseAddr)
(local.get $i)
(i32.mul (i32.const 4))
(i32.add)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
(block
(loop
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
(if
(then

;; Add the found element in set B to set A
(local.get $baseAddr$new)
(local.get $nodePtr)
(i32.load)
(i32.load)
(call $set$add)
(local.set $dump)

;; Move to next node
(local.get $nodePtr)
(i32.load)
(i32.const 4)
(i32.add)
(local.set $nodePtr)
)
)
(br_if 0
(local.get $nodePtr)
(i32.load)
(i32.const 0)
(i32.ne)
)
(br 1)
)
)
)
)

;; Check if all entries are visited
(local.get $i)
(i32.const 1)
(i32.add)
(local.set $i)
(local.get $i)
(i32.const 10)
(i32.lt_s)
(br_if $my_loop)
)

;; Return a dump value
(local.get $dump)
(return))