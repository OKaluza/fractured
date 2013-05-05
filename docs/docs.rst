.. |copy| unicode:: 0xA9 .. copyright sign
.. |fractal| image:: media/fractal.png
.. |formula| image:: media/formula.png
.. |image| image:: media/camerai.png
.. |palette| image:: media/palette.png
.. |settings| image:: media/settingsi.png
.. |draw| image:: media/draw.png

.. _WebGL: http://www.khronos.org/webgl
.. _WebCL: http://www.khronos.org/webcl
.. _plugin: http://webcl.nokiaresearch.com

==========================================================================
Fractured - `User Guide <http://fract.ured.me/docs_VERSION.html>`_
==========================================================================
| Fractured | Fractal art studio | Version VERSION
| |copy| Owen Kaluza, 2013

.. contents:: `Table of contents`

Introduction
============
Fractured is a GPU accelerated fractal exploration application written in HTML,CSS,Javascript and WebGL_ / WebCL_\*.
It is designed to work as a stand-alone app, but there are a number of additional functions provided by the server allowing data to be stored online and accessed anywhere.

I started working on it (years ago now) because I was interested in doing high resolution renders of computationally intensive fractals a hell of a lot faster on the GPU with GLSL, which was not being done at the time I started except for a few proof of concept demos.
Now many lost weekends and evenings later it seems to finally have turned into a fairly complete thing and does what I needed it to.

\*There's also experimental WebCL_ support which allows CPU rendering and double precision mode where possible. It will only work with the Nokia Firefox plugin_ for now but when the standard solidifies a bit I'll make sure it runs with other implementations.
  
*(NOTE: this documentation is still a work in progress, if you have any questions or feedback email me at: owen (at) ozone.id.au)*

Acknowledgments
---------------

- CodeMirror http://codemirror.net used for formula / shader code editing component.
- Expression parser built using Jison http://zaach.github.com/jison
- Vector and Matrix library: glMatrix https://github.com/toji/gl-matrix
- Learning WebGL http://learningwebgl.com for WebGL tutorials
- WebCL tutorials: Nokia Research WebCL http://webcl.nokiaresearch.com (particular thanks to Tomi Aarnio from Nokia for helping me get WebCL working correctly on CPU platforms). 
- WebCL Examples <http://www.ibiblio.org/e-notes/webcl/webcl.htm>.
- Some fractal formulae based on those in Gnofract http://gnofract4d.sourceforge.net/ and UltraFractal http://www.ultrafractal.com
- My colour picker css design is based on one from `ColorJack.com <http://www.colorjack.com/software/dhtml+color+picker.html>`_.

Requirements
------------
- A modern browser supporting WebGL, confirmed working with Firefox, Chrome & Safari.
- A graphics card with up to date drivers that support OpenGL. (Unless using WebCL: the better your graphics card, the faster it will render fractals).
- Experimental WebCL support is also available, using the Nokia Research Firefox WebCL plugin_. 
- **Note: Windows** in windows Chrome and Firefox do WebGL rendering via conversion to DirectX shaders (`Angle <http://code.google.com/p/angleproject/>`_), this is a workaround for poor quality windows OpenGL graphics drivers and is a bit unreliable at times. For best results where possible I recommend using native OpenGL rendering, this has to be enabled in your browser manually. In Firefox: set webgl.prefer-native-gl to true in about:config, in Chrome: run with arguments: –use-gl=desktop *(in recent versions of Chrome it appears Native OpenGL support is broken, until this is fixed you are stuck with Angle!)*.
- **Note: Safari** if not enabled, WebGL can be switched on  by going into preferences -> advanced, show develop menu. Then select Enable WebGL on the Develop menu.
- **Note: Opera** As of Opera 12.12 the WebGL implementation works with Fractured though it must first be enabled by setting "Enable WebGL" to 1 in opera:config. *(Opera Windows no longer seems to work with Fractured, in fact it will crash the browser!)*
- *Note* My development platform is Linux, Firefox, NVidia. I've tested as many other platforms as I've been able to but if haven't covered every browser/platform combination.

Workspace
=========
What you are looking at on first loading the app: a workspace showing a selection of example fractals and the following user interface:

