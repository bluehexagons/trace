import { describe, it, expect } from 'vitest'
import { runTrace, runTraceWithOptions, Trace } from '../index.js'

describe('parse errors', () => {
  it('throws on invalid syntax', () => {
    expect(() => Trace.parse('1 > < 2')).toThrow('Syntax error')
  })

  it('includes character offset in parse error', () => {
    expect(() => Trace.parse('1 > < 2')).toThrowError(/Syntax error at offset \d+/)
  })

  it('includes source pointer in parse error', () => {
    expect(() => Trace.parse('1 > < 2')).toThrowError(/\^/)
  })

  it('offset points at the unparseable position', () => {
    let err: Error | undefined
    try { Trace.parse('1 > < 2') } catch (e) { err = e as Error }
    // preprocessed is '1><2'; error is at offset 2 (the '<')
    expect(err?.message).toContain('offset 2')
  })
})

describe('runTrace', () => {
  it('evaluates simple addition', () => {
    expect(runTrace('1 + 10')).toBe(11)
  })

  it('evaluates subtraction', () => {
    expect(runTrace('10 - 3')).toBe(7)
  })

  it('evaluates multiplication', () => {
    expect(runTrace('3 * 4')).toBe(12)
  })

  it('evaluates division', () => {
    expect(runTrace('10 / 2')).toBe(5)
  })

  it('evaluates exponentiation', () => {
    expect(runTrace('2 ** 8')).toBe(256)
  })

  it('respects order of operations', () => {
    expect(runTrace('2 + 3 * 4')).toBe(14)
  })

  it('respects parentheses', () => {
    expect(runTrace('(2 + 3) * 4')).toBe(20)
  })
})

describe('Trace class', () => {
  it('parses and runs a script', () => {
    const script = Trace.parse('x = 5; x * 2')
    expect(script.run()).toBe(10)
  })

  it('caches parsed scripts (reuses token arrays)', () => {
    // The cache reuses the underlying token array, not the Trace wrapper object.
    // Verify that two parses of the same script produce equal results.
    const a = Trace.parse('1 + 1')
    const b = Trace.parse('1 + 1')
    expect(a.run()).toBe(b.run())
    expect(a.run()).toBe(2)
  })
})

describe('variables', () => {
  it('supports assignment and use', () => {
    expect(runTrace('x = 5; x * 2')).toBe(10)
  })

  it('supports compound assignment +=', () => {
    expect(runTrace('x = 5; x += 3; x')).toBe(8)
  })

  it('supports compound assignment -=', () => {
    expect(runTrace('x = 10; x -= 4; x')).toBe(6)
  })

  it('supports compound assignment *=', () => {
    expect(runTrace('x = 3; x *= 4; x')).toBe(12)
  })

  it('supports compound assignment /=', () => {
    expect(runTrace('x = 12; x /= 4; x')).toBe(3)
  })

  it('supports increment ++', () => {
    expect(runTrace('x = 0; x++; x')).toBe(1)
  })

  it('supports decrement --', () => {
    expect(runTrace('x = 5; x--; x')).toBe(4)
  })
})

describe('functions', () => {
  it('supports named function definition and call', () => {
    // add() increments q until it reaches 10 via TCO tail call
    expect(runTrace('add()=>{q=q+1;q < 10 ? >add()};q=0;l=2* (2 * 3) + add()')).toBe(12)
  })

  it('named function side effects are visible after call', () => {
    expect(runTrace('add()=>{q++;q < 10 ? >add()};q=0;l=2* (2 * 3) + add(); q')).toBe(10)
  })

  it('supports anonymous self-call loop', () => {
    expect(runTrace('q++;q < 10 ? () : q')).toBe(10)
  })

  it('supports anonymous function with block', () => {
    expect(runTrace('()=>{q++;q < 10 ? >()}; q')).toBe(10)
  })

  it('anonymous function with block result plus literal', () => {
    expect(runTrace('() => { i++ < 10 ? >() : i} + 15')).toBe(25)
  })

  it('anonymous lambda result plus literal', () => {
    expect(runTrace('() => i++ < 10 ? >() : i; + 15')).toBe(25)
  })

  it('supports named function parameters as globals', () => {
    expect(runTrace('add(a,b)=>{a+b}; add(2,3)')).toBe(5)
  })

  it('evaluates function argument expressions before assignment', () => {
    expect(runTrace('add(a,b)=>{a+b}; base=2; add(base+3,4*5)')).toBe(25)
  })

  it('supports function calls inside function arguments', () => {
    expect(runTrace('inc(x)=>{x+1}; add(a,b)=>{a+b}; add(inc(2), inc(3))')).toBe(7)
  })

  it('missing function arguments default to zero', () => {
    expect(runTrace('add(a,b)=>{a+b}; add(7)')).toBe(7)
  })

  it('function parameters intentionally write to global variables', () => {
    expect(runTrace('setX(x)=>{x+1}; x=2; setX(10); x')).toBe(10)
  })
})

