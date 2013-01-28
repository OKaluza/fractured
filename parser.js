/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"p":6,"(":7,")":8,"real":9,"INTEGER":10,"REAL":11,"E":12,"PI":13,"const":14,"call":15,"IDENTIFIER":16,"COMPLEXFN":17,"REALFN":18,"+":19,"-":20,"*":21,"/":22,"^":23,"==":24,"!=":25,"<=":26,">=":27,"<":28,">":29,"#":30,"!":31,"|":32,"$":33,"COMPLEX":34,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"(",8:")",10:"INTEGER",11:"REAL",12:"E",13:"PI",16:"IDENTIFIER",17:"COMPLEXFN",18:"REALFN",19:"+",20:"-",21:"*",22:"/",23:"^",24:"==",25:"!=",26:"<=",27:">=",28:"<",29:">",30:"#",31:"!",32:"|",33:"$",34:"COMPLEX"},
productions_: [0,[3,2],[6,3],[9,1],[9,1],[9,1],[9,1],[14,1],[15,2],[15,2],[15,2],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,2],[4,2],[4,3],[4,3],[4,2],[4,1],[4,1],[4,1],[4,1],[4,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return $$[$0-1];
break;
case 2:
        this.$ = "(" + $$[$0-1] + ")" 
        yy[this.$] = yy[$$[$0-1]];
      
break;
case 3:this.$ = $$[$0] + ".0";
break;
case 7:
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
        this.$ = $$[$0-1] + $$[$0];
        yy[this.$] = 'real';
      
break;
case 11:
        if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " + " + $$[$0];
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
        //alert(yy[this.$] + " : " + yy[$$[$0-2]] + " + " + yy[$$[$0]]);
      
break;
case 12:
        if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " - " + $$[$0];
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
        //alert(yy[$$[$0-2]] + " * " + yy[$$[$0]]);
        if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " * " + $$[$0];
          yy[this.$] = 'real';
        } else if (yy[$$[$0-2]] == 'real' || yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " * " + $$[$0];
          yy[this.$] = 'complex';
        } else {
          this.$ = "mul(" + $$[$0-2] + "," + $$[$0] + ")";
          yy[this.$] = 'complex';
        }
      
break;
case 14:
        if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " / " + $$[$0];
          yy[this.$] = 'real';
        } else if (yy[$$[$0-2]] == 'real') {
          if (parseFloat($$[$0-2]) == 1.0)
            this.$ = "inv(" + $$[$0] + ")";
          else
            this.$ = $$[$0-2] + " * inv(" + $$[$0] + ")";
          yy[this.$] = 'complex';
        } else if (yy[$$[$0]] == 'real') {
          this.$ = $$[$0-2] + " / " + $$[$0];
          yy[this.$] = 'complex';
        } else {
          this.$ = "div(" + $$[$0-2] + "," + $$[$0] + ")";
          yy[this.$] = 'complex';
        }
        //alert(yy[this.$] + " : " + yy[$$[$0-2]] + " / " + yy[$$[$0]]);

      
