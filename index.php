<?php
  session_start();
?>

<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<!-- This is supposed to tell IE to use Chrome Frame if available-->
<meta http-equiv="X-UA-Compatible" content="chrome=1">

<title>Fractured - WebGL Fractal Art Studio</title>

<!--link href='http://fonts.googleapis.com/css?family=Droid+Sans' rel='stylesheet' type='text/css'-->
<link rel="stylesheet" type="text/css" href="reset.css">
<link rel="stylesheet" type="text/css" href="styles.css">

<script type="text/javascript" src="colourPicker.js"></script>
<script type="text/javascript" src="index.js"></script>
<script type="text/javascript" src="utils.js"></script>
<script type="text/javascript" src="ajax.js"></script>
<script type="text/javascript" src="mouse.js"></script>
<script type="text/javascript" src="parser.js"></script>
<script type="text/javascript" src="fractal.js"></script>
<script type="text/javascript" src="colour.js"></script>

<script type="text/javascript" src="sylvester.js"></script>
<script type="text/javascript" src="webgl.js"></script>
<!--
<script type="text/javascript" src="fractured-compressed.js"></script>
-->

</head>

<body onload="pageStart();" id="body">

  <header id="header">
    <h2>Fractured Studio v0.2</h2>

      <section id="controls">
        <div id="backgroundBG" class="colourbg">
          <div id="backgroundCUR" class="colour" onmousedown="bgColourMouseClick();"></div>
        </div>
        <canvas id="palette" width="572" height="24"></canvas>
      </section>
      <nav>
        <ul>
          <li><span id="hide" onClick="toggleParams();">Tools &uarr;</span></li> 
          <li><span id="show" style="display:none" onClick="toggleParams();">Tools &darr;</span></li> 
          <li><span onClick="applyAndSave();">Draw</span></li> 
          <li><span onClick="saveFractal(false);">Save</span></li> 
          <li><span onClick="showPopup('popup');">Test</span></li> 
          <!--li><span onClick="saveFractal(true);">Export</span></li-->
          <!--li><span onClick="saveImage();">Save Image</span></li--> 

           <!--li> Testing multi-level dropdown menu
             <span onClick="exportFractalFile();">Export</span>
              <ul>  
                <li><a href="#" title="Sub Nav Link 1">Sub Nav Link 1</a></li>  
                <li><a href="#" title="Sub Nav Link 2">Sub Nav Link 2</a></li>  
                <li><a href="#" title="Sub Nav Link 3">Sub Nav Link 3</a></li>  
                <li><a href="#" title="Sub Nav Link 4">Sub Nav Link 4</a></li>  
                <li class="last"><a href="#" title="Sub Nav Link 5">Sub Nav Link 5</a></li>  
              </ul>
           </li-->
        </ul>
      </nav>


  </header>

  <section id="left">  

    <aside id="sidebar">

      <nav id="tabs">
        <ul>
        <li onmousedown="showPanel(this, 'panel1');" id="tab1" >Session</li>
        <li onmousedown="showPanel(this, 'panel2');" class="gradient">Parameters</li>
        <li onmousedown="showPanel(this, 'panel3');" class="gradient">Formula</li>
        <li onmousedown="showPanel(this, 'panel4');" class="gradient">Colour</li>
        <li onmousedown="showPanel(this, 'panel5');" class="gradient">Info</li>
        </ul>
      </nav>

      <div class="panel scroll" id="panel1" style="display: block">


