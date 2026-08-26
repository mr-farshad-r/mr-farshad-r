---
layout: post
title: "JavaScript After ES6: Every Feature from ES2016 to ES2025"
date: 2026-08-09
description: A practical guide to the major JavaScript features introduced from ES2016 through ES2025, with clear explanations and code examples.
image: /assets/images/posts/javascript-after-es6.jpg
image_alt: Modular JavaScript features evolve along an illuminated timeline in a dark technical landscape.
---

ES6 (also known as ES2015) was a massive milestone for JavaScript — it introduced
`let`/`const`, arrow functions, classes, modules, promises, destructuring, and more.
But JavaScript didn't stop there. Every year since, the language has shipped new
features through the TC39 process.

This post covers **every major feature from ES2016 through ES2025**, with practical
examples for each one.

---

## ES2016 (ES7)

### 1. Array.prototype.includes

Before ES2016, you had to use `indexOf` and check against `-1`. Now there's a
clean, readable method that returns a boolean.

```javascript
// Before
const fruits = ["apple", "banana", "orange"];
console.log(fruits.indexOf("banana") !== -1); // true

// After
console.log(fruits.includes("banana")); // true
console.log(fruits.includes("grape"));  // false
```

`includes` also handles `NaN` correctly, which `indexOf` does not:

```javascript
const values = [1, 2, NaN];

console.log(values.indexOf(NaN));    // -1 (broken)
console.log(values.includes(NaN));   // true  (fixed)
```

### 2. Exponentiation Operator (`**`)

No more `Math.pow` for simple exponentiation.

```javascript
// Before
const area = Math.pow(2, 10); // 1024

// After
const area = 2 ** 10;         // 1024

// It also works with variables
const base = 3;
const exp = 4;
console.log(base ** exp);     // 81

// And as an assignment operator
let n = 2;
n **= 3;  // n = 8
```

---

## ES2017 (ES8)

### 3. async / await

The most impactful addition since ES6. `async/await` makes asynchronous code
read like synchronous code, built on top of promises.

```javascript
// Before: Promise chains
function fetchUser(id) {
    return fetch(`/api/users/${id}`)
        .then(res => res.json())
        .then(user => fetch(`/api/posts/${user.postIds[0]}`))
        .then(res => res.json())
        .then(post => console.log(post));
}

// After: async/await
async function fetchUser(id) {
    const res = await fetch(`/api/users/${id}`);
    const user = await res.json();
    const postRes = await fetch(`/api/posts/${user.postIds[0]}`);
    const post = await postRes.json();
    console.log(post);
}
```

Error handling with `try/catch`:

```javascript
async function fetchData(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Fetch failed:", err.message);
        return null;
    }
}
```

Running promises in parallel:

```javascript
async function loadDashboard() {
    const [user, posts, notifications] = await Promise.all([
        fetch("/api/user").then(r => r.json()),
        fetch("/api/posts").then(r => r.json()),
        fetch("/api/notifications").then(r => r.json()),
    ]);
    return { user, posts, notifications };
}
```

### 4. Object.entries / Object.values / Object.getOwnPropertyDescriptors

```javascript
const user = { name: "Farshad", role: "Engineer", city: "Tehran" };

// Object.entries — key/value pairs as arrays
Object.entries(user);
// [["name", "Farshad"], ["role", "Engineer"], ["city", "Tehran"]]

// Object.values — just the values
Object.values(user);
// ["Farshad", "Engineer", "Tehran"]

// Iterating with entries
for (const [key, value] of Object.entries(user)) {
    console.log(`${key}: ${value}`);
}

// Object.getOwnPropertyDescriptors — full metadata per property
Object.getOwnPropertyDescriptors(user);
// {
//   name: { value: "Farshad", writable: true, enumerable: true, configurable: true },
//   ...
// }
```

### 5. String Padding — padStart / padEnd

```javascript
// Format numbers with leading zeros
const invoiceNumber = "42";
console.log(invoiceNumber.padStart(6, "0")); // "000042"

// Right-align text in a terminal
console.log("Total".padStart(20, ".") + " $99.00");
// "...............Total $99.00"

// padEnd
console.log("Name".padEnd(12, " ") + "Value");
// "Name        Value"
```

