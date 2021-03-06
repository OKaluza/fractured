/* parser generated by jison 0.4.4 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace(){},
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"p":6,"(":7,")":8,"real":9,"INTEGER":10,"REAL":11,"E":12,"PI":13,"const":14,"call":15,"IDENTIFIER":16,"COMPLEXFN":17,"REALFN":18,"+":19,"-":20,"*":21,"/":22,"^":23,"==":24,"!=":25,"<=":26,">=":27,"<":28,">":29,"#":30,"!":31,"|":32,"$":33,"COMPLEX":34,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"(",8:")",10:"INTEGER",11:"REAL",12:"E",13:"PI",16:"IDENTIFIER",17:"COMPLEXFN",18:"REALFN",19:"+",20:"-",21:"*",22:"/",23:"^",24:"==",25:"!=",26:"<=",27:">=",28:"<",29:">",30:"#",31:"!",32:"|",33:"$",34:"COMPLEX"},
productions_: [0,[3,2],[6,3],[9,1],[9,1],[9,1],[9,1],[14,1],[15,2],[15,2],[15,2],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,1],[4,1],[4,1],[4,1],[4,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:return $$[$0-1];
break;
case 2:        
        if (yy[$$[$0-1]] == 'real' && yy.eval)
          this.$ = "(" + yy.eval($$[$0-1], true) + ")";
        else
          this.$ = "(" + $$[$0-1] + ")" 
        yy[this.$] = yy[$$[$0-1]];
      
break;
case 3:this.$ = $$[$0] + ".0";
break;
case 5:this.$ = "2.718281828";
break;
case 6:this.$ = "3.141592654";
break;
case 7:
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
//alert(ex + " = " + result);
                if (result == Math.floor(result))
                  return result + '.0';
                return result + '';
              }
              //Otherwise return actual result
              return result;
            };
        }

        yy[this.$] = 'real';
        //alert(this.$ + " ==> " + yy[this.$]);
      
break;
case 8:
        this.$ = $$[$0-1] + $$[$0]
        yy[this.$] = yy[$$[$0]];
      
break;
case 9:
        if (yy[$$[$0]] != 'real')
          this.$ = "c" + $$[$0-1] + $$[$0]
        else
          this.$ = $$[$0-1] + $$[$0]
        yy[this.$] = yy[$$[$0]];
      
break;
case 10:
        if (yy[$$[$0]] == 'real' && yy.eval)
          this.$ = yy.eval($$[$0-1] + $$[$0], true);
        else
          this.$ = $$[$0-1] + $$[$0];
        yy[this.$] = 'real';
      
break;
case 11:
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($$[$0-2]);
          rhs = yy.eval($$[$0]);
        }
        if (lhs == 0) this.$ = $$[$0];
        else if (rhs == 0) this.$ = $$[$0-2];
        else if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " + " + $$[$0];
          if (yy.eval) this.$ = yy.eval(this.$, true);
          yy[this.$] = 'real';
        } else if (yy[$$[$0-2]] == 'real') {
          this.$ = "C(" + $$[$0-2] + ",0) + " + $$[$0];
          yy[this.$] = 'complex';
        } else if (yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " + C(" + $$[$0] + ",0)";
          yy[this.$] = 'complex';
        } else {
          this.$ = $$[$0-2] + " + " + $$[$0];
          yy[this.$] = 'complex';
        }
      
break;
case 12:
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($$[$0-2]);
          rhs = yy.eval($$[$0]);
        }
        if (lhs == 0) this.$ = $$[$0];
        else if (rhs == 0) this.$ = $$[$0-2];
        else if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " - " + $$[$0];
          if (yy.eval) this.$ = yy.eval(this.$, true);
          yy[this.$] = 'real';
        } else if (yy[$$[$0-2]] == 'real') {
          this.$ = "C(" + $$[$0-2] + ",0) - " + $$[$0];
          yy[this.$] = 'complex';
        } else if (yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " - C(" + $$[$0] + ",0)";
          yy[this.$] = 'complex';
        } else {
          this.$ = $$[$0-2] + " - " + $$[$0];
          yy[this.$] = 'complex';
        }
      
break;
case 13:
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($$[$0-2]);
          rhs = yy.eval($$[$0]);
        }
        if (lhs == 0 || rhs == 0) {
            this.$ = "0.0";
            yy[this.$] = 'real';
        }
        else if (lhs == 1) this.$ = $$[$0];
        else if (rhs == 1) this.$ = $$[$0-2];
        else if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " * " + $$[$0];
          if (yy.eval) this.$ = yy.eval(this.$, true);
          yy[this.$] = 'real';
        } else if (yy[$$[$0-2]] == 'real') {
          this.$ = "mul(C(" + $$[$0-2] + ",0)," + $$[$0] + ")";
          yy[this.$] = 'complex';
        } else if (yy[$$[$0]] == 'real') {
          this.$ = "mul(" + $$[$0-2] + ",C(" + $$[$0] + ",0))";
          yy[this.$] = 'complex';
        } else {
          this.$ = "mul(" + $$[$0-2] + "," + $$[$0] + ")";
          yy[this.$] = 'complex';
        }
      
break;
case 14:
        var lhs, rhs;
        if (yy.eval) {
          lhs = yy.eval($$[$0-2]);
          rhs = yy.eval($$[$0]);
        }
        if (lhs == 0 || rhs == 0) {
            this.$ = "0.0";
            yy[this.$] = 'real';
        }
        else if (rhs == 1) this.$ = $$[$0-2];
        else if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " / " + $$[$0];
          if (yy.eval) this.$ = yy.eval(this.$, true);
          yy[this.$] = 'real';
        } else if (yy[$$[$0-2]] == 'real') {
          if (yy.eval && yy.eval($$[$0-2]) == 1)
            this.$ = "inv(" + $$[$0] + ")";
          else
            this.$ = "div(C(" + $$[$0-2] + ",0), " + $$[$0] + ")";
            //this.$ = $$[$0-2] + " * inv(" + $$[$0] + ")";
          yy[this.$] = 'complex';
        } else if (yy[$$[$0]] == 'real') {
          if (yy.eval && yy.eval($$[$0]) == 1)
            this.$ = $$[$0-2];
          else
            this.$ = "div(" + $$[$0-2] + ",(C(, " + $$[$0] + ",0))";
            //this.$ = $$[$0-2] + " / " + $$[$0];
          yy[this.$] = 'complex';
        } else {
          this.$ = "div(" + $$[$0-2] + "," + $$[$0] + ")";
          yy[this.$] = 'complex';
        }
      
break;
case 15:
        var power;
        if (yy.eval) power = yy.eval($$[$0]);
        if (power == 1) this.$ = $$[$0-2];
        else if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = "pow(" + $$[$0-2] + ", " + $$[$0] + ")";
          if (yy.eval) this.$ = yy.eval(this.$, true);
          else if (power == 0)
            this.$ = "1.0";
          else if (power == 2)
            this.$ = "(" + $$[$0-2] + "*" + $$[$0-2] + ")";
          else if (power == 3)
            this.$ = "(" + $$[$0-2] + "*" + $$[$0-2] + "*" + $$[$0-2] + ")";
          else
            this.$ = "pow(" + $$[$0-2] + "," + $$[$0] + ")";
          yy[this.$] = 'real';
        } else {
          if (power == 0)
            this.$ = "C(1,0)";
          else if (power == 2)
            this.$ = "sqr(" + $$[$0-2] + ")";
          else if (power == 3)
            this.$ = "cube(" + $$[$0-2] + ")";
          else {
            if (yy[$$[$0-2]] == 'real')
              $$[$0-2] = "C(" + $$[$0-2] + ",0)";
            if (yy[$$[$0]] == 'real')
              $$[$0] = "C(" + $$[$0] + ",0)";
            this.$ = "cpow(" + $$[$0-2] + "," + $$[$0] + ")"
          }
          yy[this.$] = 'complex';
        }
      
break;
case 16:this.$ = $$[$0-2] + " == " + $$[$0];
break;
case 17:this.$ = $$[$0-2] + " != " + $$[$0];
break;
case 18:this.$ = "R(" + $$[$0-2] + ") <= R(" + $$[$0] + ")";
break;
case 19:this.$ = "R(" + $$[$0-2] + ") >= R(" + $$[$0] + ")";
break;
case 20:this.$ = "R(" + $$[$0-2] + ") < R(" + $$[$0] + ")";
break;
case 21:this.$ = "R(" + $$[$0-2] + ") > R(" + $$[$0] + ")";
break;
case 22:
        this.$ = "R(" + $$[$0] + ")";
        yy[this.$] = 'real';
      
break;
case 23:
        this.$ = "!" + $$[$0];
        yy[this.$] = yy[$$[$0]];
      
break;
case 24:
        this.$ = "-" + $$[$0];
        yy[this.$] = yy[$$[$0]];
      
break;
case 25:
        if (yy[$$[$0-1]] == 'real')
          this.$ = "abs(" + $$[$0-1] + ")";
        else
          this.$ = "cabs(" + $$[$0-1] + ")";
        yy[this.$] = 'real';
      
break;
case 26:
        if (yy[$$[$0-1]] == 'real')
          this.$ = "(" + $$[$0-1] + "*" + $$[$0-1] + ")";
        else
          this.$ = "norm(" + $$[$0-1] + ")";
        yy[this.$] = 'real';
      
break;
case 27:yy[this.$] = 'real';
break;
case 28:this.$ = "C" + $$[$0]; yy[this.$] = 'complex';
break;
case 29:
        switch ($$[$0])
        {
          case "pi":
          case "PI":
            this.$ = "PI";
            yy[this.$] = 'real';
            break;
          case "e":
          case "E":
            this.$ = "E";
            yy[this.$] = 'real';
            break;
          default:
            //this.$ = $$[$0];
            yy[this.$] = 'complex';
        }
      
break;
}
},
table: [{3:1,4:2,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{1:[3]},{5:[1,21],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{4:33,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:34,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:35,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:36,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:37,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{5:[2,27],19:[2,27],20:[2,27],21:[2,27],22:[2,27],23:[2,27],24:[2,27],25:[2,27],26:[2,27],27:[2,27],28:[2,27],29:[2,27],32:[2,27],33:[2,27],8:[2,27]},{5:[2,28],19:[2,28],20:[2,28],21:[2,28],22:[2,28],23:[2,28],24:[2,28],25:[2,28],26:[2,28],27:[2,28],28:[2,28],29:[2,28],32:[2,28],33:[2,28],8:[2,28]},{6:38,7:[1,14],5:[2,29],19:[2,29],20:[2,29],21:[2,29],22:[2,29],23:[2,29],24:[2,29],25:[2,29],26:[2,29],27:[2,29],28:[2,29],29:[2,29],32:[2,29],33:[2,29],8:[2,29]},{5:[2,30],19:[2,30],20:[2,30],21:[2,30],22:[2,30],23:[2,30],24:[2,30],25:[2,30],26:[2,30],27:[2,30],28:[2,30],29:[2,30],32:[2,30],33:[2,30],8:[2,30]},{5:[2,31],19:[2,31],20:[2,31],21:[2,31],22:[2,31],23:[2,31],24:[2,31],25:[2,31],26:[2,31],27:[2,31],28:[2,31],29:[2,31],32:[2,31],33:[2,31],8:[2,31]},{29:[2,7],28:[2,7],27:[2,7],26:[2,7],25:[2,7],24:[2,7],23:[2,7],22:[2,7],21:[2,7],20:[2,7],19:[2,7],5:[2,7],8:[2,7],33:[2,7],32:[2,7]},{4:39,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{6:40,7:[1,14]},{6:41,7:[1,14]},{5:[2,3],19:[2,3],20:[2,3],21:[2,3],22:[2,3],23:[2,3],24:[2,3],25:[2,3],26:[2,3],27:[2,3],28:[2,3],29:[2,3],32:[2,3],33:[2,3],8:[2,3]},{5:[2,4],19:[2,4],20:[2,4],21:[2,4],22:[2,4],23:[2,4],24:[2,4],25:[2,4],26:[2,4],27:[2,4],28:[2,4],29:[2,4],32:[2,4],33:[2,4],8:[2,4]},{5:[2,5],19:[2,5],20:[2,5],21:[2,5],22:[2,5],23:[2,5],24:[2,5],25:[2,5],26:[2,5],27:[2,5],28:[2,5],29:[2,5],32:[2,5],33:[2,5],8:[2,5]},{5:[2,6],19:[2,6],20:[2,6],21:[2,6],22:[2,6],23:[2,6],24:[2,6],25:[2,6],26:[2,6],27:[2,6],28:[2,6],29:[2,6],32:[2,6],33:[2,6],8:[2,6]},{1:[2,1]},{4:42,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:43,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:44,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:45,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:46,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:47,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:48,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:49,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:50,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:51,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:52,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],14:8,34:[1,9],16:[1,10],6:11,15:12,9:13,7:[1,14],17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{19:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22],27:[2,22],28:[2,22],29:[2,22],5:[2,22],32:[2,22],33:[2,22],8:[2,22]},{19:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[2,23],24:[2,23],25:[2,23],26:[2,23],27:[2,23],28:[2,23],29:[2,23],5:[2,23],32:[2,23],33:[2,23],8:[2,23]},{19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[2,24],24:[2,24],25:[2,24],26:[2,24],27:[2,24],28:[2,24],29:[2,24],5:[2,24],32:[2,24],33:[2,24],8:[2,24]},{32:[1,53],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{33:[1,54],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{29:[2,8],28:[2,8],27:[2,8],26:[2,8],25:[2,8],24:[2,8],23:[2,8],22:[2,8],21:[2,8],20:[2,8],19:[2,8],5:[2,8],8:[2,8],33:[2,8],32:[2,8]},{8:[1,55],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{29:[2,9],28:[2,9],27:[2,9],26:[2,9],25:[2,9],24:[2,9],23:[2,9],22:[2,9],21:[2,9],20:[2,9],19:[2,9],5:[2,9],8:[2,9],33:[2,9],32:[2,9]},{29:[2,10],28:[2,10],27:[2,10],26:[2,10],25:[2,10],24:[2,10],23:[2,10],22:[2,10],21:[2,10],20:[2,10],19:[2,10],5:[2,10],8:[2,10],33:[2,10],32:[2,10]},{19:[2,11],20:[2,11],21:[1,24],22:[1,25],23:[1,26],24:[2,11],25:[2,11],26:[2,11],27:[2,11],28:[2,11],29:[2,11],5:[2,11],32:[2,11],33:[2,11],8:[2,11]},{19:[2,12],20:[2,12],21:[1,24],22:[1,25],23:[1,26],24:[2,12],25:[2,12],26:[2,12],27:[2,12],28:[2,12],29:[2,12],5:[2,12],32:[2,12],33:[2,12],8:[2,12]},{19:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[1,26],24:[2,13],25:[2,13],26:[2,13],27:[2,13],28:[2,13],29:[2,13],5:[2,13],32:[2,13],33:[2,13],8:[2,13]},{19:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[1,26],24:[2,14],25:[2,14],26:[2,14],27:[2,14],28:[2,14],29:[2,14],5:[2,14],32:[2,14],33:[2,14],8:[2,14]},{19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15],24:[2,15],25:[2,15],26:[2,15],27:[2,15],28:[2,15],29:[2,15],5:[2,15],32:[2,15],33:[2,15],8:[2,15]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,16],25:[2,16],26:[2,16],27:[2,16],28:[2,16],29:[2,16],5:[2,16],32:[2,16],33:[2,16],8:[2,16]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,17],25:[2,17],26:[2,17],27:[2,17],28:[2,17],29:[2,17],5:[2,17],32:[2,17],33:[2,17],8:[2,17]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,18],25:[2,18],26:[2,18],27:[2,18],28:[2,18],29:[2,18],5:[2,18],32:[2,18],33:[2,18],8:[2,18]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,19],25:[2,19],26:[2,19],27:[2,19],28:[2,19],29:[2,19],5:[2,19],32:[2,19],33:[2,19],8:[2,19]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,20],25:[2,20],26:[2,20],27:[2,20],28:[2,20],29:[2,20],5:[2,20],32:[2,20],33:[2,20],8:[2,20]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,21],25:[2,21],26:[2,21],27:[2,21],28:[2,21],29:[2,21],5:[2,21],32:[2,21],33:[2,21],8:[2,21]},{5:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25],27:[2,25],28:[2,25],29:[2,25],32:[2,25],33:[2,25],8:[2,25]},{5:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[2,26],23:[2,26],24:[2,26],25:[2,26],26:[2,26],27:[2,26],28:[2,26],29:[2,26],32:[2,26],33:[2,26],8:[2,26]},{29:[2,2],28:[2,2],27:[2,2],26:[2,2],25:[2,2],24:[2,2],23:[2,2],22:[2,2],21:[2,2],20:[2,2],19:[2,2],5:[2,2],8:[2,2],33:[2,2],32:[2,2]}],
defaultActions: {21:[2,1]},
parseError: function parseError(str,hash){if(hash.recoverable){this.trace(str)}else{throw new Error(str)}},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.0 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str,hash){if(this.yy.parser){this.yy.parser.parseError(str,hash)}else{throw new Error(str)}},

// resets the lexer, sets new input
setInput:function (input){this._input=input;this._more=this._backtrack=this.done=false;this.yylineno=this.yyleng=0;this.yytext=this.matched=this.match="";this.conditionStack=["INITIAL"];this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0};if(this.options.ranges){this.yylloc.range=[0,0]}this.offset=0;return this},

// consumes and returns one char from the input
input:function (){var ch=this._input[0];this.yytext+=ch;this.yyleng++;this.offset++;this.match+=ch;this.matched+=ch;var lines=ch.match(/(?:\r\n?|\n).*/g);if(lines){this.yylineno++;this.yylloc.last_line++}else{this.yylloc.last_column++}if(this.options.ranges){this.yylloc.range[1]++}this._input=this._input.slice(1);return ch},

