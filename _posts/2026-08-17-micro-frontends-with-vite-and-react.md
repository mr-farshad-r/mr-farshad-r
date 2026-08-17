---
layout: post
title: "Build Micro-Frontends with Vite and React"
date: 2026-08-17
description: Build a practical React micro-frontend with Vite, Module Federation, independent deployments, shared dependencies, and resilient loading.
---

Micro-frontends split a browser application into features that teams can build,
test, and deploy independently. A shell owns the page frame and integration
points; remote applications provide focused capabilities such as a product
catalog, checkout, or account area.

That independence is valuable, but it is not free. The browser still presents
one product, so the applications must agree on contracts, dependencies,
routing, styling, observability, and failure behavior. This guide builds the
smallest useful example with React, Vite, and Module Federation, then covers the
decisions needed to run the pattern safely in production.

## When a micro-frontend is the right tool

Use micro-frontends when independently operating teams need independent release
cycles and own distinct business areas. A good boundary is usually a vertical
slice, such as `catalog` or `billing`, rather than a technical layer such as
`buttons` or `forms`.

Keep a modular monolith when one team owns the whole interface, releases are
already coordinated, or the application is small. Multiple builds, repositories,
and runtimes create real operational cost. Module Federation solves runtime code
loading; it does not create good organizational boundaries by itself.

## The example architecture

We will create two Vite applications:

- `shell` renders navigation, global layout, and error/loading states.
- `products` owns a product card and exposes it as a remote module.

At build time, `products` emits its normal JavaScript and CSS plus a
`remoteEntry.js` manifest. At runtime, the shell downloads that entry, requests
the exposed component, and renders it like a local lazy-loaded component.

Each project remains independently buildable and deployable:

```text
Browser
  └── shell.example.com
        ├── shell assets
        └── products.example.com/assets/remoteEntry.js
              └── ProductCard and its chunks
```

## Create the two React applications

Create the projects side by side and install the federation plugin in each:

```bash
npm create vite@latest shell -- --template react-ts
npm create vite@latest products -- --template react-ts

cd shell
npm install
npm install --save-dev @originjs/vite-plugin-federation

cd ../products
npm install
npm install --save-dev @originjs/vite-plugin-federation
```

The example uses `@originjs/vite-plugin-federation`. Federation is supplied by
a Vite plugin rather than by React or Vite itself, so review plugin compatibility
when upgrading the build tool.

## Expose a component from the products app

Create `products/src/ProductCard.tsx`:

```tsx
type ProductCardProps = {
  name: string;
  price: number;
  onAddToCart?: () => void;
};

export default function ProductCard({
  name,
  price,
  onAddToCart,
}: ProductCardProps) {
  return (
    <article className="product-card">
      <h2>{name}</h2>
      <p>${price.toFixed(2)}</p>
      <button type="button" onClick={onAddToCart}>
        Add to cart
      </button>
    </article>
  );
}
```

Then configure `products/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "products",
      filename: "remoteEntry.js",
      exposes: {
        "./ProductCard": "./src/ProductCard.tsx",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    target: "esnext",
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
});
```

The public contract is the key-value pair in `exposes`. Consumers import
`products/ProductCard`; the file location behind that name can change without
breaking them.

React and React DOM are shared so the host and remote can use one compatible
runtime. Accidentally loading multiple React instances can cause invalid Hook
calls and context that does not cross the application boundary. Keep their
versions aligned, test upgrades across the full system, and share only
dependencies whose duplication is costly or unsafe. Sharing every package
couples deployments and makes version negotiation harder.

## Consume the remote from the shell

Configure `shell/vite.config.ts` with the remote entry URL:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "shell",
      remotes: {
        products: "http://localhost:4174/assets/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    target: "esnext",
  },
});
```

TypeScript does not know about the virtual remote module. Add
`shell/src/remotes.d.ts`:

```ts
declare module "products/ProductCard" {
  import type { ComponentType } from "react";

  export type ProductCardProps = {
    name: string;
    price: number;
    onAddToCart?: () => void;
  };

  const ProductCard: ComponentType<ProductCardProps>;
  export default ProductCard;
}
```

Now load the component in `shell/src/App.tsx`:

```tsx
import { lazy, Suspense } from "react";
import "./App.css";

const ProductCard = lazy(() => import("products/ProductCard"));

