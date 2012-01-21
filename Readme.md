# Readme

This simple JavaScript application generates [truth tables][tt] for arbitrary boolean logic expressions. The parser is quite primitive, so it requires each subexpression to be surrounded by parentheses. So `(a | b) | c` is fine, `a | b | c` isn't. It runs completely in the browser and requires no server side support.

Try it here: [http://mustpax.github.com/Truth-Table-Generator/][generator]

# License
Licensed under the MIT license. See License.txt for details.

[tt]: http://en.wikipedia.org/wiki/Truth_table "Wikipedia article on Truth Tables"
[generator]: http://mustpax.github.com/Truth-Table-Generator/