// unshifts one char (or a string) into the input
unput:function (ch){var len=ch.length;var lines=ch.split(/(?:\r\n?|\n)/g);this._input=ch+this._input;this.yytext=this.yytext.substr(0,this.yytext.length-len-1);this.offset-=len;var oldLines=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1);this.matched=this.matched.substr(0,this.matched.length-1);if(lines.length-1){this.yylineno-=lines.length-1}var r=this.yylloc.range;this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:lines?(lines.length===oldLines.length?this.yylloc.first_column:0)+oldLines[oldLines.length-lines.length].length-lines[0].length:this.yylloc.first_column-len};if(this.options.ranges){this.yylloc.range=[r[0],r[0]+this.yyleng-len]
}this.yyleng=this.yytext.length;return this},

// When called from action, caches matched text and appends it on next action
more:function (){this._more=true;return this},

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function (){if(this.options.backtrack_lexer){this._backtrack=true}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})}return this},

// retain first n characters of the match
less:function (n){this.unput(this.match.slice(n))},

// displays already matched input, i.e. for error messages
pastInput:function (){var past=this.matched.substr(0,this.matched.length-this.match.length);return(past.length>20?"...":"")+past.substr(-20).replace(/\n/g,"")},

// displays upcoming input, i.e. for error messages
upcomingInput:function (){var next=this.match;if(next.length<20){next+=this._input.substr(0,20-next.length)}return(next.substr(0,20)+(next.length>20?"...":"")).replace(/\n/g,"")},

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function (){var pre=this.pastInput();var c=new Array(pre.length+1).join("-");return pre+this.upcomingInput()+"\n"+c+"^"},

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match,indexed_rule){var token,lines,backup;if(this.options.backtrack_lexer){backup={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done};if(this.options.ranges){backup.yylloc.range=this.yylloc.range.slice(0)}}lines=match[0].match(/(?:\r\n?|\n).*/g);if(lines){this.yylineno+=lines.length}this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:lines?lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+match[0].length};this.yytext+=match[0];this.match+=match[0];this.matches=match;this.yyleng=this.yytext.length;if(this.options.ranges){this.yylloc.range=[this.offset,this.offset+=this.yyleng]}this._more=false;this._backtrack=false;this._input=this._input.slice(match[0].length);this.matched+=match[0];token=this.performAction.call(this,this.yy,this,indexed_rule,this.conditionStack[this.conditionStack.length-1]);if(this.done&&this._input){this.done=false}if(token){if(this.options.backtrack_lexer){delete backup}return token}else if(this._backtrack){for(var k in backup){this[k]=backup[k]}return false}if(this.options.backtrack_lexer){delete backup}return false},

