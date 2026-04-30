// performance is available globally in Node.js (>=16) and browsers

// TODO: consider |> function calls
const enum TokenKind {
  null,

  variable,
  pointer,
  literal,
  percent,
  literalArray,

  negate,
  not,
  plusminus, // plus or minus (random)

  startGroup,
  endGroup,

  functionCall,
  tailCall,
  aFunction,
  function,
  aLambda,
  lambda,

  add,
  sub,
  mul,
  div,
  mod,
  pow,
  range,

  gt,
  lt,
  gteq,
  lteq,
  eq,
  neq,
  or,
  and,
  xor,

  ternaryTrue,
  ternaryFalse,
  blockStart,
  blockEnd,

  set,
  addSet,
  subSet,
  mulSet,
  divSet,
  modSet,
  powSet,
  increment,
  decrement,

  arrayCreate,
  arrayRead,

  statement,
  separator,
  beep,
}

// find operand, [operator, operand]...
const operands = [
  {
    regex: /^@[^@]*@/,
    kind: TokenKind.beep
  },
  {
    regex: /^-/,
    kind: TokenKind.negate
  },
  {
    regex: /^\+-/,
    kind: TokenKind.plusminus
  },
  {
    regex: /^!/,
    kind: TokenKind.not
  },
  {
    regex: /^\([^)]*\)=>\{[^}]*\}/,
    kind: TokenKind.aFunction
  },
  {
    regex: /^\([^)]*\)=>[^;]*;?/,
    kind: TokenKind.aLambda
  },
  {
    regex: /^[a-zA-Z_][\w.]*\([^)]*\)=>\{[^}]*\}/,
    kind: TokenKind.function
  },
  {
    regex: /^[a-zA-Z_][\w.]*\([^)]*\)=>[^;]*;?/,
    kind: TokenKind.lambda
  },
  {
    regex: /^(?:[a-zA-Z_][\w.]*\((?:[^(){};]|\([^(){};]*\))*\)|\(\))/,
    kind: TokenKind.functionCall
  },
  {
    regex: /^>(?:[a-zA-Z_][\w.]*\((?:[^(){};]|\([^(){};]*\))*\)|\(\))/,
    kind: TokenKind.tailCall
  },
  {
    regex: /^[a-zA-Z_][\w.]*\[[^\]]*\]/,
    kind: TokenKind.arrayRead
  },
  {
    regex: /^[a-zA-Z_][\w.]*/,
    kind: TokenKind.variable
  },
  {
    regex: /^-?[0-9.]+(\|-?[0-9.]+)+/,
    kind: TokenKind.literalArray
  },
  {
    regex: /^(-?[0-9.]+%(?!%)|-?[0-9.]+%(?=%%))/,
    kind: TokenKind.percent
  },
  {
    regex: /^-?[0-9.]+/,
    kind: TokenKind.literal
  },
  {
    regex: /^;/,
    kind: TokenKind.statement
  },
  {
    regex: /^\(/,
    kind: TokenKind.startGroup
  },
  {
    regex: /^\[[^\]]*\]/,
    kind: TokenKind.arrayCreate
  },
  {
    regex: /^&/,
    kind: TokenKind.pointer
  }
]

const operators = [
  {
    regex: /^@[^@]*@/,
    kind: TokenKind.beep
  },
  {
    regex: /^\+=/,
    kind: TokenKind.addSet
  },
  {
    regex: /^-=/,
    kind: TokenKind.subSet
  },
  {
    regex: /^\*\*=/,
    kind: TokenKind.powSet
  },
  {
    regex: /^\*=/,
    kind: TokenKind.mulSet
  },
  {
    regex: /^\/=/,
    kind: TokenKind.divSet
  },
  {
    regex: /^%%=/,
    kind: TokenKind.modSet
  },
  {
    regex: /^\+\+/,
    kind: TokenKind.increment
  },
  {
    regex: /^--/,
    kind: TokenKind.decrement
  },

  {
    regex: /^\+/,
    kind: TokenKind.add
  },
  {
    regex: /^-/,
    kind: TokenKind.sub
  },
  {
    regex: /^\*\*/,
    kind: TokenKind.pow
  },
  {
    regex: /^\*/,
    kind: TokenKind.mul
  },
  {
    regex: /^\//,
    kind: TokenKind.div
  },
  {
    regex: /^%%/,
    kind: TokenKind.mod
  },
  {
    regex: /^~/,
    kind: TokenKind.range
  },

  {
    regex: /^>=/,
    kind: TokenKind.gteq
  },
  {
    regex: /^<=/,
    kind: TokenKind.lteq
  },
  {
    regex: /^!=/,
    kind: TokenKind.neq
  },
  {
    regex: /^==/,
    kind: TokenKind.eq
  },
  {
    regex: /^</,
    kind: TokenKind.lt
  },
  {
    regex: /^>/,
    kind: TokenKind.gt
  },
  {
    regex: /^\|\|/,
    kind: TokenKind.or
  },
  {
    regex: /^&&/,
    kind: TokenKind.and
  },
  {
    regex: /^\^/,
    kind: TokenKind.xor
  },

  {
    regex: /^=/,
    kind: TokenKind.set
  },

  {
    regex: /^\?/,
    kind: TokenKind.ternaryTrue,
  },
  {
    regex: /^:/,
    kind: TokenKind.ternaryFalse,
  },
  {
    regex: /^{/,
    kind: TokenKind.blockStart
  },
  {
    regex: /^}/,
    kind: TokenKind.blockEnd
  },

  {
    regex: /^;/,
    kind: TokenKind.statement
  },
  {
    regex: /^,/,
    kind: TokenKind.separator
  },
  {
    regex: /^\)/,
    kind: TokenKind.endGroup
  },
]

