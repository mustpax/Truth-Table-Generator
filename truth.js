var SYMBOL = /[a-zA-Z]\w*/;
var DEBUG = false;

function truthCombos(symbols) {
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
}

function displayAST(ast) {
    var elemGen = function(expr) {
        debug('displayAST', expr);
        if (! $.isArray(expr) ) {
            return $("<li>").text(expr);
        }

        var ret = $('<ul>');
        $.each(expr, function(i) {
            ret.append(elemGen(expr[i]));
        });
        return ret;
    };

    $('#ast').empty().append('<h1>Abstract Syntax Tree</h1>', elemGen(ast));
}

function handleInput(val) {
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

function displayCombos(expression, symbols, ast, combos) {
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

function isBoolean(val) {
    return (val === true) || (val === false);
}

function assertBoolean(val) {
    if (! isBoolean(val)) {
        throw new SyntaxError('Unbound symbol: ' + val);
    }
}

function evalExpr(ast, bindings) {
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

function out(val) {
    $('#output').text(val.toString());
}

function displaySym(symbols) {
    var title = $('<h1>Symbols</h1>');
    var symTable = $('<ol/>');
    $.each(symbols, function(sym) {
        symTable.append($('<li/>').text(sym));
    });
    $('#sym').empty().append(title, symTable);
}

function main() {
    $('#apply').click(function() {
        handleInput($('#expr').val());
    });

    handleInput('!(a & (b | a))');
}

/**
 * Build an abstract syntax tree out of the given stream of tokens.
 */
function parse(tokens) {
    debug('parse', tokens);
    if ((! tokens) || (tokens.length === 0)) {
        return [];
    }

    var pos = 0;
    var self = this;
    var symbols = {};

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
        debug('consumeToken', curTok);
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
    
    var ret = expr();
    if (pos < tokens.length) {
        throw new SyntaxError('Could not consume all tokens. Remaining tokens: ' + 
            tokens.slice(pos, tokens.length));
    }

    return [ret, symbols];
};


function tokenize(str) {
    if ((! str) || (! str.replace(/\s/g, ''))) {
        return [];
    }

    var ret = str.split(/\b/);
    for (var i = 0; i < ret.length; i++) {
        // Remove whitespace from tokens
        ret[i] = ret[i].replace(/\s/g, '');

        if (ret[i].length === 0) {
            ret.splice(i, 1);
        } else if (! SYMBOL.test(ret[i])) {
            var arr = [];
            for (var j = 0; j < ret[i].length; j++) {
                arr[j] = ret[i][j];
            }
            ret.splice.apply(ret, [i, 1].concat(arr));
        }
    }

    return ret;
}

function debug() {
    if (DEBUG) {
        console.log.apply(console, arguments);
    }
}