- *Top Menu* containing the [|draw| Studio], |fractal| Fractal, |formula| Formula, |image| Image, |palette| Palette and |settings| Settings menus.
- *Palette* an editable gradient colour palette and background colour selection
- *Tools* the set of tabs and panels on the left where you are reading this help file, containing tools with complete control over the fractal formula being rendered, the tabs are [Parameters] [Formula] [Colour] [Info] and [Log]
- *Main Display* occupies the rest of the available browser window, initially showing an image gallery, switching to display the rendered fractal image (when in rendering mode).
- *Coordinates* at the bottom left, shows the current complex coordinate under the mouse pointer as you move it over the fractal display.

Main Display
------------
The main window area is initially occupied by an image/fractal gallery, this is the welcome screen. When you render a fractal image it will switch to rendering mode and the fractal image will be displayed here.

Welcome screen
~~~~~~~~~~~~~~
This page only shows when you first load the site, it displays some example images and allows viewing and loading fractals and images that other users have shared. 

Only some of the options in the Fractal menu are visible in this mode.

There are several large buttons at the top of the page that allow switching between the available views:

- *Examples* Some simple pre-loaded example fractals, click on the thumbnail to load them into the renderer. 
- *Shared* Fractals that have been shared by other users, you can also click on these to load them.
- *Images* Images that have been uploaded by other users, click to view (hosted on imgur or flickr).
- *My Shared* Fractals uploaded and shared by you
- *My Uploads* Fractals uploaded by you but not shared
- *My Images* Images uploaded by you to imgur / flickr

Loading any fractal switches to the fractal display, to go back to the welcome page, click on the "Fractured" heading in the top left corner.

Fractal Display
~~~~~~~~~~~~~~~
This is the output of the fractal formula and parameters, showing a rendering of the selected fractal formula coloured using the selected colouring algorithms using the palette gradient.
This area of the screen is responsive to various mouse actions, many of which can be customised (see later section on editing mouse commands).

The default mouse actions are:

- *Mouse scroll over fractal* zoom in and out
- *Left-click* centre fractal on coordinate clicked on
- *Left-click and drag* Select an area of the fractal to zoom in on
- *Right click* switch between Mandelbrot set and Julia set at selected coordinate (at mouse pointer)
- *Right-click and drag* pan/scroll fractal window (if larger than display window)
- *Shift + scroll* Rotate in 10 degree increments