const opLevels = new Map<TokenKind, number>()
for (const t of [TokenKind.range]) {
  opLevels.set(t, 5)
}
for (const t of [TokenKind.pow]) {
  opLevels.set(t, 4)
}
for (const t of [TokenKind.mul, TokenKind.div, TokenKind.mod]) {
  opLevels.set(t, 3)
}
for (const t of [TokenKind.add, TokenKind.sub]) {
  opLevels.set(t, 2)
}
for (const t of [TokenKind.gt, TokenKind.lt, TokenKind.gteq, TokenKind.lteq, TokenKind.eq, TokenKind.neq]) {
  opLevels.set(t, 1)
}

type TraceToken = { kind: TokenKind, value: number, string: string, parsedArgs?: Trace[], parsedValues?: number[] }

export type TraceRunOptions = {
  args?: number[]
  variables?: {[s: string]: number}
  rand?: () => number
  randomSeed?: number
  timeoutMs?: number
  maxSteps?: number
  persist?: boolean
  strict?: boolean
}

export type TraceRunStatus = 'completed' | 'timeout' | 'step-limit' | 'error'

export type TraceRunResult = {
  value: number | null
  steps: number
  runtimeMs: number
  status: TraceRunStatus
  error?: string
}

type TraceRunContext = {
  startedAt: number
  steps: number
  status: TraceRunStatus
  error?: string
}

const paramNamePattern = /^[a-zA-Z_][\w.]*$/

// Tokens that make the preceding variable a write target rather than a read,
// so the strict unknown-variable check can be deferred to the write site which
// provides a more specific error message.
const writeTargets = new Set([
  TokenKind.set, TokenKind.addSet, TokenKind.subSet, TokenKind.mulSet,
  TokenKind.divSet, TokenKind.modSet, TokenKind.powSet,
  TokenKind.increment, TokenKind.decrement,
])

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const parseParamList = (source: string) => {
  const start = source.indexOf('(')
  const end = source.indexOf(')', start + 1)
  if (start === -1 || end === -1 || end === start + 1) {
    return []
  }

  return source
    .substring(start + 1, end)
    .split(',')
    .map((param) => param.trim())
    .filter((param) => param.length > 0)
}

const parseCallArgs = (source: string) => {
  const start = source.indexOf('(')
  const end = source.lastIndexOf(')')
  if (start === -1 || end === -1 || end === start + 1) {
    return []
  }

  const args: string[] = []
  const argSource = source.substring(start + 1, end)
  let groupLevel = 0
  let argStart = 0

  for (let i = 0; i < argSource.length; i++) {
    const char = argSource[i]
    if (char === '(') {
      groupLevel++
    } else if (char === ')') {
      groupLevel--
    } else if (char === ',' && groupLevel === 0) {
      args.push(argSource.substring(argStart, i).trim())
      argStart = i + 1
    }
  }

  args.push(argSource.substring(argStart).trim())
  return args.filter((arg) => arg.length > 0)
}

