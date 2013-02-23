/* Parses complex mathematical expressions,
 * Types stored on yy[], all variables assumed complex
 * No type checking for == and !=, assumes valid
 * Some implicit multiplication support before and after parentheses
 */

/* lexical grammar */
%lex
%%

\s+                    /* skip whitespace */
"(""-"?[0-9]+("."[0-9]+)?\b",""-"?[0-9]+("."[0-9]+)?\b")"    return 'COMPLEX'
[0-9]+("."[0-9]+)\b    return 'REAL'
[0-9]+                 return 'INTEGER'
"*"                    return '*'
"/"                    return '/'
"-"                    return '-'
"+"                    return '+'
"^"                    return '^'
"("                    return '('
")"                    return ')'
"#"                    return '#'
"||"                   return '$'
"|"                    return '|'
","                    return ','
"=="                   return '=='
"!="                   return '!='
"<="                   return '<='
"=<"                   return '<='
">="                   return '>='
"=>"                   return '>='
"<"                    return '<'
">"                    return '>'
"!"                    return '!'
<<EOF>>                return 'EOF'
E                      return 'E'
PI                     return 'PI'
"manhattan"|"norm"|"cabs"|"arg"|"imag"|"dot"|"real" return 'REALFN'
"pow"|"exp"|"sin"|"cos"|"tan"|"asin"|"acos"|"atan"|"sinh"|"cosh"|"tanh"|"asinh"|"acosh"|"atanh"|"sqrt"|"ln"|"log10" return 'COMPLEXFN';
[@:]*[_a-zA-Z][_a-zA-Z0-9]*("."[w-z])? return 'IDENTIFIER';
.                      return 'INVALID'

/lex

/* operator associations and precedence */

%left '<' '>' '==' '!=' '<=' '>='
%left '+' '-'
%left '*' '/'
%left '^'
%left CPLX
%left NORM
%left REAL
%left UNOT
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        {return $e;}
    ;

p
    : '(' e ')' 
      {        
        if (yy[$e] == 'real' && yy.eval && yy.eval($e))
          $$ = yy.eval($e);
        else
          $$ = "(" + $e + ")" 
        yy[$$] = yy[$e];
      }
    ;

real
    : INTEGER -> $1 + ".0"
    | REAL
    | E -> "2.718281828"
    | PI -> "3.141592654"
    ;

const
    : real
      {
        //Define eval function, replace
        //with safer version if required
        if (!yy.eval) {
          yy.eval = function(expr) {
              expr += "";
              var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
              // Detect valid JS identifier names and replace them
              expr = expr.replace(reg, function(fn) {
                // If the name is a direct member of Math, allow
                if (Math.hasOwnProperty(fn))
                  return "Math."+fn;
                // Otherwise the expression is invalid
                else
                  return null;
              });
              try { return eval(expr); } catch (e) { return null; };
            };
        }

        yy[$$] = 'real';
        //alert($$ + " ==> " + yy[$$]);
      }
    ;

call
    : IDENTIFIER p //-> $1 + $p
      {
        $$ = $1 + $p
        yy[$$] = yy[$p];
      }
    | COMPLEXFN p //-> "c" + $1 + $p
      {
        if (yy[$p] != 'real')
          $$ = "c" + $1 + $p
        else
          $$ = $1 + $p
        yy[$$] = yy[$p];
      }
    | REALFN p
      {
        $$ = $REALFN + $p;
        yy[$$] = 'real';
      }
    ;