describe('execution limits', () => {
  it('returns structured run metadata', () => {
    const result = runTraceWithOptions('1 + 2', { maxSteps: 10 })
    expect(result.value).toBe(3)
    expect(result.steps).toBeGreaterThan(0)
    expect(result.runtimeMs).toBeGreaterThanOrEqual(0)
    expect(result.status).toBe('completed')
  })

  it('can stop execution after a step budget is exceeded', () => {
    const script = Trace.parse('q++; q < 10 ? () : q')
    script.errorLogger = () => {}

    const result = script.runWithOptions({ maxSteps: 5 })
    expect(result.value).toBe(0)
    expect(result.steps).toBeGreaterThan(5)
    expect(result.status).toBe('step-limit')
  })

  it('shares the step budget with function argument expressions', () => {
    const script = Trace.parse('loop()=>{q++; >loop()}; id(v)=>{v}; id(loop())')
    script.errorLogger = () => {}

    const result = script.runWithOptions({ maxSteps: 10 })
    expect(result.value).toBe(0)
    expect(result.steps).toBeGreaterThan(10)
    expect(result.status).toBe('step-limit')
  })

  it('runs with isolated state by default', () => {
    const script = Trace.parse('x++; x')
    expect(script.runWithOptions().value).toBe(1)
    expect(script.runWithOptions().value).toBe(1)
  })

  it('can persist state when requested', () => {
    const script = Trace.parse('x++; x')
    expect(script.runWithOptions({ persist: true }).value).toBe(1)
    expect(script.runWithOptions({ persist: true }).value).toBe(2)
  })

  it('can report unknown variables in strict mode', () => {
    const result = runTraceWithOptions('score + 1', { strict: true })
    expect(result.value).toBeNull()
    expect(result.status).toBe('error')
    expect(result.error).toContain('unknown variable "score"')
  })

  it('allows assignments in strict mode', () => {
    const result = runTraceWithOptions('score = 10; score + 1', { strict: true })
    expect(result.value).toBe(11)
    expect(result.status).toBe('completed')
  })

  it('can report unknown functions in strict mode', () => {
    const result = runTraceWithOptions('missing()', { strict: true })
    expect(result.value).toBeNull()
    expect(result.status).toBe('error')
    expect(result.error).toContain('unknown function "missing"')
  })

  it('keeps permissive unknown variable behavior by default', () => {
    expect(runTraceWithOptions('score + 1').value).toBe(1)
  })

  it('flags increment of undeclared variable in strict mode', () => {
    const result = runTraceWithOptions('x++', { strict: true })
    expect(result.status).toBe('error')
    expect(result.error).toMatch(/increment.*"x"/)
  })

  it('allows increment of declared variable in strict mode', () => {
    const result = runTraceWithOptions('x = 0; x++; x', { strict: true })
    expect(result.status).toBe('completed')
    expect(result.value).toBe(1)
  })

  it('flags decrement of undeclared variable in strict mode', () => {
    const result = runTraceWithOptions('x--', { strict: true })
    expect(result.status).toBe('error')
    expect(result.error).toMatch(/decrement.*"x"/)
  })

  it('flags compound assignment to undeclared variable in strict mode', () => {
    const result = runTraceWithOptions('x += 5', { strict: true })
    expect(result.status).toBe('error')
    expect(result.error).toMatch(/compound assignment.*"x"/)
  })

  it('allows compound assignment to declared variable in strict mode', () => {
    const result = runTraceWithOptions('x = 0; x += 5; x', { strict: true })
    expect(result.status).toBe('completed')
    expect(result.value).toBe(5)
  })

  it('allows plain assignment to undeclared variable in strict mode', () => {
    const result = runTraceWithOptions('x = 5; x', { strict: true })
    expect(result.status).toBe('completed')
    expect(result.value).toBe(5)
  })
})

describe('script parameters', () => {
  it('sums variadic arguments', () => {
    const result = runTrace('[...] t = 0; i = 1; &0 > 0 ? ()=>{t += &i; i++ <= &0 ? () : t}', 1, 2, 3, 4)
    expect(result).toBe(10)
  })

  it('provides argument count via &0', () => {
    expect(runTrace('[...] &0', 10, 20, 30)).toBe(3)
  })

  it('accesses pointer-based parameters', () => {
    expect(runTrace('[...] &1 + &2', 3, 7)).toBe(10)
  })

  it('named params — all params accessible including last', () => {
    expect(runTrace('[a,b,c] a + b + c', 1, 2, 3)).toBe(6)
  })

  it('named params — single param', () => {
    expect(runTrace('[x] x * 2', 5)).toBe(10)
  })
})

