VERSION = 0.92
ifeq ($(CONFIG),debug)
  COMP = cp 
  FLAGS = 
else
  COMP = java -jar compiler-latest/compiler.jar --jscomp_warning internetExplorerChecks --js=
  FLAGS = --js_output_file=
endif

#Targets
fractured=release/fractured_$(VERSION).js
viewer=release/fracturedviewer_$(VERSION).js
includes=release/includes_$(VERSION).json
formulae=release/formulae_$(VERSION).json
codemirror=release/codemirror_$(VERSION).js
codemirrorstyle=release/codemirror_$(VERSION).css

#Sources
VIEWSCRIPTS = parameter.js formulae.js index.js fractal.js
SCRIPTS = state.js automation.js $(VIEWSCRIPTS)
CMSCRIPTS = $(wildcard codemirror/lib/*.js) codemirror/mode/clike/clike.js codemirror/mode/javascript/javascript.js

all: release $(fractured) $(codemirror) $(codemirrorstyle) $(includes) $(formulae)

viewer: release $(viewer) $(includes) $(formulae)

.PHONY : release
release:
	-mkdir -p release
	#Write version info
	sed "s/VERSION/$(VERSION)/g" index.html > release/index.html
	sed "s/VERSION/$(VERSION)/g" editor.html > release/editor.html
	sed "s/VERSION/$(VERSION)/g" viewer.html > release/viewer.html
	sed "s/VERSION/$(VERSION)/g" palette.html > release/palette.html
	sed -i "/<!--@ -->/,/<!-- @-->/d" release/index.html
	sed -i "s/<!--script\(.*\)script-->/<script\1script>/g" release/index.html
	cp palettes.json favicon.ico styles.css offline.html release
	cp -R media release
	cp -R ss release
	sed -i "s/version [0-9.]\+/version $(VERSION)/g" README.md
	markdown README.md > docs.html
	cp docs.html release

.PHONY : clean
clean:
	-rm -r release

$(fractured): $(SCRIPTS) OK-min.js gl-matrix-min.js parser-min.js
	cat $(SCRIPTS) > /tmp/fractured-index.js
	sed -i "s/---VERSION---/$(VERSION)/g" /tmp/fractured-index.js
	$(COMP)/tmp/fractured-index.js $(FLAGS)/tmp/fractured-compressed.js
	#Combine into final bundle
	cat /tmp/fractured-compressed.js OK-min.js gl-matrix-min.js parser-min.js > $(fractured)

$(viewer): $(VIEWSCRIPTS) OK-min.js gl-matrix-min.js parser-min.js
	cat $(VIEWSCRIPTS) > /tmp/fracturedviewer-index.js
	sed -i "s/---VERSION---/$(VERSION)/g" /tmp/fracturedviewer-index.js
	$(COMP)/tmp/fracturedviewer-index.js $(FLAGS)/tmp/fracturedviewer-compressed.js
	#Combine into final bundle
	cat /tmp/fractured-compressed.js OK-min.js gl-matrix-min.js parser-min.js > $(viewer)

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

$(includes): $(wildcard include/*)
	python rebuild.py $(includes)

$(formulae): $(wildcard formulae/*.formula)
	python rebuild.py $(formulae)
