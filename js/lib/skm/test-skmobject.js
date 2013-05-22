
// testing the SKMObject object

require(['skm/k/Object'], function(SKMObject) {


var A = SKMObject.extend({
  a: 'a'
});


var a1 = A.create({
  a: 'a111'
});

var a2 = new A({
  a: 'a222'
}, {});


cl(a1)
cl(a2)


});