import { describe, expect, it } from 'vitest';
import { Trace, TraceMemory, runTraceWithOptions } from '../index.js';

describe('array allocation budgets', () => {
  it('counts size headers and permits allocations exactly within the budget', () => {
    expect(runTraceWithOptions('a = [5]; a[0]', { maxArrayElements: 6 }).value).toBe(5);
    expect(runTraceWithOptions('a = [6]', { maxArrayElements: 6 }).error).toMatch(
      /array allocation limit/,
    );
  });

  it('shares the budget across arrays, functions, replacements, and map output', () => {
    for (const code of [
      'a = [3]; b = [3]',
      'a = [3]; allocate()=>{b = [3]}; allocate()',
      'a = [3]; a = [3]',
      'a = [3]; b = map(a, (x) => x)',
    ]) {
      const result = runTraceWithOptions(code, { maxArrayElements: 7 });
      expect(result.status).toBe('error');
      expect(result.error).toMatch(/array allocation limit/);
    }
  });

  it('counts retained arrays on each run and recovers after memory is cleared', () => {
    const memory = new TraceMemory();
    expect(runTraceWithOptions('a = [3]', { memory, maxArrayElements: 7 }).status).toBe(
      'completed',
    );
    expect(runTraceWithOptions('b = [3]', { memory, maxArrayElements: 7 }).error).toMatch(
      /array allocation limit/,
    );
    expect(memory.getArray('a')?.length).toBe(4);
    expect(memory.getArray('b')).toBeUndefined();
    memory.clear();
    expect(runTraceWithOptions('b = [3]', { memory, maxArrayElements: 7 }).status).toBe(
      'completed',
    );
  });

  it('bounds persistent instance arrays and host-provided arrays', () => {
    const trace = Trace.parse('a = [3]');
    expect(trace.runWithOptions({ persist: true, maxArrayElements: 7 }).status).toBe('completed');
    expect(trace.runWithOptions({ persist: true, maxArrayElements: 7 }).error).toMatch(
      /array allocation limit/,
    );
    const memory = new TraceMemory();
    memory.arrays.set('external', new Float64Array(8));
    expect(runTraceWithOptions('1', { memory, maxArrayElements: 7 }).error).toMatch(
      /array allocation limit/,
    );
  });

  it('rejects unsafe sizes before allocating in both APIs', () => {
    for (const code of ['a = [1000000000000]', '[1000000000000] 1']) {
      expect(runTraceWithOptions(code).error).toMatch(/array allocation limit/);
      expect(() => Trace.parse(code).run()).toThrow(/array allocation limit/);
    }
  });

  it('validates configured budgets and allows a zero budget without arrays', () => {
    for (const maxArrayElements of [-1, 0.5, NaN, Infinity]) {
      expect(runTraceWithOptions('1', { maxArrayElements }).error).toMatch(
        /non-negative safe integer/,
      );
    }
    expect(runTraceWithOptions('1', { maxArrayElements: 0 }).value).toBe(1);
    expect(runTraceWithOptions('a = [0]', { maxArrayElements: 0 }).error).toMatch(
      /array allocation limit/,
    );
  });
});
