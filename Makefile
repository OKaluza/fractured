#COMP = yui-compressor -v 
#FLAGS = -o
COMP = java -jar compiler-latest/compiler.jar --js=
FLAGS = --js_output_file=
SCRIPTS = colourPicker.js gradient.js formulae.js index.js utils.js ajax.js mouse.js parser.js fractal.js colour.js sylvester.js webgl.js webcl.js

# --js=sha256.js --js=colourPicker.js --js=index.js --js=utils.js --js=ajax.js --js=mouse.js --js=parser.js --js=fractal.js --js=colour.js --js=sylvester.js --js=webgl.js --js_output_file=fractured-compressed.js #--compilation_level ADVANCED_OPTIMIZATIONS 

all: fractured-compressed.js

fractured-index.js: $(SCRIPTS)
	cat $(SCRIPTS) > fractured-index.js

fractured-compressed.js: fractured-index.js
	$(COMP)fractured-index.js $(FLAGS)fractured-compressed.js