### 6. Trailing Commas in Function Parameters

```javascript
// Trailing comma — no syntax error, cleaner diffs
function add(a, b,) {
    return a + b;
}

const multiply = (a, b,) => a * b;

// Also works in calls
add(1, 2,);
```

### 7. Shared Memory and Atomics

Low-level APIs for shared memory across threads (Web Workers):

```javascript
const buffer = new SharedArrayBuffer(4);        // 4 bytes
const view = new Int32Array(buffer);

// Thread 1 writes
Atomics.store(view, 0, 42);

// Thread 2 reads safely
const value = Atomics.load(view, 0);
console.log(value); // 42
```

---

## ES2018 (ES9)

### 8. Rest / Spread Properties for Objects

`...` syntax now works on objects, not just arrays.

```javascript
const user = { name: "Farshad", age: 30, role: "Engineer", city: "Tehran" };

// Rest — collect remaining properties
const { name, ...rest } = user;
console.log(name); // "Farshad"
console.log(rest); // { age: 30, role: "Engineer", city: "Tehran" }

// Spread — merge objects
const defaults = { theme: "dark", lang: "en", fontSize: 14 };
const userPrefs = { theme: "light", fontSize: 16 };

const settings = { ...defaults, ...userPrefs };
// { theme: "light", lang: "en", fontSize: 16 }
```

### 9. Asynchronous Iteration — for await...of

Iterate over async data sources sequentially:

```javascript
async function fetchAllPages(urls) {
    const results = [];
    for await (const url of urls) {
        const res = await fetch(url);
        results.push(await res.json());
    }
    return results;
}

// Also works with async generators
async function* streamData(start, end) {
    for (let i = start; i <= end; i++) {
        await new Promise(r => setTimeout(r, 100));
        yield i;
    }
}

(async () => {
    for await (const num of streamData(1, 5)) {
        console.log(num); // 1, 2, 3, 4, 5 (100ms apart)
    }
})();
```

### 10. Promise.prototype.finally

Runs regardless of resolve or reject — perfect for cleanup.

```javascript
async function loadData() {
    showSpinner();
    try {
        const data = await fetch("/api/data").then(r => r.json());
        render(data);
    } catch (err) {
        showError(err);
    } finally {
        // Runs whether it succeeded or failed
        hideSpinner();
    }
}

// Also on raw promises
fetch("/api/data")
    .then(r => r.json())
    .then(render)
    .catch(showError)
    .finally(() => hideSpinner());
```

### 11. Regular Expression Enhancements

```javascript
// Named capture groups
const dateRe = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = "2026-08-09".match(dateRe);
console.log(match.groups.year);  // "2026"
console.log(match.groups.month); // "08"
console.log(match.groups.day);   // "09"

// s flag — dot matches newlines
const re = /hello.world/s;
console.log(re.test("hello\nworld")); // true

// Lookbehind assertions
const priceRe = /(?<=\$)\d+/;
console.log("Price: $42".match(priceRe)[0]); // "42"

// Unicode property escapes
const letterRe = /\p{Letter}+/gu;
console.log("Hello".match(letterRe)); // ["Hello"]
```

---

## ES2019 (ES10)

### 12. Array.prototype.flat / flatMap

```javascript
// flat — flatten nested arrays
const nested = [1, [2, [3, [4]]]];
console.log(nested.flat());     // [1, 2, [3, [4]]]    (default depth: 1)
console.log(nested.flat(2));    // [1, 2, 3, [4]]
console.log(nested.flat(Infinity)); // [1, 2, 3, 4]

// flatMap — map then flat(1) in one pass
const sentences = ["hello world", "foo bar"];

const words = sentences.flatMap(s => s.split(" "));
// ["hello", "world", "foo", "bar"]

// Practical: extract tags from articles
const articles = [
    { title: "A", tags: ["js", "react"] },
    { title: "B", tags: ["css", "react"] },
    { title: "C", tags: ["js"] },
];

const allTags = articles.flatMap(a => a.tags);
// ["js", "react", "css", "react", "js"]

const uniqueTags = [...new Set(allTags)];
// ["js", "react", "css"]
```

