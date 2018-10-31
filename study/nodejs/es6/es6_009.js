// es6_009.js

function getVal() {
    return [1, 'a', "bc"];
}

[va1, va2, va3] = getVal();

[vb1, vb2] = getVal(); // 接受数组的元素个数可以比返回数组的个数少

//['',vc2,vc3] =getVal(); // 如何表示占位符呢？

console.log(va1, va2, va3);
console.log(vb1, vb2);
//console.log(vc2, vc3);