export default function App() {
  return (
    <main>
      <h1>Store</h1>
      <Suspense fallback={<p>Loading products…</p>}>
        <ProductCard
          name="Mechanical keyboard"
          price={129}
          onAddToCart={() => console.log("Added to cart")}
        />
      </Suspense>
    </main>
  );
}
```

`lazy` delays fetching and evaluating the remote until React renders it.
`Suspense` supplies a loading state, but it does not catch network or render
errors. Put an error boundary around each independently loaded feature so a
failed deployment or temporary CDN problem does not blank the entire page.

## Run the example locally

The plugin's remote application must produce a federation entry. Build it and
serve the output:

```bash
cd products
npm run build
npm run preview
```

In another terminal, start the shell:

```bash
cd shell
npm run dev
```

The plugin supports the host in Vite's normal development mode, but the remote
must be built because Vite's development server is bundleless. During active
remote development, `vite build --watch` can shorten the feedback loop. This is
an important workflow constraint to test before adopting the architecture.

If the browser blocks the remote, verify its URL first, then check CORS headers.
The server or CDN that hosts `remoteEntry.js` and its chunks must allow requests
from the shell's origin.

## Design contracts, not imports

A remote component's props form a public API. Keep that API small, typed, and
stable. Prefer serializable data and callbacks:

```tsx
<ProductCard
  name={product.name}
  price={product.price}
  onAddToCart={() => cart.add(product.id)}
/>
```

This leaves product presentation with the remote and cart behavior with its
owner. Avoid importing the shell's internal store, reaching into another
remote's files, or coordinating through global variables. Those shortcuts turn
independent applications back into a distributed monolith.

For contracts used by several teams, publish a small versioned package that
contains TypeScript types and event schemas, but no application runtime. Add
consumer-driven integration tests so a remote release is checked against the
shell contract before deployment.

## Decide ownership at every boundary

A maintainable system makes these responsibilities explicit:

- **Routing:** the shell owns top-level URLs; a remote may own routes beneath
  its assigned prefix.
- **Authentication:** the shell establishes the session and passes the minimum
  identity or capability data a remote needs. Do not copy tokens into globals.
- **Data:** each domain fetches and caches its own server data. Shared client
  state should be the exception.
- **Design system:** publish versioned tokens and accessible primitives. Avoid a
  global stylesheet that silently changes every remote.
- **Events:** use typed callbacks for nearby components and documented browser
  events for truly decoupled workflows. Include version and correlation data.
- **Observability:** attach the remote name, version, route, and release ID to
  errors and performance measurements.

CSS is a particularly easy source of accidental coupling. Use CSS Modules,
scoped naming, or another isolation strategy, and let the shell own page-level
layout. A remote should not reset `body`, overwrite global typography, or assume
it controls the viewport.

## Deploy without breaking the shell

Replace the local remote URL with a production URL, preferably supplied by a
release-specific configuration rather than scattered through source code:

```ts
remotes: {
  products: "https://products.example.com/assets/remoteEntry.js",
}
```

The remote entry must point to chunks that remain available after a new release.
A safe deployment usually follows these rules:

1. Give content chunks immutable, hashed filenames and long cache lifetimes.
2. Serve `remoteEntry.js` with a short cache lifetime or explicit revalidation.
3. Upload new assets before publishing the new remote entry.
4. Keep previous chunks available long enough for open browser sessions.
5. Roll out gradually and monitor remote load failures by release.

Vite's `base` option controls generated asset paths when a remote is hosted
beneath a subpath. Test the deployed artifact from its real origin; a local
preview cannot expose every CDN, path-rewrite, CSP, or CORS error.

Also treat a remote as executable third-party code even when another internal
team owns it. Restrict who can publish it, protect the build pipeline, generate
a software bill of materials, and use Content Security Policy to limit allowed
script and connection origins. Independent deployment should not mean
unreviewed production execution.

## Test at three levels

The test strategy should follow the ownership model:

- Each remote runs unit, accessibility, and component tests on its own.
- Contract tests verify exposed module names, props, events, and shared-library
  compatibility.
- A small end-to-end suite deploys the shell with real remote artifacts and
  exercises critical user journeys.

Test failure modes too: an unavailable remote, an outdated cached entry, a slow
chunk, incompatible shared dependencies, and a component that throws while
rendering. Graceful degradation is part of the micro-frontend contract.

## Takeaways

- Split by business ownership and release independence, not by arbitrary UI
  fragments.
- Expose small, stable contracts and load remotes behind Suspense and error
  boundaries.
- Share React carefully and keep dependency versions compatible.
- Give routes, state, styles, authentication, and telemetry clear owners.
- Design caching and rollback together so independent deployments remain safe.
- Prefer a modular monolith until team autonomy justifies the runtime and
  operational complexity.

Vite and React make the visible integration concise. The lasting architecture
comes from disciplined boundaries: when each team can change its feature
without surprising the rest of the page, the micro-frontend is doing its job.

## Sources

- [Vite: Getting Started](https://vite.dev/guide/)
- [Vite: Building for Production](https://vite.dev/guide/build)
- [Vite: Shared Options](https://vite.dev/config/shared-options)
- [OriginJS: Vite Plugin Federation](https://github.com/originjs/vite-plugin-federation)
- [React: `lazy`](https://react.dev/reference/react/lazy)
- [React: `Suspense`](https://react.dev/reference/react/Suspense)
- [React: Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
