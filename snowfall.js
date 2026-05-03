/**
 *	Copyright (c) 2019 Alexis Hushbeck
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
(function() {
	/**	OPTIONS
	 *	This is a list of all options available and what they do
	 *
	 *	SNOWFLAKES
	 *		"total"     (INT) : Total number of flakes to draw. Overrides min, and max.
	 *		"min"       (INT) : Minimum number of flakes to draw. Overriden by total and minFPS (DEFAULT 0)
	 *		"max"       (INT) : Maximum number of flakes to draw. Overriden by total. (DEFAULT Infinity)
	 *		"starting"  (INT) : Number of flakes to start with. (DEFAULT 250)
	 *		"lock"      (BOL) : Lock the number drawn to the value current number. (DEFAULT false)
	 *		"pileUp"    (BOL) : Pile up the flakes at the bottom of the screen. (DEFAULT true)
	 *		"sizes"     (INT) : Number of sizes to use when drawing the flakes. (DEFAULT 3)
	 *
	 *	SPEED
	 *		"FPS"       (INT) : Number of frames per second to draw at. Overrides minFPS, and maxFPS.
	 *		"minFPS"    (INT) : Minimum number of frames per second to draw at. Overriden by FPS, overrides min. (DEFAULT 0)
	 *		"maxFPS"    (INT) : Maximum number of frames per second to draw at. Overriden by FPS. (DEFAULT 60)
	 *		"pauseBlur" (BOL) : Pause when the window looses focus. (DEFAULT true)
	 *
	 *	ACCESSIBILITY / PERF
	 *		"respectReducedMotion" (BOL) : When true (default), no animation if the user prefers reduced motion.
	 *
	 *	CONTROLS
	 *		NO ACTIVE OPTIONS YET
	 *
	 *	Debug
	 *		"logTiming" (BOL) : Log the timing of drawing to the console. `console.log` is assumed. (DEFAULT false)
	 *
	 *	Note: After setOptions(), minFPS and maxFPS are stored as milliseconds per frame (1000 / fps), not as fps.
	 *
	 **/

	const DEFAULTS = {
		// Snowflakes
		min: 0,
		max: Infinity,
		starting: 250,
		lock: false,
		pileUp: true,
		sizes: 3,

		// Speed
		minFPS: 1000 / 30,
		maxFPS: 1000 / 60,
		pauseBlur: true,

		// Accessibility
		respectReducedMotion: true,

		// Controls
		// To Be Added

		// Debug
		logTiming: false,
	};
	const FLAKE_CACHE = [];
	const TWOPI = Math.PI * 2;
	/** ~60fps baseline; fall speed was historically `speed / 40` per frame at that rate */
	const REFERENCE_FRAME_MS = 1000 / 60;
	const MAX_STEP_MS = 100;

	let options = Object.assign({}, DEFAULTS);

	// Get value within bounds
	function bounds(low, val, high) {
		if (val === Infinity) return high;
		else if (val === -Infinity) return low;
		else return Math.max(low, Math.min(val, high));
	}

	function clearFlakeTextureCache() {
		FLAKE_CACHE.length = 0;
	}

	function prefersReducedMotion() {
		return (
			typeof matchMedia !== "undefined" &&
			matchMedia("(prefers-reduced-motion: reduce)").matches
		);
	}

	/**
	 * An individual tiny little snowflake. Just one though. To make it snow, we
	 * need lots of these.
	 */
	class Snowflake {
		/**
		 * Get the cached render of a single snowflake
		 *
		 * @param {number} size Size (or distance) of the snowflake
		 */
		static flakeRender(size) {
			if (FLAKE_CACHE[size]) return FLAKE_CACHE[size];

			const rendered = document.createElement("canvas");
			rendered.width = rendered.height = size;
			const ctx = rendered.getContext("2d", { alpha: false });
			const halfSize = size / 2;

			let rgb = 180;
			for (let m = size, l = 1; m > l; m--)
				rgb += Math.floor(76 / options.sizes);
			rgb = rgb.toString(16).repeat(3);

			ctx.fillStyle = "#" + rgb;
			ctx.beginPath();
			ctx.arc(halfSize, halfSize, halfSize, 0, TWOPI, false);
			ctx.closePath();
			ctx.fill();

			FLAKE_CACHE[size] = rendered;

			return rendered;
		}

		constructor(left, top, scene) {
			this.arcplace = Math.floor(Math.random() * 100); // Variable used for back and forth calculations
			this.y = top; // Place on the screen
			this.x = left;
			this.speed = Math.random() * 150 + 20;
			this.arcpace = Math.random() * 20 + 10;
			this.arcwidth = Math.random() * 50 + 50;
			this.distance = Math.floor(Math.random() * options.sizes + 1); // "Distance" from the screen
			this.arcLocation = this.calculateArcLocation();
			this.scene = scene;

			// Cache a rendered copy of the snowflake
			this._rendered = Snowflake.flakeRender(this.distance);
		}

		/**
		 * Draws the snowflake at it's currently calculated position
		 */
		draw() {
			const radius = this.distance / 2;
			this.scene.context.drawImage(
				this._rendered,
				this.arcLocation - radius,
				this.y - radius,
			);
		}

		/**
		 * Find out where in our arc pattern we are (i.e. what X should be)
		 */
		calculateArcLocation() {
			return (
				this.x + Math.sin(this.arcplace / this.arcwidth) * this.arcpace
			);
		}

		/**
		 * Figure out if we've hit the ground at our current position
		 *
		 * @param {number} arcLocation Precomputed x-location
		 */
		willHitGround(arcLocation) {
			const pile = this.scene.snowpile;
			const groundOffset = pile
				? pile.getHeight(arcLocation + this.distance / 2)
				: 0;
			const groundHeight = this.scene.canvas.height - groundOffset;
			return this.y > groundHeight;
		}

		/**
		 * A.K.A. Tick
		 *
		 * This moves our animation forward one.
		 * @param {number} dtMs elapsed time since last step in milliseconds
		 */
		fall(dtMs) {
			const frameScale = dtMs / REFERENCE_FRAME_MS;

			this.arcLocation = this.calculateArcLocation();
			this.y += (this.speed / 40) * frameScale;

			if (this.willHitGround(this.arcLocation)) {
				if (options.pileUp && this.scene.snowpile) {
					this.scene.snowpile.addToPile(this);
				}

				if (this.scene.deleteCount > 0) {
					this.scene.removeFlake(this);
					return false;
				}

				this.y = -this.distance;
				this.x = Math.random() * this.scene.canvas.width;
				this.speed = Math.random() * 150 + 20;
				this.arcLocation = this.calculateArcLocation();
			}

			this.arcplace++;
		}
	}

	/**
	 * Our pile of snow that builds up along the bottom
	 */
	class SnowPile {
		constructor(scene) {
			this.offset =
				scene._el == document.body
					? window.innerHeight - scene.e_height
					: 0;
			this.canvas = document.createElement("canvas");
			this.canvas.style = `position: absolute; bottom: ${this.offset}px; left: 0px; z-index: 2;`;
			this.offPage = false;
			this.pile = [];
			this.maxHeight = 0;
			this._lastDrawnPileHeight = -1;
			this._dirty = true;
			scene._el.appendChild(this.canvas);

			this.reset(scene);
		}

		markDirty() {
			this._dirty = true;
		}

		/**
		 * Quick helper function to get the height at a specific x-coord
		 *
		 * @param {number} x X-coord to get the height at
		 */
		getHeight(x) {
			return x ? this.pile[Math.floor(x)] : this.maxHeight;
		}

		/**
		 * Draw the snowpile along the bottom
		 */
		draw() {
			const targetH = Math.ceil(this.maxHeight) + 1;
			if (targetH !== this._lastDrawnPileHeight) {
				this.canvas.height = targetH;
				this._lastDrawnPileHeight = targetH;
			}

			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

			this.ctx.fillStyle = "#FFFFFF";
			this.ctx.beginPath();
			this.ctx.moveTo(0, this.pile[0]);

			for (let pl = 0, pw = this.canvas.width; pl <= pw; pl++) {
				this.ctx.lineTo(pl, this.canvas.height - this.pile[pl]);
				if (this.canvas.height - this.pile[pl] < 10) {
					this.offPage = true;
				}
			}
			this.ctx.lineTo(this.canvas.width, this.canvas.height);
			this.ctx.lineTo(0, this.canvas.height);
			this.ctx.closePath();
			this.ctx.fill();
			this._dirty = false;
		}

		/**
		 * "Impact" a snowflake with our pile at it's current position. This
		 * will cause a bit of normailzation of the pile, but does not cause
		 * the pile to redraw.
		 *
		 * @param {Snowflake} flake the flake that we're adding
		 */
		addToPile(flake) {
			const floored = Math.floor(flake.x);
			for (let d = -flake.distance, dl = flake.distance; d <= dl; d++) {
				const idx = floored + d;
				if (idx > 0 && idx < this.pile.length) {
					const adding =
						(flake.distance - Math.abs(d)) / flake.distance;
					this.pile[idx] += adding;
					this.maxHeight = Math.max(this.pile[idx], this.maxHeight);
				}
			}
			// == Normalize for the surrounding area
			// If we just let flakes accumulate where they land, we get odd
			// looking "spires" of snow. This is because a location that is
			// slightly higher than others is more likely to get a snowflake
			// to hit it.
			//
			// To offset this, we do a bit of normalization around the area
			// where a snowflake lands. Think of this like it being squished
			// to fit the surrounding area a bit. Doing this makes the whole
			// snowpile look a lot more natural, and makes the accumulation
			// more visually appealing.
			//
			// TODO(alexis): This normalization looks more complicated than
			// it actually is. Clean it up.
			for (
				let norm_location = Math.max(0, floored - 8),
					norm_width = Math.min(floored + 8, this.canvas.width);
				norm_location < norm_width;
				norm_location++
			) {
				let avg = this.pile[norm_location];
				const val = avg;
				let divisor = 1;

				// Find an "average" of the surrounding few pixels
				if (norm_location + 1 < norm_width) {
					avg += this.pile[norm_location + 1];
					divisor++;
				}
				if (norm_location + 2 < norm_width) {
					avg += this.pile[norm_location + 2];
					divisor++;
				}
				if (norm_location + 3 < norm_width) {
					avg += this.pile[norm_location + 3];
					divisor++;
				}
				avg = avg / divisor;

				// Normalize the spot we're trying to normalize
				this.pile[norm_location] += (avg - val) / 3;
				// ... and apply that normalization out to the surrounding area
				if (norm_location + 1 <= norm_width) {
					const i = Math.min(norm_width - 1, norm_location + 3);
					this.pile[i] += (avg - this.pile[i]) / 6;
				}
			}
			this.markDirty();
		}

		/**
		 * Reset the current pile to it's base
		 *
		 * @param {Scene} scene The scene we're being reset into
		 */
		reset(scene) {
			this.maxHeight = 0;
			this.canvas.width = scene._el.clientWidth;
			this.canvas.height = Math.ceil(this.maxHeight) + 1;
			for (let p = 0, pl = this.canvas.clientWidth; p <= pl; p++) {
				this.pile[p] = Math.floor(
					Math.max(0, Math.random() - 0.4) * 3 + 21,
				);
				this.maxHeight = Math.max(this.pile[p], this.maxHeight);
			}
			this.ctx = this.canvas.getContext("2d", { alpha: false });
			this._lastDrawnPileHeight = -1;
			this.markDirty();
			this.draw();
		}

		/**
		 * Sometimes we need to reposition ourselves if the window resized or
		 * our container did. This lines the pile up along the bottom.
		 *
		 * @param {Scene} scene The scene we need to reposition for
		 */
		reposition(scene) {
			this.offset =
				scene._el == document.body
					? window.innerHeight - scene.e_height
					: 0;
			this.canvas.style.bottom = this.offset + "px";
			this.reset(scene);
		}

		/**
		 * Last one out of Liberty City, burn it to the ground
		 */
		destroy() {
			this.canvas.parentNode.removeChild(this.canvas);
			delete this.pile;
		}
	}

	/**
	 * Our scene, which controls the rendering process and running each of the
	 * animation ticks
	 */
	class Scene {
		constructor(el) {
			// Init
			this.e_height =
				el == document.body
					? Math.max(el.offsetHeight, window.innerHeight)
					: el.offsetHeight;
			this.e_width = el.offsetWidth;
			this._el = el;
			this.flakeCount = options.starting;
			this.deleteCount = 0;
			this.iterationCheck = 100;
			this._paused = true;
			this._frozenByBlur = false;
			this._reducedMotion =
				options.respectReducedMotion !== false && prefersReducedMotion();

			if (this._reducedMotion) {
				this.flakeCount = 0;
			}

			// Setup Canvas
			this.canvas = document.createElement("canvas");
			this.canvas.className = "canvasElement";
			this.canvas.style =
				"position: absolute; left: 0px; top: 0px; z-index: 1;";
			this.canvas.height = this.e_height;
			this.canvas.width = this.e_width;
			el.appendChild(this.canvas);
			this.context = this.canvas.getContext("2d", { alpha: false });

			// Build snow pile (skipped when reduced motion — saves layout + pile simulation)
			this.snowpile = this._reducedMotion ? null : new SnowPile(this);
			this.snowflakes = [];
			this._lastFrameTime = 0;

			this.resize();
		}

		/**
		 * Draw the whole scene with all the snowflakes and the snowpile
		 */
		draw() {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			// Fill the background because we don't have an alpha channel
			this.context.fillStyle = "#102d3a";
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			const flakes = this.snowflakes;
			for (let i = 0, n = flakes.length; i < n; i++) {
				flakes[i].draw();
			}
			if (this.snowpile && this.snowpile._dirty) {
				this.snowpile.draw();
			}
			return this;
		}

		/**
		 * A.K.A. Tick
		 *
		 * Moves the scene's animation forward one frame
		 * @param {number} dtMs elapsed time since last step in milliseconds
		 */
		step(dtMs) {
			const flakes = this.snowflakes;
			for (let i = 0, n = flakes.length; i < n; i++) {
				flakes[i].fall(dtMs);
			}

			return this;
		}

		/**
		 * Automatically adjust the number of snowflakes we have in our scene
		 * based on how well we're rendering.
		 *
		 * Also logs if logging is enabled.
		 *
		 * @param {number} msPerFrameAvg Average # of ms to render a frame
		 */
		autoAdjustFlakeCount(msPerFrameAvg) {
			const checkit = () => {
				if (options.logTiming) {
					const fps = Math.round(1000 / msPerFrameAvg);
					const msg = [
						`${this.snowflakes.length.toLocaleString()} snowflakes`,
						` are being rendered in ${msPerFrameAvg}ms, which is `,
						`roughly ${fps} FPS`,
					];
					if (fps > 60) {
						msg.push(" (Capped at 60 FPS)");
					}
					console.log(msg.join(""));
				}

				if (
					msPerFrameAvg <=
					options.maxFPS + (options.minFPS - options.maxFPS) / 2
				) {
					// Going really fast, lets add a couple flakes
					const addit = bounds(0, options.max - this.flakeCount, 20);
					this.flakeCount += addit;
					for (let s = 0; s < addit; s++) {
						const sn = new Snowflake(
							Math.random() * this.e_width,
							0,
							this,
						);
						this.snowflakes.push(sn);
					}
					this.deleteCount = bounds(
						0,
						-1 * (options.max - this.flakeCount),
						10,
					);
				} else if (
					msPerFrameAvg <
					options.maxFPS + (options.minFPS - options.maxFPS) * 0.75
				) {
					// Going between 60 and 30 fps, a good speed, but lets push it and add a couple more
					const addit = bounds(0, options.max - this.flakeCount, 30);
					this.flakeCount += addit;
					for (let s = 0; s < addit; s++) {
						const sn = new Snowflake(
							Math.random() * this.e_width,
							0,
							this,
						);
						this.snowflakes.push(sn);
					}
					this.deleteCount = bounds(
						0,
						-1 * (options.max - this.flakeCount),
						10,
					);
					//next();
				} else if (msPerFrameAvg <= options.minFPS) {
					//We're around 30 fps, just go to the next frame
				} else if (msPerFrameAvg <= options.minFPS * 1.25) {
					// We're going a little slow, lets mark some to be removed
					this.deleteCount += 5;
				} else {
					// We're going slow, lets mark some to be removed
					this.deleteCount += 15;
				}
			};

			// If we can do a smarter defer, do that
			if (window.requestIdleCallback) {
				window.requestIdleCallback(checkit, { timeout: 100 });
			} else {
				// ... otherwise just defer to a future event loop
				setTimeout(checkit, 10);
			}
		}

		/**
		 * Pause the animation and rendering
		 */
		pause() {
			if (this._paused) return this;

			this._paused = true;
			window.cancelAnimationFrame(this.timer);
			return this;
		}

		/**
		 * Start or resume rendering and animating the scene
		 */
		play() {
			if (!this._paused) return this;
			if (this._reducedMotion) return this;

			let stepcount = 0;
			let totaldiff = 0;
			this._paused = false;
			this._lastFrameTime = performance.now();

			const next = (now) => {
				const rawDt = now - this._lastFrameTime;
				this._lastFrameTime = now;
				const dtMs = Math.min(Math.max(rawDt, 0), MAX_STEP_MS);

				const start = performance.now();
				this.draw();
				this.step(dtMs);
				stepcount++;
				const diff = performance.now() - start;
				totaldiff += diff;

				if (!options.lock && stepcount % this.iterationCheck == 0) {
					this.autoAdjustFlakeCount(totaldiff / this.iterationCheck);
					totaldiff = 0;
				}

				this.timer = window.requestAnimationFrame(next);
			};

			this.timer = window.requestAnimationFrame(next);
			return this;
		}

		/**
		 * Trigger an automatic resize to realign the scene to the containing
		 * element. This will wipe any snowflakes in the scene so we can
		 * properly position them again.
		 */
		resize() {
			this.pause();
			// Now resize
			this.e_height =
				this._el == document.body
					? Math.max(this._el.offsetHeight, window.innerHeight)
					: this._el.offsetHeight;
			this.e_width = this._el.offsetWidth;
			this.canvas.height = this.e_height;
			this.canvas.width = this.e_width;

			this.snowflakes = [];

			for (let s = 0; s < this.flakeCount; s++) {
				const sn = new Snowflake(
					Math.random() * this.e_width,
					Math.random() * this.e_height,
					this,
				);
				this.snowflakes.push(sn);
			}
			if (this.snowpile) {
				this.snowpile.reposition(this);
			}

			if (this._reducedMotion) {
				this._paused = true;
				this.context.clearRect(
					0,
					0,
					this.canvas.width,
					this.canvas.height,
				);
				this.context.fillStyle = "#102d3a";
				this.context.fillRect(
					0,
					0,
					this.canvas.width,
					this.canvas.height,
				);
				return this;
			}

			this._lastFrameTime = performance.now();
			return this.play();
		}

		/**
		 * Destroy the whole scene
		 */
		destroy() {
			this.pause();
			this.canvas.parentNode.removeChild(this.canvas);
			if (this.snowpile) {
				this.snowpile.destroy();
			}
			return this;
		}

		/**
		 * Remove a snowflake from the scene. We often do this to
		 * improve the framerate of the animation if it's too high.
		 *
		 * @param {Snowflake} flake The snowflake we want to remove
		 */
		removeFlake(flake) {
			const flakes = this.snowflakes;
			const i = flakes.indexOf(flake);
			if (i === -1) return;
			const last = flakes.length - 1;
			if (i !== last) {
				flakes[i] = flakes[last];
			}
			flakes.pop();
			this.flakeCount = flakes.length;
			this.deleteCount--;
		}
	}

	let scene;
	let resizeRaf = 0;

	/**
	 * Initialize our page and scene
	 */
	function scheduleResize() {
		cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(function() {
			resizeRaf = 0;
			if (scene) scene.resize();
		});
	}

	function startScene() {
		scene = new Scene(document.body);
		if (typeof ResizeObserver !== "undefined" && scene._el) {
			new ResizeObserver(scheduleResize).observe(scene._el);
		}
	}

	function init() {
		if (document.readyState === "complete") {
			startScene();
		} else {
			window.addEventListener("load", startScene);
		}

		window.addEventListener("resize", scheduleResize, { passive: true });

		document.addEventListener("visibilitychange", () => {
			if (!scene) return;
			if (document.hidden) {
				scene.pause();
			} else if (!scene._frozenByBlur) {
				scene.play();
			}
		});

		window.addEventListener("blur", () => {
			if (scene && options.pauseBlur) {
				scene._frozenByBlur = true;
				scene.pause();

				const focusFunc = () => {
					scene._frozenByBlur = false;
					if (!document.hidden) {
						scene.play();
					}
					window.removeEventListener("focus", focusFunc);
				};

				window.addEventListener("focus", focusFunc);
			}
		});
	}

	// Expose our API so folks can control the snow, if they like
	window.Snowfall = {
		setOptions: function(opts) {
			const prevSizes = options.sizes;
			options = Object.assign({}, DEFAULTS, opts);

			if (options.total) {
				options.max = options.total;
				options.min = options.starting;
				options.lock = options.starting == options.total;
			}

			if (options.FPS) {
				options.minFPS = options.FPS;
				options.maxFPS = options.FPS;
			}
			// Convert FPS to pre-computed vals
			options.minFPS = 1000 / options.minFPS;
			options.maxFPS = 1000 / options.maxFPS;

			if (options.sizes !== prevSizes) {
				clearFlakeTextureCache();
			}
		},
		pause: function() {
			if (scene) scene.pause();
		},
		play: function() {
			if (scene) scene.play();
		},
		resize: function() {
			if (scene) scene.resize();
		},
	};

	// Let's rock and roll!
	init();
})();
