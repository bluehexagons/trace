# trace

Trace - An esoteric, specialized, functional programming language

This repository contains a basic TypeScript implementation, which was developed for Antistatic.

Try Trace in a sandbox: https://bluehexagons.github.io/trace-sandbox/

## Platform Support

The core library (`trace`) works in both Node.js (>=16) and modern browsers. The `trace/cli` entry point is Node.js-only.

## Installation

```bash
npm install https://codeload.github.com/bluehexagons/trace/tar.gz/refs/tags/v0.0.6
```

For local development against a checkout:

```bash
npm install ../trace
```

## Usage

### JavaScript/Node.js (ESM)

```javascript
import { runTrace, runTraceWithOptions, Trace } from 'trace';

// Quick execution
const result = runTrace('1 + 10');
console.log(result); // 11

// Using the Trace class for more control
const script = Trace.parse('x = 5; x * 2');
const output = script.run();
console.log(output); // 10
```

### Browser (ESM)

The package ships as standard ESM and works directly in browsers via a bundler (Webpack, Vite, Rollup, etc.) or via an import map:

```html
<script type="module">
  import { runTrace, Trace } from '/node_modules/trace/dist/index.js';

  const result = runTrace('1 + 10');
  console.log(result); // 11
</script>
```

With a bundler, the import is the same as in Node.js:

```javascript
import { runTrace, Trace } from 'trace';

const result = runTrace('1 + 10');
console.log(result); // 11
```

### TypeScript

```typescript
import { runTrace, Trace } from 'trace';

// Quick execution
const result: number | null = runTrace('1 + 10');
console.log(result); // 11

// Using the Trace class for more control
const script: Trace = Trace.parse('x = 5; x * 2');
const output: number | null = script.run();
console.log(output); // 10

// Passing arguments to scripts
const sum = runTrace('[...] t = 0; i = 1; &0 > 0 ? ()=>{t += &i; i++ <= &0 ? () : t}', 1, 2, 3, 4);
console.log(sum); // 10

// Structured execution with explicit safety limits
const result = runTraceWithOptions('q++; q < 10 ? () : q', {
  maxSteps: 1000,
  timeoutMs: 100
});
console.log(result.value, result.steps, result.runtimeMs, result.status);
```

## Building

```bash
npm install
npm run build
```

## Features:
* near-total lack of syntax error checking
* does math
* more powerful than it had to be
* not powerful enough to do anything particularly useful

# literals, values

All literals are resolved to 64-bit floats.

`15` - just the number 15

`15%` - a special type of literal that returns a percentage of the `value` variable

# comments
* `code #comment (until end of line)`

# variables
* `var=5`
* `var+=5`
* `var++`

supports `+=` `-=` `*=` `/=` `%%=` `++` `--` `**=` (to power of)

`var++` and `var--` happen instantly (like `++var`) and can be used mid-statement

# ranges
`0~1` anywhere from 0 to 1

## plusminus
`+-0.5` either 0.5 or -0.5

# selections
`1|2|3|4` will be 1, 2, 3, or 4

# math
`+` `-` `*` `/` `%` `**` (`a` to power of `b`) `~` (range `[a, b)`))

order of operations and parenthesis work

# conditionals
0 = false
non-0 = true
1 is true result for boolean operators

supports `>` `<` `==` `!=` `>=` `<=` `&&` `||` `^` (exclusive or)

## ternary
* `n ? true case`
* `n ? true case : false case`

ternary terminates on statement end (semicolon or end of script)

# order of operations:

1. `~`
2. `**`
3. `*` `/` `%%` (%% = modulus, single % = percentage of `value`)
4. `+` `-`
5. `>` `<` `==` `!=` `>=` `<=`
6. everything else

# arrays

`arr = [n]` creates a fixed-size array of `n` elements, all initialised to `0`.

`arr[n]` reads element `n` (1-indexed). `arr[0]` returns the array size.

`arr[n] = v` writes to element `n`. Compound assignments work too: `arr[n] += v`.

The index expression can be any Trace expression: `arr[i]`, `arr[i+1]`, `arr[n*2]`, etc. Nested array access (`arr[arr[i]]`) is not supported.

Reading an array variable without an index (`arr`) also returns the size.

```
arr = [5]       # five-element array
arr[1] = 10
arr[2] = 20
arr[1] + arr[2] # 30
arr[0]          # 5 (size)
```

