// es6_011.js

let s = new Set();
s.add('zhangsan');
s.add(11);
s.add(3.14);

console.log(s);
console.log(s.size);
console.log(s.has(11));
console.log("-----------------------------------------");
let m = new Map();
m.set('name','Tom');
m.set('age',32);
console.log(m);
console.log(m.size);
console.log(m.has('age'));
console.log("-----------------------------------------");
