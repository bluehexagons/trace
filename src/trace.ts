import { performance } from 'perf_hooks'

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
    regex: /^\(\)=>\{[^}]*\}/,
    kind: TokenKind.aFunction
  },
  {
    regex: /^\(\)=>[^;]*;?/,
    kind: TokenKind.aLambda
  },
  {
    regex: /^[a-zA-Z_][\w.]*\(\)=>\{[^}]*\}/,
    kind: TokenKind.function
  },
  {
    regex: /^[a-zA-Z_][\w.]*\(\)=>[^;]*;?/,
    kind: TokenKind.lambda
  },
  {
    regex: /^([a-zA-Z_][\w.]*)?\(\)/,
    kind: TokenKind.functionCall
  },
  {
    regex: /^>([a-zA-Z_][\w.]*)?\(\)/,
    kind: TokenKind.tailCall
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

type TraceToken = { kind: TokenKind, value: number, string: string }

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
  sign: -1 | 1 = 1
  not = false
  ptr = false
  i = 0

  constructor(tokens: TraceToken[], stackLength = 0) {
    this.tokens = tokens
    this.stack = stackLength <= 0 ? null : new Float64Array(stackLength)
  }
}
const closeStatement = (f: StackFrame, vars: Map<string, number>) => {
  if (f.setVar === '') {
    return
  }

  const varVal = vars.has(f.setVar) ? vars.get(f.setVar) as number : 0

  switch (f.setOp) {
  case TokenKind.set:
    vars.set(f.setVar, f.value)
    break

  case TokenKind.addSet:
    vars.set(f.setVar, varVal + f.value)
    break

  case TokenKind.subSet:
    vars.set(f.setVar, varVal - f.value)
    break

  case TokenKind.mulSet:
    vars.set(f.setVar, varVal * f.value)
    break

  case TokenKind.divSet:
    vars.set(f.setVar, varVal / f.value)
    break

  case TokenKind.modSet:
    vars.set(f.setVar, varVal % f.value)
    break

  case TokenKind.powSet:
    vars.set(f.setVar, varVal ** f.value)
    break
  }

  f.value = vars.get(f.setVar) as number
  f.setVar = ''
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

type CachedScript = { stackSize: number, tokens: TraceToken[] }

const cachedScripts = new Map<string, CachedScript>()
const stdlib = new Map<string, Trace>()

export class Trace {
  static logger = console.log
  static errorLogger = console.error

  logger = Trace.logger
  errorLogger = Trace.errorLogger

  lastRunTime = 0
  vars: (Map<string, number> | null) = null
  functions: (Map<string, Trace> | null) = null

  constructor(public body: string, public tokens: TraceToken[], public params: string[], public stackSize: number) {
    if (!cachedScripts.has(body)) {
      cachedScripts.set(body, {stackSize, tokens})
    }
  }

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

    if (cachedScripts.has(preprocessed)) {
      const cached = cachedScripts.get(preprocessed) as CachedScript
      return new Trace(preprocessed, cached.tokens, params, cached.stackSize)
    }

    if (stringLeft.length === 0) {
      return new Trace(preprocessed, tokens, params, stackSize)
    }

    // script parameters
    match = /^\[((,?[a-zA-Z_][\w]*)*),?(\.\.\.)?\]/.exec(stringLeft)
    if (match !== null) {
      params = match[1].split(',')
      stackSize = match[3] === '...' ? -1 : params.length
      stringLeft = stringLeft.substr(match[0].length)
    } else {
      match = /^\[([0-9]+)\]/.exec(stringLeft)
      if (match !== null) {
        stackSize = parseInt(match[1], 10)
        stringLeft = stringLeft.substr(match[0].length)
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
        // didn't find a match, critical syntax error
        this.errorLogger('Unexpected', findOperator ? 'operator:' : 'operand:', stringLeft)
        return new Trace(preprocessed, tokens, params, stackSize)
      }

      // remove consumed text from string
      stringLeft = stringLeft.substr(match[0].length)

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
            tokens.splice(tokens.length, 0, { kind: TokenKind.endGroup, value: NaN, string: ')' })
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
          tokens.splice(tokens.length, 0, { kind: TokenKind.endGroup, value: NaN, string: ')' })
        }

        loi[loi.length - 1] = tokens.length + 1
      }

      if (kind === TokenKind.endGroup) {
        loi.pop()
        while (groupLevel > 0) {
          groupLevel--
          tokens.splice(tokens.length, 0, { kind: TokenKind.endGroup, value: NaN, string: ')' })
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
          tokens.splice(tokens.length, 0, { kind: TokenKind.endGroup, value: NaN, string: ')' })
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
      tokens.push({
        kind,
        value: parseFloat(match[0]),
        string: match[0]
      })

      // see if parsing is done
      if (stringLeft.length === 0) {
        // close all remaining parenthesis
        while (groupLevel > 0) {
          groupLevel--
          tokens.splice(tokens.length, 0, { kind: TokenKind.endGroup, value: NaN, string: ')' })
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
    rand: () => number = Math.random,
    executionLimit = 1000,
    executionStart: number = performance.now()
  ) {
    const frames = [] as StackFrame[]
    let split: string[] = []
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
        this.functions = new Map(stdlib)
      }
      functions = this.functions
    }

    if (variables !== null) {
      for (const v of Object.getOwnPropertyNames(variables)) {
        vars.set(v, +variables[v])
      }
    }

    callStack:
    while (frames.length > 0) {
      f = frames.pop() as StackFrame

      for (; f.i < f.tokens.length; f.i++) {
        const t = f.tokens[f.i]
        let val: (number | null) = null

        if (performance.now() - executionStart > executionLimit) {
          this.errorLogger('Trace timed out')
          this.lastRunTime = performance.now() - executionStart
          return 0
        }

        switch (t.kind) {
        case TokenKind.beep:
          // beeps are the logging feature
          if (t.string.startsWith('&') && t.string.length > 1) {
            if (/[0-9]/.test(t.string[1])) {
              this.logger('token ' + f.i + ':', '&' + t.string.substring(1), (f.stack as Float64Array)[parseInt(t.string.substring(1), 10)])
            } else {
              const v = vars.get(t.string.substring(1)) as number
              this.logger('token ' + f.i + ':', '&' + v, (f.stack as Float64Array)[v])
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
          val = vars.has(t.string) ? vars.get(t.string) as number : 0
          f.lastVar = t.string
          break

        case TokenKind.percent:
          val = vars.has('value') ? vars.get('value') as number * (t.value * 0.01) : 0
          break

        case TokenKind.literal:
          val = t.value
          break

        case TokenKind.literalArray:
          split = t.string.split('|')
          val = parseFloat(split[rand() * split.length | 0])
          break

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
          if (t.kind === TokenKind.function || t.kind === TokenKind.aFunction) {
            script = t.string.substring(t.string.indexOf('{') + 1, t.string.length - 1)
          } else {
            script = t.string.substring(t.string.indexOf('>') + 1, t.string.endsWith(';') ? t.string.length - 1 : t.string.length)
          }

          if (fn !== '') {
            // named function
            functions.set(fn, Trace.parse(script))
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
          f.value = f.lastValue
          continue

        case TokenKind.increment:
          val = vars.has(f.lastVar) ? vars.get(f.lastVar) as number + 1 : 1
          vars.set(f.lastVar, val)
          f.value = f.lastValue
          break

        case TokenKind.decrement:
          val = vars.has(f.lastVar) ? vars.get(f.lastVar) as number - 1 : -1
          vars.set(f.lastVar, val)
          f.value = f.lastValue
          break

        case TokenKind.statement:
        case TokenKind.separator:
          closeStatement(f, vars)
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
        val = val * f.sign
        f.sign = 1
        if (f.not) {
          val = val === 0 ? 1 : 0
          f.not = false
        }
        if (f.ptr) {
          val = f.stack === null ? 0 : val < f.stack.length && val >= 0 ? f.stack[val >>> 0] : 0
          f.ptr = false
        }
        f.lastValue = f.value

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
          f.value = f.value / val
          break

        case TokenKind.mod:
          f.value = f.value % val
          break

        case TokenKind.pow:
          f.value = f.value ** val
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

      closeStatement(f, vars)
      value = f.value
    }

    this.lastRunTime = performance.now() - executionStart
    return value
  }
}

export const runTrace = (script: string, ...args: number[]) => {
  return Trace.parse(script).run(args)
}
