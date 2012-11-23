/**
  *	Copyright (c) 2012 Andrew Hushbeck
  *
  *	Permission is hereby granted, free of charge, to any person obtaining a copy of
  *	this software and associated documentation files (the "Software"), to deal in
  *	the Software without restriction, including without limitation the rights to use,
  *	copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
  *	Software, and to permit persons to whom the Software is furnished to do so,
  *	subject to the following conditions:
  *
  *	The above copyright notice and this permission notice shall be included in all
  *	copies or substantial portions of the Software.
  *
  *	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  *	INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  *	PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  *	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  *	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  *	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  *
  **/
(function () {
	// Document.getElementById shortcut
	function $(id, context) {
		return (context || document).getElementById(id);
	}
	// Helper Method from Google Bump http://imgineme.com/projects/google-bump/
	function $create(type, attributes) {
		var node;
		if(type == 'textNode') {
			node = document.createTextNode(attributes);
		} else {
			node = document.createElement(type);
			if(typeof attributes == 'string') {
				node.textContent = attributes;
			} else {
				for (var attr in attributes){
					if(attr == "textContent") {
						if (typeof node.textContent != "undefined") node.textContent = attributes[attr];
						else node.innerText = attributes[attr];
					} else if (attr == "className") {
						node.className = attributes[attr];
					} else if (attr == "innerHTML") {
						node.innerHTML = attributes[attr];
					} else if (attributes.hasOwnProperty(attr)) {
						node.setAttribute(attr, html_entity_decode(attributes[attr]));
					}
				}
			}
		}
		return node;
	}
	//	Decoed HTML Entities
	function html_entity_decode(str) {
		//jd-tech.net
		var tarea = $create('textarea');
		tarea.innerHTML = str;
		return tarea.value;
	}
	// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
			"use strict";
			if (this == null) {
				throw new TypeError();
			}
			var t = Object(this);
			var len = t.length >>> 0;
			if (len === 0) {
				return -1;
			}
			var n = 0;
			if (arguments.length > 0) {
				n = Number(arguments[1]);
				if (n != n) { // shortcut for verifying if it's NaN
					n = 0;
				} else if (n != 0 && n != Infinity && n != -Infinity) {
					n = (n > 0 || -1) * Math.floor(Math.abs(n));
				}
			}
			if (n >= len) {
				return -1;
			}
			var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
			for (; k < len; k++) {
				if (k in t && t[k] === searchElement) {
					return k;
				}
			}
			return -1;
		}
	}
	
	function Snowflake (left, top, scene) {
		this.arcplace = Math.floor(Math.random()), // Variable used for back and forth calculations
		this.y = top, // Place on the screen
		this.speed = Math.random() * 150+ 20,
		this.arcpace = Math.random() *20 + 10,
		this.arcwidth = Math.random() * 50 + 50,
		this.distance = Math.floor(Math.random()*4+1), // "Distance" from the screen
		this.x = left,
		this.scene = scene;
		
		//this.fillStyle = "#"+rgb.toString(16)+rgb.toString(16)+rgb.toString(16);
		this._rendered = Snowflake.flake_render(this.distance);
	}
	var FLAKE_CACHE = [],
		TWOPI = Math.PI * 2;
	Snowflake.flake_render = function (size) {
		if(FLAKE_CACHE[size]) return FLAKE_CACHE[size];
		
		var rendered = $create('canvas', {width: size, height: size});
		var ctx = rendered.getContext('2d'),
			rgb = 180,
			halfSize = size/2;
		for(var m = size, l = 1; m > l; m--)
			rgb += 25;
		ctx.fillStyle = "#"+rgb.toString(16)+rgb.toString(16)+rgb.toString(16);
		ctx.beginPath();
		ctx.arc(halfSize, halfSize, halfSize, 0, TWOPI, false);
		ctx.closePath();
		ctx.fill();
		
		FLAKE_CACHE[size] = rendered;
		
		return rendered;
	};
	Snowflake.prototype.fall = function () {
		var ctx = this.scene.context,
			radius = this.distance/2;
		// ctx.fillStyle = this.fillStyle;
		// ctx.beginPath();
		var newLocation = this.x+Math.sin((this.arcplace)/(this.arcwidth))*this.arcpace;
		if((this.y+=this.speed/80) > this.scene.canvas.height - this.scene.snowpile.getHeight(newLocation + (this.distance / 2))) {
			this.scene.snowpile.addToPile(this);
			if(this.scene.deleteCount>0) {
				this.scene.removeFlake(this);
				return false;
			}
			this.y = Math.random() * -this.distance,
			this.x = Math.random() * this.scene.canvas.width,
			this.speed = Math.random() * 150+ 20;
			newLocation = this.x+Math.sin((this.arcplace)/(this.arcwidth))*this.arcpace;
		}
		this.y += this.speed / 80;
		ctx.drawImage(this._rendered, newLocation - radius, this.y - radius); 
		//ctx.arc(newLocation,this.y+=this.speed/80,this.distance / 2,0,Math.PI*2,false);
		this.arcplace++;
		// ctx.closePath();
		// ctx.fill();
	}

	function SnowPile (scene) {
		this.offset = scene._el == document.body ? window.innerHeight - scene.e_height : 0;
		this.canvas = $create('canvas',{
				'style' : 'position: absolute; bottom: '+this.offset+'px; left: 0px; z-index: 2;'
			}),
		this.offPage = false,
		this.pile = [],
		this.maxHeight = 0;
		scene._el.appendChild(this.canvas);
		
		this.canvas.width = scene._el.clientWidth,
		this.canvas.height = Math.ceil(this.maxHeight) + 1;
		for (var p = 0, pl = this.canvas.clientWidth; p <= pl; p++) {
			this.pile[p] = Math.floor(Math.max(0,Math.random()-0.4)*3+21);
			this.maxHeight = Math.max(this.pile[p], this.maxHeight);
		}
		
		if (typeof G_vmlCanvasManager != 'undefined') G_vmlCanvasManager.initElement(this.canvas);
		this.ctx = this.canvas.getContext('2d');
		
		this.draw();
	}
	SnowPile.prototype.draw = function () {
		this.canvas.height = Math.ceil(this.maxHeight) + 1;
		this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		
		this.ctx.fillStyle = "#FFFFFF";
		this.ctx.beginPath();
		this.ctx.moveTo(0,this.pile[0]);
		
		for(var pl = 0, pw = this.canvas.width; pl <= pw; pl++) {
			this.ctx.lineTo(pl,this.canvas.height-this.pile[pl]);
			if(this.canvas.height - this.pile[pl] < 10) {
				this.offPage = true;
			}
		}
		this.ctx.lineTo(this.canvas.width, this.canvas.height);
		this.ctx.lineTo(0, this.canvas.height);
		this.ctx.closePath();
		this.ctx.fill();
	};
	/**	addToPile
	  *	
	  *	Add flake to snow pile
	  *	
	  **/
	SnowPile.prototype.addToPile = function(flake) {
		var floored = Math.floor(flake.x);
		for (var d = -flake.distance, dl = flake.distance; d <= dl; d++) {
			if((floored + d > 0) && (floored + d < this.pile.length)) {
				var adding = ((flake.distance) - Math.abs(d)) / flake.distance;
				this.pile[floored + d] += adding;
				this.maxHeight = Math.max(this.pile[floored + d], this.maxHeight);
				if(isNaN(this.maxHeight)) console.log(this.maxHeight, floored, flake, this.pile.slice(floored-flake.distance, floored+flake.distance));
			}
		}
		// Normalize for the surrounding area
		for(var pl = Math.max(0, floored - 8), pw = Math.min(floored+8, this.canvas.width); pl < pw; pl++) {
			var avg = this.pile[pl],
				val = avg,
				divisor = 1;
			if(pl+1 < pw) avg += this.pile[pl + 1], divisor++;
			if(pl+2 < pw) avg += this.pile[pl + 2], divisor++;
			if(pl+3 < pw) avg += this.pile[pl + 3], divisor++;
			avg = avg / divisor;
			this.pile[pl] += (avg - val) / 3;
			if(pl+1 <= pw) {
				var i = Math.min(pw - 1, pl + 3);
				this.pile[i] += (avg - this.pile[i]) / 6;
			}
		}
		this.draw();
	};
	SnowPile.prototype.getHeight = function (x) {
		return x ? this.pile[Math.floor(x)] : this.maxHeight;
	};
	SnowPile.prototype.reposition = function (scene) {
		this.offset = scene._el == document.body ? window.innerHeight - scene.e_height : 0;
		this.canvas.style.bottom = this.offset+"px";
	};
	SnowPile.prototype.destroy = function () {
		this.canvas.parentNode.removeChild(this.canvas);
		delete this.pile;
	}

	function Scene(el, notchanged) {
		// Init
		var SR = this;
		this.e_height = el == document.body ? Math.max(el.offsetHeight, window.innerHeight) : el.offsetHeight,
		this.e_width = el.offsetWidth,
		this._el = el,
		this.flakeCount = 10,
		this.deleteCount = 0,
		this.iterationCheck = 20,
		this._paused = true,
		
		// Setup Canvas
		this.canvas = $create('canvas', {
				'className' : 'canvasElement',
				'style' : 'position: absolute; left: 0px; top: 0px; z-index: 1;'
			});
		this.canvas.height = this.e_height;
		this.canvas.width = this.e_width;
		el.appendChild(this.canvas);
		if (typeof G_vmlCanvasManager != 'undefined') G_vmlCanvasManager.initElement(canvas);
		this.context = this.canvas.getContext('2d');
		
		// Build snow pile
		this.snowpile = new SnowPile(this);
		this.resize();
		
		this.play();
	}
	Scene.prototype.step = function () {
		this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
		for(var s in this.snowflakes) {
			this.snowflakes[s].fall();
		}
		return this;
	}
	Scene.prototype.pause = function () {
		if(this._paused) return this;
		
		this._paused = true;
		clearInterval(this.timer);
		return this;
	};
	Scene.prototype.play = function () {
		if(!this._paused) return this;
		
		var self = this,
			stepcount = 0,
			totaldiff = 0,
			$count = $('count');
		this._paused = false;
		var next = function () {
				var start = new Date();
				self.step();
				stepcount++;
				var diff = new Date() - start;
				totaldiff += diff;
				
				if(stepcount % self.iterationCheck == 0) {
					
					var avg = totaldiff / self.iterationCheck;
					totaldiff = 0;
					if($count) $count.innerHTML = (self.flakeCount - self.deleteCount)+' snowflakes drawn about every '+avg+'ms';
					
					if(avg <= 16.0) {
						// Going really fast, lets add a couple flakes
						self.flakeCount += 20;
						for(var s = 0; s < 20; s++) {
							var sn = new Snowflake(Math.random()*self.e_width, 0,self);
							self.snowflakes.push(sn);
						}
						self.deleteCount=0;
					} else if(avg < 25.0) {
						// Going between 60 and 30 fps, a good speed, but lets push it and add a couple more
						self.flakeCount += 10;
						for(var s = 0; s < 10; s++) {
							var sn = new Snowflake(Math.random()*self.e_width, 0,self);
							self.snowflakes.push(sn);
						}
						self.deleteCount=0;
						//next();
					} else if(avg <= 30.0) {
						//We're around 30 fps, just go to the next frame
					} else if(avg <= 40.0) {
						// We're going a little slow, lets mark some to be removed
						self.deleteCount += 5;
					} else {
						// We're going slow, lets mark some to be removed
						self.deleteCount += 15;
					}
				}
				
				self.timer = setTimeout(next,Math.max(0,25 - (diff)));
			};
		
		next();
		// this.timer = setInterval(function () {
			// self.step();
		// }, typeof G_vmlCanvasManager != 'undefined' && notchanged ? 100 : $('speed') ? $('speed').value : 33);
		return this;
	};
	Scene.prototype.resize = function () {
		this.pause(),
		this.e_height = this._el == document.body ? Math.max(this._el.offsetHeight, window.innerHeight) : this._el.offsetHeight,
		this.e_width = this._el.offsetWidth,
		this.canvas.height = this.e_height,
		this.canvas.width = this.e_width;
		//this.flakeCount = $('snowflakes') ? $('snowflakes').value : 500;
		
		for(var s in this.snowflakes)
			delete this.snowflakes[s];
		
		this.snowflakes = [];
		
		for(var s = 0; s < this.flakeCount; s++) {
			var sn = new Snowflake(Math.random()*this.e_width, 0,this);
			sn.fall();
			this.snowflakes.push(sn);
		}
		this.snowpile.reposition(this);
		return this.play();
	};
	Scene.prototype.destroy = function () {
		this.canvas.parentNode.removeChild(this.canvas);
		this.snowpile.destroy();
		clearInterval(this.timer);
		return this;
	};
	Scene.prototype.removeFlake = function (flake) {
		this.snowflakes.splice(this.snowflakes.indexOf(flake),1);
		this.flakeCount = this.snowflakes.length;
		this.deleteCount--;
	};

	/** Document Load function.
	  * 
	  *     Handle logic start once page is loaded.
	  * 
	  */
	var scene,
		prefix = "",
		addEvent = "addEventListener",
		removeEvent = "removeEventListener",
		notchanged = true;
	
	// Start
	if(document.createElement('canvas').getContext || typeof G_vmlCanvasManager != 'undefined') init();
	function init() {
		if(!window[addEvent])
			prefix = "on", addEvent = "attachEvent", removeEvent = "detachEvent";
		
		window[addEvent](prefix+'load', function () {
			
			$c_flake = $('snowflakes'),
			$c_speed = $('speed'),
			$hide    = $('hide');
			
			scene = new Scene(document.body, 
					typeof G_vmlCanvasManager != 'undefined' && notchanged ?
						10 : $c_flake ? $c_flake.value : 500, notchanged);
			
			// TODO
			if($c_flake)
				$c_flake[addEvent](prefix+'change', function(e) {
					notchanged = false;
					scene.pause().resize().play();
				});
			if($c_speed)
				$('speed')[addEvent](prefix+'change', function(e) {
					notchanged = false;
					scene.pause().play();
				});
			if($hide)
				$('hide')[addEvent](prefix+'click', function(e) {
					$('window_hide').style.display = 'none';
					e.preventDefault();
					e.stopPropagation();
					return false;
				});
			
		}, false);
		
		window[addEvent](prefix+'resize', function () {
			if(scene) scene.resize();
		}, false);
		
		window[addEvent](prefix+'blur', function () {
			if(scene) {
				scene.pause();
				
				var focusFunc = function () {
					scene.play();
					window[removeEvent](prefix+'focus', focusFunc, false);
				}
				
				window[addEvent](prefix+'focus', focusFunc, false);
			}
		}, false);
		
	}

})();