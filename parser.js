/*
 based on: (stripped out: evaluate, toJSFunction, substitute, simplify, string support)
 http://silentmatt.com/javascript-expression-evaluator/
 Based on ndef.parser, by Raphael Graf(r@undefined.ch)
 http://www.undefined.ch/mparser/index.html
*/

var Parser = (function (scope) {
	function object(o) {
		function F() {}
		F.prototype = o;
		return new F();
	}

	var TNUMBER = 0;
	var TUNARYOP = 1;
	var TBINARYOP = 2;
	var TVAR = 3;
	var TFUNCALL = 4;

	function Token(type_, index_, prio_, number_) {
		this.type_ = type_;
		this.index_ = index_ || 0;
		this.prio_ = prio_ || 0;
		this.number_ = (number_ !== undefined && number_ !== null) ? number_ : 0;
		this.toString = function () {
			switch (this.type_) {
			case TNUMBER:
				return this.number_;
			case TUNARYOP:
			case TBINARYOP:
			case TVAR:
				return this.index_;
			case TFUNCALL:
				return "CALL";
			default:
				return "Invalid Token";
			}
		};
	}

	function Expression(tokens, unary_ops, binary_ops, functions) {
		this.tokens = tokens;
		this.unary_ops = unary_ops;
		this.binary_ops = binary_ops;
		this.functions = functions;
	}

	Expression.prototype = {
		toString: function (toJS) {
			var nstack = [];
			var n1;
			var n2;
			var f;
			var L = this.tokens.length;
			var item;
			var i = 0;
			for (i = 0; i < L; i++) {
				item = this.tokens[i];
				var type_ = item.type_;
				if (type_ === TNUMBER) {
					nstack.push("C(" + item.number_ + ")");
				}
				else if (type_ === TBINARYOP) {
					n2 = nstack.pop();
					n1 = nstack.pop();
					f = item.index_;
					if (toJS && f == "^") {
						nstack.push("cpow(" + n1 + "," + n2 + ")");
					}	else if (toJS && f == "*") {
						nstack.push("mul(" + n1 + "," + n2 + ")");
					} else if (toJS && f == "/") {
						nstack.push("div(" + n1 + "," + n2 + ")");
					} else if (toJS && f == "+") {
						nstack.push("add(" + n1 + "," + n2 + ")");
					} else if (toJS && f == "-") {
						nstack.push("sub(" + n1 + "," + n2 + ")");
					} else {
						nstack.push("(" + n1 + f + n2 + ")");
					}
				}
				else if (type_ === TVAR) {
					nstack.push(item.index_);
				}
				else if (type_ === TUNARYOP) {
					n1 = nstack.pop();
					f = item.index_;
					if (f === "-") {
						nstack.push("(" + f + n1 + ")");
					}
					else {
						nstack.push(f + "(" + n1 + ")");
					}
				}
				else if (type_ === TFUNCALL) {
					n1 = nstack.pop();
					f = nstack.pop();
					nstack.push(f + "(" + n1 + ")");
				}
				else {
					throw new Error("invalid Expression");
				}
			}
			if (nstack.length > 1) {
				throw new Error("invalid Expression (parity)");
			}
			return nstack[0];
		},
	};

	function Parser() {
		this.success = false;
		this.errormsg = "";
		this.expression = "";

		this.pos = 0;

		this.tokennumber = 0;
		this.tokenprio = 0;
		this.tokenindex = 0;
		this.tmpprio = 0;

		this.unary_ops = {
			"sin": "sin",
			"cos": "cos",
			"tan": "tan",
			"asin": "asin",
			"acos": "acos",
			"atan": "atan",
			"sqrt": "sqrt",
			"log": "log",
			"abs": "abs",
			"ceil": "ceil",
			"floor": "floor",
			"round": "round",
			"-": "neg",
			"exp": "exp"
		};

		this.binary_ops = {
			"+": "add",
			"-": "sub",
			"*": "mul",
			"/": "div",
			"%": "mod",
			"^": "pow"
		};

		this.functions = {
			"min": "min",
			"max": "max",
			"pow": "pow",
			"atan2": "atan2"
		};
	}

	Parser.parse = function (expr) {
		return new Parser().parse(expr);
	};

	Parser.toString = function (expr) {
		return Parser.parse(expr).toString(true);
	};

	Parser.Expression = Expression;

	var PRIMARY  = 1 << 0;
	var OPERATOR = 1 << 1;
	var FUNCTION = 1 << 2;
	var LPAREN   = 1 << 3;
	var RPAREN   = 1 << 4;
	var COMMA    = 1 << 5;
	var SIGN     = 1 << 6;
	var CALL     = 1 << 7;

	Parser.prototype = {
		parse: function (expr) {
			this.errormsg = "";
			this.success = true;
			var operstack = [];
			var tokenstack = [];
			this.tmpprio = 0;
			var expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
			var noperators = 0;
			this.expression = expr;
			this.pos = 0;

			while (this.pos < this.expression.length) {
				if (this.isOperator()) {
					if (this.isSign() && (expected & SIGN)) {
						if (this.isNegativeSign()) {
							this.tokenprio = 2;
							this.tokenindex = "-";
							noperators++;
							this.addfunc(tokenstack, operstack, TUNARYOP);
						}
						expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
					}
					else if (this.isComment()) {

					}
					else {
						if ((expected & OPERATOR) === 0) {
							this.error_parsing(this.pos, "unexpected operator");
						}
						noperators += 2;
						this.addfunc(tokenstack, operstack, TBINARYOP);
						expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
					}
				}
				else if (this.isNumber()) {
					if ((expected & PRIMARY) === 0) {
						this.error_parsing(this.pos, "unexpected number");
					}
					var token = new Token(TNUMBER, 0, 0, this.tokennumber);
					tokenstack.push(token);

					expected = (OPERATOR | RPAREN | COMMA);
				}
				else if (this.isLeftParenth()) {
					if ((expected & LPAREN) === 0) {
						this.error_parsing(this.pos, "unexpected \"(\"");
					}

					if (expected & CALL) {
						noperators += 2;
						this.tokenprio = -2;
						this.tokenindex = -1;
						this.addfunc(tokenstack, operstack, TFUNCALL);
					}

					expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
				}
				else if (this.isRightParenth()) {
					if ((expected & RPAREN) === 0) {
						this.error_parsing(this.pos, "unexpected \")\"");
					}

					expected = (OPERATOR | RPAREN | COMMA | LPAREN | CALL);
				}
				else if (this.isComma()) {
					if ((expected & COMMA) === 0) {
						this.error_parsing(this.pos, "unexpected \",\"");
					}
					this.addfunc(tokenstack, operstack, TBINARYOP);
					noperators += 2;
					expected = (PRIMARY | LPAREN | FUNCTION | SIGN);
				}
				else if (this.isBinaryOp()) {
					if ((expected & FUNCTION) === 0) {
						this.error_parsing(this.pos, "unexpected function");
					}
					this.addfunc(tokenstack, operstack, TBINARYOP);
					noperators += 2;
					expected = (LPAREN);
				}
				else if (this.isUnaryOp()) {
					if ((expected & FUNCTION) === 0) {
						this.error_parsing(this.pos, "unexpected function");
					}
					this.addfunc(tokenstack, operstack, TUNARYOP);
					noperators++;
					expected = (LPAREN);
				}
				else if (this.isVar()) {
					if ((expected & PRIMARY) === 0) {
						this.error_parsing(this.pos, "unexpected variable");
					}
					var vartoken = new Token(TVAR, this.tokenindex, 0, 0);
					tokenstack.push(vartoken);

					expected = (OPERATOR | RPAREN | COMMA | LPAREN | CALL);
				}
				else if (this.isWhite()) {
				}
				else {
					if (this.errormsg === "") {
						this.error_parsing(this.pos, "unknown character");
					}
					else {
						this.error_parsing(this.pos, this.errormsg);
					}
				}
			}
			if (this.tmpprio < 0 || this.tmpprio >= 10) {
				this.error_parsing(this.pos, "unmatched \"()\"");
			}
			while (operstack.length > 0) {
				var tmp = operstack.pop();
				tokenstack.push(tmp);
			}
			if (noperators + 1 !== tokenstack.length) {
				//print(noperators + 1);
				//print(tokenstack);
				this.error_parsing(this.pos, "parity");
			}

			return new Expression(tokenstack, object(this.unary_ops), object(this.binary_ops), object(this.functions));
		},

		error_parsing: function (column, msg) {
			this.success = false;
			this.errormsg = "parse error [column " + (column) + "]: " + msg;
			throw new Error(this.errormsg);
		},

//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

		addfunc: function (tokenstack, operstack, type_) {
			var operator = new Token(type_, this.tokenindex, this.tokenprio + this.tmpprio, 0);
			while (operstack.length > 0) {
				if (operator.prio_ <= operstack[operstack.length - 1].prio_) {
					tokenstack.push(operstack.pop());
				}
				else {
					break;
				}
			}
			operstack.push(operator);
		},

		isNumber: function () {
			var r = false;
			var str = "";
			while (this.pos < this.expression.length) {
				var code = this.expression.charCodeAt(this.pos);
				if ((code >= 48 && code <= 57) || code === 46) {
					str += this.expression.charAt(this.pos);
					this.pos++;
					this.tokennumber = parseFloat(str);
					r = true;
				}
				else {
					break;
				}
			}
			return r;
		},

		isOperator: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 43) { // +
				this.tokenprio = 0;
				this.tokenindex = "+";
			}
			else if (code === 45) { // -
				this.tokenprio = 0;
				this.tokenindex = "-";
			}
			else if (code === 42) { // *
				this.tokenprio = 1;
				this.tokenindex = "*";
			}
			else if (code === 47) { // /
				this.tokenprio = 2;
				this.tokenindex = "/";
			}
			else if (code === 37) { // %
				this.tokenprio = 2;
				this.tokenindex = "%";
			}
			else if (code === 94) { // ^
				this.tokenprio = 3;
				this.tokenindex = "^";
			}
			else {
				return false;
			}
			this.pos++;
			return true;
		},

		isSign: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 45 || code === 43) { // -
				return true;
			}
			return false;
		},

		isPositiveSign: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 43) { // -
				return true;
			}
			return false;
		},

		isNegativeSign: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 45) { // -
				return true;
			}
			return false;
		},

		isLeftParenth: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 40) { // (
				this.pos++;
				this.tmpprio += 10;
				return true;
			}
			return false;
		},

		isRightParenth: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 41) { // )
				this.pos++;
				this.tmpprio -= 10;
				return true;
			}
			return false;
		},

		isComma: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 44) { // ,
				this.pos++;
				this.tokenprio = -1;
				this.tokenindex = ",";
				return true;
			}
			return false;
		},

		isWhite: function () {
			var code = this.expression.charCodeAt(this.pos);
			if (code === 32 || code === 9 || code === 10 || code === 13) {
				this.pos++;
				return true;
			}
			return false;
		},

		getname: function () {
			var str = "";
			for (var i = this.pos; i < this.expression.length; i++) {
				var c = this.expression.charAt(i);
            //Not alpha
				if (c.toUpperCase() === c.toLowerCase()) {
               //First char
					if (i === this.pos)
               {
					   if (c != '_' && c != '@' && (c < '0' || c > '9'))
                     break;
               }
               else
               {
                  if (c != '_' && c != '~' && (c < '0' || c > '9'))
                     break;
               }
				}
				str += c;
			}
         return str;
      },

		isUnaryOp: function () {
         var str = this.getname();
			if (str.length > 0 && (str in this.unary_ops)) {
				this.tokenindex = str;
				this.tokenprio = 5;
				this.pos += str.length;
				return true;
			}
			return false;
		},

		isBinaryOp: function () {
         var str = this.getname();
			if (str.length > 0 && (str in this.binary_ops)) {
				this.tokenindex = str;
				this.tokenprio = 5;
				this.pos += str.length;
				return true;
			}
			return false;
		},

		isVar: function () {
         var str = this.getname();
			if (str.length > 0) {
				this.tokenindex = str;
				this.tokenprio = 4;
				this.pos += str.length;
				return true;
			}
			return false;
		},

		isComment: function () {
			var code = this.expression.charCodeAt(this.pos - 1);
			if (code === 47) {
            if (this.expression.charCodeAt(this.pos) === 42) {
               // /**/ style comment
               this.pos = this.expression.indexOf("*/", this.pos) + 2;
               if (this.pos === 1) {
                  this.pos = this.expression.length;
               }
               return true;
            } else if (this.expression.charCodeAt(this.pos) === 47) {
               //Rest of expression commented out
               this.pos = this.expression.length;
               return true;
            }
			}
			return false;
		}
	};

	scope.Parser = Parser;
	return Parser
})(typeof exports === 'undefined' ? {} : exports);
