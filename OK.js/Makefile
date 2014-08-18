#Requires google closure compiler to create OK-min.js
VERSION = 0.1
COMP = java -jar compiler-latest/compiler.jar --jscomp_warning internetExplorerChecks --js=
FLAGS = --js_output_file=
#COMP = cp 
#FLAGS = 

#Sources
LIBSCRIPTS = utils.js mouse.js webgl.js colour.js colourPicker.js gradient.js 

all: OK-min.js

.PHONY : clean
clean:
	-rm OK*.js

OK.js: $(LIBSCRIPTS)
	cat $(LIBSCRIPTS) > OK.js

OK-min.js: OK.js
	$(COMP)OK.js $(FLAGS)OK-min.js

