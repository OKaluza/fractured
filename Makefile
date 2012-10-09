#COMP = yui-compressor -v 
#FLAGS = -o
COMP = java -jar compiler-latest/compiler.jar --js=
FLAGS = --js_output_file=
SCRIPTS = colourPicker.js gradient.js formulae.js index.js utils.js ajax.js mouse.js parser.js fractal.js colour.js webgl.js webcl.js #gl-matrix.js 
CM = codemirror/
CMSCRIPTS = $(CM)lib/codemirror.js $(wildcard $(CM)lib/util/*.js) $(CM)mode/clike/clike.js $(CM)mode/javascript/javascript.js
# Flags to pass to rst2html
RSTFLAGS = --stylesheet-path=docs/docstyle.css 

# --js=sha256.js --js=colourPicker.js --js=index.js --js=utils.js --js=ajax.js --js=mouse.js --js=parser.js --js=fractal.js --js=colour.js --js=gl-matrix.js --js=webgl.js --js_output_file=fractured-compressed.js #--compilation_level ADVANCED_OPTIMIZATIONS 

all: fractured-compressed.js codemirror-compressed.js docs/docs.html json

fractured-compressed.js: $(SCRIPTS)
	cat $(SCRIPTS) > fractured-index.js
	$(COMP)fractured-index.js $(FLAGS)fractured-compressed.js
	$(COMP)gl-matrix.js $(FLAGS)gl-matrix-min.js

codemirror-compressed.js: $(CMSCRIPTS)
	cat $(CMSCRIPTS) > codemirror-index.js
	$(COMP)codemirror-index.js $(FLAGS)$(CM)codemirror-compressed.js
	cat $(CM)LICENSE $(CM)codemirror-compressed.js > codemirror-compressed.js

docs/docs.html: docs/docs.rst
	rst2html	$(RSTFLAGS)	$<	$@
	cp docs/docs.html ./docs.html

.PHONY: json
json:
	python rebuild.py

