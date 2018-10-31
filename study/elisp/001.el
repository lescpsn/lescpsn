;; example-001
(message "hello world")

;; example-002
(defun my-firstfun (name)
  "Elisp函数写法的例子" ;; 函数文档说明
  (message "This Is My First Function ,Print %s" name))

;; 调用函数
(my-firstfun "Welcom")

;; example-003
(setq print_str "I Love China")
(my-firstfun print_str)

(defvar print_str2 "I Love China 2"
  "defvar方式定义一个变量print_str2")
(my-firstfun print_str2)

(defvar print_str "I Love China 3"
  "defvar方式定义一个已有变量print_str") ;; 已经存在的变量print_str，defvar不可以重新赋值
(my-firstfun print_str)

(setq print_str "I Love China 5")
(my-firstfun print_str)

;; example-004 局部变量定义之let
(defun area (radix)
  (let ((pia 3.0) area)
    (setq area (* pia radix radix))
    (message "半径为%f 圆的面积为%f" radix area))
)
(area 3)

;; example-005 局部变量定义之let*
(defun my-area (r)
  (let* ((pia 3.1)
         (area (* pia r r)))
    (message "半径为%f 圆的面积为%f" r area)))

(my-area 3)

;; example-006 lambda 匿名函数
(setq foo (lambda (name)
            (message "hello %s" name)))

(funcall foo "carhjdd")

(progn
  (setq boo 2)
  (message "%d 的平方是 %d" boo (* boo boo))
  )

;; example-007 max最大值
(defun my-max (a b)
  (if (< a b) a b )
)

(my-max 99 111)
(> 2 3)

(integerp 1.1)

(= 1 1.0)
(equal 1 1.0)


(make-string 5 ?a)
