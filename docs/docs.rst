===================================
Fractured Studio v0.4 Documentation
===================================

Introduction
------------
Fractured Studio is a fast fractal renderer written totally in javascript and WebGL (or experimentally: WebCL).

It was originally a hobby project to allow me to get my old fractal software running cross-platform and to render fractals much faster by using the GPU. The emergence of WebGL and, more recently, WebCL, allow the power of graphics processors to be accessed from web applications.

There's lots of great fractal software out there, but if I used it I'd miss out a large part of the fun, which is in writing the code and getting everything working from scratch.
The original code for this project was started in 2009 using Java and OpenGL (JOGL), then I started to hear about WebGL I got motivated again and ported my work to javascript/html/webgl.
The formula editor and renderer where finished in late 2010. Probably should have stopped there but then I got carried away with making it a studio workspace where I could store my work on a server and access it anywhere.

Now many lost weekends and evenings later it seems to finally have turned into a fairly full-featured app so I though I should finally put it up somewhere and see if anyone else finds it useful.

Requirements
------------
- A modern browser supporting WebGL and HTML5 local storage (Only confirmed working with Firefox, Chrome & Safari at this stage, Opera's WebGL is still causing me some problems) 
- A graphics card with up to date drivers that support OpenGL (or Direct3D via ANGLE on Windows)
- Experimental WebCL support is also available, using the Nokia Research Firefox WebCL plugin: http://http://webcl.nokiaresearch.com/

Workspace
=========
Upon first load the [Info] tab will show the status while the initial program data is downloaded from the server.
Once this is complete you will be presented with a workspace showing a rendering of the Mandelbrot set and the following user interface elements:

- *Top Menu* containing the [Session] and [Fractal] menus and the [Draw] button
- *Palette* an editable gradient colour palette and background colour selection
- *Tools* a set of tabs on the left containing tools with complete control over the fractal formula being rendered, the tabs are [Parameters] [Formula] [Colour] and [Info]
- *Fractal Display* occupies the rest of the available browser window, showing the rendered fractal image.
- *Coordinates* at the bottom left, shows the current complex coordinate under the mouse pointer as you move it over the fractal display.

Fractal Display
===============
This is the output of the fractal formula and parameters, showing a rendering of the selected fractal formula coloured using the selected colouring algorithms using the palette gradient.
This area of the screen is responsive to various mouse actions, many of which can be customised (see later section --link to editing mouse commands).

The default mouse actions are:

*Mouse scroll over fractal* zoom in and out
*Left-click* centre fractal on coordinate clicked on
*Left-click and drag* Select an area of the fractal to zoom in on
*Right click (or control-click on a Mac)* switch between Mandelbrot set and Julia set at selected coordinate (coord under mouse)
*Right-click and drag* scroll fractal (if larger than display window)
*Shift + scroll* Rotate in 10 degree increments
*Alt + scroll* Rotate in 1 degree increments

Coordinates
===========
As you move the mouse over the fractal display the coordinates in the complex plane you are hovering over will be displayed in the coordinates box at the bottom left of the window. These coordinates are used for many of the available mouse actions.

Palette
=======
The palette editor allows selection of a number of colours forming a gradient which is used to colour the fractal display.
Each of the colours in the gradient is represented by a line and a slider tool, except for the start and end colours.
The slider tools (image) can be dragged, adjusting the position of the colour in the gradient.
Clicking on the line below the slider opens the Colour Selector box allowing you to edit the colour.
Clicking elsewhere in the gradient also opens the Colour Selector box allowing you to add a new colour at the selected position.
The start and end colours can also be edited by clicking at the start/end of the gradient.
Right-clicking on a colour position marker deletes the colour from the gradient.

Colour Selector
---------------
A standard colour picker box which allows selection of the Saturation and Brightness of the colour using the large square box to the left and the Hue and Opacity using the columns to the right.
The box can be moved around by clicking and dragging on its edges.
To accept changes to the colour, press the [OK] button and the box will close.
To cancel the changes press the [X] button.

Tools
=====
The bulk of the controls used to render fractals appear in the set of tabs on the left, which we will call the "Tools" area.

Parameters
----------
The first is the Parameters tab. This shows basic details of the fractal display which are common to all fractal renderings. All of these fields can be edited and most will effect the way the fractal is rendered. To redraw the fractal after changing a value, press the [Draw] button on the Top Menu. 
The fields are:

- *Name* a name for the fractal, used when saving
- *Fit to window* when checked the fractal display will take up all available window space and will be automatically adjusted when the window is resized.
- *Size* width and height dimensions of the fractal display window, uncheck Fit to window when using this to set width and height.
- *Zoom* factor of magnification used when displaying the fractal, the [Reset] button returns this value to the default (0.5)
- *Rotate* degrees of rotation to apply
- *Origin* complex coordinate at the centre of the fractal display
- *Selected* complex coordinate selected for use in rendering Julia Sets and the Perturb option.
- *Julia* when checked indicates Julia Set mode, plotting a Julia Set at the selected coord.
- *Perturb* when checked indicates applying the selected coord as a perturbation of the rendered fractal (the value is added with every iteration of the formula)

- *Iterations* maximum number of iterations to apply the selected formula

Formula
-------
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

*Details of each fractal formula*

Colour
------
Additional formulae can be selected controlling how the values calculated by iterating the fractal formula above are used to colour the resulting image.
These formulae usually derive a colour from the gradient palette, but may calculate a colour value directly, ignoring the gradient.

*Details of each colour formula*

Info
----
This tab shows a log of status information and sometimes error messages from the fractal renderer.
The [Clear Log] button clears all messages from the display.
There is also a *Local storage usage* indicator showing how much of the available local storage allocation is available, this is filled by saving fractals and when exceeded no more will be able to be saved. Currently it is based on an assumption of 5MB local storage space.

Top Menu
========
Now we get to the menu bar which has various options controlling fractal rendering and allowing saving and loading fractals and other data to local storage and to the web server.

Draw
----
This button redraws the current fractal, changes to fractal parameters in the *tools* area are not usually applied instantly and you must press this button to redraw the fractal display.

Fractal
-------
This menu contains features relating to the current fractal display:

- *New* Create a new fractal and reset all fractal settings to defaults.
- *Save* stores the current fractal in local storage using the name entered in the *parameters* tab. If the name is already used you will be asked if you'd like to overwrite the existing entry.
- *Delete* if the currently displayed fractal was loaded from the list of saved fractals, this option deletes this fractal from the list.
- *Share* Upload a fractal to the server, optionally can be published on the site. Responds with a unique URL that can be used to load this fractal.
- *Saved Fractals* displays a sub-menu of all the saved fractals, with thumbnail images if available. Clicking on one of these saved entries loads that fractal and displays it.
- *Formula Sets* sub-menu of available saved formula sets and options relating to them.
- *Save as image file* *Save JPEG* / *Save PNG* downloads the fractal image display as an image file.
- *Export to file* exports the current fractal parameters and formula as a fractal data text file.
- *Import* select and upload a previously exported data file, can select importing of a fractal, palette or formula file.
- *Anti-aliasing* select the anti-aliasing quality to use when rendering fractals.
- *Script Editor* an experimental feature allowing you to write a javascript that controls the fractal display.
- *Clear Actions* clears any saved custom mouse actions from storage.
- *Hide/Show Tools* hides or shows the *tools* area from the window, allowing more room for the fractal display.

Session
-------
This menu gives you options over the current *session* data, a *session* represents all the currently saved fractals and formula stored in local storage. This data can be stored on the server and then retrieved from another browser on another computer. It also allows more fractal files to be saved that would otherwise fit in the allocated local storage space, if you run low on space you can just save your session to the server and start a new session.

In order to use the server features you must log in, you can use any OpenID provider account to log in, Google, Yahoo, myOpenID, AOL and StackExchange account options are provided on the menu, others are supported by selecting the top *OpenID* option.

- *New* clears the session data and creates a new session, this will delete any saved fractals and formulae, make sure you have exported or uploaded your session data before you do this!
- *Export* download a data file containing all the data in the current session.
- *Import* upload a previously saved data file containing all the data for a session, which will replace the current session (also clears all data, make sure you have saved anything you want to keep!).
- *Login with* shows the OpenID login options when not logged in.
- *Saved Sessions* (when logged in only) shows a list of saved session associated with the logged in account that have been stored on the server. Clicking on one of these allows loading all the session data and replacing the current session.
- *Save* (when logged in only) saves the current set of saved fractals and formula as a session entry on the server, if the current session was previously saved allows saving over the previous data. If not you will be prompted for a description for the session. 
- *Delete* (when logged in only) if the current session was loaded from a previously saved entry in the sessions list, this will delete that entry.
- *Logout* (when logged in only) log out from the server. An option to clear the session data will be given, if taken the session will be replaed by a new session.


TODO:
Editing formulae, maths library functions etc
Custom mouse actions, scripting
