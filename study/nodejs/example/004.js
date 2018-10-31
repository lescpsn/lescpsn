mymap = {
    "id": 10001,
    "name": "abb"
};

var id_value = mymap['id'];
var name_value = mymap['name'];
console.log("---------------------------------");
console.log(mymap);
console.log(id_value);
console.log(name_value);

console.log("---------------------------------");
mymap['id'] = '20001';
console.log(mymap);
console.log("---------------------------------");

mymap['city'] = 'nanjing';
console.log(mymap);
console.log("---------------------------------");
