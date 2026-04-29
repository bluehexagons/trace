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
