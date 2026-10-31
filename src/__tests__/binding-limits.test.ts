import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { TraceMemory, runTraceWithOptions } from '../index.js';

describe('binding replacement', () => {
  it('replaces numeric parameters with functions and functions with numbers', () => {
    expect(
      runTraceWithOptions('double(x)=>{x*2}; read(fn)=>{fn}; read(7); read(double)').value,
    ).toBe(0);
    const result = runTraceWithOptions(
      'double(x)=>{x*2}; apply(fn,x)=>{fn(x)}; apply(double,3); apply(0,5)',
      { strict: true },
    );
    expect(result.status).toBe('error');
    expect(result.error).toMatch(/unknown function/);
  });

  it('replaces assignments and host values across shared-memory runs', () => {
    const memory = new TraceMemory();
    expect(runTraceWithOptions('double(x)=>{x*2}; fn=7; fn=double; fn', { memory }).value).toBe(0);
    expect(memory.variables.has('fn')).toBe(false);
    expect(runTraceWithOptions('fn=3; fn', { memory }).value).toBe(3);
    expect(memory.functions.has('fn')).toBe(false);
    runTraceWithOptions('fn=double', { memory });
    expect(runTraceWithOptions('fn', { memory, variables: { fn: 4 } }).value).toBe(4);
    expect(memory.functions.has('fn')).toBe(false);
  });

  it('replaces array bindings and stdlib callback parameters', () => {
    expect(runTraceWithOptions('a=3; a=[2]; a').value).toBe(2);
    const memory = new TraceMemory();
    runTraceWithOptions('a=[2]; a=3', { memory });
    expect(memory.arrays.has('a')).toBe(false);
    const result = runTraceWithOptions('x()=>{99}; a=[1]; foreach(a,(x)=>{x}); x', { memory });
    expect(result.value).toBe(0);
    expect(memory.functions.has('x')).toBe(false);
  });
});

describe('all supplied call arguments', () => {
  it('evaluates extra arguments left to right', () => {
    expect(runTraceWithOptions('f(a)=>{a}; x=0; f(x++,x++); x').value).toBe(2);
  });

  it('propagates errors and budgets before binding any parameters', () => {
    for (const [argument, options, status] of [
      ['missing()', { strict: true }, 'error'],
      ['while(1,0)', { maxSteps: 100 }, 'step-limit'],
    ] as const) {
      const memory = new TraceMemory();
      const result = runTraceWithOptions(`f(a)=>{a}; a=7; f(2,${argument})`, {
        memory,
        ...options,
      });
      expect(result.status).toBe(status);
      expect(memory.getVariable('a')).toBe(7);
    }
  });
});

it('enforces a timeout across short stdlib callbacks without a step limit', () => {
  // Exercise the shipped build in a child so a timeout regression cannot hang Vitest.
  const entry = new URL('../../dist/index.js', import.meta.url).href;
  const script = `import {runTraceWithOptions} from ${JSON.stringify(entry)};
    const results = ['while(1,1)', 'for(0,1,1)', 'dowhile(1,1)', 'while(()=>{1},()=>{1})']
      .map(code => runTraceWithOptions(code, {timeoutMs: 10}).status);
    process.stdout.write(JSON.stringify(results));`;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    timeout: 5000,
    encoding: 'utf8',
  });
  expect(JSON.parse(output)).toEqual(['timeout', 'timeout', 'timeout', 'timeout']);
});
