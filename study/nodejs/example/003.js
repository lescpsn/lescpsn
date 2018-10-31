var arr_a1 = ['a', 'b', 'c']; // 同一个类型
var arr_a2 = ['d', 'e', 1, "124"]; // 不同类型混合
var arr_a3 = ['f', 'eg', 1, "124", [1.23, "hij"]]; // 既然可以不同类型，当然可以支持嵌套

console.log("-------------------------------------");
console.log("arr_a1 = ", arr_a1);
console.log("arr_a2 = ", arr_a2);
console.log("arr_a3 = ", arr_a3);

console.log("-------------------------------------");
len_arr_a3 = arr_a3.length; // 数组长度
for (i = 0; i < len_arr_a3; i++) { //  如何迭代
    console.log(arr_a3[i]);
}

console.log("-------------------------------------");
var arr_a4 = arr_a2 + arr_a3;  // 连接两个数组
console.log("arr_a4 = arr_a2 + arr_a3: ", arr_a4);
console.log("arr_a4.length = ", arr_a4.length);
console.log("-------------------------------------");

