VERSION = 0.83
COMP = java -jar compiler-latest/compiler.jar --js=
FLAGS = --js_output_file=
#COMP = cp 
#FLAGS = 
RSTFLAGS = --stylesheet-path=docs/docstyle.css 

#Targets
fractured=release/fractured_$(VERSION).js
includes=release/includes_$(VERSION).json
formulae=release/formulae_$(VERSION).json
docs=release/docs_$(VERSION).html
codemirror=release/codemirror_$(VERSION).js
codemirrorstyle=release/codemirror_$(VERSION).css

#Sources
SCRIPTS = colourPicker.js gradient.js parameter.js formulae.js index.js state.js automation.js utils.js ajax.js mouse.js html5slider.js fractal.js colour.js webgl.js webcl.js 
CMSCRIPTS = $(wildcard codemirror/lib/*.js) codemirror/mode/clike/clike.js codemirror/mode/javascript/javascript.js

# Use ':=' instead of '=' to avoid multiple evaluation of NOW.
# Substitute problematic characters with underscore using tr,
#   make doesn't like spaces and ':' in filenames.
NOW := $(shell date +"%c" | tr ' :' '__')

all: release $(fractured) $(codemirror) $(codemirrorstyle) $(docs) $(includes) $(formulae)

.PHONY : release
release:
	-mkdir release
	#Write version info
	sed "s/VERSION/$(VERSION)/g" index.html > release/index.html
	sed "s/VERSION/$(VERSION)/g" editor.html > release/editor.html
	#sed "s/VERSION/$(VERSION)/g" cache.manifest | sed "s/TIMESTAMP/$(NOW)/g" > release/cache.manifest
	sed -i "/<!--@ -->/,/<!-- @-->/d" release/index.html
	sed -i "s/<!--script\(.*\)script-->/<script\1script>/g" release/index.html
	cp palettes.json favicon.ico styles.css offline.html release
	cp -R media release
	cp -R ss release

.PHONY : clean
clean:
	-rm -r release

$(fractured): $(SCRIPTS) gl-matrix.js parser.js libwebcl.js
	cat $(SCRIPTS) > /tmp/fractured-index.js
	sed -i "s/---VERSION---/$(VERSION)/g" /tmp/fractured-index.js
	$(COMP)/tmp/fractured-index.js $(FLAGS)/tmp/fractured-compressed.js
	#Modules that require separate compilation
	$(COMP)gl-matrix.js $(FLAGS)/tmp/gl-matrix-min.js
	$(COMP)parser.js $(FLAGS)/tmp/parser-min.js
	$(COMP)libwebcl.js $(FLAGS)/tmp/libwebcl-min.js
	#Combine into final bundle
	cat /tmp/fractured-compressed.js /tmp/gl-matrix-min.js /tmp/parser-min.js /tmp/libwebcl-min.js > $(fractured)

$(codemirror): $(CMSCRIPTS)
	cat $(CMSCRIPTS) > /tmp/codemirror-index.js
	$(COMP)/tmp/codemirror-index.js $(FLAGS)/tmp/codemirror-compressed.js
	cat codemirror/LICENSE /tmp/codemirror-compressed.js > $(codemirror)

$(codemirrorstyle): codemirror/theme/*.css codemirror/lib/codemirror.css codemirror/lib/dialog.css
	cat codemirror/lib/codemirror.css codemirror/lib/dialog.css codemirror/theme/*.css > $(codemirrorstyle)

$(docs): docs/docs.rst
	rst2html $(RSTFLAGS) $< $@
	sed -i "s/VERSION/$(VERSION)/g" $(docs)

$(includes): $(wildcard include/*)
	python rebuild.py $(includes)

$(formulae): $(wildcard formulae/*.formula)
	python rebuild.py $(formulae)
