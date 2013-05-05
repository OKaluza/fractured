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
"manhattan"|"norm"|"cabs"|"arg"|"imag"|"dot"|"real"|"log" return 'REALFN'
"pow"|"exp"|"asinh"|"acosh"|"atanh"|"asin"|"acos"|"atan"|"sinh"|"cosh"|"tanh"|"sin"|"cos"|"tan"|"sqrt"|"ln"|"log10" return 'COMPLEXFN';
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
        if (yy[$e] == 'real' && yy.eval)
          $$ = "(" + yy.eval($e, true) + ")";
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
        //Define eval function for parsing simple mathematical expressions
        //Only allows function calls that are props of Math.
        if (!yy.eval) {
          yy.eval = function(ex, as_string) {
              var expr = ex + "";
              var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
              // Detect valid JS identifier names and replace them
              expr = expr.replace(reg, function(fn) {
                // If the name is a direct member of Math, allow
                if (Math.hasOwnProperty(fn))
                  return "Math." + fn;
                // Otherwise the expression is invalid
                return fn;
              });
              var result;
              try {
                result = eval(expr);
              } catch (e) { 
                result = ex;
              };
              //Always return as string 
              //adding decimal if neccessary
              if (as_string) {
                if (result == Math.floor(result))
                  return result + '.0';
                return result + '';
              }
              //Otherwise return actual result
              return result;
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
        if (yy[$p] == 'real' && yy.eval)
          $$ = yy.eval($REALFN + $p, true);
        else
          $$ = $REALFN + $p;
        yy[$$] = 'real';
      }
    ;

e
    : e '+' e //-> $e1 + " + " + $e2
      {
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($e1);
          rhs = yy.eval($e2);
        }
        if (lhs == 0) $$ = $e2;
        else if (rhs == 0) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " + " + $e2;
          if (yy.eval) $$ = yy.eval($$, true);
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
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($e1);
          rhs = yy.eval($e2);
        }
        if (lhs == 0) $$ = $e2;
        else if (rhs == 0) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " - " + $e2;
          if (yy.eval) $$ = yy.eval($$, true);
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
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($e1);
          rhs = yy.eval($e2);
        }
        if (lhs == 0 || rhs == 0) {
            $$ = "0.0";
            yy[$$] = 'real';
        }
        else if (lhs == 1) $$ = $e2;
        else if (rhs == 1) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " * " + $e2;
          if (yy.eval) $$ = yy.eval($$, true);
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
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($e1);
          rhs = yy.eval($e2);
        }
        if (lhs == 0 || rhs == 0) {
            $$ = "0.0";
            yy[$$] = 'real';
        }
        else if (rhs == 1) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " / " + $e2;
          if (yy.eval) $$ = yy.eval($$, true);
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          if (yy.eval && yy.eval($e1) == 1)
            $$ = "inv(" + $e2 + ")";
          else
            $$ = "div(C(" + $e1 + ",0), " + $e2 + ")";
            //$$ = $e1 + " * inv(" + $e2 + ")";
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          if (yy.eval && yy.eval($e2) == 1)
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
        var power;
        if (yy.eval) power = yy.eval($e2);
        if (power == 1) $$ = $e1;
        else if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = "pow(" + $e1 + ", " + $e2 + ")";
          if (yy.eval) $$ = yy.eval($$, true);
          else if (power == 0)
            $$ = "1.0";
          else if (power == 2)
            $$ = "(" + $e1 + "*" + $e1 + ")";
          else if (power == 3)
            $$ = "(" + $e1 + "*" + $e1 + "*" + $e1 + ")";
          else
            $$ = "pow(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'real';
        } else {
          if (power == 0)
            $$ = "C(1,0)";
          else if (power == 2)
            $$ = "sqr(" + $e1 + ")";
          else if (power == 3)
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

