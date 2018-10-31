// 如何注释
// 脚本语言是弱类型语言，变量是没有类型的
var s_a1 = "Welcome To Iota!:1"; // 字符串 "", '', `` 区别
var s_a2 = 'Welcome To Iota!:2';
var s_a3 = `Welcome To Iota!:3`;
console.log("-------------------------------------");
console.log("s_a1 is: ", s_a1);
console.log("s_a2 is: ", s_a2);
console.log("s_a3 is: ", s_a3);
console.log("-------------------------------------");

var s_a4; // 只是声明
console.log("s_a4 is: ", s_a4);
console.log("-------------------------------------");

var f_a1 = 123.4; // 存储浮点数
var i_a1 = 123; // 存储整数
console.log("f_a1 is: ", f_a1);
console.log("i_a1 is: ", i_a1);
console.log("s_a1 + i_a1 is: ", s_a1 + i_a1); // 字符串，整数相加
console.log("f_a1 / i_a1 is: ", f_a1 / i_a1); // 浮点数除以整数
console.log("f_a1 / s_a1 is: ", f_a1 / s_a1); // 浮点数除以字符串
console.log("-------------------------------------");

f_a1 = s_a1; // 之前保存字符串的变量也可以赋值给保存浮点型的变量
console.log("f_a1 is: ", f_a1);
console.log("-------------------------------------");

i_a21 = 234; // 不用var關鍵字
console.log("i_a21(not use var) is: ", i_a21);
console.log("-------------------------------------");

var ch_a1 = "A";
var ch_a2 = 'B';
var ch_a3 = `C`;
console.log("ch_a1 is: ", ch_a1);
console.log("ch_a2 is: ", ch_a2);
console.log("ch_a3 is: ", ch_a3);

console.log("-------------------------------------t101: 测试0");
//var ch_b1 = '123';
//var int_b1 = 123;
var ch_b1 = '0';
var int_b1 = 0;

if (int_b1 == ch_b1) { // 可以打印出來 全部转换成数字比较
    console.log("int_b1 == ch_b1?", int_b1 == ch_b1);
}

if (ch_b1 == int_b1) { // 可以打印出來 全部转换成数字比较
    console.log("ch_b1 == int_b1?", ch_b1 == int_b1);
}

if (ch_b1) { // 可以打印出來
    console.log("变量ch_b1保存的字符'0'");
}

if (int_b1) { // 不能打印出來
    console.log("变量int_b1保存的数值0");
}
console.log("-------------------------------------t102: 测试0");

if (0) { // 不能打印出來
    console.log("字面量數值0");
}

if ('0') {
    console.log("字面量字符'0'");
}
console.log("-------------------------------------t103: 测试0");
if (0 == '0') { // 可以打印出來
    console.log("字面量數值0=='0'");
}

if (1 == '1') { // 可以打印出來
    console.log("字面量數值1=='1'");
}
console.log("-------------------------------------");
