import json
import re
import sys
import os
from collections import OrderedDict

def process(cat, formulae):
  for i in formulae:
    name = p.sub("_", i).lower()
    fn = "formulae/" + name + "." + cat + ".formula"
    print fn
    f = open(fn, 'r')
    key = cat + "/" + name
    entry = dict(type=cat, name=name, label=i, source=f.read())
    sources[key] = entry

#Create includes_.json
if "include" in sys.argv[1]:
  sources = { 
  "include/glsl-header.frag" : "",
  "include/opencl-header.cl" : "",
  "include/fractal-shader.frag" : "",
  "include/complex-math.frag" : "",
  "include/shader2d.vert" : "",
  "generated.shader" : ""
  }

  for key in sources:
    print key
    if os.path.exists(key):
      f = open(key, 'r')
      sources[key] = f.read()

#Create defaultformulae.json
if "formulae" in sys.argv[1]:
  sources = OrderedDict()

  p = re.compile('[^\w()]+')

  process("fractal", ["Mandelbrot","Burning Ship","Magnet 1","Magnet 2","Magnet 3","Nova","Cactus","Phoenix"])
  process("transform", ["Inverse","Functions"])
  process("colour", ["Default","Smooth","Exponential Smoothing","Triangle","Orbit Traps","Gaussian Integers","Hot and Cold"])
  process("filter", ["Colour Adjustment"])

#Write to output file
f = open(sys.argv[1], 'w')
f.write(json.dumps(sources))

