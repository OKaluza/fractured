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
"manhattan"|"norm"|"cabs"|"arg"|"imag"|"dot"|"real" return 'REALFN'
"pow"|"exp"|"sin"|"cos"|"tan"|"asin"|"acos"|"atan"|"sinh"|"cosh"|"tanh"|"asinh"|"acosh"|"atanh"|"sqrt"|"ln"|"log10" return 'COMPLEXFN';
[@:]*[_a-zA-Z][_a-zA-Z0-9]*("."[w-z])? return 'IDENTIFIER';
.                      return 'INVALID'

/lex

/* operator associations and precedence */

%left '<' '>' '==' '!=' '<=' '>='
%left UNOT
%left '+' '-'
%left '*' '/'
%left '^'
%left CPLX
%left NORM
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
        $$ = "(" + $e + ")" 
        yy[$$] = yy[$e];
      }
    ;

real
    : INTEGER -> $1 + ".0"
    | REAL
    | E
    | PI
    ;

const
    : real
      {
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
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " + " + $e2;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          $$ = "complex(" + $e1 + ",0) + " + $e2;
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          $$ = $e1 + " + complex(" + $e2 + ",0)";
          yy[$$] = 'complex';
        } else {
          $$ = $e1 + " + " + $e2;
          yy[$$] = 'complex';
        }
        //alert(yy[$$] + " : " + yy[$e1] + " + " + yy[$e2]);
      }
    | e '-' e //-> $e1 + " - " + $e2
      {
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " - " + $e2;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          $$ = "complex(" + $e1 + ",0) - " + $e2;
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          $$ = $e1 + " - complex(" + $e2 + ",0)";
          yy[$$] = 'complex';
        } else {
          $$ = $e1 + " - " + $e2;
          yy[$$] = 'complex';
        }
      }
    | e '*' e
      {
        //alert(yy[$e1] + " * " + yy[$e2]);
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " * " + $e2;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real' || yy[$e2] == 'real') {
          $$ = $e1 + " * " + $e2;
          yy[$$] = 'complex';
        } else {
          $$ = "mul(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'complex';
        }
      }
    | e '/' e
      {
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          $$ = $e1 + " / " + $e2;
          yy[$$] = 'real';
        } else if (yy[$e1] == 'real') {
          if (parseFloat($e1) == 1.0)
            $$ = "inv(" + $e2 + ")";
          else
            $$ = $e1 + " * inv(" + $e2 + ")";
          yy[$$] = 'complex';
        } else if (yy[$e2] == 'real') {
          $$ = $e1 + " / " + $e2;
          yy[$$] = 'complex';
        } else {
          $$ = "div(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'complex';
        }
        //alert(yy[$$] + " : " + yy[$e1] + " / " + yy[$e2]);

      }
    | e '^' e 
      {
        var power = parseFloat(yytext);
        if (yy[$e1] == 'real' && yy[$e2] == 'real') {
          if (power == 0.0)
            $$ = "1.0";
          else if (power == 1.0)
            $$ = $e1;
          else if (power == 2.0)
            $$ = "(" + $e1 + "*" + $e1 + ")";
          else if (power == 3.0)
            $$ = "(" + $e1 + "*" + $e1 + "*" + $e1 + ")";
          else
            $$ = "pow(" + $e1 + "," + $e2 + ")";
          yy[$$] = 'real';
        } else {
          if (power == 0.0)
            $$ = "complex(1,0)";
          else if (power == 1.0)
            $$ = $e1;
          else if (power == 2.0)
            $$ = "sqr(" + $e1 + ")";
          else if (power == 3.0)
            $$ = "cube(" + $e1 + ")";
          else {
            if (yy[$e1] == 'real')
              $e1 = "complex(" + $e1 + ",0)";
            if (yy[$e2] == 'real')
              $e2 = "complex(" + $e2 + ",0)";
            $$ = "cpow(" + $e1 + "," + $e2 + ")"
          }
          yy[$$] = 'complex';
        }
      }
    | e '==' e -> $e1 + " == " + $e2
    | e '!=' e -> $e1 + " != " + $e2
    | e '<=' e -> "real(" + $e1 + ") <= real(" + $e2 + ")"
    | e '>=' e -> "real(" + $e1 + ") >= real(" + $e2 + ")"
    | e '<' e  -> "real(" + $e1 + ") < real(" + $e2 + ")"
    | e '>' e  -> "real(" + $e1 + ") > real(" + $e2 + ")"
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
    | '|' e '|' %prec NORM //-> "complex(cabs(" + $e + "),0)"
      {
        if (yy[$e] == 'real')
          $$ = "abs(" + $e + ")";
        else
          $$ = "cabs(" + $e + ")";
        yy[$$] = 'real';
      }
    | '$' e '$' %prec NORM //-> "complex(norm(" + $e + "),0)"
      {
        if (yy[$e] == 'real')
          $$ = "(" + $e + "*" + $e + ")";
        else
          $$ = "norm(" + $e + ")";
        yy[$$] = 'real';
      }
    | p p //-> "mul(" + $p1 + "," + $p2 + ")"
      {
        if (yy[$p1] == 'real' || yy[$p2] == 'real') {
          $$ = $p1 + "*" + $p2 + ")";
          if (yy[$p1] == 'real' && yy[$p2] == 'real')
            yy[$$] = 'real';
          else
            yy[$$] = 'complex';
        } else {
          $$ = "mul(" + $p1 + "," + $p2 + ")";
          yy[$$] = 'complex';
        }
      }
    | const p 
      {
        $$ = $const + " * " + $p;
        yy[$$] = yy[$p];
      }
    | const p IDENTIFIER //-> $const + " * mul(" + $p + "," + $IDENTIFIER + ")"
      {
        if (yy[$p] == 'real')
          $$ = $const + "*" + $p + "*" + $IDENTIFIER;
        else
          $$ = $const + " * mul(" + $p + "," + $IDENTIFIER + ")";
        yy[$$] = 'complex';
      }
    | const IDENTIFIER p //-> $const + " * mul(" + $IDENTIFIER + "," + $p + ")"
      {
        if (yy[$p] == 'real')
          $$ = $const + "*" + $IDENTIFIER + "*" + $p;
        else
          $$ = $const + " * mul(" + $IDENTIFIER + "," + $p + ")";
        yy[$$] = 'complex';
      }
    | p IDENTIFIER //-> "mul(" + $p + "," + $IDENTIFIER + ")"
      {
        if (yy[$p] == 'real')
          $$ = $p + "*" + $IDENTIFIER;
        else
          $$ = "mul(" + $p + "," + $IDENTIFIER + ")";
        yy[$$] = 'complex';
      }
    | const {yy[$$] = 'real';} //"(" + $1 + ",0)"
    | COMPLEX {yy[$$] = 'complex';}
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

