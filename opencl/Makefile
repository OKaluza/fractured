OBJS = cl-shader.o
CC = g++
DEBUG = -g
OPT = -O3 -msse4a --fast-math
MODE = $(DEBUG)
CPPFLAGS = -Wall $(MODE) -I/usr/local/cuda/include/
LDFLAGS = -Wall $(MODE) -lOpenCL

all: cl-shader

cl-shader: $(OBJS)
	$(CC) -o cl-shader $(OBJS) $(LDFLAGS)
