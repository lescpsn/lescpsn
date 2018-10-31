// es6_004.js

class Human { // 方式1: export直接导出成共有，供外部文件访问
    constructor(name) { // 相当于构造函数
        this.name = name;
    }
    getName() {
        console.log("my name is:", this.name);
    }
}

function runing() {
    console.log("I can running");
}


function eating() {
    console.log("I can eating");
}

// 方式2: export直接导出成共有，供外部文件访问
export {
     runing,
     eating
 };

runing();
eating();
