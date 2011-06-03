(function($, window, undefined) {
    var that = {};
    window.truth = that;

    var SYMBOL = /[a-zA-Z]\w*/;
    var WHITESPACE = /^\s*$/;
    var DEBUG = true;

    var truthCombos = function(symbols) {
        if (! symbols) {
            return [{}];
        }

        var key;
        // get a key, any key
        $.each(symbols, function(k, v) {
            key = k;
            return false;
        });
        if (! key) {
            return [{}];
        }

        var tmp = jQuery.extend({}, symbols);
        delete tmp[key];
        var prev = truthCombos(tmp);

        var ret = [];
        $.each(prev, function(i) {
            var cur = jQuery.extend({}, prev[i]);
            cur[key] = true;
            ret.push(cur);
            cur = jQuery.extend({}, prev[i]);
            cur[key] = false;
            ret.push(cur);
        });

        return ret;
    };
    that.truthCombos = truthCombos;

    var displayAST = function(ast) {
        var elemGen = function(ast) {
            debug('displayAST', ast);
            if (! $.isArray(ast) ) {
                return $("<li>").text(ast);
            }

            var ret = $('<ul>');
            $.each(ast, function(i, val) {
                ret.append(elemGen(val));
            });
            return ret;
        };

        $('#ast').empty().append('<h1>Abstract Syntax Tree</h1>', elemGen(ast));
    }

    var handleInput = function(val) {
        try {
            $('#nothing').empty();
            var tok = tokenize(val);
            var results = parse(tok);
            var ast = results[0];
            var sym = results[1];
            debug('ast', ast);
            debug('sym', sym);
            displayAST(ast);
            displaySym(sym);
            displayCombos(val, sym, ast, truthCombos(sym));
        } catch (e) {
            out('Unable to parse expression. ' + e);
            throw e;
        }
    }

    var displayCombos = function(expression, symbols, ast, combos) {
        $('#combo').empty();
        debug(combos);

        var ret = $('<table border="1"/>');

        var header = $('<tr>');
        var symArr = [];
        $.each(symbols, function(sym) {
            header.append($('<th>').text(sym));
            symArr.push(sym);
        });
        header.append($('<th>').text(expression));

        ret.append(header);
        $('#combo').append(ret);

        $.each(combos, function(i) {
            var cur = combos[i];
            var result = evalExpr(ast, cur);
            debug('evaluated', cur, result);
            var comboRow = $('<tr>');
            $.each(symArr, function(j) {
                comboRow.append($('<td>').text(cur[symArr[j]]));
            });
            comboRow.append($('<td>').text(result));
            ret.append(comboRow);
        });
    }

    var isBoolean = function(val) {
        return (val === true) || (val === false);
    }

    var assertBoolean = function(val) {
        if (! isBoolean(val)) {
            throw new SyntaxError('Unbound symbol: ' + val);
        }
    }

    var evalExpr = function(ast, bindings) {
        var evalSym = function(index) {
            if ($.isArray(ast[index])) {
                return evalExpr(ast[index], bindings);
            }

            assertBoolean(bindings[ast[index]]);
            return bindings[ast[index]];
        };

        if (! ast) {
            throw new SyntaxError('Invalid expression: ' + ast);
        }

        if (! $.isArray(ast)) {
            return bindings[ast];
        }

        switch(ast[0]) {
        case '&':
            return evalSym(1) && evalSym(2);
            break;
        case '^':
            return (evalSym(1) || evalSym(2)) &&
                   (!(evalSym(1) && evalSym(2)));
            break;
        case '|':
            return evalSym(1) || evalSym(2);
            break;
        case '!':
        case '~':
            return ! evalSym(1);
            break;
        default:
            throw new SyntaxError('Unrecognized operator: ' + ast[0]);
        }
    }
    that.evalExpr = evalExpr;

    var out = function(val) {
        $('#nothing').text(val.toString());
        $('#ast').empty();
        $('#combo').empty();
        $('#sym').empty();
    }

    var displaySym = function(symbols) {
        var title = $('<h1>Symbols</h1>');
        var symTable = $('<ol/>');
        $.each(symbols, function(sym) {
            symTable.append($('<li/>').text(sym));
        });
        $('#sym').empty().append(title, symTable);
    }

    var main = function() {
        var self = this;
        $('#expr').keyup(function() {
            debug('keyup');
            var val = $('#expr').val();
            if (this.lastSearch !== val) {
                this.lastSearch = val;
                handleInput($('#expr').val());
            }
        });

        $('#expr').val('!(a & (b | a))');
        $('#expr').keyup();
    }
    that.main = main;

    /**
     * Build an abstract syntax tree out of the given stream of tokens.
     */
    var parse = function() {
        var pos;
        var symbols;
        var tokens;

        var getCurToken = function() {
            return tokens[pos];
        };

        /**
         * Consume the next token and add it to the symbol table.
         */
        var consumeSymbol = function() {
            debug('consumeSymbol');
            var symbol = consumeToken();
            symbols[symbol] = true;
            return symbol;
        };

        var consumeToken = function(expected) {
            var curTok = getCurToken();
            debug('consumeToken', curTok, pos);
            if (expected && (curTok !== expected)) {
                throw new SyntaxError('Did not encounter expected token. Expected: "' +
                                      expected + '" Actual: "' + curTok + '".');
            }

            pos++;
            return curTok;
        };

        var expr = function() {
            debug('expr', tokens, pos);
            if (getCurToken() == '!') {
                return [consumeToken(), subExpr()];
            }

            var a1 = subExpr();
            if (isBinaryOperator(getCurToken())) {
                return [consumeToken(), a1, subExpr()];
            }

            return a1;
        };

        var isBinaryOperator = function(tok) {
            return ((tok === '&') ||
                    (tok === '|') ||
                    (tok === '^'));
        };

        var subExpr = function() {
            debug('subExpr', tokens, pos);
            if (getCurToken() === '(') {
                consumeToken('(');
                var ret = expr();
                consumeToken(')');
                return ret;
            }
            
            if (! SYMBOL.test(getCurToken())) {
                throw new SyntaxError('Expecting symbol. Invalid symbol name: ' + getCurToken());
            }
            return consumeSymbol();
        };
        
        return function(tok) {
            debug('parse', tok);
            if ((! tok) || (! tok.length)) {
                return [];
            }

            tokens = tok;
            pos = 0;
            symbols = {};
            var ret = expr();
            if (pos < tokens.length) {
                debug(tokens);
                debug(pos);
                debug(tokens[pos]);
                throw new SyntaxError('Could not consume all tokens. '
                    + 'Remaining tokens: ' + tokens.slice(pos, tokens.length));
            }

            return [ret, symbols];
        }
    }();
    that.parse = parse;


    var tokenize = function(str) {
        if ((! str) || WHITESPACE.test(str)) {
            return [];
        }

        var ret = str.split(/\b/);
        for (var i = 0; i < ret.length; i++) {
            // Remove whitespace from tokens
            ret[i] = ret[i].replace(/\s/g, '');

            if (! ret[i].length) {
                // Delete empty element
                ret.splice(i, 1);
            } else if (! SYMBOL.test(ret[i])) {
                var arr = [];
                // For consecutive non-symbol characters,
                // split each character into individual tokens
                for (var j = 0; j < ret[i].length; j++) {
                    arr.push(ret[i][j]);
                }

                // Replace element with all subtokens of
                // current element
                Array.prototype.splice.apply(ret, [i, 1].concat(arr));
            }
        }

        return ret;
    }
    that.tokenize = tokenize;

    var debug = function() {
        if (DEBUG && window.console && window.console.log) {
            console.log.apply(console, arguments);
        }
    }

    return that;
})(jQuery, window);
