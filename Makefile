#COMP = yui-compressor -v 
#FLAGS = -o
COMP = java -jar compiler-latest/compiler.jar --js=
FLAGS = --js_output_file=
SCRIPTS = colourPicker.js gradient.js formulae.js index.js utils.js ajax.js mouse.js parser.js fractal.js colour.js gl-matrix.js webgl.js webcl.js
# Flags to pass to rst2html
RSTFLAGS = --stylesheet-path=docs/docstyle.css 

# --js=sha256.js --js=colourPicker.js --js=index.js --js=utils.js --js=ajax.js --js=mouse.js --js=parser.js --js=fractal.js --js=colour.js --js=gl-matrix.js --js=webgl.js --js_output_file=fractured-compressed.js #--compilation_level ADVANCED_OPTIMIZATIONS 

all: fractured-compressed.js docs/docs.html defaultformulae.json

fractured-index.js: $(SCRIPTS)
	cat $(SCRIPTS) > fractured-index.js

fractured-compressed.js: fractured-index.js
	$(COMP)fractured-index.js $(FLAGS)fractured-compressed.js

docs/docs.html: docs/docs.rst
	rst2html	$(RSTFLAGS)	$<	$@
	cp docs/docs.html ./docs.html

defaultformulae.json: include/*.* formulae/*.*
	python rebuild.py