Loop example — sum 1 through 5 via an array:
```
arr = [5]; i = 1;
i <= 5 ? () => { arr[i] = i; i++ <= 5 ? () : 0 };
s = 0; j = 1;
j <= 5 ? () => { s += arr[j]; j++ <= 5 ? () : s }
> 15
```

In strict mode, reading an unknown array or writing out of bounds is an error.

# script parameters

begin script with:

parameter list: `[param1, param2, param3]`

number of arguments: `[n]`

variable arguments: `[...]`

read params like variables, but are read-only; writing to will write to a global variable

can also read args/params using pointers: `&1`, `&2`, `&variable`, etc

`&0` is always the number of arguments, arguments start at `&1`

# functions

`name() => { line1; line2; implicit return statement }`

## first-class functions

Function names can be assigned to variables and passed as arguments.

**Store a reference:**
```
double(x) => { x * 2 }
f = double
f(5)        # 10
```

**Pass as an argument:**
```
apply(fn, x) => { fn(x) }
apply(double, 5)   # 10
```

**Pass a stored reference:**
```
f = double
apply(f, 5)        # 10
```

A function name in a numeric expression evaluates to `0`. Only a plain assignment (`f = name`) captures the reference — mixing it with arithmetic stores `0` instead.

Because function parameters are globals (see below), a function reference passed as a parameter is available to all functions called within that scope:
```
mapStep(fn, n) => { res[i] = fn(i); i++ <= n ? mapStep(fn, n) : 0 }
mapArr(fn, n)  => { res = [n]; i = 1; mapStep(fn, n) }
double(x) => { x * 2 }
mapArr(double, 3)
res[1] + res[2] + res[3]   # 2 + 4 + 6 = 12
```

lambdas

`name() => implicit return statement;` (note that it *must* end in a semicolon)

call functions like `name()`

function parameters are supported as syntactic sugar over globals:

```
add(a, b) => { a + b };
add(2, 3)
> 5
```

Argument expressions are evaluated before the function body. Parameter names are then assigned as global variables, so calling `setX(x)` will overwrite the global `x`. Missing arguments default to `0`.

end statements with `;` or `,`

last statement implicitly returns

## anonymous functions
`() => { do; stuff; implicit return }`
anonymous lambda (note that it *must* end in a semicolon)
`() => implicit return;`
anonymous functions trigger instantly

other examples:
```
() => i++ < 10 ? >() : i
> 10
```

```
() => { i++ < 10 ? >() : i} + 15
> 25
```

```
() => i++ < 10 ? >() : i; + 15
> 25
```

## anonymous function call
* `()`

calls currently-running function body again (including main script)

# loops
* `() => d++ < 3 ? () : d`
* `() => d++ < 3 ? () : d`
* `i++ < 10 ? >() : i`


# TCO
* `>tailcall()`

running a tail call obliterates the current stack frame
can include tailcall `>` anywhere a function is being run

# execution limits

Use `runTraceWithOptions` or `Trace.runWithOptions` to run code with explicit limits and structured metadata:

```typescript
const result = runTraceWithOptions('q++; q < 10 ? () : q', {
  maxSteps: 1000,
  timeoutMs: 100,
  strict: true,
  randomSeed: 123
});
```

`maxSteps` limits interpreter token execution, including function argument evaluation. `timeoutMs` limits wall-clock runtime. `strict` enables stricter runtime checks (see below). `randomSeed` makes range, plusminus, and selection operations deterministic unless an explicit `rand` function is provided. The result includes `{ value, steps, runtimeMs, status, error }`, where `status` is `completed`, `timeout`, `step-limit`, or `error`.

`runTraceWithOptions` and `Trace.runWithOptions` use isolated variables and functions by default. Pass `{ persist: true }` to reuse the `Trace` instance's globals across runs.

## strict mode

`strict: true` turns several silent behaviors into runtime errors:

| Situation | Default | Strict |
|---|---|---|
| Read undeclared variable | resolves to `0` | `error` |
| Call undeclared function | returns `0` | `error` |
| `x++` / `x--` on undeclared variable | initializes at `0` | `error` |
| `x += n` (any compound op) on undeclared variable | initializes at `0` | `error` |

Plain assignment (`x = 5`) is always allowed in strict mode — it declares the variable. All errors are surfaced in `result.error` and set `result.status` to `"error"`.

## code blocks and nested braces

Curly-brace bodies nest properly, so functions, anonymous functions and code
blocks can be embedded in each other:

```
outer()=>{ inner()=>{ x = 5 }; inner(); x }
outer() // 5
```