// return next match in input
next:function (){if(this.done){return this.EOF}if(!this._input){this.done=true}var token,match,tempMatch,index;if(!this._more){this.yytext="";this.match=""}var rules=this._currentRules();for(var i=0;i<rules.length;i++){tempMatch=this._input.match(this.rules[rules[i]]);if(tempMatch&&(!match||tempMatch[0].length>match[0].length)){match=tempMatch;index=i;if(this.options.backtrack_lexer){token=this.test_match(tempMatch,rules[i]);if(token!==false){return token}else if(this._backtrack){match=false;continue}else{return false}}else if(!this.options.flex){break}}}if(match){token=this.test_match(match,rules[index]);if(token!==false){return token}return false}if(this._input===""){return this.EOF}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})}},

// return next match that has a token
lex:function lex(){var r=this.next();if(r){return r}else{return this.lex()}},

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition){this.conditionStack.push(condition)},

// pop the previously active lexer condition state off the condition stack
popState:function popState(){var n=this.conditionStack.length-1;if(n>0){return this.conditionStack.pop()}else{return this.conditionStack[0]}},

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules}else{return this.conditions["INITIAL"].rules}},

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n){n=this.conditionStack.length-1-Math.abs(n||0);if(n>=0){return this.conditionStack[n]}else{return"INITIAL"}},

