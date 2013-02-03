var MView;


$(function() {

	var View = SKM.ui.View;

	MView = View.extend({
		el: $('#wrapper'),

		count: 0,

		events: {
			// 'touchend a': 'handleTouchEnd',
			// 'click a': 'handleClick',
			// 'mouseover a': 'handleMouseOver',
			// 'touchstart .touch-canvas': 'handleTouchStart',
			
			
			// 'swipe .touch-canvas': 'handleTouchMove',
			// 'swipe #button': 'handleTouchMove',
			// 'swipe #console': 'handleTouchMove',
			// 'tap #console': 'handleTouchMove',
			// 'longtap #console': 'handleTouchMove',
			
			// 'swipe #console2': 'handleTouchMove',
			// 'tap #console2': 'handleTouchMove',
			// 'longtap #console2': 'handleTouchMove',
			
			
			// 'doubletap #button': 'handleTouchMove',
			// 'longtap 800 .touch-canvas': 'handleTouchMove',
			'tap #button': 'handleTouchMove',
			// 'tap 150 .touch-canvas': 'handleTouchMove',
			'tap .touch-canvas': 'handleTouchMove',
		},

		handleTouchMove: function(evt) {
			evt.preventDefault();
	    	this.el.find('.console').text(this.count++);
		},

		handleTouchEnd: function(evt) {
	    	evt.preventDefault();
	    	this.count = 0;
			this.el.find('.console').text('end');
		},

		handleClick: function(evt) {
			evt.preventDefault();
			console.log('handleClick')
		},

		handleMouseOver: function() {
			this.el.find('.console').text('mouseover');
		}
	});

	MView.create();







	// var start = (new Date()).getMilliseconds();
	// console.time('someFunction');

	// for(var i = 0; i <= 500; i++) {
	//     MView.create();
	// }

	// var end = (new Date()).getMilliseconds();

	// cl(end - start)
	
	// console.timeEnd('someFunction');








	/*var A = SK.Object.create({
		a: 'a',
		b: 'b',
		initialize: function() {
			cl('1', arguments)
		}
	}, {
		initialize: function() {
			cl('2', arguments)
		},
		c: 'c'
	});

	cl(A)*/

	/*var B = SK.Object.create();

	cl(B)*/







	/*var AX = SK.Mixin.create({
		doA: function() {
			cl('doA', this, this.x)
		},
		doB: function() {
			cl('doB', this)
		}
	})
	

	var A = SK.Object.extend(AX, {
		a: 'a',
		b: 'b',
		initialize: function() {
			// cl('initialize', this)
		}
	});

	// cl(A, A.extend, A.create, A.mixin)
	// cl(A.prototype);

	// var m = new A();
	var m = A.create({
		a: 'an',
		b: 'bn'
	});
	cl(m)
	// cl(m.constructor)
	// cl(m instanceof SK.Object)

	cl('-------------------')


	return;

	var B = A.extend({
		x: null,
		a: 'ba',
		b: 'bb',
		initialize: function() {
			// cl('A initialize')
		}
	});

	cl(B, B.extend, B.create, B.mixin)
	cl(B.prototype)

	var b = B.create();
	cl(b)
	cl(b instanceof B, b instanceof A)
	b.doA()*/

	
	// var a = new MyClass();
	// cl(a)
	// cl(a instanceof SK.Object)

	// var b = new BClass();
	// cl(b)
	// cl(b instanceof MyClass)









	/*return;

	var count = 0;
	var clonedObject = $('#va').clone();


	$(document).on('touchmove', '.touch-canvas', function(evt) {
		evt.preventDefault();
		count += 1
	    $('#wrapper').find('.console').text(count);
	});

	$(document).on('touchend', '.touch-canvas', function() {
		count = 0;
		var self = this;
		// $('#va').remove();
	    setTimeout(function() {
	    	// $('#wrapper').html(clonedObject);
	    	$('#wrapper').find('.console').text(0);
	    }, 1000);
	});*/
	
	

});