### 13. Object.fromEntries

The reverse of `Object.entries` — turn key/value pairs back into an object.

```javascript
const entries = [["name", "Farshad"], ["role", "Engineer"]];

const obj = Object.fromEntries(entries);
// { name: "Farshad", role: "Engineer" }

// Practical: filter object keys
const user = { name: "Farshad", age: 30, password: "secret", role: "admin" };

const safe = Object.fromEntries(
    Object.entries(user).filter(([key]) => key !== "password")
);
// { name: "Farshad", age: 30, role: "admin" }

// Transform values
const doubled = Object.fromEntries(
    Object.entries({ a: 1, b: 2, c: 3 }).map(([k, v]) => [k, v * 2])
);
// { a: 2, b: 4, c: 6 }
```

### 14. String trimStart / trimEnd

```javascript
const str = "   hello world   ";

console.log(str.trimStart()); // "hello world   "
console.log(str.trimEnd());   // "   hello world"

// Aliases (for older engines)
console.log(str.trimLeft());  // "hello world   "
console.log(str.trimRight()); // "   hello world"
```

### 15. Optional Catch Binding

No need to bind the error if you don't use it.

```javascript
// Before — had to include (e) even if unused
try {
    JSON.parse(badJson);
} catch (e) {
    console.log("Invalid JSON");
}

// After — omit the binding entirely
try {
    JSON.parse(badJson);
} catch {
    console.log("Invalid JSON");
}
```

### 16. Symbol.prototype.description

```javascript
const sym = Symbol("mySymbol");
console.log(sym.description); // "mySymbol"

// Anonymous symbol
const anon = Symbol();
console.log(anon.description); // undefined
```

---

## ES2020 (ES11)

### 17. Optional Chaining (`?.`)

The feature that eliminated thousands of `&&` chains.

```javascript
const user = {
    profile: {
        address: {
            city: "Tehran",
        },
    },
};

// Before — defensive chaining
const city =
    user &&
    user.profile &&
    user.profile.address &&
    user.profile.address.city;

// After — optional chaining
const city = user?.profile?.address?.city;     // "Tehran"

// With missing data
const zip = user?.profile?.address?.zip;        // undefined (no error)

// Method calls
const result = user?.getName?.();               // undefined if getName doesn't exist

// Array access
const first = user?.posts?.[0];                 // undefined if no posts

// Combined with nullish coalescing
const displayName = user?.profile?.name ?? "Anonymous";
```

### 18. Nullish Coalescing (`??`)

Returns the right side only when the left is `null` or `undefined` — not other
falsy values like `0` or `""`.

```javascript
// Problem with || — it swallows valid falsy values
const count = 0;
console.log(count || 10);  // 10  (wrong! 0 is a valid count)

// Solution with ??
console.log(count ?? 10);  // 0   (correct!)

// More examples
const name = "" ?? "Anonymous";        // "" (empty string is valid)
const name2 = "" || "Anonymous";       // "Anonymous" (probably not intended)

const config = { retries: 0, timeout: 0 };
const retries = config.retries ?? 3;   // 0 (respect the config)
const timeout = config.timeout ?? 5000; // 0
```

### 19. BigInt

Native arbitrary-precision integers. No more `Number` overflow.

```javascript
// Regular numbers lose precision beyond 2^53 - 1
console.log(9007199254740991 + 1);   // 9007199254740992  (wrong!)
console.log(9007199254740991 + 2);   // 9007199254740992  (also wrong!)

// BigInt handles it
console.log(9007199254740991n + 1n); // 9007199254740992n
console.log(9007199254740991n + 2n); // 9007199254740993n

// Creating BigInts
const big = 123456789012345678901234567890n;
const fromStr = BigInt("123456789012345678901234567890");
const fromNum = BigInt(42);

// Arithmetic
const a = 100n;
const b = 7n;
console.log(a + b);   // 107n
console.log(a * b);   // 700n
console.log(a / b);   // 14n  (truncated, no decimals)
console.log(a % b);   // 2n

// Can't mix with regular numbers
console.log(10n + 5);  // TypeError: Cannot mix BigInt and Number
```

