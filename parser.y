/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"*"                   return '*'
"."                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"("                   return '('
")"                   return ')'
"PI"                  return 'PI'
"E"                   return 'E'
<<EOF>>               return 'EOF'
[_a-zA-Z][_a-zA-Z0-9]* return 'IDENTIFIER';
.                     return 'INVALID'

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
        {$$ = "add(" + $1 + "," + $3 + ")";}
    | e '-' e
        {$$ = "sub(" + $1 + "," + $3 + ")";}
    | e '*' e
        {$$ = "mul(" + $1 + "," + $3 + ")";}
    | e '/' e
        {$$ = "div(" + $1 + "," + $3 + ")";}
    | e '^' e
        {$$ = "cpow(" + $1 + "," + $3 + ")";}
    | '-' e %prec UMINUS
        {$$ = "-" + $2;}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = "C(" + yytext + ")";}
    | E
        {$$ = "C(E)";}
    | PI
        {$$ = "C(PI)";}
    | IDENTIFIER
    | call
    ;

call
    : IDENTIFIER '(' e ')'
        {$$ = $1 + "(" + $3 + ")";}
    ;

