#!/bin/sh
cat colourPicker.js index.js utils.js ajax.js mouse.js parser.js fractal.js colour.js sylvester.js webgl.js > fractured-index.js
yui-compressor -v fractured-index.js -o fractured-compressed.js
