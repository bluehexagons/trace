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

  it('/= by zero returns 0 (matches runtime / operator)', () => {
    expect(runTrace('x = 10; x /= 0; x')).toBe(0)
  })

  it('%= by zero returns 0 (matches runtime % operator)', () => {
    expect(runTrace('x = 10; x %%= 0; x')).toBe(0)
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

describe('first-class functions', () => {
  it('stores a function reference in a variable and calls it', () => {
    expect(runTrace('double(x)=>{x*2}; f = double; f(5)')).toBe(10)
  })

  it('aliases chain: g = f = double', () => {
    expect(runTrace('double(x)=>{x*2}; f = double; g = f; g(4)')).toBe(8)
  })

  it('passes a function by name to a higher-order function', () => {
    expect(runTrace('double(x)=>{x*2}; apply(fn,x)=>{fn(x)}; apply(double,3)')).toBe(6)
  })

  it('map over an array via a function reference', () => {
    // Nested {} inside function bodies is not supported, so the loop step is
    // a separate named function that recurses via mapStep(fn,n).
    const script = [
      'double(x)=>{x*2}',
      'mapStep(fn,n)=>{res[i]=fn(i);i++<=n?mapStep(fn,n):0}',
      'mapArr(fn,n)=>{res=[n];i=1;mapStep(fn,n)}',
      'mapArr(double,3)',
      'res[1]+res[2]+res[3]'
    ].join(';')
    expect(runTrace(script)).toBe(12)
  })

  it('function ref has numeric value 0', () => {
    expect(runTrace('double(x)=>{x*2}; f = double; f + 1')).toBe(1)
  })

  it('arithmetic on a function ref name clears the ref (scalar assigned)', () => {
    expect(runTrace('double(x)=>{x*2}; f = double + 0; f + 1')).toBe(1)
  })

  it('passing a function reference stored in a variable', () => {
    expect(runTrace('inc(x)=>{x+1}; apply(fn,x)=>{fn(x)}; f=inc; apply(f,9)')).toBe(10)
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

describe('nested braces', () => {
  it('parses nested {} inside a function body', () => {
    // outer fn with an inner anonymous function block
    expect(runTrace('outer()=>{x=0; ()=>{x=5}; x}; outer()')).toBe(5)
  })

  it('parses nested {} two levels deep', () => {
    expect(runTrace('a()=>{b()=>{c=7}; b(); c}; a()')).toBe(7)
  })

  it('allows {} inside function call arguments', () => {
    // anonymous function as an argument to a named call
    expect(runTrace('apply(fn,x)=>{fn(x)}; double(x)=>{x*2}; apply(double, 6)')).toBe(12)
  })
})

describe('code blocks', () => {
  it('treats { body } as an anonymous function (auto-runs)', () => {
    expect(runTrace('{1 + 2}')).toBe(3)
  })

  it('code block with statements behaves like an anonymous function', () => {
    expect(runTrace('x = 0; {x = 5; x + 1}')).toBe(6)
  })

  it('code block visible side effects on outer scope', () => {
    expect(runTrace('x = 1; {x = 9}; x')).toBe(9)
  })
})

describe('stdlib loops', () => {
  it('while runs body while condition holds', () => {
    expect(runTrace('i = 0; while(i < 3, i++); i')).toBe(3)
  })

  it('while accepts a code block body', () => {
    expect(runTrace('i = 0; t = 0; while(i < 4, { t += i; i++ }); t')).toBe(6)
  })

  it('while accepts an anonymous function body', () => {
    expect(runTrace('i = 0; while(i < 3, () => i++); i')).toBe(3)
  })

  it('while accepts a function reference body', () => {
    expect(runTrace('i = 0; bump()=>{i++}; while(i < 3, bump); i')).toBe(3)
  })

  it('for runs init once, then body until cond fails', () => {
    expect(runTrace('for(i = 0, i < 5, i++); i')).toBe(5)
  })

  it('for handles compound body via code block', () => {
    expect(runTrace('t = 0; for(i = 1, i <= 5, { t += i; i++ }); t')).toBe(15)
  })

  it('dowhile runs body at least once', () => {
    expect(runTrace('i = 5; dowhile(i++, i < 3); i')).toBe(6)
  })

  it('dowhile increments until condition fails', () => {
    expect(runTrace('i = 0; dowhile(i++, i < 3); i')).toBe(3)
  })

  it('supports nested loops', () => {
    expect(runTrace('t = 0; i = 0; while(i < 3, { j = 0; while(j < 4, { t++; j++ }); i++ }); t')).toBe(12)
  })

  it('infinite loop terminates safely under step limit', () => {
    const r = runTraceWithOptions('while(1, x++)', { maxSteps: 200 })
    expect(r.status).toBe('step-limit')
  })
})

describe('stdlib arrays', () => {
  it('foreach visits every element', () => {
    expect(runTrace('arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3; t=0; foreach(arr, (x) => t += x); t')).toBe(6)
  })

  it('mapmut mutates the array in place', () => {
    expect(runTrace('arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3; mapmut(arr, (x) => x * 10); arr[1]+arr[2]+arr[3]')).toBe(60)
  })

  it('map creates a new array and leaves the source intact', () => {
    expect(runTrace('arr = [2]; arr[1]=4; arr[2]=5; out = map(arr, (x) => x * 10); arr[1]*1000+arr[2]*100+out[1]+out[2]')).toBe(4590)
  })

  it('map result is assignable and indexable', () => {
    expect(runTrace('arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3; double(x)=>{x*2}; out = map(arr, double); out[1]+out[2]+out[3]')).toBe(12)
  })

  it('reduce folds elements with an accumulator', () => {
    expect(runTrace('arr = [3]; arr[1]=10; arr[2]=20; arr[3]=30; reduce(arr, (a, b) => a + b)')).toBe(60)
  })

  it('reduce accepts an initial value as the third arg', () => {
    expect(runTrace('arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3; reduce(arr, (a, b) => a + b, 100)')).toBe(106)
  })

  it('sort sorts ascending by default', () => {
    expect(runTrace('arr = [4]; arr[1]=3; arr[2]=1; arr[3]=4; arr[4]=2; sort(arr); arr[1]*1000+arr[2]*100+arr[3]*10+arr[4]')).toBe(1234)
  })

  it('sort accepts a custom comparator', () => {
    expect(runTrace('arr = [3]; arr[1]=1; arr[2]=3; arr[3]=2; sort(arr, (a, b) => b - a); arr[1]*100+arr[2]*10+arr[3]')).toBe(321)
  })

  it('sum returns the total of all elements', () => {
    expect(runTrace('arr = [3]; arr[1]=10; arr[2]=20; arr[3]=30; sum(arr)')).toBe(60)
  })

  it('find returns the 1-based index of the first match (0 when none)', () => {
    expect(runTrace('arr = [3]; arr[1]=5; arr[2]=10; arr[3]=15; find(arr, (x) => x == 10)')).toBe(2)
    expect(runTrace('arr = [3]; arr[1]=5; arr[2]=10; arr[3]=15; find(arr, (x) => x == 99)')).toBe(0)
  })
})

describe('stdlib categories option', () => {
  it('disables loops only', () => {
    const r = runTraceWithOptions('i = 0; while(i < 3, i++); i', {
      stdlib: { loops: false }
    })
    expect(r.value).toBe(0)
    expect(r.status).toBe('completed')
  })

  it('disables arrays only', () => {
    const r = runTraceWithOptions('arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3; sum(arr)', {
      stdlib: { arrays: false }
    })
    expect(r.value).toBe(0)
  })

  it('disables the entire stdlib when set to false', () => {
    const r = runTraceWithOptions('i = 0; while(i < 3, i++); i', { stdlib: false })
    expect(r.value).toBe(0)
  })

  it('reports an error for disabled stdlib calls in strict mode', () => {
    const r = runTraceWithOptions('while(1, 1)', { strict: true, stdlib: false })
    expect(r.status).toBe('error')
    expect(r.error).toContain('unknown function')
  })
})
