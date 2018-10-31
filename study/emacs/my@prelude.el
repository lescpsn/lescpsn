;; 显示行号
(global-linum-mode t)

;; 显示目录树 请自行安装neotree插件包 M-x list-package
(require 'neotree)
(global-set-key [f8] 'neotree-toggle)

;; 英文语法检查
;; use apsell as ispell backend
;; (setq-default ispell-program-name "aspell")
;; use American English as ispell default dictionary
;; (ispell-change-dictionary "american" t)
