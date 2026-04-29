// performance is available globally in Node.js (>=16) and browsers
// TODO: consider |> function calls
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
    TokenKind[TokenKind["statement"] = 46] = "statement";
    TokenKind[TokenKind["separator"] = 47] = "separator";
    TokenKind[TokenKind["beep"] = 48] = "beep";
})(TokenKind || (TokenKind = {}));
// find operand, [operator, operand]...
const operands = [
    {
        regex: /^@[^@]*@/,
        kind: 48 /* TokenKind.beep */
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
        regex: /^\([^)]*\)=>\{[^}]*\}/,
        kind: 13 /* TokenKind.aFunction */
    },
    {
        regex: /^\([^)]*\)=>[^;]*;?/,
        kind: 15 /* TokenKind.aLambda */
    },
    {
        regex: /^[a-zA-Z_][\w.]*\([^)]*\)=>\{[^}]*\}/,
        kind: 14 /* TokenKind.function */
    },
    {
        regex: /^[a-zA-Z_][\w.]*\([^)]*\)=>[^;]*;?/,
        kind: 16 /* TokenKind.lambda */
    },
    {
        regex: /^(?:[a-zA-Z_][\w.]*\([^(){};]*\)|\(\))/,
        kind: 11 /* TokenKind.functionCall */
    },
    {
        regex: /^>(?:[a-zA-Z_][\w.]*\([^(){};]*\)|\(\))/,
        kind: 12 /* TokenKind.tailCall */
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
        kind: 46 /* TokenKind.statement */
    },
    {
        regex: /^\(/,
        kind: 9 /* TokenKind.startGroup */
    },
    {
        regex: /^&/,
        kind: 2 /* TokenKind.pointer */
    }
];
const operators = [
    {
        regex: /^@[^@]*@/,
        kind: 48 /* TokenKind.beep */
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
        kind: 46 /* TokenKind.statement */
    },
    {
        regex: /^,/,
        kind: 47 /* TokenKind.separator */
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
const paramNamePattern = /^[a-zA-Z_][\w.]*$/;
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
    return source
        .substring(start + 1, end)
        .split(',')
        .map((arg) => arg.trim())
        .filter((arg) => arg.length > 0);
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
    sign = 1;
    not = false;
    ptr = false;
    i = 0;
    constructor(tokens, stackLength = 0) {
        this.tokens = tokens;
        this.stack = stackLength <= 0 ? null : new Float64Array(stackLength);
    }
}
const closeStatement = (f, vars) => {
    if (f.setVar === '') {
        return;
    }
    const varVal = vars.has(f.setVar) ? vars.get(f.setVar) : 0;
    switch (f.setOp) {
        case 37 /* TokenKind.set */:
            vars.set(f.setVar, f.value);
            break;
        case 38 /* TokenKind.addSet */:
            vars.set(f.setVar, varVal + f.value);
            break;
        case 39 /* TokenKind.subSet */:
            vars.set(f.setVar, varVal - f.value);
            break;
        case 40 /* TokenKind.mulSet */:
            vars.set(f.setVar, varVal * f.value);
            break;
        case 41 /* TokenKind.divSet */:
            vars.set(f.setVar, varVal / f.value);
            break;
        case 42 /* TokenKind.modSet */:
            vars.set(f.setVar, varVal % f.value);
            break;
        case 43 /* TokenKind.powSet */:
            vars.set(f.setVar, varVal ** f.value);
            break;
    }
    f.value = vars.get(f.setVar);
    f.setVar = '';
};
const intoOperands = new Set([
    14 /* TokenKind.function */,
    16 /* TokenKind.lambda */,
    46 /* TokenKind.statement */,
    47 /* TokenKind.separator */,
    2 /* TokenKind.pointer */,
    6 /* TokenKind.negate */,
    8 /* TokenKind.plusminus */,
    7 /* TokenKind.not */,
    9 /* TokenKind.startGroup */,
]);
const stdlib = new Map();
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
    callParams = [];
    vars = null;
    functions = null;
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
            params = match[1].split(',');
            stackSize = match[3] === '...' ? -1 : params.length;
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
            match = null;
            for (let i = 0; i < ops.length; i++) {
                const o = ops[i];
                match = o.regex.exec(stringLeft);
                if (match !== null) {
                    kind = o.kind;
                    break;
                }
            }
            if (match === null) {
                throw new Error(`Syntax error: unexpected ${findOperator ? 'operator' : 'operand'} "${stringLeft}"`);
            }
            // remove consumed text from string
            stringLeft = stringLeft.substring(match[0].length);
            if (kind === 48 /* TokenKind.beep */) {
                tokens.push({
                    kind: 48 /* TokenKind.beep */,
                    value: NaN,
                    string: match[0].substring(1, match[0].length - 1)
                });
                // see if parsing is done
                if (stringLeft.length === 0) {
                    // close all remaining parenthesis
                    while (groupLevel > 0) {
                        groupLevel--;
                        tokens.splice(tokens.length, 0, { kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                    }
                    return new Trace(preprocessed, tokens, params, stackSize);
                }
                continue;
            }
            if (params.length > 0 && kind === 1 /* TokenKind.variable */) {
                const iof = params.indexOf(match[0]);
                if (iof !== -1) {
                    // variable references a parameter
                    tokens.push({
                        kind: 2 /* TokenKind.pointer */,
                        value: NaN,
                        string: '&'
                    });
                    kind = 3 /* TokenKind.literal */;
                    match[0] = (iof + 1).toFixed(0);
                }
            }
            // parenthesis insertion
            if (findOperator && kind !== 10 /* TokenKind.endGroup */ && kind !== 46 /* TokenKind.statement */ && kind !== 47 /* TokenKind.separator */ && kind !== 44 /* TokenKind.increment */ && kind !== 45 /* TokenKind.decrement */) {
                // automatically insert parenthesis for order of operations
                const opLevel = opLevels.has(kind) ? opLevels.get(kind) : 0;
                while (groupLevel < opLevel) {
                    groupLevel++;
                    tokens.splice(loi[loi.length - 1], 0, { kind: 9 /* TokenKind.startGroup */, value: NaN, string: '(' });
                }
                while (groupLevel > opLevel) {
                    groupLevel--;
                    tokens.splice(tokens.length, 0, { kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                loi[loi.length - 1] = tokens.length + 1;
            }
            if (kind === 10 /* TokenKind.endGroup */) {
                loi.pop();
                while (groupLevel > 0) {
                    groupLevel--;
                    tokens.splice(tokens.length, 0, { kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                groupLevel = groupLevels.pop();
            }
            else if (kind === 9 /* TokenKind.startGroup */) {
                loi.push(tokens.length + 1);
                groupLevels.push(groupLevel);
                groupLevel = 0;
            }
            else if (kind === 46 /* TokenKind.statement */ || kind === 47 /* TokenKind.separator */) {
                // automatically close all remaining parenthesis on new statement
                while (groupLevel > 0) {
                    groupLevel--;
                    tokens.splice(tokens.length, 0, { kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
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
            tokens.push({
                kind,
                value: parseFloat(match[0]),
                string: match[0]
            });
            // see if parsing is done
            if (stringLeft.length === 0) {
                // close all remaining parenthesis
                while (groupLevel > 0) {
                    groupLevel--;
                    tokens.splice(tokens.length, 0, { kind: 10 /* TokenKind.endGroup */, value: NaN, string: ')' });
                }
                return new Trace(preprocessed, tokens, params, stackSize);
            }
        }
    }
    run(args = [], variables = null, vars = null, functions = null, rand = Math.random, executionLimit = 1000, executionStart = performance.now(), maxSteps = Number.POSITIVE_INFINITY) {
        const frames = [];
        let split = [];
        let fn = '';
        let script = '';
        let tc = false;
        let value = null;
        let steps = 0;
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
                this.functions = new Map(stdlib);
            }
            functions = this.functions;
        }
        if (variables !== null) {
            for (const v of Object.getOwnPropertyNames(variables)) {
                vars.set(v, +variables[v]);
            }
        }
        callStack: while (frames.length > 0) {
            f = frames.pop();
            for (; f.i < f.tokens.length; f.i++) {
                const t = f.tokens[f.i];
                let val = null;
                if (performance.now() - executionStart > executionLimit) {
                    this.errorLogger('Trace timed out');
                    this.lastRunTime = performance.now() - executionStart;
                    this.lastRunSteps = steps;
                    return 0;
                }
                steps++;
                if (steps > maxSteps) {
                    this.errorLogger('Trace exceeded step limit');
                    this.lastRunTime = performance.now() - executionStart;
                    this.lastRunSteps = steps;
                    return 0;
                }
                switch (t.kind) {
                    case 48 /* TokenKind.beep */:
                        // beeps are the logging feature
                        if (t.string.startsWith('&') && t.string.length > 1) {
                            if (/[0-9]/.test(t.string[1])) {
                                this.logger('token ' + f.i + ':', '&' + t.string.substring(1), f.stack[parseInt(t.string.substring(1), 10)]);
                            }
                            else {
                                const v = vars.get(t.string.substring(1));
                                this.logger('token ' + f.i + ':', '&' + v, f.stack[v]);
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
                        val = vars.has(t.string) ? vars.get(t.string) : 0;
                        f.lastVar = t.string;
                        break;
                    case 4 /* TokenKind.percent */:
                        val = vars.has('value') ? vars.get('value') * (t.value * 0.01) : 0;
                        break;
                    case 3 /* TokenKind.literal */:
                        val = t.value;
                        break;
                    case 5 /* TokenKind.literalArray */:
                        split = t.string.split('|');
                        val = parseFloat(split[rand() * split.length | 0]);
                        break;
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
                        if (functions.has(fn)) {
                            const ms = functions.get(fn);
                            const callArgs = parseCallArgs(t.string);
                            for (let i = 0; i < ms.callParams.length; i++) {
                                const param = ms.callParams[i];
                                if (!paramNamePattern.test(param)) {
                                    throw new Error(`Syntax error: invalid function parameter "${param}"`);
                                }
                                const arg = callArgs[i];
                                const argValue = arg === undefined
                                    ? 0
                                    : Trace.parse(arg).run([], null, vars, functions, rand, executionLimit, executionStart, maxSteps);
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
                        f.value = f.lastValue;
                        continue;
                    case 44 /* TokenKind.increment */:
                        val = (vars.has(f.lastVar) ? vars.get(f.lastVar) : 0) + 1;
                        vars.set(f.lastVar, val);
                        f.value = f.lastValue;
                        break;
                    case 45 /* TokenKind.decrement */:
                        val = (vars.has(f.lastVar) ? vars.get(f.lastVar) : 0) - 1;
                        vars.set(f.lastVar, val);
                        f.value = f.lastValue;
                        break;
                    case 46 /* TokenKind.statement */:
                    case 47 /* TokenKind.separator */:
                        closeStatement(f, vars);
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
                                if (kind === 46 /* TokenKind.statement */) {
                                    // statement token should be processed
                                    f.i--;
                                    break;
                                }
                                if (kind === 47 /* TokenKind.separator */) {
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
                            if (kind === 46 /* TokenKind.statement */) {
                                // statement token should be processed
                                f.i--;
                                break;
                            }
                            if (kind === 47 /* TokenKind.separator */) {
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
            closeStatement(f, vars);
            value = f.value;
        }
        this.lastRunTime = performance.now() - executionStart;
        this.lastRunSteps = steps;
        return value;
    }
    runWithOptions(options = {}) {
        const value = this.run(options.args ?? [], options.variables ?? null, null, null, options.rand ?? Math.random, options.timeoutMs ?? 1000, performance.now(), options.maxSteps ?? Number.POSITIVE_INFINITY);
        return {
            value,
            steps: this.lastRunSteps,
            runtimeMs: this.lastRunTime
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