# Flags to pass to rst2html
RSTFLAGS = --stylesheet-path=docstyle.css 

%.html: %.rst
	rst2html	$(RSTFLAGS)	$<	$@

.PHONY: all
.DEFAULT: all

all: docs.html # any other html files to be generated from an rst file
