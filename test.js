/**
 * Does not validate ASTs, just does a deep array compare.
 * @return true iff the two abstract syntax trees are identical
 */
function astEquals(a, b) {
    if (! $.isArray(a)) {
        return ! $.isArray(b) &&
               a === b;
    }

    if (a.length !== b.length) {
        return false;
    }

    if (a.length === 0) {
        return true;
    }

    if (! $.isArray(b)) {
        return false;
    }

    return astEquals(a[0], b[0]) &&
           astEquals(a.slice(1), b.slice(1));
}

test('Truth Combos', function() {
    var symbols = {};
    var symCount = 6;
    for (var i = 0; i < symCount; i ++) {
        symbols['sym' + i] = true;
    }
    var combos = truthCombos(symbols);
    ok(combos.length === Math.pow(2, symCount), 'Check number of truth combos.');
});

function testExpr(expr, ast, sym) {
    var result = parse(tokenize(expr));
    var actualAst = result[0];
    var actualSym = result[1];
    console.log(ast);
    ok(astEquals(actualAst, ast, 'Verify parsed ast'));
}

test('Parser', function() {
    testExpr('a&b', ['&', 'a', 'b']);
    testExpr('a & b', ['&', 'a', 'b']);
    testExpr('verylongsymbolname1 & ((b))', ['&', 'verylongsymbolname1', 'b']);
//    testExpr('b & (b & (b & (b & b)))', ['&', 'b', 
//                                         ['&', 'b'
//                                         ['&', 'b'
//                                         ['&', 'b', 'b']]]]);
});

test('Tokenizer', function() {
});