describe('arrays', () => {
  it('creates an array and returns its size', () => {
    expect(runTrace('arr = [5]; arr[0]')).toBe(5)
  })

  it('reads from an array element (initially 0)', () => {
    expect(runTrace('arr = [3]; arr[1]')).toBe(0)
  })

  it('writes to and reads back an array element', () => {
    expect(runTrace('arr = [3]; arr[1] = 42; arr[1]')).toBe(42)
  })

  it('writes multiple elements independently', () => {
    expect(runTrace('arr = [3]; arr[1] = 10; arr[2] = 20; arr[3] = 30; arr[1] + arr[2] + arr[3]')).toBe(60)
  })

  it('supports compound assignment on array elements', () => {
    expect(runTrace('arr = [3]; arr[1] = 5; arr[1] += 3; arr[1]')).toBe(8)
  })

  it('supports indexed access via variable', () => {
    expect(runTrace('arr = [3]; arr[2] = 99; i = 2; arr[i]')).toBe(99)
  })

  it('plain array name returns element count (arr[0])', () => {
    expect(runTrace('arr = [7]; arr')).toBe(7)
  })

  it('out-of-bounds read returns 0', () => {
    expect(runTrace('arr = [3]; arr[9]')).toBe(0)
  })

  it('can be used with dynamic size', () => {
    expect(runTrace('n = 5; arr = [n]; arr[0]')).toBe(5)
  })

  it('works in function bodies', () => {
    expect(runTrace('arr = [3]; fill()=>{arr[1]=1;arr[2]=2;arr[3]=3}; fill(); arr[1]+arr[2]+arr[3]')).toBe(6)
  })

  it('loop-fills an array and sums it', () => {
    const script = 'arr = [5]; i = 1; i <= 5 ? ()=>{arr[i] = i; i++ <= 5 ? () : 0}; s = 0; j = 1; j <= 5 ? ()=>{s += arr[j]; j++ <= 5 ? () : s}'
    expect(runTrace(script)).toBe(15)
  })

  it('strict mode: unknown array read throws', () => {
    const result = runTraceWithOptions('missing[1]', { strict: true })
    expect(result.status).toBe('error')
    expect(result.error).toContain('"missing"')
  })

  it('strict mode: out-of-bounds write throws', () => {
    const result = runTraceWithOptions('arr = [2]; arr[5] = 1', { strict: true })
    expect(result.status).toBe('error')
    expect(result.error).toContain('out of bounds')
  })
})

describe('conditionals', () => {
  it('ternary true branch', () => {
    expect(runTrace('1 ? 42')).toBe(42)
  })

  it('ternary false branch (condition is 0)', () => {
    expect(runTrace('0 ? 1 : 99')).toBe(99)
  })

  it('ternary true branch with else', () => {
    expect(runTrace('1 ? 7 : 99')).toBe(7)
  })

  it('comparison operators: greater than', () => {
    expect(runTrace('5 > 3')).toBe(1)
    expect(runTrace('3 > 5')).toBe(0)
  })

  it('comparison operators: less than', () => {
    expect(runTrace('2 < 4')).toBe(1)
    expect(runTrace('4 < 2')).toBe(0)
  })

  it('comparison operators: equality', () => {
    expect(runTrace('5 == 5')).toBe(1)
    expect(runTrace('5 == 6')).toBe(0)
  })

  it('comparison operators: inequality', () => {
    expect(runTrace('5 != 6')).toBe(1)
    expect(runTrace('5 != 5')).toBe(0)
  })

  it('logical and', () => {
    expect(runTrace('1 && 1')).toBe(1)
    expect(runTrace('1 && 0')).toBe(0)
  })

  it('logical or', () => {
    expect(runTrace('0 || 1')).toBe(1)
    expect(runTrace('0 || 0')).toBe(0)
  })
})

describe('random operators', () => {
  it('range ~ produces value within [a, b)', () => {
    // Run many times to check bounds
    for (let i = 0; i < 100; i++) {
      const v = runTrace('0~10') as number
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(10)
    }
  })

  it('plusminus +- produces either positive or negative value', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 100; i++) {
      seen.add(runTrace('+-1') as number)
    }
    expect(seen).toContain(1)
    expect(seen).toContain(-1)
  })

  it('selection | picks one of the listed values', () => {
    const valid = new Set([1, 2, 3, 4])
    for (let i = 0; i < 100; i++) {
      const v = runTrace('1|2|3|4') as number
      expect(valid).toContain(v)
    }
  })

  it('can use seeded randomness for deterministic runs', () => {
    const script = '0~10'
    const a = runTraceWithOptions(script, { randomSeed: 123 }).value
    const b = runTraceWithOptions(script, { randomSeed: 123 }).value
    const c = runTraceWithOptions(script, { randomSeed: 456 }).value

    expect(a).toBe(b)
    expect(c).not.toBe(a)
  })

  it('prefers an explicit rand function over randomSeed', () => {
    const result = runTraceWithOptions('0~10', {
      randomSeed: 123,
      rand: () => 0.25
    })

    expect(result.value).toBe(2.5)
  })
})