### 20. Dynamic import()

Load modules on demand — enables code splitting and lazy loading.

```javascript
// Static import — always loaded
import heavyLib from "./heavy-lib.js";

// Dynamic import — loaded only when needed
button.addEventListener("click", async () => {
    const { default: heavyLib } = await import("./heavy-lib.js");
    heavyLib.doWork();
});

// Conditional loading
async function loadImageProcessor(format) {
    if (format === "webp") {
        const { processWebP } = await import("./webp-processor.js");
        return processWebP;
    } else {
        const { processPNG } = await import("./png-processor.js");
        return processPNG;
    }
}

// With React.lazy
const AdminPanel = React.lazy(() => import("./AdminPanel"));
```

### 21. Promise.allSettled

Waits for all promises to settle (resolve or reject) — never short-circuits.

```javascript
const apiCalls = [
    fetch("/api/users").then(r => r.json()),
    fetch("/api/posts").then(r => r.json()),
    fetch("/api/comments").then(r => r.json()),  // this one might fail
];

// Promise.all — rejects if ANY reject
Promise.all(apiCalls)
    .then(([users, posts, comments]) => {
        // Never runs if comments fails
    })
    .catch(err => console.error("One failed:", err));

// Promise.allSettled — always resolves, gives you everything
Promise.allSettled(apiCalls).then(results => {
    results.forEach((result, i) => {
        if (result.status === "fulfilled") {
            console.log(`API ${i}:`, result.value);
        } else {
            console.error(`API ${i} failed:`, result.reason);
        }
    });
});
```

### 22. globalThis

A universal way to access the global object regardless of environment.

```javascript
// Before — different in every environment
// Browser: window
// Node: global
// Web Worker: self

// After — one name everywhere
globalThis.myGlobalVar = "hello";

// Works in:
// - Browser   (window === globalThis)
// - Node.js   (global === globalThis)
// - Workers   (self === globalThis)
```

### 23. String.prototype.matchAll

Returns an iterator of all matches including capture groups.

```javascript
const text = "Order #123, Item #456, Ref #789";
const re = /#(\d+)/g;

// Before — clunky while loop with exec
let match;
while ((match = re.exec(text)) !== null) {
    console.log(match[1]); // "123", "456", "789"
}

// After — matchAll
for (const match of text.matchAll(re)) {
    console.log(match[0]); // "#123", "#456", "#789"
    console.log(match[1]); // "123", "456", "789"
}

// Collect into array
const ids = [...text.matchAll(re)].map(m => m[1]);
// ["123", "456", "789"]
```

---

## ES2021 (ES12)

### 24. Logical Assignment Operators

Shorthand for combining logical operators with assignment.

```javascript
// ||= — assign if falsy
let port = 0;
port ||= 3000;   // port = 3000

// &&= — assign if truthy
let count = 5;
count &&= count + 1;  // count = 6

// ??= — assign if nullish
let name = null;
name ??= "Anonymous";  // name = "Anonymous"

// Practical: config defaults
function configure(options) {
    options ??= {};
    options.retries ??= 3;
    options.timeout ??= 5000;
    options.host ??= "localhost";
    return options;
}

configure({ retries: 0, timeout: 1000 });
// { retries: 0, timeout: 1000, host: "localhost" }
```

### 25. Numeric Separators

Make large numbers readable with underscores.

```javascript
// Before — hard to read
const budget = 1000000000;
const bytes = 1073741824;

// After — clear grouping
const budget = 1_000_000_000;     // 1 billion
const bytes = 1_073_741_824;      // 1 GiB
const pi = 3.141_592_653_589_793;

// Works with BigInt and binary/hex
const big = 1_000_000_000_000_000n;
const flags = 0b1010_0101;
const hex = 0xFF_FF_FF_FF;
```

### 26. String.prototype.replaceAll

Replace all occurrences without regex.

