// es6_005.js

class Human {
    constructor(name) { // 相当于构造函数
        this.name = name;
    }
    getName() {
        console.log("my name is:", this.name);
    }
}

class Man extends Human {
    constructor(name, sex) { // 相当于构造函数
        super(name); // 继承父类的构造函数
        this.sex = sex;
    }

    info() {
        console.log(this.name, "is", this.sex);
    }
}

var boy = new Man("Jem", "boy");
boy.getName();
boy.info();
