
(function() {

    "use strict";

    if (window.WebCL) {
        return;
    }

    var console = window.console || { log : function () {} };

    function WEBCL_EXCEPTION(e) {
        console.error(e);
        throw new Error(e.message);
    }

    var nativeWebCL = webcl;
    var nativeWebCLGL = null;
    var webGLContext = null;

    if (!nativeWebCL) {
        console.error("WebCL not found!");
        throw new Error("WebCL not found!");
    }

    window.mozRequestAnimationFrame = window.webkitRequestAnimationFrame;

    window.WebCL = (function () {

        function getSupportedExtensions() {
            var extensions = [];

            try {
                return nativeWebCL.getSupportedExtensions();
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        function getPlatforms() {
            try {
                var platforms = [];
                var nativePlatforms = nativeWebCL.getPlatforms();
                for (var i in nativePlatforms) {
                    platforms[i] = new WebCLPlatform(nativePlatforms[i]);
                }
                return platforms;
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        function createContext(properties, devices, gl) {
            if (properties.length < 2
                    || properties[0] !== nativeWebCL.CONTEXT_PLATFORM) {
                console.error("Invalid properties", properties);
            }

            webGLContext = gl;

            if (gl) {
                console.log("WebGL :", gl);
                nativeWebCLGL = nativeWebCL.getExtension("KHR_GL_SHARING");
                if (!nativeWebCLGL) {
                    console.error("WebCLGL extension not found!");
                }
            }

            return properties[1].createContext(devices);
        }

        function createContextFromType(properties, deviceType, gl) {
            if (properties.length < 2
                    || properties[0] !== nativeWebCL.CONTEXT_PLATFORM) {
                WEBCL_EXCEPTION("Invalid properties", properties);
            }

            webGLContext = gl;

            if (gl) {
                console.log("WebGL :", gl);
                nativeWebCLGL = nativeWebCL.getExtension("KHR_GL_SHARING");
                if (!nativeWebCLGL) {
                    console.error("WebCLGL extension not found!");
                }
            }

            return properties[1].createContextFromType(deviceType);
        }

        var API = {

            getSupportedExtensions : getSupportedExtensions,

            getPlatforms : getPlatforms,

            getPlatformIDs : getPlatforms,

            createContext : createContext,

            createContextFromType : createContextFromType,

            types : WebCLKernelArgumentTypes
        };

        nativeWebCL.DEVICE_NAME = 0x102B;

        for (var p in nativeWebCL) {
            if (typeof nativeWebCL[p] !== 'function') {
                API[p] = nativeWebCL[p];

                // Mozilla WebCL API
                API['CL_' + p] = nativeWebCL[p];
            }
        }

        // Mozilla WebCL API
        API['CL_PLATFORM_NAME'] = nativeWebCL.PLATFORM_VERSION;
        API['CL_PLATFORM_VENDOR'] = nativeWebCL.PLATFORM_VERSION;
        API['CL_PLATFORM_EXTENSIONS'] = 0x904;
        API['CL_DEVICE_EXTENSIONS'] = 0x1030;

        return API;
    })();

    function WebCLPlatform(nativePlatform) {

        function getInfo(name) {
            try {

                switch (name) {
                case WebCL.CL_PLATFORM_EXTENSIONS :
                    return WebCL.getSupportedExtensions();
                    break;

                default:
                    return nativePlatform.getInfo(name);
                }

            } catch (e) {
                console.log("PARAM: name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        function createContext(hostDevices) {
            try {
                var nativeDevices = [];

                for (var i in hostDevices) {
                    nativeDevices[i] = hostDevices[i].getNative();
                }

                var ctxProperties = {platform: nativePlatform,
                    devices: nativeDevices,
                    deviceType: nativeWebCL.DEVICE_TYPE_ALL,
                    shareGroup: 0, hint: null,
                    sharedContext: webGLContext
                };
                var nativeContext = null;

                if (nativeWebCLGL) {
                    nativeContext = nativeWebCLGL.createContext(ctxProperties);
                } else {
                    nativeContext = nativeWebCL.createContext(ctxProperties);
                }

                return new WebCLContext(nativeContext, hostDevices);
            } catch (e) {
                console.log("PARAM: hostDevice = ", hostDevice);
                WEBCL_EXCEPTION(e);
            }
        }

        function createContextFromType(deviceType) {
            var hostDevices = this.getDevices(deviceType);
            return this.createContext(hostDevices);
        }

        function getDevices(deviceType) {
            try {
                // BUG Error: INVALID_VALUE: DOM WebCL Exception -30
                // for DEVICE_TYPE_ALL
                var deviceTypes = [];
                var devices = [];
                var nativeDevices = [];

                switch (deviceType) {
                    case nativeWebCL.DEVICE_TYPE_CPU:
                        deviceTypes = [deviceType];
                        break;

                    case nativeWebCL.DEVICE_TYPE_GPU:
                        deviceTypes = [deviceType];
                        break;

                    case nativeWebCL.DEVICE_TYPE_DEFAULT:
                        deviceTypes = [deviceType];
                        break;

                    default:
                        deviceTypes = [nativeWebCL.DEVICE_TYPE_CPU,
                                    nativeWebCL.DEVICE_TYPE_GPU];
                }

                for (var j in deviceTypes) {

                    try {
                        nativeDevices = nativePlatform.getDevices(deviceTypes[j]);
                    } catch (e) {
                        if (e.name !== "DEVICE_NOT_FOUND") {
                            throw e;
                        }
                    }

                    for (var i in nativeDevices) {
                        var isAvailable = nativeDevices[i].getInfo(nativeWebCL.DEVICE_AVAILABLE);
                        if (isAvailable === true) {
                            var availableDevice = new WebCLDevice(nativeDevices[i], this);
                            devices.push(availableDevice);
                        }
                    }
                }

                if (!devices.length) {
                    throw nativeWebCL.DEVICE_NOT_FOUND;
                }

                return devices;
            } catch (e) {
                console.log("PARAM: deviceType = ", deviceType);
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative : function () {
                return nativePlatform;
            },

            getExtension : function (extension) {
                return nativePlatform.getExtension(extension);
            },

            getPlatformInfo : getInfo,

            createContext : createContext,

            createContextFromType : createContextFromType,

            getDevices : getDevices,

            getDeviceIDs : getDevices
        };
    }

    function WebCLDevice(nativeDevice, hostPlatform) {
        var typeName;
        var devType = nativeDevice.getInfo(nativeWebCL.DEVICE_TYPE);

        if (devType == nativeWebCL.DEVICE_TYPE_ACCELERATOR) {
            typeName = "ACCELERATOR";
        } else if (devType == nativeWebCL.DEVICE_TYPE_CPU) {
            typeName = "CPU";
        } else {
            typeName = "GPU";
        }


        function getInfo(name) {
            try {
                switch (name) {
                    case nativeWebCL.DEVICE_PLATFORM:
                        return hostPlatform;
                    break;
                    case nativeWebCL.DEVICE_NAME:
                        return typeName;
                    case nativeWebCL.DEVICE_TYPE:
                        return devType;
                    break;
                    default:
                        return nativeDevice.getInfo(name);
                }

            } catch (e) {
                console.log("PARAM: name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative: function () {
                return nativeDevice;
            },

            name : typeName,

            type : devType,

            getDeviceInfo : getInfo
        };
    }

    function WebCLContext(nativeContext, hostDevices) {

        function getInfo(name) {
            try {
                switch (name) {
                    case nativeWebCL.CONTEXT_DEVICES:
                        return hostDevices;
                    break;
                    default:
                        return nativeContext.getInfo(name);
                }
            } catch (e) {
                console.log("PARAM: name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        function createProgram(source) {
            try {
                var nativeProgram = nativeContext.createProgram(source);
                return new WebCLProgram(nativeProgram);
            } catch (e) {
                console.log("PARAM: source = ", source);
                WEBCL_EXCEPTION(e);
            }
        }

        function createCommandQueue(hostDevice, properties) {
            try {
                var nativeQueue = nativeContext.createCommandQueue(hostDevice.getNative(),
                        properties);
                return new WebCLCommandQueue(nativeQueue);
            } catch (e) {
                console.log("PARAMS: hostDevice = ", hostDevice,
                        ", properties = ", properties);
                WEBCL_EXCEPTION(e);
            }
        }

        function createBuffer(memFlags, sizeInBytes) {
            try {
                var nativeBuffer = nativeContext.createBuffer(memFlags, sizeInBytes);
                return new WebCLMemoryObject(nativeBuffer, sizeInBytes);
            } catch (e) {
                console.log("PARAMS: memFlags = ", memFlags,
                        ", sizeInBytes = ", sizeInBytes);
                WEBCL_EXCEPTION(e);
            }
        }

        function createFromGLBuffer(memFlags, glBuffer) {
            try {
                var nativeBuffer = nativeContext.createFromGLBuffer(memFlags, glBuffer);
                return new WebCLMemoryObject(nativeBuffer);
            } catch (e) {
                console.log("PARAMS: memFlags = ", memFlags,
                        ", glBuffer = ", glBuffer);
                WEBCL_EXCEPTION(e);
            }
        }

        function createImage(imgFlags, descriptor) {
            try {
                var nativeImgBuffer = nativeContext.createImage(imgFlags, descriptor);
                return new WebCLImage(nativeImgBuffer);
            } catch (e) {
                console.log("PARAMS: imgFlags = ", imgFlags,
                        ", descriptor = ", descriptor);
                WEBCL_EXCEPTION(e);
            }
        }

        function createImage2D(imgFlags, format, w, h, pitch) {
            var channel = format.channelOrder || WebCL.RG;
            var type = format.channelDataType || WebCL.UNORM_INT8;

            var descriptor = {channelOrder : channel, channelType : type,
                width : w, height : h, rowPitch : pitch};

            try {
                var nativeImgBuffer = nativeContext.createImage(imgFlags, descriptor);
                return new WebCLImage(nativeImgBuffer);
            } catch (e) {
                console.log("PARAMS: imgFlags = ", imgFlags,
                        ", descriptor = ", descriptor);
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative : function () {
                return nativeContext;
            },

            getContextInfo : getInfo,

            createProgramWithSource : createProgram,

            createCommandQueue : createCommandQueue,

            createBuffer : createBuffer,

            createBufferFromGL : createFromGLBuffer,

            createImage : createImage,

            createImage2D : createImage2D
        };
    }

    function WebCLProgram(nativeProgram) {
        function getInfo(name) {
            try {
                return nativeProgram.getInfo(name);
            } catch (e) {
                console.log("PARAM: name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        function getBuildInfo(hostDevice, name) {
            try {
                return nativeProgram.getBuildInfo(hostDevice.getNative(), name);
            } catch (e) {
                console.log("PARAMS: hostDevice = ", hostDevice.getNative(), ", name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }


        function build(hostDevices, options) {
            var nativeDevices = [];
            try {
                for (var i in hostDevices) {
                    nativeDevices[i] = hostDevices[i].getNative();
                }
                nativeProgram.build(nativeDevices);
            } catch (e) {
                var log = "";
                // BUG : get PROGRAM_BUILD_LOG
                // INVALID_VALUE: DOM WebCL Exception -30
                if (nativeDevices.length > 0) {
                    console.log(nativeDevices, nativeWebCL.PROGRAM_BUILD_LOG);
                    log = nativeProgram.getBuildInfo(nativeDevices,
                            nativeWebCL.PROGRAM_BUILD_STATUS);
                }
                console.log("Build log:", log);
                WEBCL_EXCEPTION(e);
            }
        }

        function createKernel(kernelName) {
            try {
                var nativeKernel = nativeProgram.createKernel(kernelName);
                return WebCLKernel(nativeKernel);
            } catch (e) {
                console.log("PARAM: kernelName = ", kernelName);
                WEBCL_EXCEPTION(e);
            }

        }

        function createKernelsInProgram() {
            try {
                var kernels = [];
                var nativeKernels = nativeProgram.createKernelsInProgram();

                for (var i in nativeKernels) {
                    kernels.push(new WebCLKernel(nativeKernels[i]));
                }

                return kernels;
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative : function () {
                return nativeProgram;
            },

            getProgramInfo : getInfo,

            getProgramBuildInfo : getBuildInfo,

            buildProgram : build,

            createKernel : createKernel,

            createKernelsInProgram : createKernelsInProgram
        };
    }

    function WebCLKernel(nativeKernel) {
        function getInfo(name) {
            try {
                return nativeKernel.getInfo(name);
            } catch (e) {
                console.log("PARAM: name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        function getWorkGroupInfo(hostDevice, name) {
            try {
                return nativeKernel.getWorkGroupInfo(hostDevice.getNative(), name);
            } catch (e) {
                console.log("PARAMS: hostDevice = ", hostDevice, ", name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        function setArg(index, value, type) {
            try {
                value = (value.getNative && value.getNative()) || value;
                if (type === undefined) {
                    return nativeKernel.setArg(index, value);
                } else if (type == WebCLKernelArgumentTypes.FLOAT) {
                    // BUG Error: INVALID_ARG_INDEX: DOM WebCL Exception -49
                    return nativeKernel.setArg(index, value * 1.0, type);
                } else {
                    return nativeKernel.setArg(index, value, type);
                }
            } catch (e) {
                console.log("PARAMS: index = ", index,
                        ", value = ", value, ", type = ", type);
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative : function () {
                return nativeKernel;
            },

            getKernelInfo : getInfo,

            getKernelWorkGroupInfo : getWorkGroupInfo,

            setKernelArg : setArg,

            setKernelArgLocal : setArg,

            setMemArg : setArg,

            setScalarArg : setArg
        };
    }


    function WebCLCommandQueue(nativeCmdQueue) {

        function getInfo(name) {
            try {
                return nativeCmdQueue.getInfo(name);
            } catch (e) {
                console.log("PARAM: name = ", name);
                WEBCL_EXCEPTION(e);
            }
        }

        function enqueueNDRangeKernel(hostKernel, workDim, globalWorkOffset,
                globalWorkSize, localWorkSize) {
            try {

                if (typeof(globalWorkSize) == 'number') {
                    globalWorkSize = [globalWorkSize];
                }

                if (!localWorkSize) {
                    localWorkSize = [];
                } else if (typeof(localWorkSize) == 'number') {
                        localWorkSize = [localWorkSize];
                }

                var gws = new Int32Array(globalWorkSize);
                var lws = new Int32Array(localWorkSize);

                nativeCmdQueue.enqueueNDRangeKernel(hostKernel.getNative(),
                        null, gws, lws);

                // Mozilla WebCL API
                return new WebCLEvent(null);
            } catch (e) {
                console.log("Global w.g. size:", globalWorkSize,
                        "Local w.g. size:", localWorkSize);
                WEBCL_EXCEPTION(e);
            }
        }

        function enqueueWriteBuffer(dstBufferObject, blockingWrite, dstOffset,
                sizeInBytes, srcArrayBuffer, hostEventWaitList) {
            try {
                var nativeEventWaitList = hostToNativeList(hostEventWaitList);

                nativeCmdQueue.enqueueWriteBuffer(dstBufferObject.getNative(),
                        blockingWrite, dstOffset, sizeInBytes,
                        srcArrayBuffer, nativeEventWaitList);

                // Mozilla WebCL API
                return new WebCLEvent(null);
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        function enqueueReadImage(srcImage, blockingRead, origin, region, rowPitch, slicePitch,
                hostPtr) {

            var origin = (origin instanceof Int32Array) ? origin : new Int32Array(origin);
            var region = (region instanceof Int32Array) ? region : new Int32Array(region);
            var rowPitch = (rowPitch instanceof Uint32Array) ? rowPitch : new Uint32Array([rowPitch]);

            try {
                return nativeCmdQueue.enqueueReadImage(srcImage.getNative(), blockingRead,
                        origin, region, rowPitch, hostPtr);
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }

        }

        function enqueueReadBuffer(srcBufferObject, blockingRead, srcOffset,
                sizeInBytes, dstArrayBuffer, hostEventWaitList) {

            try {
                var nativeEventWaitList = hostToNativeList(hostEventWaitList);

                var nativeEvent = nativeCmdQueue.enqueueReadBuffer(srcBufferObject.getNative(),
                        blockingRead, srcOffset, sizeInBytes,
                        dstArrayBuffer, nativeEventWaitList);

                // Mozilla WebCL API
                return new WebCLEvent(null);
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        function enqueueWriteImage(image, blockingWrite, origin, region,
                rowPitch, slicePitch, hostPtr) {
            try {
                origin = new Int32Array(origin);
                region = new Int32Array(region);
                rowPitch = new Uint32Array([rowPitch]);

                nativeCmdQueue.enqueueWriteImage(image.getNative(),
                        blockingWrite, origin, region, rowPitch, hostPtr);

                // Mozilla WebCL API
                return new WebCLEvent(null);
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        function enqueueAcquireGLObjects(hostBuffer) {
            nativeCmdQueue.enqueueAcquireGLObjects(hostBuffer.getNative());
        }

        function enqueueReleaseGLObjects(hostBuffer) {
            nativeCmdQueue.enqueueReleaseGLObjects(hostBuffer.getNative());
        }

        return {
            getNative : function () {
                return nativeCmdQueue;
            },

            getCommandQueueInfo : function (name) {
                return nativeCmdQueue.getCommandQueueInfo(name);
            },

            enqueueNDRangeKernel : enqueueNDRangeKernel,

            enqueueWriteBuffer : enqueueWriteBuffer,

            enqueueReadBuffer : enqueueReadBuffer,

            enqueueWriteImage : enqueueWriteImage,

            enqueueAcquireGLObjects :enqueueAcquireGLObjects,

            enqueueReleaseGLObjects :enqueueReleaseGLObjects,

            enqueueReadImage : enqueueReadImage,

            finish : function () {
                nativeCmdQueue.finish();
            },

            flush : function () {
                nativeCmdQueue.flush();
            }
        };
    }

    function WebCLMemoryObject(nativeMemObject) {
        function release() {
            // BUG: not working
            if (nativeMemObject.release)
                nativeMemObject.release();
        }

        return {
            getNative : function () {
                return nativeMemObject;
            },

            releaseCLResources : release
        };
    }

    function WebCLImage(nativeImgBuffer) {
        function getInfo(name) {
            try {
                return nativeImgBuffer.getInfo(name);
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative : function () {
                return nativeImgBuffer;
            },

            getInfo : getInfo
        }
    }

    function WebCLEvent(nativeEvent) {
        function getInfo(name) {
            try {
                return nativeEvent.getInfo(name);
            } catch (e) {
                WEBCL_EXCEPTION(e);
            }
        }

        return {
            getNative : function () {
                return nativeEvent;
            },

            getEventInfo : getInfo
        };
    }

    function hostToNativeList(hostObjList) {
        var nativeObjList = [];
        for (var i in hostObjList) {
            if (hostObjList[i].getNative())
                nativeObjList[i] = hostObjList[i].getNative();
        }

        return nativeObjList;
    }
})();
