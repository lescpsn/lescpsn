// es6_004.js

class Human {
    constructor(name) {  // 相当于构造函数
        this.name = name;
    }
    getName(){
        console.log("my name is:",this.name);
    }
}
var man = new Human('bccc');
man.getName();
