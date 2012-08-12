COMP = java -jar ../compiler-latest/compiler.jar --js=
FLAGS = --js_output_file=
SCRIPTS = lib/codemirror.js lib/util/searchcursor.js lib/util/search.js lib/util/dialog.js mode/clike/clike.js mode/javascript/javascript.js

all: codemirror-compressed.js

codemirror-index.js: $(SCRIPTS)
	cat $(SCRIPTS) > codemirror-index.js

codemirror-compressed.js: codemirror-index.js
	$(COMP)codemirror-index.js $(FLAGS)codemirror-compressed.js
	cat LICENSE codemirror-compressed.js > ../codemirror-compressed.js

