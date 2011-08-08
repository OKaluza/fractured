/* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() {
},
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"+":6,"-":7,"*":8,"/":9,"^":10,"(":11,")":12,"NUMBER":13,"E":14,"PI":15,"IDENTIFIER":16,"call":17,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:"+",7:"-",8:"*",9:"/",10:"^",11:"(",12:")",13:"NUMBER",14:"E",15:"PI",16:"IDENTIFIER"},
productions_: [0,[3,2],[4,3],[4,3],[4,3],[4,3],[4,3],[4,2],[4,3],[4,1],[4,1],[4,1],[4,1],[4,1],[17,4]],
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
            this.$ = 1;
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
        this.$ = "-" + $$[$0];
        break;
      case 8:
        this.$ = $$[$0 - 1];
        break;
      case 9:
        if (yytext.indexOf(".") < 0) {
            this.$ = yytext + ".0";
        }
        break;
      case 14:
        this.$ = $$[$0 - 3] + "(" + $$[$0 - 1] + ")";
        break;
      default:;
    }
},
table: [{3:1,4:2,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{1:[3]},{5:[1,10],6:[1,11],7:[1,12],8:[1,13],9:[1,14],10:[1,15]},{4:16,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{4:17,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{5:[2,9],6:[2,9],7:[2,9],8:[2,9],9:[2,9],10:[2,9],12:[2,9]},{5:[2,10],6:[2,10],7:[2,10],8:[2,10],9:[2,10],10:[2,10],12:[2,10]},{5:[2,11],6:[2,11],7:[2,11],8:[2,11],9:[2,11],10:[2,11],12:[2,11]},{11:[1,18],5:[2,12],6:[2,12],7:[2,12],8:[2,12],9:[2,12],10:[2,12],12:[2,12]},{5:[2,13],6:[2,13],7:[2,13],8:[2,13],9:[2,13],10:[2,13],12:[2,13]},{1:[2,1]},{4:19,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{4:20,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{4:21,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{4:22,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{4:23,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{6:[2,7],7:[2,7],8:[2,7],9:[2,7],10:[2,7],5:[2,7],12:[2,7]},{12:[1,24],6:[1,11],7:[1,12],8:[1,13],9:[1,14],10:[1,15]},{4:25,7:[1,3],11:[1,4],13:[1,5],14:[1,6],15:[1,7],16:[1,8],17:9},{6:[2,2],7:[2,2],8:[1,13],9:[1,14],10:[1,15],5:[2,2],12:[2,2]},{6:[2,3],7:[2,3],8:[1,13],9:[1,14],10:[1,15],5:[2,3],12:[2,3]},{6:[2,4],7:[2,4],8:[2,4],9:[2,4],10:[1,15],5:[2,4],12:[2,4]},{6:[2,5],7:[2,5],8:[2,5],9:[2,5],10:[1,15],5:[2,5],12:[2,5]},{6:[2,6],7:[2,6],8:[2,6],9:[2,6],10:[2,6],5:[2,6],12:[2,6]},{5:[2,8],6:[2,8],7:[2,8],8:[2,8],9:[2,8],10:[2,8],12:[2,8]},{12:[1,26],6:[1,11],7:[1,12],8:[1,13],9:[1,14],10:[1,15]},{10:[2,14],9:[2,14],8:[2,14],7:[2,14],6:[2,14],5:[2,14],12:[2,14]}],
defaultActions: {10:[2,1]},
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
        return 13;
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
        return 11;
        break;
      case 9:
        return 12;
        break;
      case 10:
        return 15;
        break;
      case 11:
        return 14;
        break;
      case 12:
        return 5;
        break;
      case 13:
        return 16;
        break;
      case 14:
        return "INVALID";
        break;
      default:;
    }
};
lexer.rules = [/^\s+/,/^[0-9]+(\.[0-9]+)?\b/,/^\*/,/^\./,/^\//,/^-/,/^\+/,/^\^/,/^\(/,/^\)/,/^PI\b/,/^E\b/,/^$/,/^[_a-zA-Z][_a-zA-Z0-9]*/,/^./];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],"inclusive":true}};return lexer;})()
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