<?php
  if (!isset($_SESSION['user_id']))
  {
  ?> 
  <script type='text/javascript'> 
    function EventChanged(changedEvent) {
      var e = document.getElementById('openid');
      if (changedEvent.value == "none")
        e.style.display = 'block';
      else
        e.style.display = 'none';
    }

    if (localStorage["fractured.currentLogin"]) {
      alert('Loading stored login : ' + localStorage["fractured.currentLogin"]);
      var currentLogin = JSON.parse(localStorage["fractured.currentLogin"]);
      if (currentLogin.id && currentLogin.id.length > 4) {
         alert('db/login_get.php?user=' + currentLogin.user + '&login=' + currentLogin.id);
        ajaxReadFile('db/login_get.php?user=' + currentLogin.user + '&login=' + currentLogin.id, setLogin);
      }
    }
  </script>

  <form action="authenticate.php?login" method="post" class="login">
    <p>Login with</p>
    <input type="submit" name="submit" value="Login" class="right" >
    <select name="provider-url" onchange="EventChanged(this)">
      <option value="https://www.google.com/accounts/o8/id">Google</option>
      <option value="https://me.yahoo.com">Yahoo</option>
      <option value="http://myopenid.com">MyOpenId</option>
      <option value="http://openid.stackexchange.com">StackExchange</option>
      <option value="none">Entered OpenID...</option>
    </select><br>
    <input type="text" id="openid" name="openid_identifier" style="display: none;"/>
    <div class="clear"></div>
  </form>
  <div class="gap"></div>
  <input type="button" value="New workspace" onclick="resetState();">
  <input type="button" onclick="exportStateFile();" value="Export workspace"/>
  <input type="button" value="Upload workspace" onClick="filetype='session'; $('fileupload').click();"/>
  <?php
  }
  else
  {
  ?>
  <script type='text/javascript'>
    <?php
    //Copy session login to local storage
    if ($_SESSION['login'])
      echo "var currentLogin = {'id' : '" . $_SESSION['login'] . "', 
                                'user' : '" . $_SESSION['user_id'] . "'};";
      echo "localStorage['fractured.currentLogin'] = JSON.stringify(currentLogin);";
    ?>
    //document.write('<br>js current login : ' + JSON.stringify(currentLogin));
    //Load sessions list from server
    ajaxReadFile('db/session_get.php', loadStateList);
  </script>
  <form action="logout.php" method="post" class="login">
    <p>Welcome <b><?php echo $_SESSION['name'];?></b>
    <!--p>USER_ID: <?php echo $_SESSION['user_id'];?>, SESSION_ID: <?php echo $_SESSION['session_id'];?></p>
    <p><?php echo $_SESSION['error'];?></p-->
    <input class="right" type="submit" value="Logout" onclick="delete localStorage['fractured.currentLogin']; delete localStorage['fractured.currentSession']"/></p>
    <div class="clear"></div>
  </form>
  <div class="gap"></div>
  <input type="button" value="New workspace" onclick="resetState();">
  <input type="button" onclick="exportStateFile();" value="Export workspace"/>
  <input type="button" value="Upload workspace" onClick="filetype='session'; $('fileupload').click();"/>
  <form name="savesession" action="db/session_save.php" method="post">
    <input type="hidden" id="desc" name="description"/>
    <input type="hidden" id="sessid" name="session_id"/>
  </form>
  <div class="gap"></div>
  <p><i><b>Sessions:</b></i></p>
  <input type="button" onclick="uploadState(<?php echo $_SESSION['session_id'];?>);" value="Save"/>
  <input type="button" onclick="loadSelectedState();" value="Load"/>
  <input type="button" onclick="deleteSelectedState();" value="Delete"/>
  <select size="20" class="savelist" id="sessions" ondblclick="loadSelectedState()">
  </select>
  <br>

  <?php
  }
?>
        <!--hr>
          <div class="row">
            <div class="label">Left-click Action</div>
            <div class="field">
              <select id="left_click" onchange="alert(this.value)">
              <option value="none">Set Origin</option>
              </select>
            </div>
            <div class="label">Wheel Action</div>
            <div class="field">
              <select id="right_click" onchange="alert(this.value)">
              <option value="none">Zoom</option>
              </select>
            </div>
          </div>

        <div id="image"></div-->

        </div>

      <div class="panel" id="panel2" style="display: none">

        <form id="inputs" name="inputs" class="scroll" onmousedown="handleFormMouseDown(event)">

          <p><i><b>Saved Fractals:</b></i></p>
          <input type="button" value="Load" onclick="selectedFractal($('stored'));">
          <input type="button" value="Delete" onclick="deleteFractal();">
          <input type="button" value="Export" onclick="exportFractalFile();">
          <input type="button" value="Upload" onClick="filetype='fractal'; $('fileupload').click();"/>
          <input type="button" value="Upload palette" onClick="filetype='palette'; $('fileupload').click();"/>
          <select size="10" class="savelist" id="stored" ondblclick="selectedFractal(this)">
          </select>
          <div id="indicatorbg"><div id="indicator"></div></div>
          <div class="gap"></div>
          <div class="divider"></div>


          <div class="row">
            <span class="label">Name</span>
            <span class="field"><input type="text" id="nameInput" value="unnamed" style="width: 160px" onchange="fractal.name = this.value;">
              <input type="button" value="Clear" onclick="clearFractal();">
            </span>
          </div>
          <div class="row">
            <span class="label">Size (<label for="autosize">Auto:</label><input type="checkbox" id="autosize" checked="checked" onclick="autoResize(this.checked);">)