e
    : e '+' e //-> $e1 + " + " + $e2
      {
        if (yy.eval && yy.eval($e1) == 0.0) $$ = $e2;
        if (yy.eval && yy.eval($e2) == 0.0) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " + " + $e2;
          var ev = yy.eval ? yy.eval($$) : null;
          if (ev) $$ = ev;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          $$ = "C(" + $e1 + ",0) + " + $e2;
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          $$ = $e1 + " + C(" + $e2 + ",0)";
          yy[$$] = 'complex';
        } else {
          $$ = $e1 + " + " + $e2;
          yy[$$] = 'complex';
        }
      }
    | e '-' e //-> $e1 + " - " + $e2
      {
        if (yy.eval && yy.eval($e1) == 0.0) $$ = $e2;
        if (yy.eval && yy.eval($e2) == 0.0) $$ = $e1;
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " - " + $e2;
          var ev = yy.eval ? yy.eval($$) : null;
          if (ev) $$ = ev;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          $$ = "C(" + $e1 + ",0) - " + $e2;
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          $$ = $e1 + " - C(" + $e2 + ",0)";
          yy[$$] = 'complex';
        } else {
          $$ = $e1 + " - " + $e2;
          yy[$$] = 'complex';
        }
      }
    | e '*' e
      {
        if (yy.eval && yy.eval($e1) == 1.0) $$ = $e2;
        if (yy.eval && yy.eval($e2) == 1.0) $$ = $e1;
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " * " + $e2;
          var ev = yy.eval ? yy.eval($$) : null;
          if (ev) $$ = ev;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          $$ = "mul(C(" + $e1 + ",0)," + $e2 + ")";
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          $$ = "mul(" + $e1 + ",C(" + $e2 + ",0))";
          yy[$$] = 'complex';
        } else {
          $$ = "mul(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'complex';
        }
      }
    | e '/' e
      {
        if (yy.eval && yy.eval($e2) == 1.0) $$ = $e1;
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " / " + $e2;
          var ev = yy.eval ? yy.eval($$) : null;
          if (ev) $$ = ev;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          if (yy.eval && yy.eval($e1) == 1.0)
            $$ = "inv(" + $e2 + ")";
          else
            $$ = "div(C(" + $e1 + ",0), " + $e2 + ")";
            //$$ = $e1 + " * inv(" + $e2 + ")";
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          if (yy.eval && yy.eval($e2) == 1.0)
            $$ = $e1;
          else
            $$ = "div(" + $e1 + ",(C(, " + $e2 + ",0))";
            //$$ = $e1 + " / " + $e2;
          yy[$$] = 'complex';
        } else {
          $$ = "div(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'complex';
        }
      }
    | e '^' e 
      {
        var power = yy.eval ? yy.eval($e2) : $e2;
        if (power == 1.0) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = "pow(" + $e1 + ", " + $e2 + ")";
          var ev = yy.eval ? yy.eval($$) : null;
          if (ev) $$ = ev;
          else if (power == 0.0)
            $$ = "1.0";
          else if (power == 2.0)
            $$ = "(" + $e1 + "*" + $e1 + ")";
          else if (power == 3.0)
            $$ = "(" + $e1 + "*" + $e1 + "*" + $e1 + ")";
          else
            $$ = "pow(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'real';
        } else {
          if (power == 0.0)
            $$ = "C(1,0)";
          else if (power == 2.0)
            $$ = "sqr(" + $e1 + ")";
          else if (power == 3.0)
            $$ = "cube(" + $e1 + ")";
          else {
            if (yy[$e1] == 'real')
              $e1 = "C(" + $e1 + ",0)";
            if (yy[$e2] == 'real')
              $e2 = "C(" + $e2 + ",0)";
            $$ = "cpow(" + $e1 + "," + $e2 + ")"
          }
          yy[$$] = 'complex';
        }
      }
    | e '==' e -> $e1 + " == " + $e2
    | e '!=' e -> $e1 + " != " + $e2
    | e '<=' e -> "R(" + $e1 + ") <= R(" + $e2 + ")"
    | e '>=' e -> "R(" + $e1 + ") >= R(" + $e2 + ")"
    | e '<' e  -> "R(" + $e1 + ") < R(" + $e2 + ")"
    | e '>' e  -> "R(" + $e1 + ") > R(" + $e2 + ")"
    | '#' e %prec REAL
      {
        $$ = "R(" + $e + ")";
        yy[$$] = 'real';
      }
    | '!' e %prec UNOT  // -> "!" + $e
      {
        $$ = "!" + $e;
        yy[$$] = yy[$e];
      }
    | '-' e %prec UMINUS //-> "-" + $e
      {
        $$ = "-" + $e;
        yy[$$] = yy[$e];
      }
    | '|' e '|' %prec NORM //-> "C(cabs(" + $e + "),0)"
      {
        if (yy[$e] == 'real')
          $$ = "abs(" + $e + ")";
        else
          $$ = "cabs(" + $e + ")";
        yy[$$] = 'real';
      }
    | '$' e '$' %prec NORM //-> "C(norm(" + $e + "),0)"
      {
        if (yy[$e] == 'real')
          $$ = "(" + $e + "*" + $e + ")";
        else
          $$ = "norm(" + $e + ")";
        yy[$$] = 'real';
      }
    | const {yy[$$] = 'real';} //"(" + $1 + ",0)"
    | COMPLEX {$$ = "C" + $COMPLEX; yy[$$] = 'complex';}
    | IDENTIFIER 
      {
        switch ($IDENTIFIER)
        {
          case "pi":
          case "PI":
            $$ = "PI";
            yy[$$] = 'real';
            break;
          case "e":
          case "E":
            $$ = "E";
            yy[$$] = 'real';
            break;
          default:
            //$$ = $IDENTIFIER;
            yy[$$] = 'complex';
        }
      }
    | p
    | call
    ;

