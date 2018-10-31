const pi = 3.1415926;
for (let i = 0; i < 2; i++) {
    console.log("this is for loop i: ", i);
}

console.log("pi: ", pi);

// let声明的i，只是在for作用域中，这里没有定义的变量i报错
console.log("this is not for loop i: ", i); 

