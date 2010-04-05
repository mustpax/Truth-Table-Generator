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
    same(ast, actualAst, 'Verify expression ' + expr);
}

test('Parser', function() {
    testExpr('a&b', ['&', 'a', 'b']);
    testExpr('a & b', ['&', 'a', 'b']);
    testExpr('a & (((((b)))))', ['&', 'a', 'b']);
    testExpr('verylongsymbolname1 & ((b))', ['&', 'verylongsymbolname1', 'b']);
    testExpr('b & (b & (b & (b & b)))', ['&', 'b', 
                                         ['&', 'b'
                                         ['&', 'b'
                                         ['&', 'b', 'b']]]]);
});

test('Tokenizer', function() {
});