class StackFrame {
  stack: (Float64Array | null)
  tokens: TraceToken[]
  value = 0
  lastValue = 0
  values: number[] = []
  operator = TokenKind.add
  ops: TokenKind[] = []
  setOp = TokenKind.add
  lastVar = ''
  setVar = ''
  pendingArray = ''    // array name from most recent arrayRead operand
  pendingIndex = 0     // index from most recent arrayRead operand
  writeArray = ''      // array name captured by assignment operator
  writeIndex = 0       // index captured by assignment operator
  arrayWrite = false
  newArray: (Float64Array | null) = null
  valFn: (Trace | null) = null
  sign: -1 | 1 = 1
  not = false
  ptr = false
  i = 0

  constructor(tokens: TraceToken[], stackLength = 0) {
    this.tokens = tokens
    this.stack = stackLength <= 0 ? null : new Float64Array(stackLength)
  }
}
const applySetOp = (op: TokenKind, cur: number, val: number): number => {
  switch (op) {
  case TokenKind.set:    return val
  case TokenKind.addSet: return cur + val
  case TokenKind.subSet: return cur - val
  case TokenKind.mulSet: return cur * val
  case TokenKind.divSet: return val === 0 ? 0 : cur / val
  case TokenKind.modSet: return (val === 0 || !Number.isFinite(val)) ? 0 : cur % val
  case TokenKind.powSet: return cur ** val
  default:               return cur
  }
}

const closeStatement = (f: StackFrame, vars: Map<string, number>, functions: Map<string, Trace>, arrays: Map<string, Float64Array>, strict = false) => {
  if (f.newArray !== null) {
    if (f.setVar !== '') {
      arrays.set(f.setVar, f.newArray)
      f.value = f.newArray[0]
    }
    f.newArray = null
    f.setVar = ''
    f.pendingArray = ''
    f.arrayWrite = false
    f.valFn = null
    return
  }

  if (f.setVar === '') {
    f.pendingArray = ''
    f.arrayWrite = false
    f.valFn = null
    return
  }

  if (f.valFn !== null && f.setOp === TokenKind.set) {
    functions.set(f.setVar, f.valFn)
    f.value = 0
    f.setVar = ''
    f.valFn = null
    f.arrayWrite = false
    return
  }
  f.valFn = null

  if (f.arrayWrite) {
    const arr = arrays.get(f.writeArray)
    const idx = f.writeIndex
    if (arr !== undefined && idx >= 1 && idx < arr.length) {
      arr[idx] = applySetOp(f.setOp, arr[idx], f.value)
      f.value = arr[idx]
    } else if (strict) {
      if (arr === undefined) {
        throw new Error(`Runtime error: write to unknown array "${f.writeArray}"`)
      }
      throw new Error(`Runtime error: index ${idx} out of bounds for array "${f.writeArray}" (size ${arr[0]})`)
    }
    f.setVar = ''
    f.writeArray = ''
    f.arrayWrite = false
    return
  }

  if (strict && f.setOp !== TokenKind.set && !vars.has(f.setVar)) {
    throw new Error(`Runtime error: compound assignment to undeclared variable "${f.setVar}"`)
  }

  const newVal = applySetOp(f.setOp, vars.get(f.setVar) ?? 0, f.value)
  vars.set(f.setVar, newVal)
  f.value = newVal
  f.setVar = ''
  f.arrayWrite = false
}

const intoOperands = new Set([
  TokenKind.function,
  TokenKind.lambda,
  TokenKind.statement,
  TokenKind.separator,
  TokenKind.pointer,
  TokenKind.negate,
  TokenKind.plusminus,
  TokenKind.not,
  TokenKind.startGroup,
])

export class Trace {
  static logger = console.log
  static errorLogger = console.error

  logger = Trace.logger
  errorLogger = Trace.errorLogger

  lastRunTime = 0
  lastRunSteps = 0
  lastRunStatus: TraceRunStatus = 'completed'
  callParams: string[] = []
  vars: (Map<string, number> | null) = null
  functions: (Map<string, Trace> | null) = null
  arrays: (Map<string, Float64Array> | null) = null

  constructor(public body: string, public tokens: TraceToken[], public params: string[], public stackSize: number) {}

