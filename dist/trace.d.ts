declare const enum TokenKind {
    null = 0,
    variable = 1,
    pointer = 2,
    literal = 3,
    percent = 4,
    literalArray = 5,
    negate = 6,
    not = 7,
    plusminus = 8,// plus or minus (random)
    startGroup = 9,
    endGroup = 10,
    functionCall = 11,
    tailCall = 12,
    aFunction = 13,
    function = 14,
    aLambda = 15,
    lambda = 16,
    add = 17,
    sub = 18,
    mul = 19,
    div = 20,
    mod = 21,
    pow = 22,
    range = 23,
    gt = 24,
    lt = 25,
    gteq = 26,
    lteq = 27,
    eq = 28,
    neq = 29,
    or = 30,
    and = 31,
    xor = 32,
    ternaryTrue = 33,
    ternaryFalse = 34,
    blockStart = 35,
    blockEnd = 36,
    set = 37,
    addSet = 38,
    subSet = 39,
    mulSet = 40,
    divSet = 41,
    modSet = 42,
    powSet = 43,
    increment = 44,
    decrement = 45,
    arrayCreate = 46,
    arrayRead = 47,
    statement = 48,
    separator = 49,
    beep = 50
}
type TraceToken = {
    kind: TokenKind;
    value: number;
    string: string;
    parsedArgs?: Trace[];
    parsedValues?: number[];
    callable?: {
        trace: Trace;
        params: string[];
    };
};
export type TraceStdlibCategory = 'loops' | 'arrays';
export type TraceStdlibOptions = {
    loops?: boolean;
    arrays?: boolean;
};
export type TraceRunOptions = {
    args?: number[];
    variables?: {
        [s: string]: number;
    };
    rand?: () => number;
    randomSeed?: number;
    timeoutMs?: number;
    maxSteps?: number;
    persist?: boolean;
    strict?: boolean;
    stdlib?: TraceStdlibOptions | boolean;
};
export type TraceRunStatus = 'completed' | 'timeout' | 'step-limit' | 'error';
export type TraceRunResult = {
    value: number | null;
    steps: number;
    runtimeMs: number;
    status: TraceRunStatus;
    error?: string;
};
type TraceRunContext = {
    startedAt: number;
    steps: number;
    status: TraceRunStatus;
    error?: string;
};
export declare class Trace {
    body: string;
    tokens: TraceToken[];
    params: string[];
    stackSize: number;
    static logger: (...data: any[]) => void;
    static errorLogger: (...data: any[]) => void;
    logger: (...data: any[]) => void;
    errorLogger: (...data: any[]) => void;
    lastRunTime: number;
    lastRunSteps: number;
    lastRunStatus: TraceRunStatus;
    callParams: string[];
    vars: (Map<string, number> | null);
    functions: (Map<string, Trace> | null);
    arrays: (Map<string, Float64Array> | null);
    constructor(body: string, tokens: TraceToken[], params: string[], stackSize: number);
    static parse(s: string): Trace;
    run(args?: number[], variables?: ({
        [s: string]: number;
    } | null), vars?: (Map<string, number> | null), functions?: (Map<string, Trace> | null), arrays?: (Map<string, Float64Array> | null), rand?: () => number, executionLimit?: number, executionStart?: number, maxSteps?: number, context?: TraceRunContext, strict?: boolean, stdlibCategories?: ReadonlySet<TraceStdlibCategory>): number | null;
    runWithOptions(options?: TraceRunOptions): TraceRunResult;
}
export declare const runTrace: (script: string, ...args: number[]) => number | null;
export declare const runTraceWithOptions: (script: string, options?: TraceRunOptions) => TraceRunResult;
export {};
//# sourceMappingURL=trace.d.ts.map