;; 显示行号
(global-linum-mode t)

;; 显示目录树
;;(add-to-list 'load-path "~/.emacs.d/elpa/neotree-20160306.730")
;;(add-to-list 'load-path prelude-dir)
(require 'neotree)
(global-set-key [f8] 'neotree-toggle)

;; 英文语法检查
;; use apsell as ispell backend
(setq-default ispell-program-name "aspell")
;; use American English as ispell default dictionary
(ispell-change-dictionary "american" t)