A bare `{ body }` at an operand position is sugar for an immediately-invoked
anonymous function `()=>{ body }`. It runs in the surrounding scope:

```
x = 1; { x = 9 }; x   // 9
{ a = 1 + 2; a * 10 } // 30
```

This also lets you pass blocks of code as arguments to functions in the
standard library:

```
i = 0; while(i < 3, { i++ }); i // 3
```

## standard library

A small set of built-in functions is available by category. Each one accepts
its callable arguments as a function reference, an anonymous function, or a
code block.

### loops

| Function | Behavior |
|---|---|
| `while(cond, body)` | runs `body` while `cond` is non-zero |
| `for(init, cond, body)` | runs `init` once, then `body` while `cond` is non-zero |
| `dowhile(body, cond)` | runs `body`, then continues while `cond` is non-zero |

```
i = 0; while(i < 3, i++); i           // 3
for(i = 0, i < 5, { i++ }); i         // 5
i = 0; dowhile(i++, i < 3); i         // 3
i = 0; bump()=>{ i++ }; while(i < 3, bump); i // 3
```

### arrays

| Function | Behavior |
|---|---|
| `foreach(arr, fn)` | calls `fn(elem, index)` for each element |
| `mapmut(arr, fn)` | replaces every element with `fn(elem, index)` in place |
| `map(arr, fn)` | returns a new array with `fn(elem, index)` per element |
| `reduce(arr, fn, init?)` | folds with `fn(acc, elem, index)`; `init` defaults to `arr[1]` |
| `sort(arr, cmp?)` | sorts in place; `cmp(a, b)` defaults to ascending |
| `sum(arr)` | returns the total of all elements |
| `find(arr, pred)` | returns the 1-based index of the first element where `pred(elem, index)` is non-zero (`0` if none) |

`map` allocates a new array and returns it via assignment, so the source array
is left untouched:

```
arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3;
out = map(arr, (x) => x * 10);
// arr is unchanged; out[1]=10, out[2]=20, out[3]=30
```

`mapmut` mutates the source in place:

```
arr = [3]; arr[1]=1; arr[2]=2; arr[3]=3;
mapmut(arr, (x) => x * 10);
// arr[1]=10, arr[2]=20, arr[3]=30
```

### enabling and disabling categories

Categories are configured via the `stdlib` option on `runTraceWithOptions`
(or `Trace.runWithOptions`). All categories are enabled by default.

```js
// disable everything
runTraceWithOptions(src, { stdlib: false })

// disable only loops
runTraceWithOptions(src, { stdlib: { loops: false } })

// explicit enable list
runTraceWithOptions(src, { stdlib: { loops: true, arrays: false } })
```

Disabled stdlib calls behave like any other unknown function: they return `0`
in default mode, or raise a runtime error under `strict: true`.

# parse errors

Parse errors include the character offset in the preprocessed source and a snippet with a `^` pointer:

```
Syntax error at offset 2: unexpected operand
  1><2
    ^
```

The preprocessed source has whitespace and comments stripped, so the offset may not match the original text directly.

# echo

* `@echo@` will `console.log` the text inside
* `@=variable@` will `console.log` the name and value of the variable
* `@&n@` will `console.log` the result of resolving the pointer
* `@&variable@` will `console.log` the result of resolving the variable pointer

# examples used in testing
```
add()=>{q=q+1;q < 10 ? >add()};q=0;l=2* (2 * 3) + add()
> 12
```

```
add()=>{q=q+1;q < 10 ? add()};q=0;l=2* (2 * 3) + add(); q
> 10
```

```
add()=>{q++;q < 10 ? >add()};q=0;l=2* (2 * 3) + add(); q
> 10
```

```
q++;q < 10 ? () : q
> 10
```

```
()=>{q++;q < 10 ? >()}; q
> 10
```
counts to 10

```
runMath('[...] t = 0; i = 1; &0 > 0 ? ()=>{t += &i; i++ <= &0 ? () : t}', 1, 2, 3, 4)
> 10
```
totals all arguments

formatted:

```
[...]
t = 0;
i = 1;
&0 > 0 ? ()=>{
  t += &i;
  i++ <= &0 ? () : t
}
```

# quirks
* Anonymous lambdas are treated as an operand, despite ending in a semicolon. To terminate the statement, you need two semicolons.
* `()=>15;3` -> parse error because of unexpected operand (3)
* `()=>15;;3` -> OK, script returns 3

There are a lot of syntax errors that go unchecked and probably break everything
