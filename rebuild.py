import json
import re
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

inc = { 
"include/glsl-header.frag" : "",
"include/opencl-header.cl" : "",
"include/fractal-shader.frag" : "",
"include/complex-math.frag" : "",
"include/shader2d.vert" : "",
"include/script.js" : ""
}

for key in inc:
  print key
  f = open(key, 'r')
  inc[key] = f.read()

f = open('includes.json', 'w')
f.write(json.dumps(inc))

sources = OrderedDict()

p = re.compile('[^\w()]+')

process("base", ["Default"])
process("fractal", ["Mandelbrot","Burning Ship","Magnet 1","Magnet 2","Magnet 3","Nova","Cactus","Phoenix"])
process("transform", ["Inverse","Functions"])
process("colour", ["Default","Smooth","Exponential Smoothing","Triangle Inequality","Orbit Traps","Gaussian Integers","Hot and Cold"])

f = open('defaultformulae.json', 'w')
f.write(json.dumps(sources))


