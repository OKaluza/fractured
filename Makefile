VERSION = 0.85
#COMP = java -jar compiler-latest/compiler.jar --js=
#FLAGS = --js_output_file=
COMP = cp 
FLAGS = 
RSTFLAGS = --stylesheet-path=docs/docstyle.css 

#Targets
fractured=release/fractured_$(VERSION).js
viewer=release/fracturedviewer_$(VERSION).js
includes=release/includes_$(VERSION).json
formulae=release/formulae_$(VERSION).json
docs=release/docs_$(VERSION).html
codemirror=release/codemirror_$(VERSION).js
codemirrorstyle=release/codemirror_$(VERSION).css

#Sources
VIEWSCRIPTS = parameter.js formulae.js index.js utils.js ajax.js mouse.js fractal.js colour.js webgl.js webcl.js 
SCRIPTS = colourPicker.js gradient.js state.js automation.js html5slider.js $(VIEWSCRIPTS)
CMSCRIPTS = $(wildcard codemirror/lib/*.js) codemirror/mode/clike/clike.js codemirror/mode/javascript/javascript.js

# Use ':=' instead of '=' to avoid multiple evaluation of NOW.
# Substitute problematic characters with underscore using tr,
#   make doesn't like spaces and ':' in filenames.
NOW := $(shell date +"%c" | tr ' :' '__')

all: release $(fractured) $(codemirror) $(codemirrorstyle) $(docs) $(includes) $(formulae)

viewer: release $(viewer) $(docs) $(includes) $(formulae)

.PHONY : release
release:
	-mkdir release
	#Write version info
	sed "s/VERSION/$(VERSION)/g" index.html > release/index.html
	sed "s/VERSION/$(VERSION)/g" editor.html > release/editor.html
	sed "s/VERSION/$(VERSION)/g" viewer.html > release/viewer.html
	#sed "s/VERSION/$(VERSION)/g" cache.manifest | sed "s/TIMESTAMP/$(NOW)/g" > release/cache.manifest
	sed -i "/<!--@ -->/,/<!-- @-->/d" release/index.html
	sed -i "s/<!--script\(.*\)script-->/<script\1script>/g" release/index.html
	cp palettes.json favicon.ico styles.css offline.html release
	cp -R media release
	cp -R ss release

.PHONY : clean
clean:
	-rm -r release

$(fractured): $(SCRIPTS) gl-matrix-min.js parser-min.js
	cat $(SCRIPTS) > /tmp/fractured-index.js
	sed -i "s/---VERSION---/$(VERSION)/g" /tmp/fractured-index.js
	$(COMP)/tmp/fractured-index.js $(FLAGS)/tmp/fractured-compressed.js
	#Combine into final bundle
	cat /tmp/fractured-compressed.js gl-matrix-min.js parser-min.js > $(fractured)

$(viewer): $(VIEWSCRIPTS) gl-matrix-min.js parser-min.js
	cat $(VIEWSCRIPTS) > /tmp/fracturedviewer-index.js
	sed -i "s/---VERSION---/$(VERSION)/g" /tmp/fracturedviewer-index.js
	$(COMP)/tmp/fracturedviewer-index.js $(FLAGS)/tmp/fracturedviewer-compressed.js
	#Combine into final bundle
	cat /tmp/fractured-compressed.js gl-matrix-min.js parser-min.js > $(viewer)

gl-matrix-min.js: gl-matrix.js
	$(COMP)gl-matrix.js $(FLAGS)gl-matrix-min.js

parser-min.js: parser.js
	$(COMP)parser.js $(FLAGS)parser-min.js

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
