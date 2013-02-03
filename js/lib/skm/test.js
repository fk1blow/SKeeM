


require(['jquery', 'console', 'underscore', 'skm/skm','skm/k/Object', 'skm/k/Mixin'], function() {
  console.clear();


  var A = SKM.Object.extend({
    times: 1,
  });


  // console.time('someFunction');

  // for(var i = 0; i <= 10000; i++) {
  //     SKM.Object.create({
  //       a: '1', b: '2', c: '3'
  //     });
  // }
  
  // console.timeEnd('someFunction');




  return;

  // var Ax = SKM.Mixin.create({
  // // var Ax = Ember.Mixin.create({
  //   doAsOne: function() {
  //     cl('doAs1')
  //   }
  // });


  // var Bx = Ember.Mixin.create({
  var Bx = SKM.Mixin.create({
  // var Bx = {
    doAsOne: function() {
      cl('doAs1')
    },
    doAsTwo: function() {
      cl('doAs2')
    }
  });

  var AAx = {
    temp: 'temp',
    hasA: function() {
      cl('hasA')
    },
    initialize: function() {
      cl('initialize')
    }
  }

  // var obj = {};
  // Bx.injectInto(obj);
  // cl(Bx instanceof SKM.Mixin)

  var A1 = SKM.Object.extend({
    initialize: function() {
      cl('args: ', arguments)
      cl(this)
    }
  })

  var a = A1.create(AAx);
  // cl(a)
  // cl(a.initialize)
  
  
  return;


  var A = SKM.Object.extend({
    initialize: function() {
      // cl('A.initialize')
    }
  });

  var B = A.extend({
    b: 'b',
    initialize: function(opt) {
      // cl('B.initialize', opt)
    }
  })

  var b = B.create(Ax, Bx, {
    doSome: function(opt) {
      // cl('B.1.initialize', opt)
    }
  });
  cl(b)

  // var ba = new B({
  //   b1: 'b1',
  //   initialize: function() {
  //     cl('B.1.initialize')
  //   }
  // });

  // cl(ba)
  

  // console.time('someFunction');

  // for(var i = 0; i <= 10000; i++) {
  //     SKM.Object.create({
  //     // Ember.Object.create(Ax, Bx, {
  //       doSome: function(opt) {
  //         cl('B.1.initialize', opt)
  //       },
  //       temp: 'temp'
  //     });
  // }
  
  // console.timeEnd('someFunction');


});