```javascript
// Before — had to use regex with /g flag
"hello world hello".replace(/hello/g, "hi"); // "hi world hi"

// After — simple string method
"hello world hello".replaceAll("hello", "hi"); // "hi world hi"

// Practical: template substitution
const template = "Hello {name}, welcome to {city}!";
const result = template
    .replaceAll("{name}", "Farshad")
    .replaceAll("{city}", "Tehran");
// "Hello Farshad, welcome to Tehran!"
```

### 27. Promise.any

Resolves with the first fulfilled promise. Rejects only if ALL reject.

```javascript
// Race multiple CDNs — use whichever responds first
const cdns = [
    fetch("https://cdn1.example.com/lib.js"),
    fetch("https://cdn2.example.com/lib.js"),
    fetch("https://cdn3.example.com/lib.js"),
];

const fastest = await Promise.any(cdns);

// vs Promise.race — rejects on first rejection
// vs Promise.all — rejects on first rejection
// vs Promise.allSettled — waits for all

// Practical: timeout with fallback
async function fetchWithTimeout(url, ms) {
    return Promise.any([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms)
        ),
    ]);
}
```

### 28. WeakRef and FinalizationRegistry

Hold weak references to objects and run cleanup callbacks.

```javascript
// WeakRef — reference without preventing GC
let hugeData = { /* lots of data */ };
const weakRef = new WeakRef(hugeData);

// Later — check if still alive
const obj = weakRef.deref();
if (obj) {
    console.log("Still alive:", obj);
} else {
    console.log("Garbage collected");
}

// FinalizationRegistry — cleanup callback after GC
const registry = new FinalizationRegistry((heldValue) => {
    console.log(`Cleanup: ${heldValue}`);
});

let target = { id: 1 };
registry.register(target, "resource-1");
target = null; // eventually triggers cleanup callback
```

### 29. Array.prototype.sort is now Stable

```javascript
// Sort is guaranteed stable across all engines (was implementation-dependent before)
const items = [
    { name: "A", priority: 1 },
    { name: "B", priority: 2 },
    { name: "C", priority: 1 },
    { name: "D", priority: 2 },
];

// Stable sort by priority — original order preserved within same priority
items.sort((a, b) => a.priority - b.priority);
// [{name:"A",priority:1}, {name:"C",priority:1}, {name:"B",priority:2}, {name:"D",priority:2}]
```

---

## ES2022 (ES13)

### 30. Top-Level await

Use `await` at the top level of a module — no wrapper function needed.

```javascript
// Before — needed an IIFE
(async () => {
    const config = await fetch("/config.json").then(r => r.json());
    initialize(config);
})();

// After — top-level await in ES modules
const config = await fetch("/config.json").then(r => r.json());
initialize(config);

// Dynamic dependency loading
const { render } = await import("./renderer.js");
render();

// Fallback data source
let users;
try {
    users = await fetch("/api/users").then(r => r.json());
} catch {
    users = await import("./fallback-users.js").then(m => m.default);
}
```

### 31. Class Fields (Public, Private, Static)

```javascript
class User {
    // Public field (with initializer)
    name = "Anonymous";
    role = "guest";

    // Private field — truly private, not just conventional
    #password = "";
    #createdAt = Date.now();

    // Static field — on the class, not instances
    static count = 0;
    static #maxUsers = 1000;

    constructor(name, password) {
        this.name = name;
        this.#password = password;
        User.count++;
    }

    // Private method
    #validatePassword(input) {
        return input === this.#password;
    }

    // Public method using private members
    authenticate(input) {
        if (this.#validatePassword(input)) {
            return `Welcome, ${this.name}`;
        }
        return "Access denied";
    }

    // Static method
    static canCreateMore() {
        return User.count < User.#maxUsers;
    }

    // Static initializer block
    static {
        console.log("User class loaded");
    }
}

const user = new User("Farshad", "secret123");
console.log(user.name);           // "Farshad"
console.log(user.password);       // undefined (doesn't exist)
console.log(user.#password);      // SyntaxError (truly private)
console.log(user.authenticate("secret123")); // "Welcome, Farshad"
console.log(User.count);          // 1
console.log(User.canCreateMore()); // true
```

