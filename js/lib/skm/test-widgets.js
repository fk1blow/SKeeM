//'skm/net/WebSocket', 'skm/k/Object', 'skm/util/Timer', 'skm/k/Mixin'


require(['skm/k/Object', 'skm/k/Mixin'],
  function(SKMObject, SKMMixin)
{
	console.clear();

	console.log(SKMObject);

	console.log(SKMObject.prototype);

	console.log(Object.keys(SKMObject));

	var Human = SKMObject.extend({
		age: null,
		name: null
	});

	var Nigga = Human.extend({
		whiteTrashKilled: 0,

		initialize: function() {
			cl('Nigga.initialize')
		}
	});

	



	var lafayette = Nigga.create({
		age: 24,
		name: 'bob',
		whiteTrashKilled: 9000
	});

	cl(lafayette)


	var MyView = View.extend({
		events: {
			'swipe .elemnen': callback
		}
	})



	var Human = function() {}; === SKMObject.extend()

	var aLousyHooman = new Human() === Human.create();

});