// alias for begin(condition)
pushState:function pushState(condition){this.begin(condition)},

// return the number of states currently on the stack
stateStackSize:function stateStackSize(){return this.conditionStack.length},
options: {},
performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 34
break;
case 2:return 11
break;
case 3:return 10
break;
case 4:return 21
break;
case 5:return 22
break;
case 6:return 20
break;
case 7:return 19
break;
case 8:return 23
break;
case 9:return 7
break;
case 10:return 8
break;
case 11:return 30
break;
case 12:return 33
break;
case 13:return 32
break;
case 14:return ','
break;
case 15:return 24
break;
case 16:return 25
break;
case 17:return 26
break;
case 18:return 26
break;
case 19:return 27
break;
case 20:return 27
break;
case 21:return 28
break;
case 22:return 29
break;
case 23:return 31
break;
case 24:return 5
break;
case 25:return 12
break;
case 26:return 13
break;
case 27:return 18
break;
case 28:return 17;
break;
case 29:return 16;
break;
case 30:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:\(-?[0-9]+(\.[0-9]+)?\b,-?[0-9]+(\.[0-9]+)?\b\))/,/^(?:[0-9]+(\.[0-9]+)\b)/,/^(?:[0-9]+)/,/^(?:\*)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:\^)/,/^(?:\()/,/^(?:\))/,/^(?:#)/,/^(?:\|\|)/,/^(?:\|)/,/^(?:,)/,/^(?:==)/,/^(?:!=)/,/^(?:<=)/,/^(?:=<)/,/^(?:>=)/,/^(?:=>)/,/^(?:<)/,/^(?:>)/,/^(?:!)/,/^(?:$)/,/^(?:E\b)/,/^(?:PI\b)/,/^(?:manhattan|norm|cabs|arg|imag|dot|real|log\b)/,/^(?:pow|exp|asinh|acosh|atanh|asin|acos|atan|sinh|cosh|tanh|sin|cos|tan|sqrt|ln|log10\b)/,/^(?:[@:]*[_a-zA-Z][_a-zA-Z0-9]*(\.[w-z])?)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args){if(!args[1]){console.log("Usage: "+args[0]+" FILE");process.exit(1)}var source=require("fs").readFileSync(require("path").normalize(args[1]),"utf8");return exports.parser.parse(source)};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}