### 32. Array.prototype.at

Negative indexing for arrays — read from the end.

```javascript
const arr = ["a", "b", "c", "d", "e"];

// Before — clunky
const last = arr[arr.length - 1];   // "e"
const secondLast = arr[arr.length - 2]; // "d"

// After — clean
console.log(arr.at(0));    // "a"  (same as arr[0])
console.log(arr.at(-1));   // "e"  (last element)
console.log(arr.at(-2));   // "d"  (second to last)
console.log(arr.at(-10));  // undefined (out of bounds)

// Works on strings too
"hello".at(-1); // "o"
```

### 33. Object.hasOwn

A safer alternative to `Object.prototype.hasOwnProperty`.

```javascript
const obj = Object.create(null); // no prototype
obj.name = "Farshad";

// Before — breaks on objects without prototype
obj.hasOwnProperty("name"); // TypeError: not a function

// Workaround
Object.prototype.hasOwnProperty.call(obj, "name"); // true (ugly)

// After — clean and safe
Object.hasOwn(obj, "name"); // true
Object.hasOwn(obj, "age");  // false

// Also avoids issues with properties named "hasOwnProperty"
const tricky = { hasOwnProperty: () => false, name: "test" };
Object.hasOwn(tricky, "name"); // true (ignores the shadowed method)
```

### 34. Error Cause

Chain errors with context — no more losing the original error.

```javascript
async function fetchUser(id) {
    try {
        const res = await fetch(`/api/users/${id}`);
        return await res.json();
    } catch (err) {
        throw new Error(`Failed to fetch user ${id}`, { cause: err });
    }
}

try {
    await fetchUser(42);
} catch (err) {
    console.error(err.message);        // "Failed to fetch user 42"
    console.error(err.cause);          // Original TypeError/NetworkError
    console.error(err.cause.message);  // "fetch failed"
}
```

---

## ES2023 (ES14)

### 35. Array findLast / findLastIndex

Search from the end of an array — no more `[...arr].reverse().find()`.

```javascript
const temps = [20, 22, 25, 18, 30, 28, 15];

// Find last temp above 25
const lastHot = temps.findLast(t => t > 25);
// 28

const lastHotIndex = temps.findLastIndex(t => t > 25);
// 5

// Before this, you'd have to do:
// [...temps].reverse().find(t => t > 25)  // clunky and mutates copy
```

### 36. Array methods with "from" — find from index

New non-mutating `toReversed`, `toSorted`, `toSpliced`, `with`:

```javascript
const arr = [3, 1, 4, 1, 5];

// Before — sort mutates the array
arr.sort();        // arr is now [1, 1, 3, 4, 5]

// After — non-mutating versions
const sorted = arr.toSorted((a, b) => a - b);  // [1, 1, 3, 4, 5]
console.log(arr);   // [3, 1, 4, 1, 5]  (unchanged!)

const reversed = arr.toReversed();  // [5, 1, 4, 1, 3]
console.log(arr);   // [3, 1, 4, 1, 5]  (unchanged!)

const spliced = arr.toSpliced(1, 2); // [3, 5]  (removed index 1-2)
console.log(arr);   // [3, 1, 4, 1, 5]  (unchanged!)

const updated = arr.with(0, 99); // [99, 1, 4, 1, 5]  (replace at index)
console.log(arr);   // [3, 1, 4, 1, 5]  (unchanged!)
```

### 37. Symbols as WeakMap Keys

```javascript
// Before — only objects as WeakMap keys
const weakMap = new WeakMap();
const obj = {};
weakMap.set(obj, "data"); // OK
// weakMap.set(Symbol(), "data"); // TypeError

// After — symbols allowed too
const sym = Symbol("key");
weakMap.set(sym, "data");
console.log(weakMap.get(sym)); // "data"
```

### 38. Hashbang Grammar

Allow `#!` shebang at the start of JS files.

```javascript
#!/usr/bin/env node
// The line above is now valid JavaScript syntax (not a comment hack)
console.log("I'm a CLI script");
```

