#!/bin/sh
#cat sha256.js colourPicker.js index.js utils.js ajax.js mouse.js parser.js fractal.js colour.js sylvester.js webgl.js > fractured-index.js
#yui-compressor -v fractured-index.js -o fractured-compressed.js

java -jar compiler-latest/compiler.jar --js=sha256.js --js=colourPicker.js --js=index.js --js=utils.js --js=ajax.js --js=mouse.js --js=parser.js --js=fractal.js --js=colour.js --js=sylvester.js --js=webgl.js --js_output_file=fractured-compressed.js #--compilation_level ADVANCED_OPTIMIZATIONS 
