var A = SKM.Object.extend({
    a: 'a',
    b: 'b',
    arraSomeRtf: null,
    arrStackUpdates: null,

    initialize: function() {
      this.a = 'a';
      this.b = 'b';
      this.arraSomeRtf = {};
      this.arrStackUpdates = [];
    }
});



// setTimeout(function() {

var myjson = {};
for (var i = 0; i < 20000; i++) {
  myjson['a' + i] = "oldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldoldold";
}

var updatejson = {};
for (var i = 0; i < 10000; i++) {
  updatejson['a' + i] = "newnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnewnew";
}

var createjson = {};
for (var i = 0; i < 10000; i++) {
  createjson['b' + i] = "createcreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreatecreate";
}

var deletejson = [];
for(var i = 0; i < 10000; i++) {
    deletejson.push("a" + i);
}

var a1 = (new Date()).getTime();
for(var item in updatejson) {
  myjson[item] = updatejson[item];
}
$('#update').text(new Date().getTime() - a1);
console.log('update : ', new Date().getTime() - a1)
// alert(new Date().getTime() - a1);



var a2 = (new Date()).getTime()
for(var item in createjson) {
  myjson[item] = createjson[item];
}
$('#create').text(new Date().getTime() - a2);
console.log('create : ', new Date().getTime() - a2)
// alert(new Date().getTime() - a2);


var a3 = (new Date()).getTime()
for(var item in deletejson) {
  delete myjson[item];
}
$('#delete').text(new Date().getTime() - a3);
console.log('delete : ', new Date().getTime() - a3)
// alert(new Date().getTime() - a3);

// }, 1000)