---

## ES2024 (ES15)

### 39. Object.groupBy / Map.groupBy

Group array items by a key function — no more manual `reduce`.

```javascript
const products = [
    { name: "Apple", category: "fruit", price: 1 },
    { name: "Carrot", category: "vegetable", price: 0.5 },
    { name: "Banana", category: "fruit", price: 0.8 },
    { name: "Broccoli", category: "vegetable", price: 1.5 },
    { name: "Bread", category: "bakery", price: 2 },
];

// Object.groupBy — returns a plain object
const grouped = Object.groupBy(products, p => p.category);
// {
//   fruit:     [{name:"Apple",...}, {name:"Banana",...}],
//   vegetable: [{name:"Carrot",...}, {name:"Broccoli",...}],
//   bakery:    [{name:"Bread",...}]
// }

// Map.groupBy — returns a Map (any key type)
const byPriceRange = Map.groupBy(products, p => {
    if (p.price < 1) return "cheap";
    if (p.price < 2) return "mid";
    return "expensive";
});
// Map(2) { "cheap" => [...], "mid" => [...] }

// Before this, you'd need:
// products.reduce((acc, p) => {
//     (acc[p.category] ??= []).push(p);
//     return acc;
// }, {});
```

### 40. Promise.withResolvers

Extract `resolve` and `reject` without the callback dance.

```javascript
// Before — awkward pattern for external resolve/reject
let resolve, reject;
const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
});
// resolve and reject are now available outside

// After — clean one-liner
const { promise, resolve, reject } = Promise.withResolvers();

// Practical: event-driven promise
function waitForEvent(target, eventName) {
    const { promise, resolve } = Promise.withResolvers();
    target.addEventListener(eventName, resolve, { once: true });
    return promise;
}

// Practical: deferred cache
const cache = new Map();

function getCached(key, fetcher) {
    if (cache.has(key)) return cache.get(key).promise;

    const { promise, resolve, reject } = Promise.withResolvers();
    cache.set(key, { promise, resolve, reject });

    fetcher().then(resolve).catch(reject);
    return promise;
}
```

### 41. String isWellFormed / toWellFormed

Check and fix lone surrogates (invalid UTF-16).

```javascript
// isWellFormed — check if string is valid UTF-16
const valid = "Hello 🌍";
const invalid = "Hello \uD800"; // lone surrogate

console.log(valid.isWellFormed());   // true
console.log(invalid.isWellFormed()); // false

// toWellFormed — replace lone surrogates with U+FFFD
const fixed = invalid.toWellFormed();
console.log(fixed); // "Hello �"
console.log(fixed.isWellFormed()); // true
```

### 42. Atomics.waitAsync

Non-blocking wait on shared memory — for main thread use.

```javascript
const buffer = new SharedArrayBuffer(4);
const view = new Int32Array(buffer);

// Before — Atomics.wait() blocks (can't use on main thread)
// Atomics.wait(view, 0, 0); // blocks until changed

// After — async version, works on main thread
const result = Atomics.waitAsync(view, 0, 0);
console.log(result.async); // true

result.value.then(() => {
    console.log("Value changed!");
});

// In another thread:
// Atomics.notify(view, 0); // triggers the promise above
```

---

## ES2025 (ES16)

### 43. Set Methods (union, intersection, difference, etc.)

Set finally gets proper set-theory operations.

```javascript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

// Union — all elements from both
a.union(b);        // Set {1, 2, 3, 4, 5, 6}

// Intersection — elements in both
a.intersection(b); // Set {3, 4}

// Difference — in a but not in b
a.difference(b);   // Set {1, 2}

// Symmetric difference — in one but not both
a.symmetricDifference(b); // Set {1, 2, 5, 6}

// Subset — is a contained in b?
const c = new Set([3, 4]);
c.isSubsetOf(b);   // true

// Superset — does a contain c?
a.isSupersetOf(c); // true

// Disjoint — no elements in common?
const d = new Set([10, 20]);
a.isDisjointFrom(d); // true
```

### 44. Iterator Helpers (map, filter, take, etc.)