</span><span class="field"><input type="number" id="widthInput" value="600"></span><span class="field"><input type="number" id="heightInput" value="600"></span>
          </div>

          <div class="row">
            <span class="label">Zoom</span>
            <span class="field"><input type="number" id="zoomLevel" value="0.5" step="0.01" min="0.00000000001"></span>
            <div class="left"><input type="button" value="Reset" onclick="fractal.resetZoom()"></div>
          </div>
          <div class="row">
            <span class="label">Rotate&#176;</span>
            <span class="field"><input type="number" id="rotate" value="0.0" min="0" max="360"></span>
          </div>
          <div class="row">
            <span class="label">Origin</span><span class="field"><input type="number" id="xPosInput" value="0.0" step="0.1"></span><span class="field"><input type="number" id="yPosInput" value="0.0" step="0.1"></span>
          </div>
          <div class="row">
            <span class="label">Selected coord</span><span class="field"><input type="number" id="xSelInput" value="0.0" step="0.1"></span><span class="field"><input type="number" id="ySelInput" value="0.0" step="0.1"></span>
          </div>
          <div class="row">
            <span class="label"></span>
            <span class="field">
              <input type="checkbox" id="julia" checked="unchecked">
              <label for="julia">Julia</label>
            </span>
            <span class="field">
              &nbsp; <input type="checkbox" id="perturb" checked="unchecked">
              <label for="perturb">Perturb</label>
            </span>
          </div>

          <div class="clear"></div>
          <div class="row">
          </div>

          <div id="base_params" width="100%"></div>

          <div class="clear"></div>

        </form>

      </div>

      <div class="panel scroll" id="panel3" style="display: none">
        <p>Fractal</p>
        <div class="field">
          <select id="fractal_formula" onchange="fractal['fractal'].select(this.value)">
          </select>
          <div class="right">
            <input type="button" value="Edit" onclick="fractal.editFormula('fractal');">
            <input type="button" value="&nbsp;+&nbsp;" onclick="fractal.newFormula('fractal');">
            <input type="button" value="&nbsp;&ndash;&nbsp;" onclick="fractal.deleteFormula('fractal');">
          </div>
        </div>

        <p>Pre-Transform</p>
        <div class="field">
          <select id="pre_transform_formula" onchange="fractal['pre_transform'].select(this.value)">
            <option value="none"></option>
          </select>
          <div class="right">
            <input type="button" value="Edit" onclick="fractal.editFormula('pre_transform');">
            <input type="button" value="&nbsp;+&nbsp;" onclick="fractal.newFormula('pre_transform');">
            <input type="button" value="&nbsp;&ndash;&nbsp;" onclick="fractal.deleteFormula('pre_transform');">
          </div>
        </div>

        <p>Post-Transform</p>
        <div class="field">
          <select id="post_transform_formula" onchange="fractal['post_transform'].select(this.value)">
            <option value="none"></option>
          </select>
          <div class="right">
            <input type="button" value="Edit" onclick="fractal.editFormula('post_transform');">
            <input type="button" value="&nbsp;+&nbsp;" onclick="fractal.newFormula('post_transform');">
            <input type="button" value="&nbsp;&ndash;&nbsp;" onclick="fractal.deleteFormula('post_transform');">
          </div>
        </div>


          <div class="gap"></div>
          <div id="fractal_params" width="100%"></div>
          <div id="pre_transform_params" width="100%"></div>
          <div id="post_transform_params" width="100%"></div>
      </div>

      <div class="panel scroll" id="panel4" style="display: none">
        <p>Outside Colour</p>
        <div class="field">
          <select id="outside_colour_formula" onchange="fractal['outside_colour'].select(this.value)">
          </select>
          <div class="right">
            <input type="button" value="Edit" onclick="fractal.editFormula('outside_colour');">
            <input type="button" value="&nbsp;+&nbsp;" onclick="fractal.newFormula('outside_colour');">
            <input type="button" value="&nbsp;&ndash;&nbsp;" onclick="fractal.deleteFormula('outside_colour');">
          </div>
        </div>
        <p>Inside Colour</p>
        <div class="field">
          <select id="inside_colour_formula" onchange="fractal['inside_colour'].select(this.value)">
          </select>
          <div class="right">
            <input type="button" value="Edit" onclick="fractal.editFormula('inside_colour');">
            <input type="button" value="&nbsp;+&nbsp;" onclick="fractal.newFormula('inside_colour');">
            <input type="button" value="&nbsp;&ndash;&nbsp;" onclick="fractal.deleteFormula('inside_colour');">
          </div>
        </div>


          <div class="gap"></div>
          <div id="outside_colour_params" width="100%"></div>
          <div id="inside_colour_params" width="100%"></div>
      </div>

      <div class="panel scroll" id="panel5" style="display: none">
        <div id="debug" style="display: none">
          <input type="button" value="Source" onClick="lineOffset=1; openEditor('gen-shader.frag')">
          <input type="button" value="Header" onClick="lineOffset=1; openEditor('shaders/fractal-header.frag')">
          <input type="button" value="Body" onClick="lineOffset=1; openEditor('shaders/fractal-shader.frag')">
          <input type="button" value="Complex" onClick="lineOffset=1; openEditor('shaders/complex-math.frag')"-->
          <input type="button" value="Vertex" onClick="lineOffset=1; openEditor('shaders/shader2d.vert')"-->
        </div>
        <input type="button" value="Clear log" onClick="consoleClear()" ondblClick="$('debug').style.display='block'">
        <div id="consolearea">
          <div id="console">
            <br>
            <p>Fractured Studio v0.2 - Owen Kaluza, 2011</p>
            <p></p>
            <br>
            <p><i><b>With thanks to:</b></i></p>
            <p>
            Formula/Shader code editing component uses <a href="http://codemirror.net/">CodeMirror</a>
            </p>
            <p>
            Colour picker was based on an original design from <a href="http://www.colorjack.com/software/dhtml+color+picker.html">colorjack.com</a>, heavily modified since.
            </p>
            <p>
            Expression parser built using <a href="http://zaach.github.com/jison/">Jison</a>
            </p>
          </div>
        </div>
      </div>

      <div id="statusbar">
        <span id="coords">&nbsp;re: im:</span>
      </div>

    </aside>

  </section>

  <section id="main">
    <canvas id="fractal-canvas" width="600" height="600"></canvas>
  </section>

  <!-- Hidden -->
  <div id="select" style="display: none"></div>
  <div id="hidden" style="display: none">
    <img src="media/slider.png" id="slider">
    <img src="media/SatVal.png">
    <canvas id="gradient" width="4096" height="1"></canvas>

    <form name="exporter" action="savefile.php" method="post">
      <input type="hidden" id="export-filename" name="filename"/>
      <input type="hidden" id="export-content" name="content"/>
    </form>

  </div>
  <input name="file" id="fileupload" type="file" onchange="fileSelected(this.files)">

  <div id="popup" class="popup">
    This a vertically and horizontally centered popup.
  </div>

  <!-- Colour picker -->
  <div id="plugin">
    <div id="plugCURBG"><div id="plugCUR"></div></div>
    <div id="plugRGB" onclick="colours.picker.updateString()">R: 255 G: 255 B: 255</div>
    <div id="plugCLOSE">X</div>
    <div id="plugOK">OK</div><br>
    <div id="SV">
     <div id="SVslide"></div>
    </div>
    <div id="H" class="slider">
     <div id="Hmodel" class="sliderBG"></div>
     <div id="Hslide" class="sliderControl"></div>
    </div>
    <div id="O" class="slider">
     <div id="Omodel" class="sliderBG"></div>
     <div id="Oslide" class="sliderControl"></div>
    </div>
  </div>

</body>
</html>

