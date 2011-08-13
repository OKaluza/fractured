/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() {
},
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"+":6,"-":7,"*":8,"/":9,"^":10,"==":11,"!=":12,"<=":13,">=":14,"<":15,">":16,"!":17,"(":18,")":19,"NUMBER":20,"E":21,"PI":22,"IDENTIFIER":23,"call":24,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:"+",7:"-",8:"*",9:"/",10:"^",11:"==",12:"!=",13:"<=",14:">=",15:"<",16:">",17:"!",18:"(",19:")",20:"NUMBER",21:"E",22:"PI",23:"IDENTIFIER"},
productions_: [0,[3,2],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,2],[4,3],[4,1],[4,1],[4,1],[4,1],[4,1],[24,4]],
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
            var result = a + b + "";
            if (result.indexOf(".") < 0) {
                result += ".0";
            }
            this.$ = result;
        } else {
            this.$ = "add(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 3:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            var result = a - b + "";
            if (result.indexOf(".") < 0) {
                result += ".0";
            }
            this.$ = result;
        } else {
            this.$ = "sub(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 4:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            var result = a * b + "";
            if (result.indexOf(".") < 0) {
                result += ".0";
            }
            this.$ = result;
        } else {
            this.$ = "mul(" + $$[$0 - 2] + "," + $$[$0] + ")";
        }
        break;
      case 5:
        var a = parseFloat($$[$0 - 2]);
        var b = parseFloat($$[$0]);
        if (a && b) {
            var result = a / b + "";
            if (result.indexOf(".") < 0) {
                result += ".0";
            }
            this.$ = result;
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
        this.$ = "-" + $$[$0];
        break;
      case 14:
        this.$ = "!" + $$[$0];
        break;
      case 15:
        this.$ = $$[$0 - 1];
        break;
      case 16:
        if (yytext.indexOf(".") < 0) {
            this.$ = yytext + ".0";
        }
        break;
      case 21:
        this.$ = $$[$0 - 3] + "(" + $$[$0 - 1] + ")";
        break;
      default:;
    }
},
table: [{3:1,4:2,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{1:[3]},{5:[1,11],6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22]},{4:23,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:24,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:25,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{5:[2,16],6:[2,16],7:[2,16],8:[2,16],9:[2,16],10:[2,16],11:[2,16],12:[2,16],13:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16]},{5:[2,17],6:[2,17],7:[2,17],8:[2,17],9:[2,17],10:[2,17],11:[2,17],12:[2,17],13:[2,17],14:[2,17],15:[2,17],16:[2,17],19:[2,17]},{5:[2,18],6:[2,18],7:[2,18],8:[2,18],9:[2,18],10:[2,18],11:[2,18],12:[2,18],13:[2,18],14:[2,18],15:[2,18],16:[2,18],19:[2,18]},{18:[1,26],5:[2,19],6:[2,19],7:[2,19],8:[2,19],9:[2,19],10:[2,19],11:[2,19],12:[2,19],13:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19]},{5:[2,20],6:[2,20],7:[2,20],8:[2,20],9:[2,20],10:[2,20],11:[2,20],12:[2,20],13:[2,20],14:[2,20],15:[2,20],16:[2,20],19:[2,20]},{1:[2,1]},{4:27,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:28,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:29,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:30,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:31,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:32,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:33,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:34,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:35,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:36,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{4:37,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{6:[2,13],7:[2,13],8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[2,13],5:[2,13],19:[2,13]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22],5:[2,14],19:[2,14]},{19:[1,38],6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22]},{4:39,7:[1,3],17:[1,4],18:[1,5],20:[1,6],21:[1,7],22:[1,8],23:[1,9],24:10},{6:[2,2],7:[2,2],8:[1,14],9:[1,15],10:[1,16],11:[2,2],12:[2,2],13:[2,2],14:[2,2],15:[2,2],16:[2,2],5:[2,2],19:[2,2]},{6:[2,3],7:[2,3],8:[1,14],9:[1,15],10:[1,16],11:[2,3],12:[2,3],13:[2,3],14:[2,3],15:[2,3],16:[2,3],5:[2,3],19:[2,3]},{6:[2,4],7:[2,4],8:[2,4],9:[2,4],10:[1,16],11:[2,4],12:[2,4],13:[2,4],14:[2,4],15:[2,4],16:[2,4],5:[2,4],19:[2,4]},{6:[2,5],7:[2,5],8:[2,5],9:[2,5],10:[1,16],11:[2,5],12:[2,5],13:[2,5],14:[2,5],15:[2,5],16:[2,5],5:[2,5],19:[2,5]},{6:[2,6],7:[2,6],8:[2,6],9:[2,6],10:[2,6],11:[2,6],12:[2,6],13:[2,6],14:[2,6],15:[2,6],16:[2,6],5:[2,6],19:[2,6]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[2,7],12:[2,7],13:[2,7],14:[2,7],15:[2,7],16:[2,7],5:[2,7],19:[2,7]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],5:[2,8],19:[2,8]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],5:[2,9],19:[2,9]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[2,10],12:[2,10],13:[2,10],14:[2,10],15:[2,10],16:[2,10],5:[2,10],19:[2,10]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[2,11],12:[2,11],13:[2,11],14:[2,11],15:[2,11],16:[2,11],5:[2,11],19:[2,11]},{6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[2,12],5:[2,12],19:[2,12]},{5:[2,15],6:[2,15],7:[2,15],8:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15]},{19:[1,40],6:[1,12],7:[1,13],8:[1,14],9:[1,15],10:[1,16],11:[1,17],12:[1,18],13:[1,19],14:[1,20],15:[1,21],16:[1,22]},{16:[2,21],15:[2,21],14:[2,21],13:[2,21],12:[2,21],11:[2,21],10:[2,21],9:[2,21],8:[2,21],7:[2,21],6:[2,21],5:[2,21],19:[2,21]}],
defaultActions: {11:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == "undefined") {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
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
            if (symbol == null) {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            if (!recovering) {
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                }
                var errStr = "";
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ");
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
                if (state == 0) {
                    throw new Error(errStr || "Parsing halted.");
                }
                popStack(1);
                state = stack[stack.length - 1];
            }
            preErrorSymbol = symbol;
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
}};/* Jison generated lexer */
var lexer = (function(){var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
    if (this.yy.parseError) {
        this.yy.parseError(str, hash);
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
    return this;
},
input:function () {
    var ch = this._input[0];
    this.yytext += ch;
    this.yyleng++;
    this.match += ch;
    this.matched += ch;
    var lines = ch.match(/\n/);
    if (lines) {
        this.yylineno++;
    }
    this._input = this._input.slice(1);
    return ch;
},
unput:function (ch) {
    this._input = ch + this._input;
    return this;
},
more:function () {
    this._more = true;
    return this;
},
pastInput:function () {
    var past = this.matched.substr(0, this.matched.length - this.match.length);
    return (past.length > 20 ? "..." : "") + past.substr(- 20).replace(/\n/g, "");
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
    var token, match, col, lines;
    if (!this._more) {
        this.yytext = "";
        this.match = "";
    }
    var rules = this._currentRules();
    for (var i = 0; i < rules.length; i++) {
        match = this._input.match(this.rules[rules[i]]);
        if (match) {
            lines = match[0].match(/\n.*/g);
            if (lines) {
                this.yylineno += lines.length;
            }
            this.yylloc = {first_line: this.yylloc.last_line, last_line: this.yylineno + 1, first_column: this.yylloc.last_column, last_column: lines ? lines[lines.length - 1].length - 1 : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[i], this.conditionStack[this.conditionStack.length - 1]);
            if (token) {
                return token;
            } else {
                return;
            }
        }
    }
    if (this._input === "") {
        return this.EOF;
    } else {
        this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {text: "", token: null, line: this.yylineno});
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
}});
lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
    var YYSTATE = YY_START;
    switch ($avoiding_name_collisions) {
      case 0:
        break;
      case 1:
        return 20;
        break;
      case 2:
        return 8;
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
        return 18;
        break;
      case 9:
        return 19;
        break;
      case 10:
        return 11;
        break;
      case 11:
        return 12;
        break;
      case 12:
        return 13;
        break;
      case 13:
        return 13;
        break;
      case 14:
        return 14;
        break;
      case 15:
        return 14;
        break;
      case 16:
        return 15;
        break;
      case 17:
        return 16;
        break;
      case 18:
        return 17;
        break;
      case 19:
        return 22;
        break;
      case 20:
        return 21;
        break;
      case 21:
        return 5;
        break;
      case 22:
        return 23;
        break;
      case 23:
        return "INVALID";
        break;
      default:;
    }
};
lexer.rules = [/^\s+/,/^[0-9]+(\.[0-9]+)?\b/,/^\*/,/^\./,/^\//,/^-/,/^\+/,/^\^/,/^\(/,/^\)/,/^==/,/^!=/,/^<=/,/^=</,/^>=/,/^=>/,/^</,/^>/,/^!/,/^PI\b/,/^E\b/,/^$/,/^[_a-zA-Z][_a-zA-Z0-9]*/,/^./];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],"inclusive":true}};return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        throw new Error("Usage: " + args[0] + " FILE");
    }
    if (typeof process !== "undefined") {
        var source = require("fs").readFileSync(require("path").join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}