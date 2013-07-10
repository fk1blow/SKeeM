  
// ...

define(['../lib/skm/util/ObjectUtils'],
  function(ObjectUtils)
{
'use strict';



var Animal = function() {
  this.type = "Generix";
}

Animal.prototype.shit = function() {
  console.log("shitting bricks...");
}

Animal.extend = ObjectUtils.extend;


var Dog = Animal.extend({
  type: "Dog"
})



console.log(Dog.prototype)



});