// performance is available globally in Node.js (>=16) and browsers
// TODO: consider |> function calls
// Returns the index of the matching close delimiter for s[startIdx], allowing
// nested () and {} interleaved. Returns -1 if unbalanced.
const findMatchingClose = (s, startIdx, open, close) => {
    let parens = 0;
    let braces = 0;
    for (let i = startIdx; i < s.length; i++) {
        const c = s[i];
        if (c === '(')
            parens++;
        else if (c === ')') {
            parens--;
            if (parens < 0)
                return -1;
            if (close === ')' && parens === 0 && braces === 0)
                return i;
        }
        else if (c === '{')
            braces++;
        else if (c === '}') {
            braces--;
            if (braces < 0)
                return -1;
            if (close === '}' && braces === 0 && parens === 0)
                return i;
        }
    }
    return -1;
};
const scanAFunction = (s) => {
    if (s[0] !== '(')
        return null;
    const cp = findMatchingClose(s, 0, '(', ')');
    if (cp === -1)
        return null;
    if (s[cp + 1] !== '=' || s[cp + 2] !== '>' || s[cp + 3] !== '{')
        return null;
    const cb = findMatchingClose(s, cp + 3, '{', '}');
    if (cb === -1)
        return null;
    return s.substring(0, cb + 1);
};
const scanALambda = (s) => {
    if (s[0] !== '(')
        return null;
    const cp = findMatchingClose(s, 0, '(', ')');
    if (cp === -1)
        return null;
    if (s[cp + 1] !== '=' || s[cp + 2] !== '>')
        return null;
    let i = cp + 3;
    while (i < s.length && s[i] !== ';')
        i++;
    return s.substring(0, Math.min(i + 1, s.length));
};
const scanFunction = (s) => {
    const nm = /^[a-zA-Z_][\w.]*/.exec(s);
    if (nm === null)
        return null;
    const after = nm[0].length;
    if (s[after] !== '(')
        return null;
    const cp = findMatchingClose(s, after, '(', ')');
    if (cp === -1)
        return null;
    if (s[cp + 1] !== '=' || s[cp + 2] !== '>' || s[cp + 3] !== '{')
        return null;
    const cb = findMatchingClose(s, cp + 3, '{', '}');
    if (cb === -1)
        return null;
    return s.substring(0, cb + 1);
};
const scanLambda = (s) => {
    const nm = /^[a-zA-Z_][\w.]*/.exec(s);
    if (nm === null)
        return null;
    const after = nm[0].length;
    if (s[after] !== '(')
        return null;
    const cp = findMatchingClose(s, after, '(', ')');
    if (cp === -1)
        return null;
    if (s[cp + 1] !== '=' || s[cp + 2] !== '>')
        return null;
    let i = cp + 3;
    while (i < s.length && s[i] !== ';')
        i++;
    return s.substring(0, Math.min(i + 1, s.length));
};
const scanFunctionCall = (s) => {
    const nm = /^[a-zA-Z_][\w.]*/.exec(s);
    if (nm === null) {
        if (s.startsWith('()'))
            return '()';
        return null;
    }
    const after = nm[0].length;
    if (s[after] !== '(')
        return null;
    const cp = findMatchingClose(s, after, '(', ')');
    if (cp === -1)
        return null;
    return s.substring(0, cp + 1);
};
const scanTailCall = (s) => {
    if (s[0] !== '>')
        return null;
    const inner = scanFunctionCall(s.substring(1));
    if (inner === null)
        return null;
    return '>' + inner;
};
const scanCodeBlock = (s) => {
    if (s[0] !== '{')
        return null;
    const cb = findMatchingClose(s, 0, '{', '}');
    if (cb === -1)
        return null;
    return s.substring(0, cb + 1);
};
const scanBracketed = (s) => {
    if (s[0] !== '[')
        return null;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '[')
            depth++;
        else if (s[i] === ']') {
            depth--;
            if (depth === 0)
                return s.substring(0, i + 1);
        }
    }
    return null;
};
const scanArrayRead = (s) => {
    const nm = /^[a-zA-Z_][\w.]*/.exec(s);
    if (nm === null)
        return null;
    const after = nm[0].length;
    if (s[after] !== '[')
        return null;
    const sub = scanBracketed(s.substring(after));
    if (sub === null)
        return null;
    return s.substring(0, after + sub.length);
};
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["null"] = 0] = "null";
    TokenKind[TokenKind["variable"] = 1] = "variable";
    TokenKind[TokenKind["pointer"] = 2] = "pointer";
    TokenKind[TokenKind["literal"] = 3] = "literal";
    TokenKind[TokenKind["percent"] = 4] = "percent";
    TokenKind[TokenKind["literalArray"] = 5] = "literalArray";
    TokenKind[TokenKind["negate"] = 6] = "negate";
    TokenKind[TokenKind["not"] = 7] = "not";
    TokenKind[TokenKind["plusminus"] = 8] = "plusminus";
    TokenKind[TokenKind["startGroup"] = 9] = "startGroup";
    TokenKind[TokenKind["endGroup"] = 10] = "endGroup";
    TokenKind[TokenKind["functionCall"] = 11] = "functionCall";
    TokenKind[TokenKind["tailCall"] = 12] = "tailCall";
    TokenKind[TokenKind["aFunction"] = 13] = "aFunction";
    TokenKind[TokenKind["function"] = 14] = "function";
    TokenKind[TokenKind["aLambda"] = 15] = "aLambda";
    TokenKind[TokenKind["lambda"] = 16] = "lambda";
    TokenKind[TokenKind["add"] = 17] = "add";
    TokenKind[TokenKind["sub"] = 18] = "sub";
    TokenKind[TokenKind["mul"] = 19] = "mul";
    TokenKind[TokenKind["div"] = 20] = "div";
    TokenKind[TokenKind["mod"] = 21] = "mod";
    TokenKind[TokenKind["pow"] = 22] = "pow";
    TokenKind[TokenKind["range"] = 23] = "range";
    TokenKind[TokenKind["gt"] = 24] = "gt";
    TokenKind[TokenKind["lt"] = 25] = "lt";
    TokenKind[TokenKind["gteq"] = 26] = "gteq";
    TokenKind[TokenKind["lteq"] = 27] = "lteq";
    TokenKind[TokenKind["eq"] = 28] = "eq";
    TokenKind[TokenKind["neq"] = 29] = "neq";
    TokenKind[TokenKind["or"] = 30] = "or";
    TokenKind[TokenKind["and"] = 31] = "and";
    TokenKind[TokenKind["xor"] = 32] = "xor";
    TokenKind[TokenKind["ternaryTrue"] = 33] = "ternaryTrue";
    TokenKind[TokenKind["ternaryFalse"] = 34] = "ternaryFalse";
    TokenKind[TokenKind["blockStart"] = 35] = "blockStart";
    TokenKind[TokenKind["blockEnd"] = 36] = "blockEnd";
    TokenKind[TokenKind["set"] = 37] = "set";
    TokenKind[TokenKind["addSet"] = 38] = "addSet";
    TokenKind[TokenKind["subSet"] = 39] = "subSet";
    TokenKind[TokenKind["mulSet"] = 40] = "mulSet";
    TokenKind[TokenKind["divSet"] = 41] = "divSet";
    TokenKind[TokenKind["modSet"] = 42] = "modSet";
    TokenKind[TokenKind["powSet"] = 43] = "powSet";
    TokenKind[TokenKind["increment"] = 44] = "increment";
    TokenKind[TokenKind["decrement"] = 45] = "decrement";
    TokenKind[TokenKind["arrayCreate"] = 46] = "arrayCreate";
    TokenKind[TokenKind["arrayRead"] = 47] = "arrayRead";
    TokenKind[TokenKind["statement"] = 48] = "statement";
    TokenKind[TokenKind["separator"] = 49] = "separator";
    TokenKind[TokenKind["beep"] = 50] = "beep";
})(TokenKind || (TokenKind = {}));
// find operand, [operator, operand]...
const operands = [
    {
        regex: /^@[^@]*@/,
        kind: 50 /* TokenKind.beep */
    },
    {
        regex: /^-/,
        kind: 6 /* TokenKind.negate */
    },
    {
        regex: /^\+-/,
        kind: 8 /* TokenKind.plusminus */
    },
    {
        regex: /^!/,
        kind: 7 /* TokenKind.not */
    },
    {
        scan: scanAFunction,
        kind: 13 /* TokenKind.aFunction */
    },
    {
        scan: scanALambda,
        kind: 15 /* TokenKind.aLambda */
    },
    {
        scan: scanFunction,
        kind: 14 /* TokenKind.function */
    },
    {
        scan: scanLambda,
        kind: 16 /* TokenKind.lambda */
    },
    {
        scan: scanFunctionCall,
        kind: 11 /* TokenKind.functionCall */
    },
    {
        scan: scanTailCall,
        kind: 12 /* TokenKind.tailCall */
    },
    {
        scan: scanArrayRead,
        kind: 47 /* TokenKind.arrayRead */
    },
    {
        regex: /^[a-zA-Z_][\w.]*/,
        kind: 1 /* TokenKind.variable */
    },
    {
        regex: /^-?[0-9.]+(\|-?[0-9.]+)+/,
        kind: 5 /* TokenKind.literalArray */
    },
    {
        regex: /^(-?[0-9.]+%(?!%)|-?[0-9.]+%(?=%%))/,
        kind: 4 /* TokenKind.percent */
    },
    {
        regex: /^-?[0-9.]+/,
        kind: 3 /* TokenKind.literal */
    },
    {
        regex: /^;/,
        kind: 48 /* TokenKind.statement */
    },
    {
        regex: /^\(/,
        kind: 9 /* TokenKind.startGroup */
    },
    {
        // Code block as operand: `{ body }` is sugar for `() => { body }`
        scan: scanCodeBlock,
        kind: 13 /* TokenKind.aFunction */
    },
    {
        scan: scanBracketed,
        kind: 46 /* TokenKind.arrayCreate */
    },
    {
        regex: /^&/,
        kind: 2 /* TokenKind.pointer */
    }
];
const operators = [
    {
        regex: /^@[^@]*@/,
        kind: 50 /* TokenKind.beep */
    },
    {
        regex: /^\+=/,
        kind: 38 /* TokenKind.addSet */
    },
    {
        regex: /^-=/,
        kind: 39 /* TokenKind.subSet */
    },
    {
        regex: /^\*\*=/,
        kind: 43 /* TokenKind.powSet */
    },
    {
        regex: /^\*=/,
        kind: 40 /* TokenKind.mulSet */
    },
    {
        regex: /^\/=/,
        kind: 41 /* TokenKind.divSet */
    },
    {
        regex: /^%%=/,
        kind: 42 /* TokenKind.modSet */
    },
    {
        regex: /^\+\+/,
        kind: 44 /* TokenKind.increment */
    },
    {
        regex: /^--/,
        kind: 45 /* TokenKind.decrement */
    },
    {
        regex: /^\+/,
        kind: 17 /* TokenKind.add */
    },
    {
        regex: /^-/,
        kind: 18 /* TokenKind.sub */
    },
    {
        regex: /^\*\*/,
        kind: 22 /* TokenKind.pow */
    },
    {
        regex: /^\*/,
        kind: 19 /* TokenKind.mul */
    },
    {
        regex: /^\//,
        kind: 20 /* TokenKind.div */
    },
    {
        regex: /^%%/,
        kind: 21 /* TokenKind.mod */
    },
    {
        regex: /^~/,
        kind: 23 /* TokenKind.range */
    },
    {
        regex: /^>=/,
        kind: 26 /* TokenKind.gteq */
    },
    {
        regex: /^<=/,
        kind: 27 /* TokenKind.lteq */
    },
    {
        regex: /^!=/,
        kind: 29 /* TokenKind.neq */
    },
    {
        regex: /^==/,
        kind: 28 /* TokenKind.eq */
    },
    {
        regex: /^</,
        kind: 25 /* TokenKind.lt */
    },
    {
        regex: /^>/,
        kind: 24 /* TokenKind.gt */
    },
    {
        regex: /^\|\|/,
        kind: 30 /* TokenKind.or */
    },
    {
        regex: /^&&/,
        kind: 31 /* TokenKind.and */
    },
    {
        regex: /^\^/,
        kind: 32 /* TokenKind.xor */
    },
    {
        regex: /^=/,
        kind: 37 /* TokenKind.set */
    },
    {
        regex: /^\?/,
        kind: 33 /* TokenKind.ternaryTrue */,
    },
    {
        regex: /^:/,
        kind: 34 /* TokenKind.ternaryFalse */,
    },
    {
        regex: /^{/,
        kind: 35 /* TokenKind.blockStart */
    },
    {
        regex: /^}/,
        kind: 36 /* TokenKind.blockEnd */
    },
    {
        regex: /^;/,
        kind: 48 /* TokenKind.statement */
    },
    {
        regex: /^,/,
        kind: 49 /* TokenKind.separator */
    },
    {
        regex: /^\)/,
        kind: 10 /* TokenKind.endGroup */
    },
];
const opLevels = new Map();
for (const t of [23 /* TokenKind.range */]) {
    opLevels.set(t, 5);
}
for (const t of [22 /* TokenKind.pow */]) {
    opLevels.set(t, 4);
}
for (const t of [19 /* TokenKind.mul */, 20 /* TokenKind.div */, 21 /* TokenKind.mod */]) {
    opLevels.set(t, 3);
}
for (const t of [17 /* TokenKind.add */, 18 /* TokenKind.sub */]) {
    opLevels.set(t, 2);
}
for (const t of [24 /* TokenKind.gt */, 25 /* TokenKind.lt */, 26 /* TokenKind.gteq */, 27 /* TokenKind.lteq */, 28 /* TokenKind.eq */, 29 /* TokenKind.neq */]) {
    opLevels.set(t, 1);
}
const allStdlibCategories = ['loops', 'arrays'];
const resolveStdlibCategories = (opt) => {
    if (opt === false)
        return new Set();
    const out = new Set();
    const o = (opt === undefined || opt === true) ? {} : opt;
    for (const c of allStdlibCategories) {
        if (o[c] !== false)
            out.add(c);
    }
    return out;
};
const defaultStdlibCategories = new Set(allStdlibCategories);
const paramNamePattern = /^[a-zA-Z_][\w.]*$/;
// Tokens that make the preceding variable a write target rather than a read,
// so the strict unknown-variable check can be deferred to the write site which
// provides a more specific error message.
const writeTargets = new Set([
    37 /* TokenKind.set */, 38 /* TokenKind.addSet */, 39 /* TokenKind.subSet */, 40 /* TokenKind.mulSet */,
    41 /* TokenKind.divSet */, 42 /* TokenKind.modSet */, 43 /* TokenKind.powSet */,
    44 /* TokenKind.increment */, 45 /* TokenKind.decrement */,
]);
const createSeededRandom = (seed) => {
    let state = seed >>> 0;
    return () => {
        state = (Math.imul(1664525, state) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
};
const parseParamList = (source) => {
    const start = source.indexOf('(');
    const end = source.indexOf(')', start + 1);
    if (start === -1 || end === -1 || end === start + 1) {
        return [];
    }
    return source
        .substring(start + 1, end)
        .split(',')
        .map((param) => param.trim())
        .filter((param) => param.length > 0);
};
const parseCallArgs = (source) => {
    const start = source.indexOf('(');
    const end = source.lastIndexOf(')');
    if (start === -1 || end === -1 || end === start + 1) {
        return [];
    }
    const args = [];
    const argSource = source.substring(start + 1, end);
    let parenLevel = 0;
    let braceLevel = 0;
    let argStart = 0;
    for (let i = 0; i < argSource.length; i++) {
        const char = argSource[i];
        if (char === '(') {
            parenLevel++;
        }
        else if (char === ')') {
            parenLevel--;
        }
        else if (char === '{') {
            braceLevel++;
        }
        else if (char === '}') {
            braceLevel--;
        }
        else if (char === ',' && parenLevel === 0 && braceLevel === 0) {
            args.push(argSource.substring(argStart, i).trim());
            argStart = i + 1;
        }
    }
    args.push(argSource.substring(argStart).trim());
    return args.filter((arg) => arg.length > 0);
};
class StackFrame {
    stack;
    tokens;
    value = 0;
    lastValue = 0;
    values = [];
    operator = 17 /* TokenKind.add */;
    ops = [];
    setOp = 17 /* TokenKind.add */;
    lastVar = '';
    setVar = '';
    pendingArray = ''; // array name from most recent arrayRead operand
    pendingIndex = 0; // index from most recent arrayRead operand
    writeArray = ''; // array name captured by assignment operator
    writeIndex = 0; // index captured by assignment operator
    arrayWrite = false;
    newArray = null;
    valFn = null;
    sign = 1;
    not = false;
    ptr = false;
    i = 0;
    constructor(tokens, stackLength = 0) {
        this.tokens = tokens;
        this.stack = stackLength <= 0 ? null : new Float64Array(stackLength);
    }
}
const applySetOp = (op, cur, val) => {
    switch (op) {
        case 37 /* TokenKind.set */: return val;
        case 38 /* TokenKind.addSet */: return cur + val;
        case 39 /* TokenKind.subSet */: return cur - val;
        case 40 /* TokenKind.mulSet */: return cur * val;
        case 41 /* TokenKind.divSet */: return val === 0 ? 0 : cur / val;
        case 42 /* TokenKind.modSet */: return (val === 0 || !Number.isFinite(val)) ? 0 : cur % val;
        case 43 /* TokenKind.powSet */: return cur ** val;
        default: return cur;
    }
};
const closeStatement = (f, vars, functions, arrays, strict = false) => {
    if (f.newArray !== null) {
        if (f.setVar !== '') {
            arrays.set(f.setVar, f.newArray);
            f.value = f.newArray[0];
        }
        f.newArray = null;
        f.setVar = '';
        f.pendingArray = '';
        f.arrayWrite = false;
        f.valFn = null;
        return;
    }
    if (f.setVar === '') {
        f.pendingArray = '';
        f.arrayWrite = false;
        f.valFn = null;
        return;
    }
    if (f.valFn !== null && f.setOp === 37 /* TokenKind.set */) {
        functions.set(f.setVar, f.valFn);
        f.value = 0;
        f.setVar = '';
        f.valFn = null;
        f.arrayWrite = false;
        return;
    }
    f.valFn = null;
    if (f.arrayWrite) {
        const arr = arrays.get(f.writeArray);
        const idx = f.writeIndex;
        if (arr !== undefined && idx >= 1 && idx < arr.length) {
            arr[idx] = applySetOp(f.setOp, arr[idx], f.value);
            f.value = arr[idx];
        }
        else if (strict) {
            if (arr === undefined) {
                throw new Error(`Runtime error: write to unknown array "${f.writeArray}"`);
            }
            throw new Error(`Runtime error: index ${idx} out of bounds for array "${f.writeArray}" (size ${arr[0]})`);
        }
        f.setVar = '';
        f.writeArray = '';
        f.arrayWrite = false;
        return;
    }
    if (strict && f.setOp !== 37 /* TokenKind.set */ && !vars.has(f.setVar)) {
        throw new Error(`Runtime error: compound assignment to undeclared variable "${f.setVar}"`);
    }
    const newVal = applySetOp(f.setOp, vars.get(f.setVar) ?? 0, f.value);
    vars.set(f.setVar, newVal);
    f.value = newVal;
    f.setVar = '';
    f.arrayWrite = false;
};
const intoOperands = new Set([
    14 /* TokenKind.function */,
    16 /* TokenKind.lambda */,
    48 /* TokenKind.statement */,
    49 /* TokenKind.separator */,
    2 /* TokenKind.pointer */,
    6 /* TokenKind.negate */,
    8 /* TokenKind.plusminus */,
    7 /* TokenKind.not */,
    9 /* TokenKind.startGroup */,
]);
const stdlibRegistry = new Map();
const evalArg = (arg, ctx) => {
    if (arg === undefined)
        return 0;
    return +(arg.run([], null, ctx.vars, ctx.functions, ctx.arrays, ctx.rand, ctx.executionLimit, ctx.startedAt, ctx.maxSteps, ctx.context, ctx.strict, ctx.stdlibCategories) ?? 0);
};
// Resolve a callable from a parsedArg (Trace) — accepts a bare function-name
// reference, an anonymous function/lambda, or a code-block (which the parser
// has already lowered to an anonymous function token).
const resolveCallable = (arg, ctx) => {
    if (arg === undefined)
        return null;
    const tk = arg.tokens;
    if (tk.length !== 1)
        return null;
    const t = tk[0];
    if (t.kind === 1 /* TokenKind.variable */) {
        const fnRef = ctx.functions.get(t.string);
        if (fnRef !== undefined)
            return { trace: fnRef, params: fnRef.callParams };
        return null;
    }
    if (t.kind === 13 /* TokenKind.aFunction */ || t.kind === 14 /* TokenKind.function */ ||
        t.kind === 15 /* TokenKind.aLambda */ || t.kind === 16 /* TokenKind.lambda */) {
        if (t.callable === undefined) {
            const isFn = t.kind === 14 /* TokenKind.function */ || t.kind === 13 /* TokenKind.aFunction */;
            const body = isFn
                ? t.string.substring(t.string.indexOf('{') + 1, t.string.length - 1)
                : t.string.substring(t.string.indexOf('>') + 1, t.string.endsWith(';') ? t.string.length - 1 : t.string.length);
            const sub = Trace.parse(body);
            sub.callParams = parseParamList(t.string);
            t.callable = { trace: sub, params: sub.callParams };
        }
        return t.callable;
    }
    return null;
};
const callCallable = (callable, callerArgs, ctx) => {
    // Set declared parameters as globals (mirrors the existing function-call
    // convention) so named functions see their named params.
    for (let i = 0; i < callable.params.length; i++) {
        ctx.vars.set(callable.params[i], callerArgs[i] ?? 0);
    }
    return +(callable.trace.run(callerArgs, null, ctx.vars, ctx.functions, ctx.arrays, ctx.rand, ctx.executionLimit, ctx.startedAt, ctx.maxSteps, ctx.context, ctx.strict, ctx.stdlibCategories) ?? 0);
};
const resolveArrayName = (arg) => {
    if (arg === undefined)
        return null;
    const tk = arg.tokens;
    if (tk.length === 1 && tk[0].kind === 1 /* TokenKind.variable */)
        return tk[0].string;
    return null;
};
const requireArray = (name, op, ctx) => {
    if (name === null) {
        if (ctx.strict)
            throw new Error(`Runtime error: ${op} requires a bare array variable as first argument`);
        return null;
    }
    const arr = ctx.arrays.get(name);
    if (arr === undefined) {
        if (ctx.strict)
            throw new Error(`Runtime error: ${op} on unknown array "${name}"`);
        return null;
    }
    return arr;
};
// --- loops ---
const evalCondOrCallable = (arg, callable, ctx) => {
    if (callable !== null)
        return callCallable(callable, [], ctx);
    return evalArg(arg, ctx);
};
const stdlibWhile = (args, ctx) => {
    if (args.length < 2)
        return 0;
    const cond = resolveCallable(args[0], ctx);
    const body = resolveCallable(args[1], ctx);
    let last = 0;
    while (true) {
        const c = evalCondOrCallable(args[0], cond, ctx);
        if (ctx.context.status !== 'completed')
            return 0;
        if (c === 0)
            break;
        last = evalCondOrCallable(args[1], body, ctx);
        if (ctx.context.status !== 'completed')
            return 0;
    }
    return last;
};
const stdlibFor = (args, ctx) => {
    if (args.length < 3)
        return 0;
    const init = resolveCallable(args[0], ctx);
    const cond = resolveCallable(args[1], ctx);
    const body = resolveCallable(args[2], ctx);
    evalCondOrCallable(args[0], init, ctx);
    if (ctx.context.status !== 'completed')
        return 0;
    let last = 0;
    while (true) {
        const c = evalCondOrCallable(args[1], cond, ctx);
        if (ctx.context.status !== 'completed')
            return 0;
        if (c === 0)
            break;
        last = evalCondOrCallable(args[2], body, ctx);
        if (ctx.context.status !== 'completed')
            return 0;
    }
    return last;
};
const stdlibDoWhile = (args, ctx) => {
    if (args.length < 2)
        return 0;
    const body = resolveCallable(args[0], ctx);
    const cond = resolveCallable(args[1], ctx);
    let last = 0;
    while (true) {
        last = evalCondOrCallable(args[0], body, ctx);
        if (ctx.context.status !== 'completed')
            return 0;
        const c = evalCondOrCallable(args[1], cond, ctx);
        if (ctx.context.status !== 'completed')
            return 0;
        if (c === 0)
            break;
    }
    return last;
};
stdlibRegistry.set('while', { category: 'loops', fn: stdlibWhile });
stdlibRegistry.set('for', { category: 'loops', fn: stdlibFor });
stdlibRegistry.set('dowhile', { category: 'loops', fn: stdlibDoWhile });
// --- arrays ---
const stdlibForeach = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'foreach', ctx);
    if (arr === null)
        return 0;
    const cb = resolveCallable(args[1], ctx);
    if (cb === null)
        return 0;
    let last = 0;
    for (let i = 1; i < arr.length; i++) {
        last = callCallable(cb, [arr[i], i], ctx);
        if (ctx.context.status !== 'completed')
            return 0;
    }
    return last;
};
const stdlibMapMut = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'mapmut', ctx);
    if (arr === null)
        return 0;
    const cb = resolveCallable(args[1], ctx);
    if (cb === null)
        return arr[0];
    for (let i = 1; i < arr.length; i++) {
        arr[i] = callCallable(cb, [arr[i], i], ctx);
        if (ctx.context.status !== 'completed')
            return 0;
    }
    return arr[0];
};
const stdlibMap = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'map', ctx);
    if (arr === null)
        return 0;
    const out = new Float64Array(arr.length);
    out[0] = arr[0];
    const cb = resolveCallable(args[1], ctx);
    if (cb !== null) {
        for (let i = 1; i < arr.length; i++) {
            out[i] = callCallable(cb, [arr[i], i], ctx);
            if (ctx.context.status !== 'completed')
                return 0;
        }
    }
    else {
        for (let i = 1; i < arr.length; i++)
            out[i] = arr[i];
    }
    // Hand the new array off via the caller's stack frame so that
    // `result = map(arr, fn)` assigns it like a normal arrayCreate.
    ctx.frame.newArray = out;
    return out[0];
};
const stdlibReduce = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'reduce', ctx);
    if (arr === null)
        return 0;
    const cb = resolveCallable(args[1], ctx);
    if (cb === null)
        return 0;
    let acc = args.length >= 3 ? evalArg(args[2], ctx) : 0;
    if (ctx.context.status !== 'completed')
        return 0;
    for (let i = 1; i < arr.length; i++) {
        acc = callCallable(cb, [acc, arr[i], i], ctx);
        if (ctx.context.status !== 'completed')
            return 0;
    }
    return acc;
};
const stdlibSort = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'sort', ctx);
    if (arr === null)
        return 0;
    const size = arr[0] | 0;
    const slice = new Array(size);
    for (let i = 0; i < size; i++)
        slice[i] = arr[i + 1];
    const cb = args.length >= 2 ? resolveCallable(args[1], ctx) : null;
    if (cb !== null) {
        slice.sort((a, b) => callCallable(cb, [a, b], ctx));
    }
    else {
        slice.sort((a, b) => a - b);
    }
    if (ctx.context.status !== 'completed')
        return 0;
    for (let i = 0; i < size; i++)
        arr[i + 1] = slice[i];
    return arr[0];
};
const stdlibSum = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'sum', ctx);
    if (arr === null)
        return 0;
    let s = 0;
    for (let i = 1; i < arr.length; i++)
        s += arr[i];
    return s;
};
const stdlibFind = (args, ctx) => {
    const arr = requireArray(resolveArrayName(args[0]), 'find', ctx);
    if (arr === null)
        return 0;
    const cb = resolveCallable(args[1], ctx);
    if (cb === null)
        return 0;
    for (let i = 1; i < arr.length; i++) {
        const r = callCallable(cb, [arr[i], i], ctx);
        if (ctx.context.status !== 'completed')
            return 0;
        if (r !== 0)
            return i;
    }
    return 0;
};
stdlibRegistry.set('foreach', { category: 'arrays', fn: stdlibForeach });
stdlibRegistry.set('mapmut', { category: 'arrays', fn: stdlibMapMut });
stdlibRegistry.set('map', { category: 'arrays', fn: stdlibMap });
stdlibRegistry.set('reduce', { category: 'arrays', fn: stdlibReduce });
stdlibRegistry.set('sort', { category: 'arrays', fn: stdlibSort });
stdlibRegistry.set('sum', { category: 'arrays', fn: stdlibSum });
stdlibRegistry.set('find', { category: 'arrays', fn: stdlibFind });
export class Trace {
    body;
    tokens;
    params;
    stackSize;
    static logger = console.log;
    static errorLogger = console.error;
    logger = Trace.logger;
    errorLogger = Trace.errorLogger;
    lastRunTime = 0;
    lastRunSteps = 0;
    lastRunStatus = 'completed';
    callParams = [];
    vars = null;
    functions = null;
    arrays = null;
    constructor(body, tokens, params, stackSize) {
        this.body = body;
        this.tokens = tokens;
        this.params = params;
        this.stackSize = stackSize;
    }
    static parse(s) {
        const preprocessed = s.replace(/#[^\n]*/g, '').replace(/\s/g, '');
        let stringLeft = preprocessed;
        const tokens = [];
        let findOperator = false;
        let loi = [0]; // last operator index was too long to keep typing
        let groupLevel = 0;
        let stackSize = 0;
        let params = [];
        const groupLevels = [];
        let match = null;
        if (stringLeft.length === 0) {
            return new Trace(preprocessed, tokens, params, stackSize);
        }
        // script parameters
        match = /^\[((,?[a-zA-Z_][\w]*)*),?(\.\.\.)?\]/.exec(stringLeft);
        if (match !== null) {
            params = match[1] ? match[1].split(',') : [];
            stackSize = match[3] === '...' ? -1 : params.length + 1;
            stringLeft = stringLeft.substring(match[0].length);
        }
        else {
            match = /^\[([0-9]+)\]/.exec(stringLeft);
            if (match !== null) {
                stackSize = parseInt(match[1], 10);
                stringLeft = stringLeft.substring(match[0].length);
            }
        }
        for (;;) {
            // scan and parse
            let kind = 0 /* TokenKind.null */;
            const ops = findOperator ? operators : operands;
            let matched = null;
            for (let i = 0; i < ops.length; i++) {
                const o = ops[i];
                if (o.regex !== undefined) {
                    const m = o.regex.exec(stringLeft);
                    if (m !== null) {
                        matched = m[0];
                        kind = o.kind;
                        break;
                    }
                }
                else if (o.scan !== undefined) {
                    const m = o.scan(stringLeft);
                    if (m !== null) {
                        matched = m;
                        kind = o.kind;
                        break;
                    }
                }
            }
            if (matched === null) {
                const offset = preprocessed.length - stringLeft.length;
                const contextStart = Math.max(0, offset - 20);
                const snippet = preprocessed.substring(contextStart, offset + 30);
                const col = offset - contextStart;
                throw new Error(`Syntax error at offset ${offset}: unexpected ${findOperator ? 'operator' : 'operand'}\n  ${snippet}\n  ${' '.repeat(col)}^`);
            }
            // Code block sugar: `{ body }` becomes anonymous function `() => { body }`.
            // The scan rule already mapped it to TokenKind.aFunction; rewrite the
            // matched string so downstream handling sees a complete function token.
            if (kind === 13 /* TokenKind.aFunction */ && matched[0] === '{') {
                matched = '()=>' + matched;
            }
            // remove consumed text from string
            stringLeft = stringLeft.substring(matched.length);
            if (kind === 50 /* TokenKind.beep */) {
                tokens.push({
                    kind: 50 /* TokenKind.beep */,
                    value: NaN,
                    string: matched.substring(1, matched.length - 1)
                });
                // see if parsing is done
                if (stringLeft.length === 0) {
                    // close all remaining parenthesis
                    while (groupLevel > 0) {
                        groupLevel--;
                        tokens.push({ kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                    }
                    return new Trace(preprocessed, tokens, params, stackSize);
                }
                continue;
            }
            if (params.length > 0 && kind === 1 /* TokenKind.variable */) {
                const iof = params.indexOf(matched);
                if (iof !== -1) {
                    // variable references a parameter
                    tokens.push({
                        kind: 2 /* TokenKind.pointer */,
                        value: NaN,
                        string: '&'
                    });
                    kind = 3 /* TokenKind.literal */;
                    matched = (iof + 1).toFixed(0);
                }
            }
            // parenthesis insertion
            if (findOperator && kind !== 10 /* TokenKind.endGroup */ && kind !== 48 /* TokenKind.statement */ && kind !== 49 /* TokenKind.separator */ && kind !== 44 /* TokenKind.increment */ && kind !== 45 /* TokenKind.decrement */) {
                // automatically insert parenthesis for order of operations
                const opLevel = opLevels.has(kind) ? opLevels.get(kind) : 0;
                while (groupLevel < opLevel) {
                    groupLevel++;
                    tokens.splice(loi[loi.length - 1], 0, { kind: 9 /* TokenKind.startGroup */, value: NaN, string: '(' });
                }
                while (groupLevel > opLevel) {
                    groupLevel--;
                    tokens.push({ kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                loi[loi.length - 1] = tokens.length + 1;
            }
            if (kind === 10 /* TokenKind.endGroup */) {
                loi.pop();
                while (groupLevel > 0) {
                    groupLevel--;
                    tokens.push({ kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                groupLevel = groupLevels.pop();
            }
            else if (kind === 9 /* TokenKind.startGroup */) {
                loi.push(tokens.length + 1);
                groupLevels.push(groupLevel);
                groupLevel = 0;
            }
            else if (kind === 48 /* TokenKind.statement */ || kind === 49 /* TokenKind.separator */) {
                // automatically close all remaining parenthesis on new statement
                while (groupLevel > 0) {
                    groupLevel--;
                    tokens.push({ kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                loi[0] = tokens.length + 1;
            }
            // determine what to find next
            if (kind === 10 /* TokenKind.endGroup */ || kind === 44 /* TokenKind.increment */ || kind === 45 /* TokenKind.decrement */) {
                // kinds of tokens that lead into operators
                findOperator = true;
            }
            else if (intoOperands.has(kind)) {
                // kinds of tokens that lead into operands
                findOperator = false;
            }
            else {
                findOperator = !findOperator;
            }
            // push the token
            const token = {
                kind,
                value: parseFloat(matched),
                string: matched
            };
            if (kind === 5 /* TokenKind.literalArray */) {
                token.parsedValues = matched.split('|').map(parseFloat);
            }
            else if (kind === 11 /* TokenKind.functionCall */ || kind === 12 /* TokenKind.tailCall */) {
                const callArgStrings = parseCallArgs(matched);
                if (callArgStrings.length > 0) {
                    token.parsedArgs = callArgStrings.map(arg => Trace.parse(arg));
                }
            }
            else if (kind === 47 /* TokenKind.arrayRead */) {
                const bracketPos = matched.indexOf('[');
                const indexSrc = matched.substring(bracketPos + 1, matched.length - 1);
                if (indexSrc.length > 0) {
                    token.parsedArgs = [Trace.parse(indexSrc)];
                }
                token.string = matched.substring(0, bracketPos);
            }
            else if (kind === 46 /* TokenKind.arrayCreate */) {
                const sizeSrc = matched.substring(1, matched.length - 1);
                if (sizeSrc.length > 0) {
                    token.parsedArgs = [Trace.parse(sizeSrc)];
                }
            }
            tokens.push(token);
            // see if parsing is done
            if (stringLeft.length === 0) {
                // close all remaining parenthesis
                while (groupLevel > 0) {
                    groupLevel--;
                    tokens.push({ kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                return new Trace(preprocessed, tokens, params, stackSize);
            }
        }
    }
    run(args = [], variables = null, vars = null, functions = null, arrays = null, rand = Math.random, executionLimit = 1000, executionStart = performance.now(), maxSteps = Number.POSITIVE_INFINITY, context = { startedAt: executionStart, steps: 0, status: 'completed' }, strict = false, stdlibCategories = defaultStdlibCategories) {
        const frames = [];
        let fn = '';
        let script = '';
        let tc = false;
        let value = null;
        let stackSize = this.stackSize === -1 ? args.length + 1 : this.stackSize;
        let f = new StackFrame(this.tokens, stackSize);
        let stack = f.stack;
        if (stackSize > 0) {
            stack[0] = stackSize - 1;
            for (let i = 0; i < stackSize && i < args.length; i++) {
                stack[i + 1] = +args[i];
            }
        }
        frames.push(f);
        if (vars === null) {
            if (this.vars === null) {
                this.vars = new Map();
            }
            vars = this.vars;
        }
        if (functions === null) {
            if (this.functions === null) {
                this.functions = new Map();
            }
            functions = this.functions;
        }
        if (arrays === null) {
            if (this.arrays === null) {
                this.arrays = new Map();
            }
            arrays = this.arrays;
        }
        if (variables !== null) {
            for (const v of Object.getOwnPropertyNames(variables)) {
                vars.set(v, +variables[v]);
            }
        }
        let nextTimeoutCheck = context.steps + 1024;
        callStack: while (frames.length > 0) {
            f = frames.pop();
            for (; f.i < f.tokens.length; f.i++) {
                const t = f.tokens[f.i];
                let val = null;
                context.steps++;
                if (context.steps >= nextTimeoutCheck) {
                    nextTimeoutCheck = context.steps + 1024;
                    if (performance.now() - context.startedAt > executionLimit) {
                        this.errorLogger('Trace timed out');
                        context.status = 'timeout';
                        this.lastRunTime = performance.now() - context.startedAt;
                        this.lastRunSteps = context.steps;
                        this.lastRunStatus = context.status;
                        return 0;
                    }
                }
                if (context.steps > maxSteps) {
                    this.errorLogger('Trace exceeded step limit');
                    context.status = 'step-limit';
                    this.lastRunTime = performance.now() - context.startedAt;
                    this.lastRunSteps = context.steps;
                    this.lastRunStatus = context.status;
                    return 0;
                }
                switch (t.kind) {
                    case 50 /* TokenKind.beep */:
                        // beeps are the logging feature
                        if (t.string.startsWith('&') && t.string.length > 1) {
                            const s = f.stack;
                            if (/[0-9]/.test(t.string[1])) {
                                this.logger('token ' + f.i + ':', '&' + t.string.substring(1), s !== null ? s[parseInt(t.string.substring(1), 10)] : undefined);
                            }
                            else {
                                const v = vars.get(t.string.substring(1)) ?? 0;
                                this.logger('token ' + f.i + ':', '&' + v, s !== null ? s[v] : undefined);
                            }
                        }
                        else if (t.string.startsWith('=')) {
                            this.logger('token ' + f.i + ':', t.string.substring(1), vars.get(t.string.substring(1)));
                        }
                        else {
                            this.logger('token ' + f.i + ':', t.string);
                        }
                        continue;
                    case 6 /* TokenKind.negate */:
                        f.sign = -1;
                        break;
                    case 2 /* TokenKind.pointer */:
                        f.ptr = true;
                        break;
                    case 8 /* TokenKind.plusminus */:
                        f.sign = rand() < 0.5 ? 1 : -1;
                        break;
                    case 7 /* TokenKind.not */:
                        f.not = true;
                        break;
                    case 9 /* TokenKind.startGroup */:
                        f.values.push(f.value);
                        f.lastValue = 0;
                        f.value = 0;
                        f.ops.push(f.operator);
                        f.operator = 17 /* TokenKind.add */;
                        break;
                    case 10 /* TokenKind.endGroup */:
                        val = f.value;
                        if (f.values.length > 0) {
                            f.value = f.values.pop();
                            f.lastValue = f.value;
                            f.operator = f.ops.pop();
                        }
                        else {
                            f.value = 0;
                            f.lastValue = 0;
                            f.operator = 17 /* TokenKind.add */;
                        }
                        break;
                    case 1 /* TokenKind.variable */:
                        if (strict && !vars.has(t.string) && !arrays.has(t.string) && !functions.has(t.string) && !writeTargets.has(f.tokens[f.i + 1]?.kind)) {
                            throw new Error(`Runtime error: unknown variable "${t.string}"`);
                        }
                        if (!vars.has(t.string) && functions.has(t.string)) {
                            f.valFn = functions.get(t.string);
                            val = 0;
                        }
                        else {
                            f.valFn = null;
                            val = vars.get(t.string) ?? arrays.get(t.string)?.[0] ?? 0;
                        }
                        f.lastVar = t.string;
                        f.pendingArray = '';
                        break;
                    case 4 /* TokenKind.percent */:
                        if (strict && !vars.has('value')) {
                            throw new Error('Runtime error: unknown variable "value"');
                        }
                        val = (vars.get('value') ?? 0) * (t.value * 0.01);
                        break;
                    case 3 /* TokenKind.literal */:
                        val = t.value;
                        break;
                    case 5 /* TokenKind.literalArray */: {
                        const pv = t.parsedValues;
                        val = pv[rand() * pv.length | 0];
                        break;
                    }
                    case 14 /* TokenKind.function */:
                    case 16 /* TokenKind.lambda */:
                    case 13 /* TokenKind.aFunction */:
                    case 15 /* TokenKind.aLambda */:
                        tc = t.string[0] === '>';
                        if (value !== null) {
                            // anonymous function returned
                            if (!tc) {
                                val = value;
                            }
                            value = null;
                            break;
                        }
                        fn = t.string.substring(tc ? 1 : 0, t.string.indexOf('('));
                        const callParams = parseParamList(t.string);
                        if (t.kind === 14 /* TokenKind.function */ || t.kind === 13 /* TokenKind.aFunction */) {
                            script = t.string.substring(t.string.indexOf('{') + 1, t.string.length - 1);
                        }
                        else {
                            script = t.string.substring(t.string.indexOf('>') + 1, t.string.endsWith(';') ? t.string.length - 1 : t.string.length);
                        }
                        if (fn !== '') {
                            // named function
                            const ms = Trace.parse(script);
                            ms.callParams = callParams;
                            functions.set(fn, ms);
                            break;
                        }
                        // anonymous function
                        const ms = Trace.parse(script);
                        const sf = new StackFrame(ms.tokens, 0);
                        // anonymous functions share stack with caller
                        sf.stack = f.stack;
                        if (!tc) {
                            frames.push(f);
                        }
                        // todo: var args
                        frames.push(sf);
                        continue callStack;
                    case 11 /* TokenKind.functionCall */:
                    case 12 /* TokenKind.tailCall */:
                        tc = t.string[0] === '>';
                        if (value !== null) {
                            // function returned
                            if (!tc) {
                                val = value;
                            }
                            value = null;
                            break;
                        }
                        fn = t.string.substring(tc ? 1 : 0, t.string.indexOf('('));
                        // Standard library dispatch — runs synchronously without pushing a
                        // frame, since each stdlib function controls its own execution.
                        {
                            const stdEntry = stdlibRegistry.get(fn);
                            if (stdEntry !== undefined && stdlibCategories.has(stdEntry.category)) {
                                const stdCtx = {
                                    vars, functions, arrays, rand,
                                    executionLimit, startedAt: context.startedAt, maxSteps,
                                    context, strict, stdlibCategories, frame: f
                                };
                                val = stdEntry.fn(t.parsedArgs ?? [], stdCtx);
                                if (context.status !== 'completed') {
                                    this.lastRunTime = performance.now() - context.startedAt;
                                    this.lastRunSteps = context.steps;
                                    this.lastRunStatus = context.status;
                                    return 0;
                                }
                                break;
                            }
                        }
                        if (functions.has(fn)) {
                            const ms = functions.get(fn);
                            const parsedArgs = t.parsedArgs;
                            for (let i = 0; i < ms.callParams.length; i++) {
                                const param = ms.callParams[i];
                                if (!paramNamePattern.test(param)) {
                                    throw new Error(`Syntax error: invalid function parameter "${param}"`);
                                }
                                const argTrace = parsedArgs?.[i];
                                // Bare function name as argument — pass the Trace reference directly
                                if (argTrace !== undefined && argTrace.tokens.length === 1 && argTrace.tokens[0].kind === 1 /* TokenKind.variable */) {
                                    const fnRef = functions.get(argTrace.tokens[0].string);
                                    if (fnRef !== undefined) {
                                        functions.set(param, fnRef);
                                        continue;
                                    }
                                }
                                const argValue = argTrace === undefined
                                    ? 0
                                    : argTrace.run([], null, vars, functions, arrays, rand, executionLimit, context.startedAt, maxSteps, context, strict, stdlibCategories);
                                if (context.status !== 'completed') {
                                    this.lastRunTime = performance.now() - context.startedAt;
                                    this.lastRunSteps = context.steps;
                                    this.lastRunStatus = context.status;
                                    return 0;
                                }
                                vars.set(param, +(argValue ?? 0));
                            }
                            if (!tc) {
                                frames.push(f);
                            }
                            frames.push(new StackFrame(ms.tokens, ms.stackSize === -1 ? 0 : ms.stackSize));
                            continue callStack;
                        }
                        else if (fn === '') {
                            const sf = new StackFrame(f.tokens, 0);
                            // anonymous functions share stack with caller
                            sf.stack = f.stack;
                            if (!tc) {
                                frames.push(f);
                            }
                            frames.push(sf);
                            continue callStack;
                        }
                        if (strict) {
                            throw new Error(`Runtime error: unknown function "${fn}"`);
                        }
                        val = 0;
                        break;
                    case 37 /* TokenKind.set */:
                    case 38 /* TokenKind.addSet */:
                    case 39 /* TokenKind.subSet */:
                    case 40 /* TokenKind.mulSet */:
                    case 41 /* TokenKind.divSet */:
                    case 42 /* TokenKind.modSet */:
                    case 43 /* TokenKind.powSet */:
                        f.operator = 17 /* TokenKind.add */;
                        f.setOp = t.kind;
                        f.setVar = f.lastVar;
                        f.arrayWrite = f.pendingArray !== '';
                        f.writeArray = f.pendingArray;
                        f.writeIndex = f.pendingIndex;
                        f.pendingArray = '';
                        f.value = f.lastValue;
                        continue;
                    case 44 /* TokenKind.increment */:
                        if (strict && !vars.has(f.lastVar)) {
                            throw new Error(`Runtime error: increment of undeclared variable "${f.lastVar}"`);
                        }
                        val = (vars.get(f.lastVar) ?? 0) + 1;
                        vars.set(f.lastVar, val);
                        f.value = f.lastValue;
                        break;
                    case 45 /* TokenKind.decrement */:
                        if (strict && !vars.has(f.lastVar)) {
                            throw new Error(`Runtime error: decrement of undeclared variable "${f.lastVar}"`);
                        }
                        val = (vars.get(f.lastVar) ?? 0) - 1;
                        vars.set(f.lastVar, val);
                        f.value = f.lastValue;
                        break;
                    case 47 /* TokenKind.arrayRead */: {
                        const arrName = t.string;
                        const indexTrace = t.parsedArgs?.[0];
                        const idxRaw = indexTrace === undefined ? 0 : (indexTrace.run([], null, vars, functions, arrays, rand, executionLimit, context.startedAt, maxSteps, context, strict, stdlibCategories) ?? 0);
                        if (context.status !== 'completed') {
                            this.lastRunTime = performance.now() - context.startedAt;
                            this.lastRunSteps = context.steps;
                            this.lastRunStatus = context.status;
                            return 0;
                        }
                        const idx = Math.trunc(idxRaw);
                        const arr = arrays.get(arrName);
                        if (idx === 0) {
                            val = arr !== undefined ? arr[0] : 0;
                        }
                        else if (arr !== undefined && idx >= 1 && idx < arr.length) {
                            val = arr[idx];
                        }
                        else {
                            if (strict && arr === undefined) {
                                throw new Error(`Runtime error: unknown array "${arrName}"`);
                            }
                            val = 0;
                        }
                        f.lastVar = arrName;
                        f.pendingArray = arrName;
                        f.pendingIndex = idx;
                        break;
                    }
                    case 46 /* TokenKind.arrayCreate */: {
                        const sizeTrace = t.parsedArgs?.[0];
                        const sizeRaw = sizeTrace === undefined ? 0 : (sizeTrace.run([], null, vars, functions, arrays, rand, executionLimit, context.startedAt, maxSteps, context, strict, stdlibCategories) ?? 0);
                        if (context.status !== 'completed') {
                            this.lastRunTime = performance.now() - context.startedAt;
                            this.lastRunSteps = context.steps;
                            this.lastRunStatus = context.status;
                            return 0;
                        }
                        const size = Math.max(0, Math.trunc(sizeRaw));
                        const newArr = new Float64Array(size + 1);
                        newArr[0] = size;
                        f.newArray = newArr;
                        val = size;
                        break;
                    }
                    case 48 /* TokenKind.statement */:
                    case 49 /* TokenKind.separator */:
                        closeStatement(f, vars, functions, arrays, strict);
                        f.lastValue = 0;
                        f.value = 0;
                        break;
                    case 33 /* TokenKind.ternaryTrue */:
                        f.operator = 17 /* TokenKind.add */;
                        if (f.value === 0) {
                            // false
                            let g = 0;
                            // skip true case
                            for (; f.i < f.tokens.length; f.i++) {
                                const kind = f.tokens[f.i].kind;
                                if (kind === 34 /* TokenKind.ternaryFalse */) {
                                    break;
                                }
                                if (kind === 48 /* TokenKind.statement */) {
                                    // statement token should be processed
                                    f.i--;
                                    break;
                                }
                                if (kind === 49 /* TokenKind.separator */) {
                                    f.i--;
                                    break;
                                }
                                if (kind === 9 /* TokenKind.startGroup */) {
                                    g++;
                                }
                                if (kind === 10 /* TokenKind.endGroup */) {
                                    g--;
                                    if (g < 0) {
                                        f.i--;
                                        break;
                                    }
                                }
                            }
                            continue;
                        }
                        // true
                        f.lastValue = 0;
                        f.value = 0;
                        break;
                    case 34 /* TokenKind.ternaryFalse */:
                        // only reaches this if parsing during ternary, skip false
                        let g = 0;
                        for (; f.i < f.tokens.length; f.i++) {
                            const kind = f.tokens[f.i].kind;
                            if (kind === 48 /* TokenKind.statement */) {
                                // statement token should be processed
                                f.i--;
                                break;
                            }
                            if (kind === 49 /* TokenKind.separator */) {
                                f.i--;
                                break;
                            }
                            if (kind === 9 /* TokenKind.startGroup */) {
                                g++;
                            }
                            if (kind === 10 /* TokenKind.endGroup */) {
                                g--;
                                if (g < 0) {
                                    f.i--;
                                    break;
                                }
                            }
                        }
                        continue;
                    default:
                        f.operator = t.kind;
                }
                if (val === null) {
                    // operator
                    continue;
                }
                //operand
                if (f.sign !== 1 || f.not || f.ptr) {
                    f.valFn = null;
                }
                val = val * f.sign;
                f.sign = 1;
                if (f.not) {
                    val = val === 0 ? 1 : 0;
                    f.not = false;
                }
                if (f.ptr) {
                    val = (f.stack === null || val < 0 || !Number.isFinite(val) || val >= f.stack.length) ? 0 : f.stack[val];
                    f.ptr = false;
                }
                f.lastValue = f.value;
                // Function ref only survives a plain add where both operands are zero
                if (f.operator !== 17 /* TokenKind.add */ || f.value !== 0 || val !== 0) {
                    f.valFn = null;
                }
                switch (f.operator) {
                    case 17 /* TokenKind.add */:
                        f.value = f.value + val;
                        break;
                    case 18 /* TokenKind.sub */:
                        f.value = f.value - val;
                        break;
                    case 19 /* TokenKind.mul */:
                        f.value = f.value * val;
                        break;
                    case 20 /* TokenKind.div */:
                        f.value = val === 0 ? 0 : f.value / val;
                        break;
                    case 21 /* TokenKind.mod */:
                        f.value = (val === 0 || !Number.isFinite(val)) ? 0 : f.value % val;
                        break;
                    case 22 /* TokenKind.pow */:
                        f.value = (f.value === 0 && val < 0) || !Number.isFinite(f.value) || !Number.isFinite(val) ? 0 : f.value ** val;
                        break;
                    case 23 /* TokenKind.range */:
                        f.value = f.value + rand() * (val - f.value);
                        break;
                    case 24 /* TokenKind.gt */:
                        f.value = f.value > val ? 1 : 0;
                        break;
                    case 25 /* TokenKind.lt */:
                        f.value = f.value < val ? 1 : 0;
                        break;
                    case 26 /* TokenKind.gteq */:
                        f.value = f.value >= val ? 1 : 0;
                        break;
                    case 27 /* TokenKind.lteq */:
                        f.value = f.value <= val ? 1 : 0;
                        break;
                    case 28 /* TokenKind.eq */:
                        f.value = f.value === val ? 1 : 0;
                        break;
                    case 29 /* TokenKind.neq */:
                        f.value = f.value !== val ? 1 : 0;
                        break;
                    case 30 /* TokenKind.or */:
                        f.value = f.value !== 0 || val !== 0 ? 1 : 0;
                        break;
                    case 31 /* TokenKind.and */:
                        f.value = f.value !== 0 && val !== 0 ? 1 : 0;
                        break;
                    case 32 /* TokenKind.xor */:
                        f.value = (f.value !== 0) !== (val !== 0) ? 1 : 0;
                        break;
                }
            }
            closeStatement(f, vars, functions, arrays, strict);
            value = f.value;
        }
        this.lastRunTime = performance.now() - context.startedAt;
        this.lastRunSteps = context.steps;
        this.lastRunStatus = context.status;
        return value;
    }
    runWithOptions(options = {}) {
        const vars = options.persist ? null : new Map();
        const functions = options.persist ? null : new Map();
        const arrays = options.persist ? null : new Map();
        const startedAt = performance.now();
        const context = {
            startedAt,
            steps: 0,
            status: 'completed'
        };
        const rand = options.rand ?? (options.randomSeed === undefined
            ? Math.random
            : createSeededRandom(options.randomSeed));
        let value = null;
        try {
            value = this.run(options.args ?? [], options.variables ?? null, vars, functions, arrays, rand, options.timeoutMs ?? 1000, startedAt, options.maxSteps ?? Number.POSITIVE_INFINITY, context, options.strict ?? false, resolveStdlibCategories(options.stdlib));
        }
        catch (e) {
            context.status = 'error';
            context.error = e instanceof Error ? e.message : String(e);
            this.lastRunTime = performance.now() - context.startedAt;
            this.lastRunSteps = context.steps;
            this.lastRunStatus = context.status;
        }
        return {
            value,
            steps: this.lastRunSteps,
            runtimeMs: this.lastRunTime,
            status: this.lastRunStatus,
            error: context.error
        };
    }
}
export const runTrace = (script, ...args) => {
    return Trace.parse(script).run(args);
};
export const runTraceWithOptions = (script, options = {}) => {
    return Trace.parse(script).runWithOptions(options);
};
//# sourceMappingURL=trace.js.map