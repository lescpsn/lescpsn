# 设置命令行提示符
function fish_prompt
    set_color green
    echo -n [(whoami)'@'(hostname)]
    set_color FF0
    echo -n (pwd)
    set_color normal
    echo '>'
end

# 设置终端256色
set -x TERM xterm-256color

# 设置Golang环境变量
set -x GOPATH ~/Projects/lescpsn/golang

# 设置PATH环境变量
set -x PATH $PATH $GOPATH/bin 
