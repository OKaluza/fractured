var FLOAT_EPSILON=1E-6,glMath={};(function(){if("undefined"!=typeof Float32Array){var a=new Float32Array(1),b=new Int32Array(a.buffer);glMath.invsqrt=function(c){a[0]=c;b[0]=1597463007-(b[0]>>1);var d=a[0];return d*(1.5-.5*c*d*d)}}else glMath.invsqrt=function(a){return 1/Math.sqrt(a)}})();var MatrixArray=null;function setMatrixArrayType(a){return MatrixArray=a}function determineMatrixArrayType(){return MatrixArray="undefined"!==typeof Float32Array?Float32Array:Array}determineMatrixArrayType();
var vec3={create:function(a){var b=new MatrixArray(3);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2]):b[0]=b[1]=b[2]=0;return b},createFrom:function(a,b,c){var d=new MatrixArray(3);d[0]=a;d[1]=b;d[2]=c;return d},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b},equal:function(a,b){return a===b||Math.abs(a[0]-b[0])<FLOAT_EPSILON&&Math.abs(a[1]-b[1])<FLOAT_EPSILON&&Math.abs(a[2]-b[2])<FLOAT_EPSILON},add:function(a,b,c){if(!c||a===c)return a[0]+=b[0],a[1]+=b[1],a[2]+=b[2],a;c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=
a[2]+b[2];return c},subtract:function(a,b,c){if(!c||a===c)return a[0]-=b[0],a[1]-=b[1],a[2]-=b[2],a;c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c},multiply:function(a,b,c){if(!c||a===c)return a[0]*=b[0],a[1]*=b[1],a[2]*=b[2],a;c[0]=a[0]*b[0];c[1]=a[1]*b[1];c[2]=a[2]*b[2];return c},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b},scale:function(a,b,c){if(!c||a===c)return a[0]*=b,a[1]*=b,a[2]*=b,a;c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c},normalize:function(a,b){b||
(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(!g)return b[0]=0,b[1]=0,b[2]=0,b;if(1===g)return b[0]=c,b[1]=d,b[2]=e,b;g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b},cross:function(a,b,c){c||(c=a);var d=a[0],e=a[1];a=a[2];var g=b[0],f=b[1];b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c},length:function(a){var b=a[0],c=a[1];a=a[2];return Math.sqrt(b*b+c*c+a*a)},squaredLength:function(a){var b=a[0],c=a[1];a=a[2];return b*b+c*c+a*a},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]},
direction:function(a,b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1];a=a[2]-b[2];b=Math.sqrt(d*d+e*e+a*a);if(!b)return c[0]=0,c[1]=0,c[2]=0,c;b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d},dist:function(a,b){var c=b[0]-a[0],d=b[1]-a[1],e=b[2]-a[2];return Math.sqrt(c*c+d*d+e*e)}},xUnitVec3=vec3.createFrom(1,0,0),yUnitVec3=vec3.createFrom(0,1,0),zUnitVec3=vec3.createFrom(0,0,1),tmpvec3=vec3.create();
vec3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};
var mat4={create:function(a){var b=new MatrixArray(16);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8],b[9]=a[9],b[10]=a[10],b[11]=a[11],b[12]=a[12],b[13]=a[13],b[14]=a[14],b[15]=a[15]);return b},createFrom:function(a,b,c,d,e,g,f,h,m,k,n,l,q,r,w,x){var p=new MatrixArray(16);p[0]=a;p[1]=b;p[2]=c;p[3]=d;p[4]=e;p[5]=g;p[6]=f;p[7]=h;p[8]=m;p[9]=k;p[10]=n;p[11]=l;p[12]=q;p[13]=r;p[14]=w;p[15]=x;return p},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=
a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b},equal:function(a,b){return a===b||Math.abs(a[0]-b[0])<FLOAT_EPSILON&&Math.abs(a[1]-b[1])<FLOAT_EPSILON&&Math.abs(a[2]-b[2])<FLOAT_EPSILON&&Math.abs(a[3]-b[3])<FLOAT_EPSILON&&Math.abs(a[4]-b[4])<FLOAT_EPSILON&&Math.abs(a[5]-b[5])<FLOAT_EPSILON&&Math.abs(a[6]-b[6])<FLOAT_EPSILON&&Math.abs(a[7]-b[7])<FLOAT_EPSILON&&Math.abs(a[8]-b[8])<FLOAT_EPSILON&&Math.abs(a[9]-
b[9])<FLOAT_EPSILON&&Math.abs(a[10]-b[10])<FLOAT_EPSILON&&Math.abs(a[11]-b[11])<FLOAT_EPSILON&&Math.abs(a[12]-b[12])<FLOAT_EPSILON&&Math.abs(a[13]-b[13])<FLOAT_EPSILON&&Math.abs(a[14]-b[14])<FLOAT_EPSILON&&Math.abs(a[15]-b[15])<FLOAT_EPSILON},identity:function(a){a||(a=mat4.create());a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=
a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b},determinant:function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],m=a[7],k=a[8],n=a[9],l=a[10],q=a[11],r=a[12],w=a[13],x=a[14];a=a[15];return r*n*h*e-k*w*h*e-r*f*l*e+g*w*l*e+k*f*x*e-g*n*x*e-r*n*d*
m+k*w*d*m+r*c*l*m-b*w*l*m-k*c*x*m+b*n*x*m+r*f*d*q-g*w*d*q-r*c*h*q+b*w*h*q+g*c*x*q-b*f*x*q-k*f*d*a+g*n*d*a+k*c*h*a-b*n*h*a-g*c*l*a+b*f*l*a},inverse:function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],m=a[6],k=a[7],n=a[8],l=a[9],q=a[10],r=a[11],w=a[12],x=a[13],p=a[14],z=a[15],u=c*h-d*f,v=c*m-e*f,s=c*k-g*f,t=d*m-e*h,A=d*k-g*h,B=e*k-g*m,C=n*x-l*w,D=n*p-q*w,E=n*z-r*w,F=l*p-q*x,G=l*z-r*x,H=q*z-r*p,y=u*H-v*G+s*F+t*E-A*D+B*C;if(!y)return null;y=1/y;b[0]=(h*H-m*G+k*F)*y;b[1]=(-d*H+e*G-g*F)*
y;b[2]=(x*B-p*A+z*t)*y;b[3]=(-l*B+q*A-r*t)*y;b[4]=(-f*H+m*E-k*D)*y;b[5]=(c*H-e*E+g*D)*y;b[6]=(-w*B+p*s-z*v)*y;b[7]=(n*B-q*s+r*v)*y;b[8]=(f*G-h*E+k*C)*y;b[9]=(-c*G+d*E-g*C)*y;b[10]=(w*A-x*s+z*u)*y;b[11]=(-n*A+l*s-r*u)*y;b[12]=(-f*F+h*D-m*C)*y;b[13]=(c*F-d*D+e*C)*y;b[14]=(-w*t+x*v-p*u)*y;b[15]=(n*t-l*v+q*u)*y;return b},toRotationMat:function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=
0;b[14]=0;b[15]=1;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],m=a[5],k=a[6],n=a[7],l=a[8],q=a[9],r=a[10],w=a[11],x=a[12],p=a[13],z=a[14];a=a[15];var u=b[0],v=b[1],s=b[2],t=b[3];c[0]=u*d+v*h+s*l+t*x;c[1]=u*e+v*m+s*q+t*p;c[2]=u*g+v*k+s*r+t*z;c[3]=u*f+v*n+s*w+t*a;u=b[4];v=b[5];s=b[6];t=b[7];c[4]=u*d+v*h+s*l+t*x;c[5]=u*e+v*m+s*q+t*p;c[6]=u*g+v*k+s*r+t*z;c[7]=u*f+v*n+s*w+t*a;u=b[8];v=b[9];s=b[10];t=b[11];c[8]=u*d+v*h+s*l+t*x;c[9]=u*e+v*m+s*q+t*p;c[10]=u*g+v*k+s*r+
t*z;c[11]=u*f+v*n+s*w+t*a;u=b[12];v=b[13];s=b[14];t=b[15];c[12]=u*d+v*h+s*l+t*x;c[13]=u*e+v*m+s*q+t*p;c[14]=u*g+v*k+s*r+t*z;c[15]=u*f+v*n+s*w+t*a;return c},multiplyVec3:function(a,b,c){c||(c=b);var d=b[0],e=b[1];b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c},translate:function(a,b,c){var d=b[0],e=b[1];b=b[2];var g,f,h,m,k,n,l,q,r,w,x,p;if(!c||a===c)return a[12]=a[0]*d+a[4]*e+a[8]*b+a[12],a[13]=a[1]*d+a[5]*e+a[9]*b+a[13],a[14]=a[2]*
d+a[6]*e+a[10]*b+a[14],a[15]=a[3]*d+a[7]*e+a[11]*b+a[15],a;g=a[0];f=a[1];h=a[2];m=a[3];k=a[4];n=a[5];l=a[6];q=a[7];r=a[8];w=a[9];x=a[10];p=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=m;c[4]=k;c[5]=n;c[6]=l;c[7]=q;c[8]=r;c[9]=w;c[10]=x;c[11]=p;c[12]=g*d+k*e+r*b+a[12];c[13]=f*d+n*e+w*b+a[13];c[14]=h*d+l*e+x*b+a[14];c[15]=m*d+q*e+p*b+a[15];return c},scale:function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a===c)return a[0]*=d,a[1]*=d,a[2]*=d,a[3]*=d,a[4]*=e,a[5]*=e,a[6]*=e,a[7]*=e,a[8]*=b,a[9]*=b,a[10]*=b,a[11]*=b,
a;c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c},rotate:function(a,b,c,d){var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c),h,m,k,n,l,q,r,w,x,p,z,u,v,s,t,A,B,C,D,E;if(!f)return null;1!==f&&(f=1/f,e*=f,g*=f,c*=f);h=Math.sin(b);m=Math.cos(b);k=1-m;b=a[0];f=a[1];n=a[2];l=a[3];q=a[4];r=a[5];w=a[6];x=a[7];p=a[8];z=a[9];u=a[10];v=a[11];s=e*e*
k+m;t=g*e*k+c*h;A=c*e*k-g*h;B=e*g*k-c*h;C=g*g*k+m;D=c*g*k+e*h;E=e*c*k+g*h;e=g*c*k-e*h;g=c*c*k+m;d?a!==d&&(d[12]=a[12],d[13]=a[13],d[14]=a[14],d[15]=a[15]):d=a;d[0]=b*s+q*t+p*A;d[1]=f*s+r*t+z*A;d[2]=n*s+w*t+u*A;d[3]=l*s+x*t+v*A;d[4]=b*B+q*C+p*D;d[5]=f*B+r*C+z*D;d[6]=n*B+w*C+u*D;d[7]=l*B+x*C+v*D;d[8]=b*E+q*e+p*g;d[9]=f*E+r*e+z*g;d[10]=n*E+w*e+u*g;d[11]=l*E+x*e+v*g;return d},rotateX:function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[4],g=a[5],f=a[6],h=a[7],m=a[8],k=a[9],n=a[10],l=a[11];c?a!==c&&
(c[0]=a[0],c[1]=a[1],c[2]=a[2],c[3]=a[3],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[4]=e*b+m*d;c[5]=g*b+k*d;c[6]=f*b+n*d;c[7]=h*b+l*d;c[8]=e*-d+m*b;c[9]=g*-d+k*b;c[10]=f*-d+n*b;c[11]=h*-d+l*b;return c},rotateY:function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],m=a[8],k=a[9],n=a[10],l=a[11];c?a!==c&&(c[4]=a[4],c[5]=a[5],c[6]=a[6],c[7]=a[7],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[0]=e*b+m*-d;c[1]=g*b+k*-d;c[2]=f*b+n*-d;c[3]=h*b+l*-d;c[8]=e*d+m*
b;c[9]=g*d+k*b;c[10]=f*d+n*b;c[11]=h*d+l*b;return c},rotateZ:function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],m=a[4],k=a[5],n=a[6],l=a[7];c?a!==c&&(c[8]=a[8],c[9]=a[9],c[10]=a[10],c[11]=a[11],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[0]=e*b+m*d;c[1]=g*b+k*d;c[2]=f*b+n*d;c[3]=h*b+l*d;c[4]=e*-d+m*b;c[5]=g*-d+k*b;c[6]=f*-d+n*b;c[7]=h*-d+l*b;return c},frustum:function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,m=d-c,k=g-e;f[0]=2*e/h;f[1]=0;f[2]=0;f[3]=0;
f[4]=0;f[5]=2*e/m;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/m;f[10]=-(g+e)/k;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/k;f[15]=0;return f},perspective:function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b*=a;return mat4.frustum(-b,b,-a,a,c,d,e)},ortho:function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,m=d-c,k=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/m;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/k;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/m;f[14]=-(g+e)/k;f[15]=1;return f},lookAt:function(a,b,c,d){d||(d=mat4.create());
var e,g,f,h,m,k,n,l,q=a[0],r=a[1];a=a[2];f=c[0];h=c[1];g=c[2];n=b[0];c=b[1];e=b[2];if(q===n&&r===c&&a===e)return mat4.identity(d);b=q-n;c=r-c;n=a-e;l=1/Math.sqrt(b*b+c*c+n*n);b*=l;c*=l;n*=l;e=h*n-g*c;g=g*b-f*n;f=f*c-h*b;(l=Math.sqrt(e*e+g*g+f*f))?(l=1/l,e*=l,g*=l,f*=l):f=g=e=0;h=c*f-n*g;m=n*e-b*f;k=b*g-c*e;(l=Math.sqrt(h*h+m*m+k*k))?(l=1/l,h*=l,m*=l,k*=l):k=m=h=0;d[0]=e;d[1]=h;d[2]=b;d[3]=0;d[4]=g;d[5]=m;d[6]=c;d[7]=0;d[8]=f;d[9]=k;d[10]=n;d[11]=0;d[12]=-(e*q+g*r+f*a);d[13]=-(h*q+m*r+k*a);d[14]=-(b*
q+c*r+n*a);d[15]=1;return d},str:function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"}};
