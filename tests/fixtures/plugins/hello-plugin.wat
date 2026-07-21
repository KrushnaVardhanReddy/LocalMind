(module
  (memory $mem 1)
  (export "memory" (memory $mem))

  (func $alloc (param $size i32) (result i32)
    (i32.const 0) ;; Simple allocator that always returns address 0
  )
  (export "alloc" (func $alloc))

  (func $dealloc (param $ptr i32)
    ;; No-op dealloc for simple test
  )
  (export "dealloc" (func $dealloc))

  (func $process (param $ptr i32) (param $len i32) (result i32)
    (local $i i32)
    (local $char i32)

    (local.set $i (i32.const 0))
    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (local.get $len)))

        (local.set $char (i32.load8_u (i32.add (local.get $ptr) (local.get $i))))

        ;; If a-z (97-122), subtract 32
        (if (i32.and
              (i32.ge_u (local.get $char) (i32.const 97))
              (i32.le_u (local.get $char) (i32.const 122))
            )
          (then
            (i32.store8
              (i32.add (local.get $ptr) (local.get $i))
              (i32.sub (local.get $char) (i32.const 32))
            )
          )
        )

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )

    (local.get $ptr)
  )
  (export "process" (func $process))
)