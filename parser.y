/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                    /* skip whitespace */
[0-9]+("."[0-9]+)?\b   return 'NUMBER'
"*"                    return '*'
"."                    return '*'
"/"                    return '/'
"-"                    return '-'
"+"                    return '+'
"^"                    return '^'
"("                    return '('
")"                    return ')'
"PI"                   return 'PI'
"E"                    return 'E'
<<EOF>>                return 'EOF'
[_a-zA-Z][_a-zA-Z0-9]* return 'IDENTIFIER';
.                      return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        {return $1;}
    ;

e
    : e '+' e
        {
          var a = parseFloat($1);
          var b = parseFloat($3);
          if (a && b) {
            var result = a + b + "";
            if (result.indexOf(".") < 0) result += ".0";
            $$ = result;
          } else 
            $$ = "add(" + $1 + "," + $3 + ")";
        }
    | e '-' e
        {
          var a = parseFloat($1);
          var b = parseFloat($3);
          if (a && b) {
            var result = a - b + "";
            if (result.indexOf(".") < 0) result += ".0";
            $$ = result;
          } else 
            $$ = "sub(" + $1 + "," + $3 + ")";
        }
    | e '*' e
        {
          var a = parseFloat($1);
          var b = parseFloat($3);
          if (a && b) {
            var result = a * b + "";
            if (result.indexOf(".") < 0) result += ".0";
            $$ = result;
          } else 
 
            $$ = "mul(" + $1 + "," + $3 + ")";
        }
    | e '/' e
        {
          var a = parseFloat($1);
          var b = parseFloat($3);
          if (a && b) {
            var result = a / b + "";
            if (result.indexOf(".") < 0) result += ".0";
            $$ = result;
          } else 
            $$ = "div(" + $1 + "," + $3 + ")";
        }
    | e '^' e
        {
          if ($3 == 0) $$ = 1;
          else if ($3 == 1) $$ = $1;
          else if ($3 == 2) $$ = "sqr(" + $1 + ")";
          else if ($3 == 3) $$ = "cube(" + $1 + ")";
          else $$ = "cpow(" + $1 + "," + $3 + ")";
        }
    | '-' e %prec UMINUS
        {$$ = "-" + $2;}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {
          if (yytext.indexOf(".") < 0) 
            $$ = yytext + ".0"; }
        }
    | E
    | PI
    | IDENTIFIER
    | call
    ;

call
    : IDENTIFIER '(' e ')'
        {$$ = $1 + "(" + $3 + ")";}
    ;