Lazy-computation chain methods on any iterator — no intermediate arrays.

```javascript
function* naturals() {
    let n = 1;
    while (true) yield n++;
}

// Before — eager, creates arrays at every step
const result = naturals()
    .map(x => x * 2)      // infinite loop! crashes
    .filter(x => x > 10)
    .take(3);

// After — lazy iterator helpers
const result = naturals()
    .map(x => x * 2)        // lazily applied
    .filter(x => x > 10)    // lazily applied
    .take(3)                // stops after 3
    .toArray();             // [12, 14, 16]

// Other helpers
const evens = naturals().filter(x => x % 2 === 0).take(5).toArray();
// [2, 4, 6, 8, 10]

const dropped = naturals().drop(3).take(3).toArray();
// [4, 5, 6]

const mapped = naturals().map(x => x ** 2).take(4).toArray();
// [1, 4, 9, 16]

const reduced = naturals().take(5).reduce((acc, n) => acc + n, 0);
// 15
```

### 45. Promise.try

Wrap a synchronous function in a promise — unified error handling.

```javascript
// Before — sync errors don't become rejections
function parseConfig(json) {
    return Promise.resolve(JSON.parse(json)); // sync error escapes!
}

// After — Promise.try catches sync errors
function parseConfig(json) {
    return Promise.try(() => JSON.parse(json));
}

parseConfig("{bad json}")
    .then(config => console.log(config))
    .catch(err => console.error("Parse error:", err.message));

// Practical: unified try/catch for sync + async
function getData(id) {
    return Promise.try(() => {
        if (!id) throw new Error("ID required");
        return db.findById(id); // may be sync or async
    });
}
```

### 46. RegExp.escape

Escape a string for use in a regex pattern.

```javascript
const userInput = "Price: $42 + tax";

// Before — manual escaping (error-prone)
const escaped = userInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re = new RegExp(escaped);

// After — built-in
const re = new RegExp(RegExp.escape(userInput));
console.log(re.test("Total Price: $42 + tax is $50")); // true
```

### 47. Duplicate Named Capture Groups

Multiple groups with the same name in different alternation branches.

```javascript
// Before — SyntaxError: duplicate group name
// /(?<year>\d{4})|(?<year>\d{2})/  ❌

// After — allowed if they're in different alternatives
const dateRe = /(?<year>\d{4})-(?<month>\d{2})|(?<month>\d{2})\/(?<year>\d{4})/;

const m1 = "2026-08".match(dateRe);
console.log(m1.groups.year);  // "2026"

const m2 = "08/2026".match(dateRe);
console.log(m2.groups.year);  // "2026" (from the second alternative)
```

---

## Summary

| Version | Year | Key Features |
|---------|------|-------------|
| ES2016 | 2017 | `includes()`, `**` |
| ES2017 | 2018 | `async/await`, `Object.entries/values`, `padStart/padEnd` |
| ES2018 | 2019 | Rest/spread for objects, `for await...of`, `finally`, regex |
| ES2019 | 2020 | `flat/flatMap`, `Object.fromEntries`, `trimStart/trimEnd` |
| ES2020 | 2021 | `?.`, `??`, `BigInt`, `import()`, `allSettled`, `globalThis` |
| ES2021 | 2022 | `\|\|=`, `??=`, `replaceAll`, `Promise.any`, numeric separators |
| ES2022 | 2023 | Top-level await, class fields, `at()`, `Object.hasOwn`, `Error.cause` |
| ES2023 | 2024 | `findLast`, `toSorted/toReversed/toSpliced/with`, hashbang |
| ES2024 | 2025 | `groupBy`, `Promise.withResolvers`, `waitAsync`, well-formed strings |
| ES2025 | 2026 | Set methods, iterator helpers, `Promise.try`, `RegExp.escape` |

JavaScript keeps evolving every year. The TC39 process ensures that features are
carefully designed, prototyped, and tested before they land in the spec. If you're
working with modern tooling (Babel, TypeScript, Vite, esbuild), you can use most
of these features today.

Keep building. Keep learning.

— Farshad
