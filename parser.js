/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() {
},
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"+":6,"-":7,"*":8,"/":9,"^":10,"==":11,"!=":12,"<=":13,">=":14,"<":15,">":16,"!":17,"|":18,"$":19,"p":20,"const":21,"IDENTIFIER":22,"(":23,",":24,")":25,"call":26,"INTEGER":27,"REAL":28,"E":29,"PI":30,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:"+",7:"-",8:"*",9:"/",10:"^",11:"==",12:"!=",13:"<=",14:">=",15:"<",16:">",17:"!",18:"|",19:"$",22:"IDENTIFIER",23:"(",24:",",25:")",27:"INTEGER",28:"REAL",29:"E",30:"PI"},
productions_: [0,[3,2],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,2],[4,3],[4,3],[4,2],[4,2],[4,3],[4,3],[4,2],[4,1],[4,5],[4,1],[4,1],[4,1],[20,3],[21,1],[21,1],[21,1],[21,1],[26,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
    var $0 = $$.length - 1;
    switch (yystate) {
      case 1:
        return $$[$0 - 1];
        break;
      case 2:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            this.$ = a + b + ((a + b) % 1 === 0 ? ".0" : "");
        } else {
            this.$ = "add(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 3:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            this.$ = a - b + ((a - b) % 1 === 0 ? ".0" : "");
        } else {
            this.$ = "sub(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 4:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            this.$ = a * b + (a * b % 1 === 0 ? ".0" : "");
        } else {
            this.$ = "mul(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 5:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            this.$ = a / b + (a / b % 1 === 0 ? ".0" : "");
        } else {
            this.$ = "div(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 6:
        if ($$[$0] == 0) {
            this.$ = "1.0";
        } else if ($$[$0] == 1) {
            this.$ = $$[$0 - 2];
        } else if ($$[$0] == 2) {
            this.$ = "sqr(" + $$[$0 - 2] + ")";
        } else if ($$[$0] == 3) {
            this.$ = "cube(" + $$[$0 - 2] + ")";
        } else {
            this.$ = "cpow(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 7:
        this.$ = $$[$0 - 2] + " == " + $$[$0];
        break;
      case 8:
        this.$ = $$[$0 - 2] + " != " + $$[$0];
        break;
      case 9:
        this.$ = $$[$0 - 2] + " <= " + $$[$0];
        break;
      case 10:
        this.$ = $$[$0 - 2] + " >= " + $$[$0];
        break;
      case 11:
        this.$ = $$[$0 - 2] + " < " + $$[$0];
        break;
      case 12:
        this.$ = $$[$0 - 2] + " > " + $$[$0];
        break;
      case 13:
        this.$ = "!" + $$[$0];
        break;
      case 14:
        this.$ = "-" + $$[$0];
        break;
      case 15:
        this.$ = "cabs(" + $$[$0 - 1] + ")";
        break;
      case 16:
        this.$ = "norm(" + $$[$0 - 1] + ")";
        break;
      case 17:
        this.$ = "mul(" + $$[$0 - 1] + "," + $$[$0] + ")";
        break;
      case 18:
        this.$ = "mul(" + $$[$0 - 1] + "," + $$[$0] + ")";
        break;
      case 19:
        this.$ = "mul(mul(" + $$[$0 - 2] + "," + $$[$0 - 1] + ")" + "," + $$[$0] + ")";
        break;
      case 20:
        this.$ = "mul(mul(" + $$[$0 - 2] + "," + $$[$0 - 1] + ")" + "," + $$[$0] + ")";
        break;
      case 21:
        this.$ = "mul(" + $$[$0 - 1] + "," + $$[$0] + ")";
        break;
      case 23:
        this.$ = "complex(" + $$[$0 - 3] + "," + $$[$0 - 1] + ")";
        break;
      case 27:
        this.$ = "(" + $$[$0 - 1] + ")";
        break;
      case 28:
        this.$ = $$[$0] + ".0";
        break;
      case 32:
        this.$ = $$[$0 - 1] + $$[$0];
        break;
      default:;
    }
},
table: [{3:1,4:2,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{1:[3]},{5:[1,16],6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[1,22],12:[1,23],13:[1,24],14:[1,25],15:[1,26],16:[1,27]},{4:28,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:29,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:30,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:31,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{20:32,22:[1,33],23:[1,34],5:[2,25],6:[2,25],7:[2,25],8:[2,25],9:[2,25],10:[2,25],11:[2,25],12:[2,25],13:[2,25],14:[2,25],15:[2,25],16:[2,25],18:[2,25],19:[2,25],25:[2,25],24:[2,25]},{20:35,22:[1,36],23:[1,34],5:[2,22],6:[2,22],7:[2,22],8:[2,22],9:[2,22],10:[2,22],11:[2,22],12:[2,22],13:[2,22],14:[2,22],15:[2,22],16:[2,22],18:[2,22],19:[2,22],25:[2,22],24:[2,22]},{4:37,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{20:38,23:[1,34],5:[2,24],6:[2,24],7:[2,24],8:[2,24],9:[2,24],10:[2,24],11:[2,24],12:[2,24],13:[2,24],14:[2,24],15:[2,24],16:[2,24],18:[2,24],19:[2,24],25:[2,24],24:[2,24]},{5:[2,26],6:[2,26],7:[2,26],8:[2,26],9:[2,26],10:[2,26],11:[2,26],12:[2,26],13:[2,26],14:[2,26],15:[2,26],16:[2,26],18:[2,26],19:[2,26],25:[2,26],24:[2,26]},{23:[2,28],22:[2,28],16:[2,28],15:[2,28],14:[2,28],13:[2,28],12:[2,28],11:[2,28],10:[2,28],9:[2,28],8:[2,28],7:[2,28],6:[2,28],5:[2,28],25:[2,28],24:[2,28],19:[2,28],18:[2,28]},{23:[2,29],22:[2,29],16:[2,29],15:[2,29],14:[2,29],13:[2,29],12:[2,29],11:[2,29],10:[2,29],9:[2,29],8:[2,29],7:[2,29],6:[2,29],5:[2,29],25:[2,29],24:[2,29],19:[2,29],18:[2,29]},{23:[2,30],22:[2,30],16:[2,30],15:[2,30],14:[2,30],13:[2,30],12:[2,30],11:[2,30],10:[2,30],9:[2,30],8:[2,30],7:[2,30],6:[2,30],5:[2,30],25:[2,30],24:[2,30],19:[2,30],18:[2,30]},{23:[2,31],22:[2,31],16:[2,31],15:[2,31],14:[2,31],13:[2,31],12:[2,31],11:[2,31],10:[2,31],9:[2,31],8:[2,31],7:[2,31],6:[2,31],5:[2,31],25:[2,31],24:[2,31],19:[2,31],18:[2,31]},{1:[2,1]},{4:39,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:40,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:41,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:42,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:43,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:44,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:45,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:46,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:47,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:48,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{4:49,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[2,13],5:[2,13],18:[2,13],19:[2,13],25:[2,13],24:[2,13]},{6:[2,14],7:[2,14],8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],14:[2,14],15:[2,14],16:[2,14],5:[2,14],18:[2,14],19:[2,14],25:[2,14],24:[2,14]},{18:[1,50],6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[1,22],12:[1,23],13:[1,24],14:[1,25],15:[1,26],16:[1,27]},{19:[1,51],6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[1,22],12:[1,23],13:[1,24],14:[1,25],15:[1,26],16:[1,27]},{5:[2,17],6:[2,17],7:[2,17],8:[2,17],9:[2,17],10:[2,17],11:[2,17],12:[2,17],13:[2,17],14:[2,17],15:[2,17],16:[2,17],18:[2,17],19:[2,17],25:[2,17],24:[2,17]},{5:[2,21],6:[2,21],7:[2,21],8:[2,21],9:[2,21],10:[2,21],11:[2,21],12:[2,21],13:[2,21],14:[2,21],15:[2,21],16:[2,21],18:[2,21],19:[2,21],25:[2,21],24:[2,21]},{4:52,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{22:[1,53],5:[2,18],6:[2,18],7:[2,18],8:[2,18],9:[2,18],10:[2,18],11:[2,18],12:[2,18],13:[2,18],14:[2,18],15:[2,18],16:[2,18],18:[2,18],19:[2,18],25:[2,18],24:[2,18]},{20:54,23:[1,34]},{24:[1,55],25:[1,56],6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[1,22],12:[1,23],13:[1,24],14:[1,25],15:[1,26],16:[1,27]},{16:[2,32],15:[2,32],14:[2,32],13:[2,32],12:[2,32],11:[2,32],10:[2,32],9:[2,32],8:[2,32],7:[2,32],6:[2,32],5:[2,32],25:[2,32],24:[2,32],19:[2,32],18:[2,32]},{6:[2,2],7:[2,2],8:[1,19],9:[1,20],10:[1,21],11:[2,2],12:[2,2],13:[2,2],14:[2,2],15:[2,2],16:[2,2],5:[2,2],18:[2,2],19:[2,2],25:[2,2],24:[2,2]},{6:[2,3],7:[2,3],8:[1,19],9:[1,20],10:[1,21],11:[2,3],12:[2,3],13:[2,3],14:[2,3],15:[2,3],16:[2,3],5:[2,3],18:[2,3],19:[2,3],25:[2,3],24:[2,3]},{6:[2,4],7:[2,4],8:[2,4],9:[2,4],10:[1,21],11:[2,4],12:[2,4],13:[2,4],14:[2,4],15:[2,4],16:[2,4],5:[2,4],18:[2,4],19:[2,4],25:[2,4],24:[2,4]},{6:[2,5],7:[2,5],8:[2,5],9:[2,5],10:[1,21],11:[2,5],12:[2,5],13:[2,5],14:[2,5],15:[2,5],16:[2,5],5:[2,5],18:[2,5],19:[2,5],25:[2,5],24:[2,5]},{6:[2,6],7:[2,6],8:[2,6],9:[2,6],10:[2,6],11:[2,6],12:[2,6],13:[2,6],14:[2,6],15:[2,6],16:[2,6],5:[2,6],18:[2,6],19:[2,6],25:[2,6],24:[2,6]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,7],12:[2,7],13:[2,7],14:[2,7],15:[2,7],16:[2,7],5:[2,7],18:[2,7],19:[2,7],25:[2,7],24:[2,7]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],5:[2,8],18:[2,8],19:[2,8],25:[2,8],24:[2,8]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],5:[2,9],18:[2,9],19:[2,9],25:[2,9],24:[2,9]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,10],12:[2,10],13:[2,10],14:[2,10],15:[2,10],16:[2,10],5:[2,10],18:[2,10],19:[2,10],25:[2,10],24:[2,10]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,11],12:[2,11],13:[2,11],14:[2,11],15:[2,11],16:[2,11],5:[2,11],18:[2,11],19:[2,11],25:[2,11],24:[2,11]},{6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[2,12],5:[2,12],18:[2,12],19:[2,12],25:[2,12],24:[2,12]},{5:[2,15],6:[2,15],7:[2,15],8:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],14:[2,15],15:[2,15],16:[2,15],18:[2,15],19:[2,15],25:[2,15],24:[2,15]},{5:[2,16],6:[2,16],7:[2,16],8:[2,16],9:[2,16],10:[2,16],11:[2,16],12:[2,16],13:[2,16],14:[2,16],15:[2,16],16:[2,16],18:[2,16],19:[2,16],25:[2,16],24:[2,16]},{25:[1,56],6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[1,22],12:[1,23],13:[1,24],14:[1,25],15:[1,26],16:[1,27]},{5:[2,19],6:[2,19],7:[2,19],8:[2,19],9:[2,19],10:[2,19],11:[2,19],12:[2,19],13:[2,19],14:[2,19],15:[2,19],16:[2,19],18:[2,19],19:[2,19],25:[2,19],24:[2,19]},{5:[2,20],6:[2,20],7:[2,20],8:[2,20],9:[2,20],10:[2,20],11:[2,20],12:[2,20],13:[2,20],14:[2,20],15:[2,20],16:[2,20],18:[2,20],19:[2,20],25:[2,20],24:[2,20]},{4:57,17:[1,3],7:[1,4],18:[1,5],19:[1,6],20:7,21:8,23:[1,9],22:[1,10],26:11,27:[1,12],28:[1,13],29:[1,14],30:[1,15]},{23:[2,27],22:[2,27],16:[2,27],15:[2,27],14:[2,27],13:[2,27],12:[2,27],11:[2,27],10:[2,27],9:[2,27],8:[2,27],7:[2,27],6:[2,27],5:[2,27],25:[2,27],24:[2,27],19:[2,27],18:[2,27]},{25:[1,58],6:[1,17],7:[1,18],8:[1,19],9:[1,20],10:[1,21],11:[1,22],12:[1,23],13:[1,24],14:[1,25],15:[1,26],16:[1,27]},{5:[2,23],6:[2,23],7:[2,23],8:[2,23],9:[2,23],10:[2,23],11:[2,23],12:[2,23],13:[2,23],14:[2,23],15:[2,23],16:[2,23],18:[2,23],19:[2,23],25:[2,23],24:[2,23]}],
defaultActions: {16:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined") {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function") {
        this.parseError = this.yy.parseError;
    }

    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }


    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
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
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
    _handle_error:
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || "Parsing halted.");
                }
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }
            while (1) {
                if (TERROR.toString() in table[state]) {
                    break;
                }
                if (state === 0) {
                    throw new Error(errStr || "Parsing halted.");
                }
                popStack(1);
                state = stack[stack.length - 1];
            }
            preErrorSymbol = symbol == 2 ? null : symbol;
            symbol = TERROR;
            state = stack[stack.length - 1];
            action = table[state] && table[state][TERROR];
            recovering = 3;
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
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
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, - 1 * len * 2);
                vstack = vstack.slice(0, - 1 * len);
                lstack = lstack.slice(0, - 1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
          case 3:
            return true;
          default:;
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
    this.yytext = this.matched = this.match = "";
    this.conditionStack = ["INITIAL"];
    this.yylloc = {first_line: 1, first_column: 0, last_line: 1, last_column: 0};
    if (this.options.ranges) {
        this.yylloc.range = [0, 0];
    }
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
    if (this.options.ranges) {
        this.yylloc.range[1]++;
    }
    this._input = this._input.slice(1);
    return ch;
},
unput:function (ch) {
    var len = ch.length;
    var lines = ch.split(/(?:\r\n?|\n)/g);
    this._input = ch + this._input;
    this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
    this.offset -= len;
    var oldLines = this.match.split(/(?:\r\n?|\n)/g);
    this.match = this.match.substr(0, this.match.length - 1);
    this.matched = this.matched.substr(0, this.matched.length - 1);
    if (lines.length - 1) {
        this.yylineno -= lines.length - 1;
    }
    var r = this.yylloc.range;
    this.yylloc = {first_line: this.yylloc.first_line, last_line: this.yylineno + 1, first_column: this.yylloc.first_column, last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len};
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
    return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
},
upcomingInput:function () {
    var next = this.match;
    if (next.length < 20) {
        next += this._input.substr(0, 20 - next.length);
    }
    return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
},
showPosition:function () {
    var pre = this.pastInput();
    var c = (new Array(pre.length + 1)).join("-");
    return pre + this.upcomingInput() + "\n" + c + "^";
},
next:function () {
    if (this.done) {
        return this.EOF;
    }
    if (!this._input) {
        this.done = true;
    }
    var token, match, tempMatch, index, col, lines;
    if (!this._more) {
        this.yytext = "";
        this.match = "";
    }
    var rules = this._currentRules();
    for (var i = 0; i < rules.length; i++) {
        tempMatch = this._input.match(this.rules[rules[i]]);
        if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
            match = tempMatch;
            index = i;
            if (!this.options.flex) {
                break;
            }
        }
    }
    if (match) {
        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {first_line: this.yylloc.last_line, last_line: this.yylineno + 1, first_column: this.yylloc.last_column, last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
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
        token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else {
            return;
        }
    }
    if (this._input === "") {
        return this.EOF;
    } else {
        return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {text: "", token: null, line: this.yylineno});
    }
},
lex:function lex() {
    var r = this.next();
    if (typeof r !== "undefined") {
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
    return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
},
topState:function () {
    return this.conditionStack[this.conditionStack.length - 2];
},
pushState:function begin(condition) {
    this.begin(condition);
}});
lexer.options = {};
lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
    var YYSTATE = YY_START;
    switch ($avoiding_name_collisions) {
      case 0:
        break;
      case 1:
        return 28;
        break;
      case 2:
        return 27;
        break;
      case 3:
        return 8;
        break;
      case 4:
        return 9;
        break;
      case 5:
        return 7;
        break;
      case 6:
        return 6;
        break;
      case 7:
        return 10;
        break;
      case 8:
        return 23;
        break;
      case 9:
        return 25;
        break;
      case 10:
        return 19;
        break;
      case 11:
        return 18;
        break;
      case 12:
        return 24;
        break;
      case 13:
        return 11;
        break;
      case 14:
        return 12;
        break;
      case 15:
        return 13;
        break;
      case 16:
        return 13;
        break;
      case 17:
        return 14;
        break;
      case 18:
        return 14;
        break;
      case 19:
        return 15;
        break;
      case 20:
        return 16;
        break;
      case 21:
        return 17;
        break;
      case 22:
        return 30;
        break;
      case 23:
        return 29;
        break;
      case 24:
        return 5;
        break;
      case 25:
        return 22;
        break;
      case 26:
        return "INVALID";
        break;
      default:;
    }
};
lexer.rules = [/^(?:\s+)/,/^(?:[0-9]+(\.[0-9]+)\b)/,/^(?:[0-9]+)/,/^(?:\*)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:\^)/,/^(?:\()/,/^(?:\))/,/^(?:\|\|)/,/^(?:\|)/,/^(?:,)/,/^(?:==)/,/^(?:!=)/,/^(?:<=)/,/^(?:=<)/,/^(?:>=)/,/^(?:=>)/,/^(?:<)/,/^(?:>)/,/^(?:!)/,/^(?:pi\b)/,/^(?:e\b)/,/^(?:$)/,/^(?:[@:]*[_a-zA-Z][_a-zA-Z0-9]*(\.[w-z])?)/,/^(?:.)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],"inclusive":true}};
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
    if (!args[1]) {
        throw new Error("Usage: " + args[0] + " FILE");
    }
    var source, cwd;
    if (typeof process !== "undefined") {
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