break;
case 15:
        var power = parseFloat(yytext);
        if (yy[$$[$0-2]] == 'real' && yy[$$[$0]] == 'real') {
          if (power == 0.0)
            this.$ = "1.0";
          else if (power == 1.0)
            this.$ = $$[$0-2];
          else if (power == 2.0)
            this.$ = "(" + $$[$0-2] + "*" + $$[$0-2] + ")";
          else if (power == 3.0)
            this.$ = "(" + $$[$0-2] + "*" + $$[$0-2] + "*" + $$[$0-2] + ")";
          else
            this.$ = "pow(" + $$[$0-2] + "," + $$[$0] + ")";
          yy[this.$] = 'real';
        } else {
          if (power == 0.0)
            this.$ = "C(1,0)";
          else if (power == 1.0)
            this.$ = $$[$0-2];
          else if (power == 2.0)
            this.$ = "sqr(" + $$[$0-2] + ")";
          else if (power == 3.0)
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
case 27:
        if (yy[$$[$0-1]] == 'real' || yy[$$[$0]] == 'real') {
          this.$ = $$[$0-1] + "*" + $$[$0] + ")";
          if (yy[$$[$0-1]] == 'real' && yy[$$[$0]] == 'real')
            yy[this.$] = 'real';
          else
            yy[this.$] = 'complex';
        } else {
          this.$ = "mul(" + $$[$0-1] + "," + $$[$0] + ")";
          yy[this.$] = 'complex';
        }
      
break;
case 28:
        this.$ = $$[$0-1] + " * " + $$[$0];
        yy[this.$] = yy[$$[$0]];
      
break;
case 29:
        if (yy[$$[$0-1]] == 'real')
          this.$ = $$[$0-2] + "*" + $$[$0-1] + "*" + $$[$0];
        else
          this.$ = $$[$0-2] + " * mul(" + $$[$0-1] + "," + $$[$0] + ")";
        yy[this.$] = 'complex';
      
break;
case 30:
        if (yy[$$[$0]] == 'real')
          this.$ = $$[$0-2] + "*" + $$[$0-1] + "*" + $$[$0];
        else
          this.$ = $$[$0-2] + " * mul(" + $$[$0-1] + "," + $$[$0] + ")";
        yy[this.$] = 'complex';
      
break;
case 31:
        if (yy[$$[$0-1]] == 'real')
          this.$ = $$[$0-1] + "*" + $$[$0];
        else
          this.$ = "mul(" + $$[$0-1] + "," + $$[$0] + ")";
        yy[this.$] = 'complex';
      
break;
case 32:yy[this.$] = 'real';
break;
case 33:yy[this.$] = 'complex';
break;
case 34:
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
table: [{3:1,4:2,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{1:[3]},{5:[1,21],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{4:33,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:34,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:35,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:36,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:37,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{6:38,16:[1,39],7:[1,13],5:[2,35],19:[2,35],20:[2,35],21:[2,35],22:[2,35],23:[2,35],24:[2,35],25:[2,35],26:[2,35],27:[2,35],28:[2,35],29:[2,35],32:[2,35],33:[2,35],8:[2,35]},{6:40,16:[1,41],7:[1,13],5:[2,32],19:[2,32],20:[2,32],21:[2,32],22:[2,32],23:[2,32],24:[2,32],25:[2,32],26:[2,32],27:[2,32],28:[2,32],29:[2,32],32:[2,32],33:[2,32],8:[2,32]},{5:[2,33],19:[2,33],20:[2,33],21:[2,33],22:[2,33],23:[2,33],24:[2,33],25:[2,33],26:[2,33],27:[2,33],28:[2,33],29:[2,33],32:[2,33],33:[2,33],8:[2,33]},{6:42,7:[1,13],5:[2,34],19:[2,34],20:[2,34],21:[2,34],22:[2,34],23:[2,34],24:[2,34],25:[2,34],26:[2,34],27:[2,34],28:[2,34],29:[2,34],32:[2,34],33:[2,34],8:[2,34]},{5:[2,36],19:[2,36],20:[2,36],21:[2,36],22:[2,36],23:[2,36],24:[2,36],25:[2,36],26:[2,36],27:[2,36],28:[2,36],29:[2,36],32:[2,36],33:[2,36],8:[2,36]},{4:43,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{7:[2,7],16:[2,7],29:[2,7],28:[2,7],27:[2,7],26:[2,7],25:[2,7],24:[2,7],23:[2,7],22:[2,7],21:[2,7],20:[2,7],19:[2,7],5:[2,7],8:[2,7],33:[2,7],32:[2,7]},{6:44,7:[1,13]},{6:45,7:[1,13]},{5:[2,3],19:[2,3],20:[2,3],21:[2,3],22:[2,3],23:[2,3],24:[2,3],25:[2,3],26:[2,3],27:[2,3],28:[2,3],29:[2,3],16:[2,3],7:[2,3],32:[2,3],33:[2,3],8:[2,3]},{5:[2,4],19:[2,4],20:[2,4],21:[2,4],22:[2,4],23:[2,4],24:[2,4],25:[2,4],26:[2,4],27:[2,4],28:[2,4],29:[2,4],16:[2,4],7:[2,4],32:[2,4],33:[2,4],8:[2,4]},{5:[2,5],19:[2,5],20:[2,5],21:[2,5],22:[2,5],23:[2,5],24:[2,5],25:[2,5],26:[2,5],27:[2,5],28:[2,5],29:[2,5],16:[2,5],7:[2,5],32:[2,5],33:[2,5],8:[2,5]},{5:[2,6],19:[2,6],20:[2,6],21:[2,6],22:[2,6],23:[2,6],24:[2,6],25:[2,6],26:[2,6],27:[2,6],28:[2,6],29:[2,6],16:[2,6],7:[2,6],32:[2,6],33:[2,6],8:[2,6]},{1:[2,1]},{4:46,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:47,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:48,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:49,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:50,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:51,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:52,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:53,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:54,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:55,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{4:56,30:[1,3],31:[1,4],20:[1,5],32:[1,6],33:[1,7],6:8,14:9,34:[1,10],16:[1,11],15:12,7:[1,13],9:14,17:[1,15],18:[1,16],10:[1,17],11:[1,18],12:[1,19],13:[1,20]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,22],25:[2,22],26:[2,22],27:[2,22],28:[2,22],29:[2,22],5:[2,22],32:[2,22],33:[2,22],8:[2,22]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,23],25:[2,23],26:[2,23],27:[2,23],28:[2,23],29:[2,23],5:[2,23],32:[2,23],33:[2,23],8:[2,23]},{19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[2,24],24:[2,24],25:[2,24],26:[2,24],27:[2,24],28:[2,24],29:[2,24],5:[2,24],32:[2,24],33:[2,24],8:[2,24]},{32:[1,57],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{33:[1,58],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{5:[2,27],19:[2,27],20:[2,27],21:[2,27],22:[2,27],23:[2,27],24:[2,27],25:[2,27],26:[2,27],27:[2,27],28:[2,27],29:[2,27],32:[2,27],33:[2,27],8:[2,27]},{5:[2,31],19:[2,31],20:[2,31],21:[2,31],22:[2,31],23:[2,31],24:[2,31],25:[2,31],26:[2,31],27:[2,31],28:[2,31],29:[2,31],32:[2,31],33:[2,31],8:[2,31]},{16:[1,59],5:[2,28],19:[2,28],20:[2,28],21:[2,28],22:[2,28],23:[2,28],24:[2,28],25:[2,28],26:[2,28],27:[2,28],28:[2,28],29:[2,28],32:[2,28],33:[2,28],8:[2,28]},{6:60,7:[1,13]},{29:[2,8],28:[2,8],27:[2,8],26:[2,8],25:[2,8],24:[2,8],23:[2,8],22:[2,8],21:[2,8],20:[2,8],19:[2,8],5:[2,8],8:[2,8],33:[2,8],32:[2,8]},{8:[1,61],19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[1,27],25:[1,28],26:[1,29],27:[1,30],28:[1,31],29:[1,32]},{29:[2,9],28:[2,9],27:[2,9],26:[2,9],25:[2,9],24:[2,9],23:[2,9],22:[2,9],21:[2,9],20:[2,9],19:[2,9],5:[2,9],8:[2,9],33:[2,9],32:[2,9]},{29:[2,10],28:[2,10],27:[2,10],26:[2,10],25:[2,10],24:[2,10],23:[2,10],22:[2,10],21:[2,10],20:[2,10],19:[2,10],5:[2,10],8:[2,10],33:[2,10],32:[2,10]},{19:[2,11],20:[2,11],21:[1,24],22:[1,25],23:[1,26],24:[2,11],25:[2,11],26:[2,11],27:[2,11],28:[2,11],29:[2,11],5:[2,11],32:[2,11],33:[2,11],8:[2,11]},{19:[2,12],20:[2,12],21:[1,24],22:[1,25],23:[1,26],24:[2,12],25:[2,12],26:[2,12],27:[2,12],28:[2,12],29:[2,12],5:[2,12],32:[2,12],33:[2,12],8:[2,12]},{19:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[1,26],24:[2,13],25:[2,13],26:[2,13],27:[2,13],28:[2,13],29:[2,13],5:[2,13],32:[2,13],33:[2,13],8:[2,13]},{19:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[1,26],24:[2,14],25:[2,14],26:[2,14],27:[2,14],28:[2,14],29:[2,14],5:[2,14],32:[2,14],33:[2,14],8:[2,14]},{19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15],24:[2,15],25:[2,15],26:[2,15],27:[2,15],28:[2,15],29:[2,15],5:[2,15],32:[2,15],33:[2,15],8:[2,15]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,16],25:[2,16],26:[2,16],27:[2,16],28:[2,16],29:[2,16],5:[2,16],32:[2,16],33:[2,16],8:[2,16]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,17],25:[2,17],26:[2,17],27:[2,17],28:[2,17],29:[2,17],5:[2,17],32:[2,17],33:[2,17],8:[2,17]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,18],25:[2,18],26:[2,18],27:[2,18],28:[2,18],29:[2,18],5:[2,18],32:[2,18],33:[2,18],8:[2,18]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,19],25:[2,19],26:[2,19],27:[2,19],28:[2,19],29:[2,19],5:[2,19],32:[2,19],33:[2,19],8:[2,19]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,20],25:[2,20],26:[2,20],27:[2,20],28:[2,20],29:[2,20],5:[2,20],32:[2,20],33:[2,20],8:[2,20]},{19:[1,22],20:[1,23],21:[1,24],22:[1,25],23:[1,26],24:[2,21],25:[2,21],26:[2,21],27:[2,21],28:[2,21],29:[2,21],5:[2,21],32:[2,21],33:[2,21],8:[2,21]},{5:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25],27:[2,25],28:[2,25],29:[2,25],32:[2,25],33:[2,25],8:[2,25]},{5:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[2,26],23:[2,26],24:[2,26],25:[2,26],26:[2,26],27:[2,26],28:[2,26],29:[2,26],32:[2,26],33:[2,26],8:[2,26]},{5:[2,29],19:[2,29],20:[2,29],21:[2,29],22:[2,29],23:[2,29],24:[2,29],25:[2,29],26:[2,29],27:[2,29],28:[2,29],29:[2,29],32:[2,29],33:[2,29],8:[2,29]},{5:[2,30],19:[2,30],20:[2,30],21:[2,30],22:[2,30],23:[2,30],24:[2,30],25:[2,30],26:[2,30],27:[2,30],28:[2,30],29:[2,30],32:[2,30],33:[2,30],8:[2,30]},{7:[2,2],16:[2,2],29:[2,2],28:[2,2],27:[2,2],26:[2,2],25:[2,2],24:[2,2],23:[2,2],22:[2,2],21:[2,2],20:[2,2],19:[2,2],5:[2,2],8:[2,2],33:[2,2],32:[2,2]}],
defaultActions: {21:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    var ranges = this.lexer.options && this.lexer.options.ranges;

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        _handle_error:
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            var errStr = '';
            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + (this.terminals_[symbol] || symbol)+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state === 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol == 2 ? null : symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                if (ranges) {
                  yyval._$.range = [lstack[lstack.length-(len||1)].range[0], lstack[lstack.length-1].range[1]];
                }
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

var YYSTATE=YY_START
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
case 25:return 18
break;
case 26:return 17;
break;
case 27:return 16;
break;
case 28:return 'INVALID'
break;
}
};
lexer.rules = [/^(?:\s+)/,/^(?:\(-?[0-9]+(\.[0-9]+)?\b,-?[0-9]+(\.[0-9]+)?\b\))/,/^(?:[0-9]+(\.[0-9]+)\b)/,/^(?:[0-9]+)/,/^(?:\*)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:\^)/,/^(?:\()/,/^(?:\))/,/^(?:#)/,/^(?:\|\|)/,/^(?:\|)/,/^(?:,)/,/^(?:==)/,/^(?:!=)/,/^(?:<=)/,/^(?:=<)/,/^(?:>=)/,/^(?:=>)/,/^(?:<)/,/^(?:>)/,/^(?:!)/,/^(?:$)/,/^(?:manhattan|norm|cabs|arg|imag|dot|real\b)/,/^(?:pow|exp|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|sqrt|ln|log10\b)/,/^(?:[@:]*[_a-zA-Z][_a-zA-Z0-9]*(\.[w-z])?)/,/^(?:.)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require("fs").readFileSync(require("path").resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}