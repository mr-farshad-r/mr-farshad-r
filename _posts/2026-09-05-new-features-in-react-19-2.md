---
layout: post
title: "What’s New in React 19.2: Activity, Effect Events, and Faster Debugging"
date: 2026-09-05
description: Explore the most useful React 19.2 features with a practical dashboard example using Activity, useEffectEvent, and modern performance tooling.
image: /assets/images/posts/react-19-2-new-features.jpg
image_alt: A glowing React-inspired symbol connects hidden interface panels, notifications, and performance charts.
---

React 19.2 is an unusually practical release. Instead of changing how every
component is written, it targets recurring problems: preserving hidden UI,
keeping Effect logic current without reconnecting to external systems, and
understanding where rendering time goes.

This guide covers the stable features that matter most in everyday application
code and combines two of them in a small notification dashboard you can run
locally.

> **Version note:** React 19.2 introduced the APIs in this article. Install the
> latest patched React 19.2 release rather than pinning `19.2.0`, especially if
> your application uses React Server Components.

## 1. Preserve hidden UI with Activity

Applications often switch between screens with conditional rendering:

```tsx
{activeTab === "notifications" ? <NotificationList /> : null}
```

When the condition becomes false, React unmounts `NotificationList`. Its local
state and DOM are lost, so returning to the tab starts from scratch.

React 19.2 adds [`<Activity>`](https://react.dev/reference/react/Activity), which
can hide a subtree while preserving its state:

```tsx
import { Activity } from "react";

<Activity mode={activeTab === "notifications" ? "visible" : "hidden"}>
  <NotificationList />
</Activity>
```

In `hidden` mode, React hides the subtree with CSS, cleans up its Effects, and
defers its updates. When it becomes visible again, the previous state is still
there and Effects are recreated.

This is useful for tabs, drawers, route previews, and any expensive interface a
user is likely to revisit. It is not a replacement for conditionally rendering
content that should truly be destroyed, such as a completed payment form with
sensitive values.

## 2. Separate events from Effects with useEffectEvent

Consider a live connection that should be recreated only when `roomId` changes,
but should show notifications using the latest theme:

```tsx
useEffect(() => {
  const connection = connect(roomId);

  connection.on("connected", () => {
    showToast("Connected", theme);
  });

  return () => connection.disconnect();
}, [roomId, theme]);
```

The dependency list is honest, but changing the theme now disconnects and
reconnects the room. The notification needs the latest `theme`; the connection
does not.

[`useEffectEvent`](https://react.dev/reference/react/useEffectEvent) separates
that non-reactive event logic:

```tsx
import { useEffect, useEffectEvent } from "react";

const onConnected = useEffectEvent(() => {
  showToast("Connected", theme);
});

useEffect(() => {
  const connection = connect(roomId);
  connection.on("connected", onConnected);

  return () => connection.disconnect();
}, [roomId]);
```

The Effect synchronizes with `roomId`, while the Effect Event always reads the
latest committed theme. Effect Events may only be called from Effects or other
Effect Events in the same component. They are not a general escape hatch for
dependency arrays; use them only for logic that is conceptually an event caused
by an Effect.

Upgrade `eslint-plugin-react-hooks` with React so the linter understands and
enforces these rules.

## 3. Find slow work with React Performance Tracks

React 19.2 adds custom React tracks to Chrome DevTools Performance recordings.
The tracks show scheduler work, component rendering, and Effects alongside the
browser's network, layout, and paint activity.

This makes questions such as these easier to answer:

- Was a delayed interaction blocked by JavaScript or by rendering?
- Which update was urgent, and which work ran inside a transition?
- Did an Effect trigger another expensive render?
- Was a Suspense boundary waiting or revealing content?

Open Chrome DevTools, select **Performance**, record the slow interaction, and
inspect the React tracks. Use the profiler to confirm a measured bottleneck
before adding memoization.

## 4. Cancel abandoned Server Component work with cacheSignal

`cacheSignal()` returns an `AbortSignal` tied to the lifetime of a React
`cache()` render. It lets a Server Component cancel work that is no longer
needed because rendering completed, failed, or was aborted:

```tsx
import { cache, cacheSignal } from "react";

const getReport = cache(async (id: string) => {
  const response = await fetch(`https://api.example.com/reports/${id}`, {
    signal: cacheSignal() ?? undefined,
  });

  if (!response.ok) throw new Error("Could not load report");
  return response.json();
});
```

This API is currently for React Server Components. In a Client Component it
returns `null`, so it does not replace the normal `AbortController` pattern for
client-side requests.

## 5. Build hybrid pages with Partial Pre-rendering

React DOM 19.2 can pre-render a static shell, save the postponed state, and
resume the remaining server render later. A framework can serve stable content
from a CDN while filling in request-specific content dynamically.

The low-level flow uses `prerender` from `react-dom/static`, followed by
`resume` or `resumeToPipeableStream` from `react-dom/server`. Most application
teams should use the integration provided by their framework instead of owning
the postponed-state storage and streaming lifecycle themselves.

## Practical example: a persistent live dashboard

The accompanying example combines `Activity` and `useEffectEvent`. It has two
tabs, a simulated live connection, a theme switcher, and a text filter:

- Switching tabs hides the feed but preserves its filter and messages.
- Hiding the feed cleans up its simulated connection.
- Changing the theme does not reconnect the feed.
- The next incoming notification still uses the latest theme.

Clone the repository, then run:

```bash
cd examples/react-19-2-features
npm install
npm run dev
```

The important part of `LiveNotifications.tsx` looks like this:

```tsx
const onMessage = useEffectEvent((message: string) => {
  setMessages((current) => [
    { id: crypto.randomUUID(), message, theme },
    ...current,
  ]);
});

useEffect(() => {
  const stop = connectToFeed(channel, onMessage);
  return stop;
}, [channel]);
```

The Effect owns the connection lifecycle and depends only on `channel`.
`onMessage` behaves like an event fired by that connection, so it can read the
latest `theme` without making theme changes restart the Effect.

The parent keeps the complete feed subtree alive:

```tsx
<Activity mode={activeTab === "feed" ? "visible" : "hidden"}>
  <LiveNotifications channel="releases" theme={theme} />
</Activity>
```

Try entering a filter, switch to the About tab, change the theme, and return.
The filter remains, the connection restarts, and new notifications use the new
theme.

## Upgrade checklist

1. Upgrade `react` and `react-dom` together to the latest 19.2 patch.
2. Upgrade `eslint-plugin-react-hooks` to the latest compatible version.
3. Replace state-preserving conditional UI with `Activity` selectively.
4. Use `useEffectEvent` only when part of an Effect needs fresh values without
   re-synchronizing the external resource.
5. Record important interactions with React Performance Tracks before and after
   the upgrade.
6. Follow your framework's documentation before adopting Server Component or
   Partial Pre-rendering APIs.

React 19.2 does not demand a rewrite. Its strongest features let applications do
less unnecessary work while making the intended lifecycle more explicit: keep
UI state when it should survive, reconnect only when synchronization inputs
change, and profile the result with better evidence.

## Further reading

- [React 19.2 release notes](https://react.dev/blog/2025/10/01/react-19-2)
- [Activity reference](https://react.dev/reference/react/Activity)
- [useEffectEvent reference](https://react.dev/reference/react/useEffectEvent)
- [cacheSignal reference](https://react.dev/reference/react/cacheSignal)
- [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
