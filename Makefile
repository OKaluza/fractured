VERSION = 0.77
COMP = java -jar compiler-latest/compiler.jar --js=
FLAGS = --js_output_file=
RSTFLAGS = --stylesheet-path=docs/docstyle.css 

#Targets
fractured=release/fractured_$(VERSION).js
includes=release/includes_$(VERSION).json
formulae=release/formulae_$(VERSION).json
docs=release/docs_$(VERSION).html
codemirror=release/codemirror.js

#Sources
SCRIPTS = colourPicker.js gradient.js formulae.js index.js utils.js ajax.js mouse.js html5slider.js parser.js fractal.js colour.js webgl.js webcl.js 
CMSCRIPTS = codemirror/lib/codemirror.js $(wildcard codemirror/lib/util/*.js) codemirror/mode/clike/clike.js codemirror/mode/javascript/javascript.js

all: release $(fractured) $(codemirror) $(docs) $(includes) $(formulae)

.PHONY : release
release:
	-mkdir release
	sed "s/VERSION/$(VERSION)/g" index.html > release/index.html
	sed -i "/<!--@ -->/,/<!-- @-->/d" release/index.html
	sed -i "s/<!--script\(.*\)script-->/<script\1script>/g" release/index.html
	cp palettes.json editor.html favicon.ico styles.css release
	cp --parents codemirror/lib/codemirror.css release
	cp --parents codemirror/lib/util/dialog.css release
	cp --parents -R codemirror/theme release
	cp -R media release
	cp -R ss release

.PHONY : clean
clean:
	-rm -r release

$(fractured): $(SCRIPTS) gl-matrix.js
	cat $(SCRIPTS) > /tmp/fractured-index.js
	sed -i "s/---VERSION---/$(VERSION)/g" /tmp/fractured-index.js
	$(COMP)/tmp/fractured-index.js $(FLAGS)/tmp/fractured-compressed.js
	$(COMP)gl-matrix.js $(FLAGS)/tmp/gl-matrix-min.js
	cat /tmp/fractured-compressed.js /tmp/gl-matrix-min.js > $(fractured)

$(codemirror): $(CMSCRIPTS)
	cat $(CMSCRIPTS) > /tmp/codemirror-index.js
	$(COMP)/tmp/codemirror-index.js $(FLAGS)/tmp/codemirror-compressed.js
	cat codemirror/LICENSE /tmp/codemirror-compressed.js > $(codemirror)

$(docs): docs/docs.rst
	rst2html $(RSTFLAGS) $< $@
	sed -i "s/VERSION/$(VERSION)/g" $(docs)

$(includes): $(wildcard include/*)
	python rebuild.py $(includes)

$(formulae): $(wildcard formulae/*.formula)
	python rebuild.py $(formulae)
