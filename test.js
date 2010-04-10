test('Truth Combos', function() {
    var symbols = {};
    var symCount = 6;
    for (var i = 0; i < symCount; i ++) {
        symbols['sym' + i] = true;
    }
    var combos = truth.truthCombos(symbols);
    ok(combos.length === Math.pow(2, symCount), 'Check number of truth combos.');
});

function testExpr(expr, ast, sym) {
    var result = truth.parse(truth.tokenize(expr));
    var actualAst = result[0];
    var actualSym = result[1];
    same(actualAst, ast, 'Verify expression ' + expr);
}

test('Parser', function() {
    testExpr('singletoken', 'singletoken');
    testExpr('(((singletoken)))', 'singletoken');
    testExpr('a&b', ['&', 'a', 'b']);
    testExpr('a & b', ['&', 'a', 'b']);
    testExpr('a & (((((b)))))', ['&', 'a', 'b']);
    testExpr('verylong101symbolname1 & ((b))', ['&', 'verylong101symbolname1', 'b']);
    testExpr('b & (b & (b & (b & b)))', ['&', 'b', 
                                         ['&', 'b',
                                         ['&', 'b',
                                         ['&', 'b', 'b']]]]);
});

test('evalExpr', function() {
    var expr = ['&', 'a', 'b'];
    var bindings = {'a' : true,
                    'b' : false};
    equals(truth.evalExpr(expr, bindings), false);
    bindings = {'a' : true,
                'b' : true};
    equals(truth.evalExpr(expr, bindings), true);

    expr = ['^', 'a', 'b'];
    bindings = {'a' : true,
                'b' : false};
    equals(truth.evalExpr(expr, bindings), true);
    bindings = {'a' : true,
                'b' : true};
    equals(truth.evalExpr(expr, bindings), false);
});