  static parse(s: string) {
    const preprocessed = s.replace(/#[^\n]*/g, '').replace(/\s/g, '')
    let stringLeft = preprocessed
    const tokens: TraceToken[] = []
    let findOperator = false
    let loi = [0] // last operator index was too long to keep typing
    let groupLevel = 0
    let stackSize = 0
    let params: string[] = []
    const groupLevels: number[] = []
    let match: (RegExpExecArray | null) = null

    if (stringLeft.length === 0) {
      return new Trace(preprocessed, tokens, params, stackSize)
    }

    // script parameters
    match = /^\[((,?[a-zA-Z_][\w]*)*),?(\.\.\.)?\]/.exec(stringLeft)
    if (match !== null) {
      params = match[1] ? match[1].split(',') : []
      stackSize = match[3] === '...' ? -1 : params.length + 1
      stringLeft = stringLeft.substring(match[0].length)
    } else {
      match = /^\[([0-9]+)\]/.exec(stringLeft)
      if (match !== null) {
        stackSize = parseInt(match[1], 10)
        stringLeft = stringLeft.substring(match[0].length)
      }
    }

    for (;;) {
      // scan and parse
      let kind = TokenKind.null
      const ops = findOperator ? operators : operands
      match = null

      for (let i = 0; i < ops.length; i++) {
        const o = ops[i]
        match = o.regex.exec(stringLeft)
        if (match !== null) {
          kind = o.kind
          break
        }
      }
      if (match === null) {
        const offset = preprocessed.length - stringLeft.length
        const contextStart = Math.max(0, offset - 20)
        const snippet = preprocessed.substring(contextStart, offset + 30)
        const col = offset - contextStart
        throw new Error(
          `Syntax error at offset ${offset}: unexpected ${findOperator ? 'operator' : 'operand'}\n  ${snippet}\n  ${' '.repeat(col)}^`
        )
      }

      // remove consumed text from string
      stringLeft = stringLeft.substring(match[0].length)

      if (kind === TokenKind.beep) {
        tokens.push({
          kind: TokenKind.beep,
          value: NaN,
          string: match[0].substring(1, match[0].length - 1)
        })

        // see if parsing is done
        if (stringLeft.length === 0) {
          // close all remaining parenthesis
          while (groupLevel > 0) {
            groupLevel--
            tokens.push({ kind: TokenKind.endGroup, value: NaN, string: ')' })
          }

          return new Trace(preprocessed, tokens, params, stackSize)
        }
        continue
      }

      if (params.length > 0 && kind === TokenKind.variable) {
        const iof = params.indexOf(match[0])
        if (iof !== -1) {
          // variable references a parameter
          tokens.push({
            kind: TokenKind.pointer,
            value: NaN,
            string: '&'
          })
          kind = TokenKind.literal
          match[0] = (iof + 1).toFixed(0)
        }
      }

      // parenthesis insertion
      if (findOperator && kind !== TokenKind.endGroup && kind !== TokenKind.statement && kind !== TokenKind.separator && kind !== TokenKind.increment && kind !== TokenKind.decrement) {
        // automatically insert parenthesis for order of operations
        const opLevel = opLevels.has(kind) ? opLevels.get(kind) as number : 0
        while (groupLevel < opLevel) {
          groupLevel++
          tokens.splice(loi[loi.length - 1], 0, { kind: TokenKind.startGroup, value: NaN, string: '(' })
        }
        while (groupLevel > opLevel) {
          groupLevel--
          tokens.push({ kind: TokenKind.endGroup, value: NaN, string: ')' })
        }

        loi[loi.length - 1] = tokens.length + 1
      }

      if (kind === TokenKind.endGroup) {
        loi.pop()
        while (groupLevel > 0) {
          groupLevel--
          tokens.push({ kind: TokenKind.endGroup, value: NaN, string: ')' })
        }

        groupLevel = groupLevels.pop() as number
      } else if (kind === TokenKind.startGroup) {
        loi.push(tokens.length + 1)
        groupLevels.push(groupLevel)
        groupLevel = 0
      } else if (kind === TokenKind.statement || kind === TokenKind.separator) {
        // automatically close all remaining parenthesis on new statement
        while (groupLevel > 0) {
          groupLevel--
          tokens.push({ kind: TokenKind.endGroup, value: NaN, string: ')' })
        }

        loi[0] = tokens.length + 1
      }

      // determine what to find next
      if (kind === TokenKind.endGroup || kind === TokenKind.increment || kind === TokenKind.decrement) {
        // kinds of tokens that lead into operators
        findOperator = true
      } else if (intoOperands.has(kind)) {
        // kinds of tokens that lead into operands
        findOperator = false
      } else {
        findOperator = !findOperator
      }

      // push the token
      const token: TraceToken = {
        kind,
        value: parseFloat(match[0]),
        string: match[0]
      }
      if (kind === TokenKind.literalArray) {
        token.parsedValues = match[0].split('|').map(parseFloat)
      } else if (kind === TokenKind.functionCall || kind === TokenKind.tailCall) {
        const callArgStrings = parseCallArgs(match[0])
        if (callArgStrings.length > 0) {
          token.parsedArgs = callArgStrings.map(arg => Trace.parse(arg))
        }
      } else if (kind === TokenKind.arrayRead) {
        const bracketPos = match[0].indexOf('[')
        const indexSrc = match[0].substring(bracketPos + 1, match[0].length - 1)
        if (indexSrc.length > 0) {
          token.parsedArgs = [Trace.parse(indexSrc)]
        }
        token.string = match[0].substring(0, bracketPos)
      } else if (kind === TokenKind.arrayCreate) {
        const sizeSrc = match[0].substring(1, match[0].length - 1)
        if (sizeSrc.length > 0) {
          token.parsedArgs = [Trace.parse(sizeSrc)]
        }
      }
      tokens.push(token)

      // see if parsing is done
      if (stringLeft.length === 0) {
        // close all remaining parenthesis
        while (groupLevel > 0) {
          groupLevel--
          tokens.push({ kind: TokenKind.endGroup, value: NaN, string: ')' })
        }
        return new Trace(preprocessed, tokens, params, stackSize)
      }
    }
  }

  run(
    args: number[] = [],
    variables: ({[s: string]: number} | null) = null,
    vars: (Map<string, number> | null) = null,
    functions: (Map<string, Trace> | null) = null,
    arrays: (Map<string, Float64Array> | null) = null,
    rand: () => number = Math.random,
    executionLimit = 1000,
    executionStart: number = performance.now(),
    maxSteps = Number.POSITIVE_INFINITY,
    context: TraceRunContext = { startedAt: executionStart, steps: 0, status: 'completed' },
    strict = false
  ) {
    const frames = [] as StackFrame[]
    let fn = ''
    let script = ''
    let tc = false
    let value: (number | null) = null
    let stackSize = this.stackSize === -1 ? args.length + 1 : this.stackSize
    let f: StackFrame = new StackFrame(this.tokens, stackSize)
    let stack = f.stack as Float64Array

    if (stackSize > 0) {
      stack[0] = stackSize - 1

      for (let i = 0; i < stackSize && i < args.length; i++) {
        stack[i + 1] = +args[i]
      }
    }

    frames.push(f)

    if (vars === null) {
      if (this.vars === null) {
        this.vars = new Map<string, number>()
      }
      vars = this.vars
    }

    if (functions === null) {
      if (this.functions === null) {
        this.functions = new Map<string, Trace>()
      }
      functions = this.functions
    }

    if (arrays === null) {
      if (this.arrays === null) {
        this.arrays = new Map<string, Float64Array>()
      }
      arrays = this.arrays
    }

    if (variables !== null) {
      for (const v of Object.getOwnPropertyNames(variables)) {
        vars.set(v, +variables[v])
      }
    }

    let nextTimeoutCheck = context.steps + 1024

    callStack:
    while (frames.length > 0) {
      f = frames.pop() as StackFrame

      for (; f.i < f.tokens.length; f.i++) {
        const t = f.tokens[f.i]
        let val: (number | null) = null

        context.steps++
        if (context.steps >= nextTimeoutCheck) {
          nextTimeoutCheck = context.steps + 1024
          if (performance.now() - context.startedAt > executionLimit) {
            this.errorLogger('Trace timed out')
            context.status = 'timeout'
            this.lastRunTime = performance.now() - context.startedAt
            this.lastRunSteps = context.steps
            this.lastRunStatus = context.status
            return 0
          }
        }
        if (context.steps > maxSteps) {
          this.errorLogger('Trace exceeded step limit')
          context.status = 'step-limit'
          this.lastRunTime = performance.now() - context.startedAt
          this.lastRunSteps = context.steps
          this.lastRunStatus = context.status
          return 0
        }

        switch (t.kind) {
        case TokenKind.beep:
          // beeps are the logging feature
          if (t.string.startsWith('&') && t.string.length > 1) {
            const s = f.stack
            if (/[0-9]/.test(t.string[1])) {
              this.logger('token ' + f.i + ':', '&' + t.string.substring(1), s !== null ? s[parseInt(t.string.substring(1), 10)] : undefined)
            } else {
              const v = vars.get(t.string.substring(1)) ?? 0
              this.logger('token ' + f.i + ':', '&' + v, s !== null ? s[v] : undefined)
            }
          } else if (t.string.startsWith('=')) {
            this.logger('token ' + f.i + ':', t.string.substring(1), vars.get(t.string.substring(1)))
          } else {
            this.logger('token ' + f.i + ':', t.string)
          }
          continue

        case TokenKind.negate:
          f.sign = -1
          break

        case TokenKind.pointer:
          f.ptr = true
          break

        case TokenKind.plusminus:
          f.sign = rand() < 0.5 ? 1 : -1
          break

        case TokenKind.not:
          f.not = true
          break

        case TokenKind.startGroup:
          f.values.push(f.value)
          f.lastValue = 0
          f.value = 0
          f.ops.push(f.operator)
          f.operator = TokenKind.add
          break

        case TokenKind.endGroup:
          val = f.value
          if (f.values.length > 0) {
            f.value = f.values.pop() as number
            f.lastValue = f.value
            f.operator = f.ops.pop() as TokenKind
          } else {
            f.value = 0
            f.lastValue = 0
            f.operator = TokenKind.add
          }
          break

        case TokenKind.variable:
          if (strict && !vars.has(t.string) && !arrays.has(t.string) && !functions.has(t.string) && !writeTargets.has(f.tokens[f.i + 1]?.kind)) {
            throw new Error(`Runtime error: unknown variable "${t.string}"`)
          }
          if (!vars.has(t.string) && functions.has(t.string)) {
            f.valFn = functions.get(t.string) as Trace
            val = 0
          } else {
            f.valFn = null
            val = vars.get(t.string) ?? arrays.get(t.string)?.[0] ?? 0
          }
          f.lastVar = t.string
          f.pendingArray = ''
          break

        case TokenKind.percent:
          if (strict && !vars.has('value')) {
            throw new Error('Runtime error: unknown variable "value"')
          }
          val = (vars.get('value') ?? 0) * (t.value * 0.01)
          break

        case TokenKind.literal:
          val = t.value
          break

        case TokenKind.literalArray: {
          const pv = t.parsedValues as number[]
          val = pv[rand() * pv.length | 0]
          break
        }

        case TokenKind.function:
        case TokenKind.lambda:
        case TokenKind.aFunction:
        case TokenKind.aLambda:
          tc = t.string[0] === '>'
          if (value !== null) {
            // anonymous function returned
            if (!tc) {
              val = value
            }
            value = null
            break
          }

          fn = t.string.substring(tc ? 1 : 0, t.string.indexOf('('))
          const callParams = parseParamList(t.string)
          if (t.kind === TokenKind.function || t.kind === TokenKind.aFunction) {
            script = t.string.substring(t.string.indexOf('{') + 1, t.string.length - 1)
          } else {
            script = t.string.substring(t.string.indexOf('>') + 1, t.string.endsWith(';') ? t.string.length - 1 : t.string.length)
          }

          if (fn !== '') {
            // named function
            const ms = Trace.parse(script)
            ms.callParams = callParams
            functions.set(fn, ms)
            break
          }

          // anonymous function
          const ms = Trace.parse(script)
          const sf = new StackFrame(ms.tokens, 0)
          // anonymous functions share stack with caller
          sf.stack = f.stack
          if (!tc) {
            frames.push(f)
          }
          // todo: var args
          frames.push(sf)
          continue callStack

        case TokenKind.functionCall:
        case TokenKind.tailCall:
          tc = t.string[0] === '>'
          if (value !== null) {
            // function returned
            if (!tc) {
              val = value
            }
            value = null
            break
          }
          fn = t.string.substring(tc ? 1 : 0, t.string.indexOf('('))
          if (functions.has(fn)) {
            const ms = functions.get(fn) as Trace
            const parsedArgs = t.parsedArgs
            for (let i = 0; i < ms.callParams.length; i++) {
              const param = ms.callParams[i]
              if (!paramNamePattern.test(param)) {
                throw new Error(`Syntax error: invalid function parameter "${param}"`)
              }

              const argTrace = parsedArgs?.[i]

              // Bare function name as argument — pass the Trace reference directly
              if (argTrace !== undefined && argTrace.tokens.length === 1 && argTrace.tokens[0].kind === TokenKind.variable) {
                const fnRef = functions.get(argTrace.tokens[0].string)
                if (fnRef !== undefined) {
                  functions.set(param, fnRef)
                  continue
                }
              }

              const argValue = argTrace === undefined
                ? 0
                : argTrace.run([], null, vars, functions, arrays, rand, executionLimit, context.startedAt, maxSteps, context, strict)
              if (context.status !== 'completed') {
                this.lastRunTime = performance.now() - context.startedAt
                this.lastRunSteps = context.steps
                this.lastRunStatus = context.status
                return 0
              }
              vars.set(param, +(argValue ?? 0))
            }
            if (!tc) {
              frames.push(f)
            }
            frames.push(new StackFrame(ms.tokens, ms.stackSize === -1 ? 0 : ms.stackSize))
            continue callStack
          } else if (fn === '') {
            const sf = new StackFrame(f.tokens, 0)
            // anonymous functions share stack with caller
            sf.stack = f.stack
            if (!tc) {
              frames.push(f)
            }
            frames.push(sf)
            continue callStack
          }
          if (strict) {
            throw new Error(`Runtime error: unknown function "${fn}"`)
          }
          val = 0
          break

        case TokenKind.set:
        case TokenKind.addSet:
        case TokenKind.subSet:
        case TokenKind.mulSet:
        case TokenKind.divSet:
        case TokenKind.modSet:
        case TokenKind.powSet:
          f.operator = TokenKind.add
          f.setOp = t.kind
          f.setVar = f.lastVar
          f.arrayWrite = f.pendingArray !== ''
          f.writeArray = f.pendingArray
          f.writeIndex = f.pendingIndex
          f.pendingArray = ''
          f.value = f.lastValue
          continue

        case TokenKind.increment:
          if (strict && !vars.has(f.lastVar)) {
            throw new Error(`Runtime error: increment of undeclared variable "${f.lastVar}"`)
          }
          val = (vars.get(f.lastVar) ?? 0) + 1
          vars.set(f.lastVar, val)
          f.value = f.lastValue
          break

        case TokenKind.decrement:
          if (strict && !vars.has(f.lastVar)) {
            throw new Error(`Runtime error: decrement of undeclared variable "${f.lastVar}"`)
          }
          val = (vars.get(f.lastVar) ?? 0) - 1
          vars.set(f.lastVar, val)
          f.value = f.lastValue
          break

        case TokenKind.arrayRead: {
          const arrName = t.string
          const indexTrace = t.parsedArgs?.[0]
          const idxRaw = indexTrace === undefined ? 0 : (
            indexTrace.run([], null, vars, functions, arrays, rand, executionLimit, context.startedAt, maxSteps, context, strict) ?? 0
          )
          if (context.status !== 'completed') {
            this.lastRunTime = performance.now() - context.startedAt
            this.lastRunSteps = context.steps
            this.lastRunStatus = context.status
            return 0
          }
          const idx = Math.trunc(idxRaw)
          const arr = arrays.get(arrName)
          if (idx === 0) {
            val = arr !== undefined ? arr[0] : 0
          } else if (arr !== undefined && idx >= 1 && idx < arr.length) {
            val = arr[idx]
          } else {
            if (strict && arr === undefined) {
              throw new Error(`Runtime error: unknown array "${arrName}"`)
            }
            val = 0
          }
          f.lastVar = arrName
          f.pendingArray = arrName
          f.pendingIndex = idx
          break
        }

        case TokenKind.arrayCreate: {
          const sizeTrace = t.parsedArgs?.[0]
          const sizeRaw = sizeTrace === undefined ? 0 : (
            sizeTrace.run([], null, vars, functions, arrays, rand, executionLimit, context.startedAt, maxSteps, context, strict) ?? 0
          )
          if (context.status !== 'completed') {
            this.lastRunTime = performance.now() - context.startedAt
            this.lastRunSteps = context.steps
            this.lastRunStatus = context.status
            return 0
          }
          const size = Math.max(0, Math.trunc(sizeRaw))
          const newArr = new Float64Array(size + 1)
          newArr[0] = size
          f.newArray = newArr
          val = size
          break
        }

        case TokenKind.statement:
        case TokenKind.separator:
          closeStatement(f, vars, functions, arrays, strict)
          f.lastValue = 0
          f.value = 0
          break

        case TokenKind.ternaryTrue:
          f.operator = TokenKind.add
          if (f.value === 0) {
            // false
            let g = 0
            // skip true case
            for (; f.i < f.tokens.length; f.i++) {
              const kind = f.tokens[f.i].kind
              if (kind === TokenKind.ternaryFalse) {
                break
              }
              if (kind === TokenKind.statement) {
                // statement token should be processed
                f.i--
                break
              }
              if (kind === TokenKind.separator) {
                f.i--
                break
              }
              if (kind === TokenKind.startGroup) {
                g++
              }
              if (kind === TokenKind.endGroup) {
                g--
                if (g < 0) {
                  f.i--
                  break
                }
              }
            }
            continue
          }

          // true
          f.lastValue = 0
          f.value = 0
          break

        case TokenKind.ternaryFalse:
          // only reaches this if parsing during ternary, skip false
          let g = 0
          for (; f.i < f.tokens.length; f.i++) {
            const kind = f.tokens[f.i].kind
            if (kind === TokenKind.statement) {
              // statement token should be processed
              f.i--
              break
            }
            if (kind === TokenKind.separator) {
              f.i--
              break
            }
            if (kind === TokenKind.startGroup) {
              g++
            }
            if (kind === TokenKind.endGroup) {
              g--
              if (g < 0) {
                f.i--
                break
              }
            }
          }
          continue

        default:
          f.operator = t.kind
        }

        if (val === null) {
          // operator
          continue
        }

        //operand
        if (f.sign !== 1 || f.not || f.ptr) {
          f.valFn = null
        }
        val = val * f.sign
        f.sign = 1
        if (f.not) {
          val = val === 0 ? 1 : 0
          f.not = false
        }
        if (f.ptr) {
          val = (f.stack === null || val < 0 || !Number.isFinite(val) || val >= f.stack.length) ? 0 : f.stack[val]
          f.ptr = false
        }
        f.lastValue = f.value

        // Function ref only survives a plain add where both operands are zero
        if (f.operator !== TokenKind.add || f.value !== 0 || val !== 0) {
          f.valFn = null
        }

        switch (f.operator) {
        case TokenKind.add:
          f.value = f.value + val
          break

        case TokenKind.sub:
          f.value = f.value - val
          break

        case TokenKind.mul:
          f.value = f.value * val
          break

        case TokenKind.div:
          f.value = val === 0 ? 0 : f.value / val
          break

        case TokenKind.mod:
          f.value = (val === 0 || !Number.isFinite(val)) ? 0 : f.value % val
          break

        case TokenKind.pow:
          f.value = (f.value === 0 && val < 0) || !Number.isFinite(f.value) || !Number.isFinite(val) ? 0 : f.value ** val
          break

        case TokenKind.range:
          f.value = f.value + rand() * (val - f.value)
          break

        case TokenKind.gt:
          f.value = f.value > val ? 1 : 0
          break

        case TokenKind.lt:
          f.value = f.value < val ? 1 : 0
          break

        case TokenKind.gteq:
          f.value = f.value >= val ? 1 : 0
          break

        case TokenKind.lteq:
          f.value = f.value <= val ? 1 : 0
          break

        case TokenKind.eq:
          f.value = f.value === val ? 1 : 0
          break

        case TokenKind.neq:
          f.value = f.value !== val ? 1 : 0
          break

        case TokenKind.or:
          f.value = f.value !== 0 || val !== 0 ? 1 : 0
          break

        case TokenKind.and:
          f.value = f.value !== 0 && val !== 0 ? 1 : 0
          break

        case TokenKind.xor:
          f.value = (f.value !== 0) !== (val !== 0) ? 1 : 0
          break
        }
      }

      closeStatement(f, vars, functions, arrays, strict)
      value = f.value
    }

    this.lastRunTime = performance.now() - context.startedAt
    this.lastRunSteps = context.steps
    this.lastRunStatus = context.status
    return value
  }

  runWithOptions(options: TraceRunOptions = {}): TraceRunResult {
    const vars = options.persist ? null : new Map<string, number>()
    const functions = options.persist ? null : new Map<string, Trace>()
    const arrays = options.persist ? null : new Map<string, Float64Array>()
    const startedAt = performance.now()
    const context: TraceRunContext = {
      startedAt,
      steps: 0,
      status: 'completed'
    }
    const rand = options.rand ?? (
      options.randomSeed === undefined
        ? Math.random
        : createSeededRandom(options.randomSeed)
    )

    let value: number | null = null

    try {
      value = this.run(
        options.args ?? [],
        options.variables ?? null,
        vars,
        functions,
        arrays,
        rand,
        options.timeoutMs ?? 1000,
        startedAt,
        options.maxSteps ?? Number.POSITIVE_INFINITY,
        context,
        options.strict ?? false
      )
    } catch (e) {
      context.status = 'error'
      context.error = e instanceof Error ? e.message : String(e)
      this.lastRunTime = performance.now() - context.startedAt
      this.lastRunSteps = context.steps
      this.lastRunStatus = context.status
    }

    return {
      value,
      steps: this.lastRunSteps,
      runtimeMs: this.lastRunTime,
      status: this.lastRunStatus,
      error: context.error
    }
  }
}

export const runTrace = (script: string, ...args: number[]) => {
  return Trace.parse(script).run(args)
}

export const runTraceWithOptions = (script: string, options: TraceRunOptions = {}) => {
  return Trace.parse(script).runWithOptions(options)
}
