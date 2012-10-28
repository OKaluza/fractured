/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                    /* skip whitespace */
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
"pi"                   return 'PI'
"e"                    return 'E'
<<EOF>>                return 'EOF'
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

e
    : e '+' e
        {
          var a = parseFloat($e1);
          var b = parseFloat($e2);
          if (a && b)
            $$ = a + b + ((a+b) % 1 === 0 ? ".0" : "");
          else 
            $$ = "add(" + $e1 + "," + $e2 + ")";
        }
    | e '-' e
        {
          var a = parseFloat($e1);
          var b = parseFloat($e2);
          if (a && b)
            $$ = a - b + ((a-b) % 1 === 0 ? ".0" : "");
          else 
            $$ = "sub(" + $e1 + "," + $e2 + ")";
        }
    | e '*' e
        {
          var a = parseFloat($e1);
          var b = parseFloat($e2);
          if (a && b)
            $$ = a * b + ((a*b) % 1 === 0 ? ".0" : "");
          else 
             $$ = "mul(" + $e1 + "," + $e2 + ")";
        }
    | e '/' e
        {
          var a = parseFloat($e1);
          var b = parseFloat($e2);
          if (a && b)
            $$ = a / b + ((a/b) % 1 === 0 ? ".0" : "");
          else 
            $$ = "div(" + $e1 + "," + $e2 + ")";
        }
    | e '^' e
        {
          if ($e2 == 0) $$ = "1.0";
          else if ($e2 == 1) $$ = $e1;
          else if ($e2 == 2) $$ = "sqr(" + $e1 + ")";
          else if ($e2 == 3) $$ = "cube(" + $e1 + ")";
          else $$ = "cpow(" + $e1 + "," + $e2 + ")";
        }
    | e '==' e -> $e1 + " == " + $e2
    | e '!=' e -> $e1 + " != " + $e2
    | e '<=' e -> $e1 + " <= " + $e2
    | e '>=' e -> $e1 + " >= " + $e2
    | e '<' e  -> $e1 + " < " + $e2
    | e '>' e  -> $e1 + " > " + $e2
    | '!' e %prec UNOT   -> "!" + $e
    | '-' e %prec UMINUS -> "-" + $e
    | '|' e '|' %prec NORM -> "cabs(" + $e + ")"
    | '$' e '$' %prec NORM -> "norm(" + $e + ")"
    | p p -> "mul(" + $p1 + "," + $p2 + ")"
    | const p -> "mul(" + $const + "," + $p + ")"
    | const p IDENTIFIER -> "mul(mul(" + $const + "," + $p + ")" + "," + $3 + ")"
    | const IDENTIFIER p -> "mul(mul(" + $const + "," + $2 + ")" + "," + $p + ")"

    | p IDENTIFIER -> "mul(" + $p + "," + $IDENTIFIER + ")"
    | const
    | '(' e ',' e ')' %prec CPLX
        {$$ = "complex(" + $e1 + "," + $e2 + ")";}
    | IDENTIFIER
    | p
    | call
    ;

p
    : '(' e ')' -> "(" + $e + ")" 
    ;

const
    : INTEGER  -> $1 + ".0"
    | REAL
    | E
    | PI
    ;

call
    : IDENTIFIER p -> $1 + $p
    ;