Julia set preview mode: to display a Julia set preview as you move the mouse around a Mandelbrot set hit the [ESC] or back-tick [`] key. Hit the key again to turn the preview off.

Coordinates
-----------
As you move the mouse over the fractal display the coordinates in the complex plane are displayed in the box at the bottom left of the window. When switching between the Mandebrot and Julia sets or selecting a region of the fractal the coordinates show the position in fractal space that the mouse is pointing to.

Palette
-------
The palette editor allows selection of a number of colours forming a gradient which is used to colour the fractal display.
Each of the colours in the gradient is represented by a line and a slider tool, except for the start and end colours.

- The sliders can be dragged, adjusting the position of the colour in the gradient.
- Clicking on the line below the slider opens the Colour Selector box allowing you to edit the colour.
- Clicking elsewhere in the gradient also opens the Colour Selector box allowing you to add a new colour at the selected position.
- The start and end colours can also be edited by clicking at the start/end of the gradient.
- Right-clicking on a colour position marker deletes the colour from the gradient.
- Ctrl+click reverses the gradient.
- Scrolling the mouse shifts all the central colours in the gradient.

Colour Selector
~~~~~~~~~~~~~~~
A colour picker box appears whenever you click to add or edit a colour on the gradient. This allows selection of the Saturation and Brightness of the colour using the large square box to the left and the Hue and Opacity using the columns to the right.

- The box can be moved around by clicking and dragging on its edges.
- To accept changes to the colour, press the [OK] button and the box will close.
- To cancel the changes press the [X] button.

Tools
-----
The majority of the controls used to control the fractal rendering appear in the set of tabs on the left, which we will call the "Tools" area. The arrow icon at the top can be used to quickly hide and show this area.

Many of the parameters in this area can be adjusted using the mouse scroll wheel.

- Scrolling over a numeric parameter will update the value in increments of 1 and redraw the fractal.
- Finer adjustment can be achieved by holding [SHIFT] while scrolling, then only the digit under the mouse pointer will be updated. (If the mouse is not over a digit then the last digit will be updated instead). This is very handy to interactively adjust parameters and instantly see the effect on the fractal rendering.

Parameters
~~~~~~~~~~
The first is the Parameters tab. This shows basic details of the fractal display, common to all fractal renderings regardless of chosen formula. All of these fields can be edited and changing most of them will modify the way the fractal is rendered. The fractal will be redrawn after you finish editing the value of a field. 
The fields are:

- *Name* a name for the fractal, used when saving
- *Fit to window* when checked the fractal display will take up all available window space and will be automatically adjusted when the window is resized.
- *Size* width and height dimensions of the fractal display window, uncheck Fit to window when using this to set width and height.
- *Zoom* factor of magnification used when displaying the fractal, the [Reset] button returns this value to the default (0.5)
- *Rotate* degrees of rotation to apply
- *Origin* complex coordinate at the centre of the fractal display
- *Selected* complex coordinate selected for use in rendering Julia Sets and the Perturb option.
- *Julia* when checked indicates Julia Set mode, plotting a Julia Set at the selected coordinate.
- *Iterations* maximum number of iterations to apply the selected formula

Formula
~~~~~~~
This is where we start to really gain control of the fractal space to render.
The first three options here allow selection of different *Formulae* used to generate the fractal.

- *Fractal* this is the most important of all, the actual fractal formula. This is controls the equation that is iterated multiple times until either the maximum iterations value is reached or the resulting value escapes above a set value or converges below a set value. A number of predefined formulae are offered which you can edit or even create your own (see *Formula Editing*)
- *Pre-Transform* this is an optional formula that will be applied every iteration before the fractal formula.
- *Post-Transform* this is an optional formula that will be applied every iteration after the fractal formula.

When a formula is selected, it usually has a number of parameters you can edit to control its behaviour.
These will appear below the formula selections.

Each formula will have different options which are best understood by playing with the values and seeing the effect they have, but we will go over the parameters for the basic Mandelbrot set here as an example:

- *z(n+1)* is the core of the formula itself, the expression that will be calculated every iteration. Two special values to note here, *z* is the complex variable we are applying the formula to, *c* is an additional complex variable, representing either the current pixel coordinate (Mandelbrot sets) or a constant selected coordinate (Julia sets). Each iteration (n) we apply the formula to get the next value (n+1). The basic Mandelbrot set formula is z = z^2+c, our example here is z^p+c, *p* is the power to raise *z* to, described below.
- *p* is an additional parameter we have defined allowing us to control the power. This builds an additional dimension of flexibility into the formula definition, essentially providing many different possible types of fractal to be rendered by simply changing a parameter value, rather than having to edit the formula.
- *Escape* is the value which controls the *Bailout* condition, if this condition is met the fractal calculation is finished.
- *Bailout Test* is the test to apply to *z* to see if it meets the bailout value *Escape*. By default here it is *norm* so the coordinate will be considered outside the set if this condition is ever true: norm(z) > *escape* which is equivalent to norm(z) > 4.

The default *Fractal* formula list contains *Mandelbrot, Burning Ship, Magnet 1,2 & 3, Nova, Cactus & Phoenix* fractal formulae.
The default *Transform* formula list contains two simple transforms: *Inverse* (which only works as a pre-transform) and *Functions* which simply applies a mathematical function to the result of the selected formula at every iteration. 

Colour
~~~~~~
Additional formulae can be selected controlling how the values calculated by iterating the fractal formula above are used to colour the resulting image.
These formulae usually derive a colour from the gradient palette, but may calculate a colour value directly, ignoring the gradient.

The default *Colour* formula lists contains *Default, Smooth, Exponential Smoothing, Triangle Inequality, Orbit Traps, Gaussian Integers and Hot & Cold* colouring algorithms. 

There are also entries for *None* - disabling colouring in the selected area, and *As Above* (for Inside Colour only) which indicates the same colouring parameters will be used for inside colour as the selected outside colour method.

Info
~~~~
This tab contains various information notes, the content of which won't be described here as they are self-explanatory.
All these notes can be closed using the X icon in the top right corner. The last card in the info tab is a list of closed notes which allows you to re-open them if desired.

Log
~~~
This tab shows a log of status information and sometimes error messages from the fractal renderer.

The [Clear Log] button clears all messages from the display.

Some log entries will have a "@" symbol before them, this can be clicked to restore the view to the previous logged state.

Top Menu
--------
Now we get to the menu bar which has various options controlling fractal rendering and allowing saving and loading fractals and other data to local storage and to the web server.

When viewing the welcome page only a subset of the items will be shown in the menu.
Some of the items are also only visible when logged in.

Going from right to left we have:

Tools Arrow
~~~~~~~~~~~
- *Hide/Show Tools* this arrow button hides or shows the *tools* area from the window, allowing more room for the fractal display.

Settings
~~~~~~~~
|settings| Application preferences and utilities:

- *Anti-aliasing* select the anti-aliasing quality to use when rendering fractals.
- *Scripts* (experimental feature, not yet properly documented) allows you to write scripts that control the fractal display. New Script creates a new script entry in the list and opens the editor. Pressing the [Run] button in the editor window runs the script.
- *Rebuild Thumbnails* redraw and save all stored fractal thumbnail images.
- *Show Preview* enables or disables the Julia set preview window.
- *Full Screen* enter full screen mode.

Palette
~~~~~~~
|palette| This menu displays all the gradient palettes saved in local storage. Clicking on one of these saved entries loads that palette. After loading a palette it will be selected in this list and a [ X ] button appears which can be used to delete the palette from the list. Above the list of saved palettes the other functions are:

- *Store Palette* stores the current palette in the list.
- *Export Palette* download active palette as a file, this can be loaded later using the *Import* option in the [Studio] menu.

Image
~~~~~
|image| Actions that take a screen shot of the current fractal.

- *Save JPEG Image* save current fractal image display as a JPEG image file (smaller image file but slightly lower quality).
- *Save PNG Image* save current fractal image as a PNG file (best quality, larger file size)
- *Share on Imgur* Publish an image of the current fractal to imgur.com (will be displayed in the shared images list). Responds with a unique URL that can be used to view this image. Imgur doesn't require logging in but your images will not be kept idefinitely if they don't receive any views for a long time.
- *Share on Flickr* Publish an image of the current fractal to Flickr.com (will be displayed in the shared images list). Responds with a unique URL that can be used to view this image, requires you to log in to your Flickr account.

Formula
~~~~~~~
|formula| A set of features allowing you to save and restore sets of formula for later use or sharing.
The first two menu options *Public* and *Uploaded* contain formula sets on the server which you can choose to load.
Selecting one of the names formula sets from either of these sub-menus will prompt you to download and use this formula set.
*Warning* loading a formula set will replace all your active formula definitions.
Once you have loaded a formula set from the server it will be highlighted in the menu with a grey border and a [ X ] delete button will be available if you wish to remove the formula set from the server.

- The *Public* list is all formula sets that yourself or others have published on the server.
- The *Uploaded* list contains only your own formula sets that you have uploaded.
- The *Publish* option will upload your current formula set and make it available for all users.
- The *Upload* option will save your current formula set on the server but only you will be able to access it later.
- The *Export* option will save your current formula set as a data file.

Fractal
~~~~~~~
|fractal| This menu contains features relating to the current fractal display.

- *New* Create a new fractal and reset all fractal settings to defaults.
- *Store* stores the current fractal in local storage using the name entered in the *parameters* tab. If the name is already used you will be asked if you'd like to overwrite the existing entry (This will be cleared if you clear your browsing history! To save permanently you must save your session to the server or export).
- *Upload* a fractal to the server. Responds with a unique URL that can be used to load this fractal. You will be prompted if you wish to share the uploaded fractal publicly (displayed in the shared fractals list), if you choose not to then only you or anyone you provide the URL link to will be able to see it.
- *Export* download the current fractal parameters and formula as a fractal data text file, this can be loaded later using the *Import* option in the [Studio] menu.
- *Stored Fractals* finally a list of all the fractals in local storage is shown, with thumbnail images if available. Clicking on one of these saved entries loads that fractal and displays it. After loading a fractal it will be selected in this list and a [ X ] button appears which can be used to delete the fractal from the list.

Studio
~~~~~~
This menu gives you options over the current studio *session* data, a *session* represents all the currently saved fractals, formulae, palettes etc stored in local storage. This data can be stored on the server and then retrieved from another browser on another computer. It also allows more fractal files to be saved that would otherwise fit in the allocated local storage space, if you run low on space you can just save your session to the server and start a new session.

In order to use the server features you must log in, you can use any OpenID provider account to log in, Google, Yahoo, myOpenID, AOL and StackExchange account options are provided on the menu, others are supported by selecting the *OpenID* option and entering your identity URL.

- *New* clears the session data and creates a new session, this will delete any saved fractals and formulae, make sure you have exported or uploaded your session data before you do this!
- *Save* (when logged in only) saves the current set of saved fractals, formula, palettes etc as a session entry on the server, if the current session was previously saved allows saving over the previous data. If not you will be prompted for a description for the session. 
- *Export* download a data file containing all the data in the current session.
- *Import* select and upload a previously exported data file, supports importing of a fractal, palette, formula, formula set or studio session file. Importing a previously exported session will replace the current session and clear all data, make sure you have saved anything you want to keep.
- *Login with* shows the OpenID login options if not already logged in. Allows you to use an OpenID provider to log in and save sessions, formula sets and fractals on the server.
- *Saved Sessions* (when logged in only) shows a list of saved session associated with the logged in account that have been stored on the server. Clicking on one of these allows loading all the session data and replacing the current session. If a session from this list is active it will be outlined and a [ X ] delete button will be shown to allow you to remove the saved session and delete all its data from the server.
- *Logout* (when logged in only) log out from the server. An option to clear the session data will be given, if you press No here all your session data will still be loaded even after logging out, it can be cleared by starting a new session (the "New" option above.)

Editing Formulae
================
Once you exhaust the possibilities opened by changing the parameters in the predefined formulae and editing expressions within the **expression parser** there are further limitless possibile fractal domains to explore by defining your own fractal, transform and colour formulae using the built in formula definition language. 
Each formula selection has three buttons to the right:

- The [Edit] button opens an editor allowing you to modify the formula code.
- The [ + ] button allows you to add a new formula definition, after you enter a name the editor will open with the currently selected formula code as a starting point.
- The [ - ] button deletes a formula from the list.

A formula definition consists of a set of parameter definitions and (optionally) data declarations and a set of formula code sections. 

Parameter definitions
---------------------
A parameter definition is a description of a formula variable or option which you want to allow to be controlled by the user interface.
These definitions specify the controls that appear when you select this formula.

The format of a definition is::

  //Description
  @variable_name = type(default);

- *@* Indicates to the formula parser that this is a parameter definition, must start with this symbol.
- *Description* Enter the information you want to appear in the control label in this comment area on the line before the actual definition. This description can be left out, in which case the variable name will be used as a label instead.
- *variable_name* Enter a variable name (containing only the characters a-z, A-Z, 0-9 and underscore _, must not start with a number) this is the name by which you will use this parameters value in the formula code.
- *type* the type of value: bool, int, real, complex, rgba, list, real_function, complex_function, bailout_function, expression, define or range
- *default* the default value that is inserted for the parameter if it has not been edited.

**Parameter types explained**

- *bool* a true/false value, appears as a check box
- *int* an integer value, appears as a number entry
- *real* a real number, appears as a number entry
- *complex* a complex number value, represented as a real and imaginary value separated by a comma in code, appears as two number entries.
- *rgba* a colour value, appears as a colour box which can be clicked on to bring up a colour picker
- *list* a list of labels, the variable will be assigned a numeric value based on user selection from 0 to n-1 (where n is number of list items), appears as a drop down list.
- *define* a list of labels, the name of the parameter will be defined literally to the value of the selected entry (as #define param_name selected_value in generated code)
- *real_function* a drop down list of functions returning real number values
- *complex_function* a drop down list of functions returning complex number values
- *bailout_function* a drop down list of bailout functions
- *expression* a mathematical expression that will be parsed and converted into formula code
- *range* as real number, but appears as a slider control, optional additional values min, max, step (comma separated, defaults 0, 1, 0.05)

Data declarations
-----------------
Following the parameter definitions a list of data variables that will be used in the formula calculation can be defined, in the form::

  type variable_name = default;

- *type* can be one of bool, int, uint, real, float, complex or rgba.
- *variable_name* a standard variable name (containing only the characters a-z, A-Z, 0-9 and underscore _, must not start with a number)
- *default* initial value of variable, complex numbers can be specified simply using parentheses, eg: (0.3,0.3)

Formula code sections
---------------------
These are sections of code that will be processed in various points during the fractal calculation, different sections are available depending on the type of formula being edited. 

They are defined in the form::

  section:
    code statements...
    ...

*section* is the name of the section, on the following line you enter the formula code, it doesn't have to be indented but doing so will make it easier to read. Any statements from the preceding section heading until the next section heading or the end of the file will be interpreted as the section contents.

Common sections
~~~~~~~~~~~~~~~

- *init:* inserted after data declarations, before all processing.
- *reset:* inserted after setting up the initial conditions of the formula, selected starting coordinates etc.

Fractal Formula sections
~~~~~~~~~~~~~~~~~~~~~~~~

- *znext:* the calculation of the next z value, z(n+1), the core of the fractal formula processing. To define a fractal formula that does anything this section must be defined, but it may be defined as a *parameter* of type *expression* named znext, which will simply execute the code resulting from the entered mathematical expression in this code section. Otherwise you must define the znext section, you can define znext as a parameter or a code section but not both.
- *escaped:* define an escape bailout test, set the **escaped** built in variable to true here if your bailout condition is met, false otherwise, eg: escaped = (norm(z) > 4.0); if escaped is set to true, the fractal iteration halts. This section can also be replaced by a parameter named "escape" containing a numeric value (which will be used with a default bailout function) or an expression parameter (which will bailout if it evaluates to true).
- *converged:* define a convergent bailout test, same as escape except should set the **converged** built in to true when triggered. This section can also be replaced by a parameter named "converge" containing a numeric value (which will be used with a default bailout function) or an expression (which will bailout if it evaluates to true).

Transform Formula sections
~~~~~~~~~~~~~~~~~~~~~~~~~~

- *transform:* code entered here will be inserted at the fractal z(n+1) calculation stage, before processing znext if it is a pre-transform, or after if it is a post-transform. 

Colour Formula sections
~~~~~~~~~~~~~~~~~~~~~~~

- *calc:* code entered here will be inserted after the fractal z(n+1) calculation stage, use for any additional values that must be calculated during the fractal iteration to be used in the final colour calculation. 
- *result:* this is where the final colour is calculated, set the built in variable **colour** to the value desired. This must be an rgba value, the colours of the editable gradient can be accessed using the function **gradient(value)** where value is a number between 0 and 1 representing the position on the gradient to sample, this function returns an rgba colour value.

Formula language
----------------
Apart from the special format of the parameter definitions and section headers, the formula code is entered in a C-style syntax as a form of augmented GLSL ES 2.0 (http://www.khronos.org/opengles/2_X) with an additional function library for complex numbers and some definitions and pre-processing for ease of use writing fractal formulae. 

Complex numbers are represented as two-dimensional vector types, and created using the type *complex*, complex constants can be defined in code in the form (re, im), eg: complex Z = (-1,0.5). You can then access the real component (-1.0) as Z.x and the imaginary component (0.5) as Z.y.

All code statements in the formula definition must end in a semi-colon ";" as with in other c-style languages.

Complex arithmetic in formulae
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
When writing formula code you need to be aware that arithmetic operations on GLSL vector types operate component wise, this works nicely for some operations but not others.

Addition and subtraction of two complex numbers and multiplication of a real number with a complex number works correctly as these operations are defined for complex numbers the same as the equivalent vector operations.

Multiplication and division of complex numbers and addition/subtraction of complex to real numbers do not.

The best way to avoid this problem is to use the **expression parser** discussed in the section below, this will automatically translate your operations into the correct form, in fact you might as well skip ahead to the next heading as the rest of this section is for information purposes only and not relevant if you stick to using the expression parser for entering equations.

As operators can't be overloaded in GLSL, for mathematically correct results with complex numbers the *mul()* and *div()* functions have been defined instead of * and / which are designed to do correct complex number multiplication and division. For addition/subtraction ensure if you add or subtract a real number to a complex you declare it as a complex with a zero imaginary component.

*eg: if z is a complex number*::

  z = z*(1.5,-1);       
    - incorrect, component-wise vector multiplication
  z = mul(z,(1.5,-1));  
    - correct, complex multiplication

  z = z + (1,0);        
    - correct, adds 1.0 only to the real part of z
  z = z + 1.0;          
    - incorrect, adds 1.0 to both components of z

If writing equations directly into the formula code you must also be careful to always put a decimal point in real number constants, eg: 1. or 1.0 instead of just 1 or you will get type errors from the GLSL compiler when using them with complex or real number variables, another reason to use the expression parser instead...

Solution: The Expression Parser
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The expression parser allows you to enter mathematical expressions using any combination of complex and real numbers using the * (multiply) / (divide) and ^ (raise to power) symbols. Behind the scenes it will convert the expression to the formula code necessary to evaluate the expression correctly. This allows entering formulae in much clearer mathematical notation than would be possible using raw GLSL code as noted previously.

There are two ways of using this feature:

The **expression** parameter type creates an editable parameter where a formula expression can be entered, this has the additional bonus that the expression contents can be easily edited in the tools panel while working with a fractal without having to open the formula editor.

In the formula editor code sections, any text surrounded by back-slash "\\" characters will also be processed by the expression parser.

For example, entering::

  z = \z^2 + 2\;

will be translated internally to::

  z = sqr(z) + complex(2,0);

Some forms of implicit multiplication are recognised, eg:

  (z + 1)(z - 1) ==> (z + 1) * (z - 1)
  3(z + 1) ==> 3 * (z + 1)
  3x(z + 1) ==> 3 * x * (z + 1)
  (z + 1)x ==> (z + 1) * x

This does not work with variables alone, eg: x(z + 1) as it is indistinguishable from a function call to the parser, so make sure you use a multiplication symbol in such cases.

A set of brackets with a comma implies a complex number, in parsed expressions the components of the complex number can contain any expression::

  (sin(x), y^2) ==> complex(sin(x), y^2)

In base formula code you are limited to single constants or variables as the real and imaginary components in parentheses for them to be converted automatically to complex number initialisations, for other expressions you must fully specify "complex(real expr, imag expr)".

Expressions can also be entered over multiple lines and semi-colons are not required at the end of lines.

**Note: Colour and Transform formulae**
As the same colour and transform formula can be selected twice in different categories, variables declared in these formulae can cause conflicts (attempting to declare a variable or parameter of the same name twice).

To get around this you can use the at "@" character at the start of any variable as in a parameter name. When the formula code is translated to shader code the "@" will be replaced with the formula type, preventing "redefinition" errors, eg::

  complex x = (4,5);
  ... can be replaced by ...
  complex @x = (4,5);

If the above is not followed and a colour formula is selected for both inside and outside colouring, you will get errors of the form::

  (ERROR: 0:182: 'x' : redefinition).

Built in variables
~~~~~~~~~~~~~~~~~~
(TODO: Explanation required!)

- z
- c
- z_1
- z_2
- point
- coord
- selected
- limit
- count
- escaped
- converged
- colour
- offset
- julia
- pixelsize
- dims
- origin
- palette
- background
- antialias

- PI
- E

Functions
~~~~~~~~~

Real input, Real output only
- zero lnr _inv _neg _sqr _cube

Real input, Real output (or component-wise Complex input and output)
- abs acos asin atan
- ceil cos cross 
- degrees radians distance exp
- inversesqrt
- log log2 log10 max min mix mod
- pow sign sin sqrt tan
- floor trunc round 

Complex input, Real output
- manhattan norm cabs
- dot length normalize

Complex input, Complex output
- czero mul div inv sqr cube
- ln log10
- arg neg conj
- cosh tanh sinh acosh atanh asinh 
- cpow cexp csin ccos ctan casin cacos
- catan csinh ccosh ctanh casinh
- cacosh catanh csqrt csqrt2 equals
- normalize 

Others
- rgba gradient(mu)
- complex polar(r, theta)
- bool equals(complex, complex, real tolerance)

**TODO: Further document maths library functions, scripting, default formulae**


