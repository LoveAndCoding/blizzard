# It's a Blizzard Out There

Make your website snow.

## How to use

There are two ways you can make your pages snow. If you'd like your site
to always use the most up to date version, you can include the following
script snippet on your page.

    <script type="text/javascript" src="http://itsablizzardoutthere.com/snowfall.stable.js"></script>

The second method is to download the script from this page an include it
on your page.

## Compatability

* Firefox
* Chrome
* Opera 12+
* iOS 5+
* Android 2.3+
* IE 9+

IE 7 and 8 are compatible using [explorercanvas from Google](http://code.google.com/p/explorercanvas/).

## Configuration options

This is a list of all options available and what they do

### Snowflakes
	"total"     (INT) : Total number of flakes to draw. Overrides min, and max.
	"min"       (INT) : Minimum number of flakes to draw. Overriden by total and minFPS (DEFAULT 0)
	"max"       (INT) : Maximum number of flakes to draw. Overriden by total. (DEFAULT Infinity)
	"starting"  (INT) : Number of flakes to start with. (DEFAULT 10)
	"lock"      (BOL) : Lock the number drawn to the value current number. (DEFAULT false)
	"pileUp"    (BOL) : Pile up the flakes at the bottom of the screen. (DEFAULT true)
	"sizes"     (INT) : Number of sizes to use when drawing the flakes. (DEFAULT 3)

### Speed
	"FPS"       (INT) : Number of frames per second to draw at. Overrides minFPS, and maxFPS.
	"minFPS"    (INT) : Minimum number of frames per second to draw at. Overriden by FPS, overrides min. (DEFAULT 0)
	"maxFPS"    (INT) : Maximum number of frames per second to draw at. Overriden by FPS. (DEFAULT 60)
	"pauseBlur" (BOL) : Pause when the window looses focus. (DEFAULT true)

### Controls
	NO ACTIVE OPTIONS YET

### Debugging
	NO ACTIVE OPTIONS YET

## License

Code released under MIT license. View LICENSE file for more information.
