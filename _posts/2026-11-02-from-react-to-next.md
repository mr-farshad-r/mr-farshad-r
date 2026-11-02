---
layout: post
title: "From React to Next: Your Components, Full Stack"
date: 2026-11-02
lang: en
direction: ltr
description: "Learn Next.js as a React developer with practical App Router examples covering routing, layouts, Server Components, data fetching, and loading states."
excerpt: "Your React skills are the starting point. Learn how Next.js connects your components to routes, server-side data, and interactive experiences."
image: /assets/images/posts/default-post-placeholder.jpg
image_alt: "Default blog post cover illustration."
---

You know how to build React components. You can manage state, handle events, write custom hooks, and turn a design into a working interface.

Then you open a Next.js project. There is no familiar router configuration. A page can be an async function. Adding `useState` produces an error about Client Components. A tutorial says to fetch data on the server, while an older article starts with a completely different folder structure.

The difficult part is understanding where your React code runs and how a request moves through the application. Once that becomes clear, the files and conventions have a purpose.

This guide uses the App Router and a small reading app. We will build a post list, individual post pages, shared navigation, and one interactive component. The examples use TypeScript and a public demonstration API; they are intended as learning examples rather than a production application.

## Keep your React knowledge and add one question

Components, props, composition, and state still matter. Next.js gives those components a larger environment: routes, server-side data access, and browser interactivity.

Before writing a component, ask:

> Does this component need the browser, or does it mainly need data?

A post body primarily needs content. A button that expands a section needs an event handler and state. An account page may need both: server-side work to load the permitted data and a smaller interactive component for editing it.

You will make better decisions by identifying those responsibilities before adding hooks or fetching data.

## Start with the route structure

Before following a tutorial, check which router it uses. This article uses the `app` directory throughout. If another guide starts with a `pages` directory or introduces `getServerSideProps`, it is teaching a different routing model. Those examples can still be relevant to an existing project, but combining their conventions with this walkthrough makes learning unnecessarily confusing.

Keep one reference project while you learn. When you encounter a new pattern, ask which file it belongs in and which part of your existing flow it changes. That habit helps you connect concepts instead of collecting disconnected snippets.

The App Router uses folders and special files to define routes. For our reading app, the structure looks like this:

```text
app/
  layout.tsx
  page.tsx
  about/
    page.tsx
  posts/
    page.tsx
    loading.tsx
    [id]/
      page.tsx
  components/
    reading-counter.tsx
```

The relevant routes are:

| File | URL |
| --- | --- |
| `app/page.tsx` | `/` |
| `app/about/page.tsx` | `/about` |
| `app/posts/page.tsx` | `/posts` |
| `app/posts/[id]/page.tsx` | `/posts/1`, for example |

A folder supplies a route segment. A `page.tsx` file makes the page available at that route. Square brackets mark a dynamic segment whose value comes from the URL. The `components` folder above contains reusable code; without a page or route handler, that folder does not expose its own endpoint.

Create a simple page first:

```tsx
// app/about/page.tsx
export default function AboutPage() {
  return (
    <main>
      <h1>About this reading app</h1>
      <p>A small project for learning Next.js.</p>
    </main>
  )
}
```

This is an ordinary React component with a framework-defined location. See the official [layouts and pages guide](https://nextjs.org/docs/app/getting-started/layouts-and-pages) for the routing conventions.

## Put shared UI in a layout

Navigation belongs around our pages. A root layout receives the current page through `children` and includes the document's `html` and `body` elements:

```tsx
// app/layout.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
          {' · '}
          <Link href="/posts">Posts</Link>
          {' · '}
          <Link href="/about">About</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

Use `Link` for navigation between these application routes. You can add a nested layout later, such as `app/dashboard/layout.tsx`, when a group of pages needs a shared sidebar.

Layouts preserve state during navigation between the pages they wrap. That makes them useful for persistent interface elements. Their nesting follows the folder hierarchy. [Next.js layout documentation](https://nextjs.org/docs/app/getting-started/layouts-and-pages)

## Understand the server and client boundary

Pages and layouts are Server Components by default. They can do server-side work and render content without shipping their component implementation as browser JavaScript.

When a component needs state, effects, event handlers, or browser APIs, give it a client boundary with `'use client'`:

```tsx
// app/components/reading-counter.tsx
'use client'

import { useState } from 'react'

export default function ReadingCounter() {
  const [count, setCount] = useState(0)

  return (
    <section aria-label="Reading practice">
      <p>Posts read this session: {count}</p>
      <button onClick={() => setCount((value) => value + 1)}>
        Mark another as read
      </button>
    </section>
  )
}
```

Render it from the home page:

```tsx
// app/page.tsx
import ReadingCounter from './components/reading-counter'

export default function HomePage() {
  return (
    <main>
      <h1>My reading app</h1>
      <ReadingCounter />
    </main>
  )
}
```

Keep the client boundary close to the interaction. Putting `'use client'` at the top of a large component tree can pull its imported modules into the client bundle. Values passed across the boundary must be serializable by React; pass the data the interaction needs rather than database clients or private credentials.

Also, a Client Component can be prerendered on the server for the first load. The directive does not make `window` or `localStorage` safe to access during rendering. Browser-dependent work belongs in an appropriate effect or event handler. [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

Our counter is deliberately temporary. Reloading resets it. Later, saving reading progress will be a separate feature with its own persistence requirements.

## Fetch the list on the server

Consider what the page needs before choosing a fetching strategy. The post list is useful as soon as its titles and links are available. It does not need an effect to discover what to render after mounting in the browser.

Fetching in the page also puts the failure close to the operation that caused it. You can distinguish an unsuccessful HTTP response from a successful response containing an empty list. Those cases deserve different messages in a finished interface.

In a browser-focused React application, you may be used to fetching initial page data inside an effect. For this route, an async Server Component can await the data directly:

```tsx
// app/posts/page.tsx
import Link from 'next/link'

type Post = {
  id: number
  title: string
}

export default async function PostsPage() {
  const response = await fetch(
    'https://jsonplaceholder.typicode.com/posts',
    { cache: 'no-store' },
  )

  if (!response.ok) {
    throw new Error('Unable to load posts')
  }

  const posts: Post[] = await response.json()

  return (
    <main>
      <h1>Posts</h1>
      <ul>
        {posts.slice(0, 10).map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

The sequence is easy to follow: request data, check the response, and render the result. You can also query a database from server-side code without creating an HTTP endpoint solely for your own Server Component to call.

The `Post` type describes the expected API response; it does not validate incoming JSON at runtime. An application consuming untrusted or changing data should validate that boundary as well.

This example explicitly requests uncached data with `no-store`. Current documentation does not treat every fetch as persistently cached by default. Request memoization and caching across requests are different mechanisms, so make freshness decisions deliberately. [Fetching data in Next.js](https://nextjs.org/docs/app/getting-started/fetching-data)

Client-side fetching still has a place. An autocomplete control or continuously updating browser view may need it. Choose according to the interaction rather than moving every request to one environment.

## Build a detail page with a dynamic segment

The list links to `/posts/1`, `/posts/2`, and similar URLs. Create the corresponding page under `[id]`:

```tsx
// app/posts/[id]/page.tsx
import { notFound } from 'next/navigation'

type Post = {
  id: number
  title: string
  body: string
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!/^[1-9]\d*$/.test(id)) {
    notFound()
  }

  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    { cache: 'no-store' },
  )

  if (response.status === 404) {
    notFound()
  }

  if (!response.ok) {
    throw new Error('Unable to load this post')
  }

  const post: Post = await response.json()

  return (
    <main>
      <article>
        <h1>{post.title}</h1>
        <p>{post.body}</p>
      </article>
    </main>
  )
}
```

In current App Router APIs, `params` is asynchronous. Await it before reading the dynamic value. The validation also prevents malformed IDs from being forwarded to the demonstration API. See the [page API reference](https://nextjs.org/docs/app/api-reference/file-conventions/page).

A missing post and a failed service request mean different things. The first calls `notFound()`; the second throws an error. Preserve that distinction so users get a useful result when something goes wrong.

Notice another detail: the URL identifies the post. Someone should be able to copy that URL, open it in a new tab, and get the same article without first visiting the list.

Avoid making a detail page depend entirely on a record stored in client state during the previous navigation. That can appear to work while clicking through the application and fail on refresh. Use the route value to load the resource, then add client-side conveniences around that reliable baseline.

## Make waiting part of the interface

Add a loading file beside the post list:

```tsx
// app/posts/loading.tsx
export default function Loading() {
  return <p role="status">Loading posts…</p>
}
```

Next.js creates a Suspense boundary around the page and its children using this file. You can also use `<Suspense>` around individual sections when they should load independently. [Loading and streaming](https://nextjs.org/docs/app/getting-started/fetching-data)

For a small reading app, one route-level loading state is a useful beginning. A dashboard may benefit from more boundaries: its navigation can remain usable while a slow report finishes.

Choose boundaries according to what the user can meaningfully see and use. Too many independent placeholders can make a simple page harder to follow.

## Decide how fresh each piece of data must be

Caching is easier to understand when you start with a requirement:

> After someone edits a post, they should see the updated title in both the detail page and the list.

Now you can evaluate whether your data fetching and invalidation behavior satisfy that requirement.

For each data source, ask:

- How old may the result be?
- Is it public or specific to one user?
- What event should refresh it?
- What should appear immediately after a successful write?

A public article and a private account balance need different policies. Learn the caching options for your installed Next.js version and configuration, then verify their behavior in a production build. Avoid copying settings from an older tutorial without checking their meaning.

Start with the official [data-fetching guide](https://nextjs.org/docs/app/getting-started/fetching-data) and follow its caching references as your project needs them.

## Give state a clear owner

Next.js does not remove the need to decide where state belongs. It gives you more places to consider.

| Value | A useful owner to consider |
| --- | --- |
| Whether a menu is expanded | Local component state |
| A filter that should survive sharing a link | URL search parameters |
| Saved reading progress | Persistent storage |
| An unfinished form draft | Form or component state |

For our reading app, the server can load a post while a small Client Component manages an expandable panel. Neither responsibility requires a global store by itself.

Move state outward when multiple parts of the interface need to coordinate. Keep it local when one component owns the behavior. This is the same reasoning you already apply in React, now with the server and URL included in the picture.

## Follow one request through the application

The examples become easier to understand when you walk through them as a sequence.

Imagine someone opens `/posts/3` in a new browser tab:

1. The route structure identifies `app/posts/[id]/page.tsx` as the matching page.
2. The page reads the dynamic `id` value.
3. Server-side code validates that value and requests the corresponding post.
4. The response is checked before its content is rendered.
5. The page presents the post inside the shared layout.
6. Any Client Components provide their interactive behavior when ready.

Now imagine the API is unavailable. The request fails before the page can display its normal content. That is an error-handling problem, rather than a reason to pretend the post does not exist.

Finally, imagine the post loads correctly but a reading counter stops responding. The data path worked; the failure belongs to the interactive part of the page. You can investigate that boundary without rewriting the fetching code.

This way of tracing a request helps narrow bugs. Instead of asking why Next.js is broken, ask which stage produced an unexpected result: route matching, input handling, data access, rendering, or interaction.

## Compose data and interaction deliberately

A useful component boundary often follows a user responsibility. The page loads the article. A disclosure control lets the reader reveal a short explanation. That control only needs its children and a small amount of local state:

```tsx
// app/components/reading-tip.tsx
'use client'

import { useId, useState } from 'react'
import type { ReactNode } from 'react'

export default function ReadingTip({
  children,
}: {
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  return (
    <section>
      <button
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide reading tip' : 'Show reading tip'}
      </button>
      <div id={contentId} hidden={!open}>
        {children}
      </div>
    </section>
  )
}
```

The page can provide the content:

```tsx
import ReadingTip from './components/reading-tip'

export default function HomePage() {
  return (
    <main>
      <h1>My reading app</h1>
      <ReadingTip>
        <p>Write a one-sentence summary after each article.</p>
      </ReadingTip>
    </main>
  )
}
```

This home page is an alternative to the earlier counter example. You can combine them if you want both exercises.

The control owns expansion state. Its parent owns the content being supplied. Using `children` keeps those responsibilities clear and follows the documented composition pattern for passing server-rendered UI into a Client Component. [Server and client composition](https://nextjs.org/docs/app/getting-started/server-and-client-components)

For an ordinary disclosure without custom behavior, consider native `details` and `summary` elements first. The example above is useful for practicing the boundary; a real feature should earn the extra JavaScript.

## Design empty, missing, and failed states separately

A successful API response can contain no posts. A particular post can be absent. A service can fail to respond. These conditions should not collapse into one generic empty screen.

For the reading app, define the intended behavior before adding more code:

| Situation | Useful behavior |
| --- | --- |
| The list is empty | Explain that no posts are available. |
| A filter has no matches | Preserve the filter and offer a way to change it. |
| A requested article is missing | Explain that the article could not be found. |
| The data service fails | Explain that loading failed and provide an appropriate recovery path. |
| Saving a note fails | Keep the draft available so the reader can retry. |

These are product decisions as much as technical ones. An empty reading list may be completely normal for a new account. Calling it an error would confuse someone who has done nothing wrong.

The earlier snippets show the normal path and distinguish missing records from unsuccessful requests. Completing the application also means adding the surrounding interface and verifying these conditions deliberately.

## Add writes after the reading flow works

Once the list and detail pages work, add one mutation: save a note or persist a bookmark. Replace the demonstration API with a data source that actually stores your changes.

Before choosing between Server Actions and Route Handlers, define the behavior:

1. Accept only valid input.
2. Identify the user when the feature is private.
3. Check permission to access or modify the record.
4. Save the change and handle failure.
5. Refresh the affected view.
6. Show a clear result without losing unsaved input.

Keep validation and authorization at the server boundary. Hiding an edit button cannot prevent someone from submitting a request directly.

Build one complete write workflow before adding optimistic updates, shared editing, or background synchronization. A reliable save with clear feedback is a better learning milestone than several unfinished interaction patterns.

## Move an existing React application gradually

If you are learning through an existing application, begin by mapping one feature. Record its routes, data dependencies, shared providers, browser APIs, and persistence behavior.

Then choose a small route with clear boundaries. A public article page is often easier to reason about than a complex authenticated editor with several background operations.

Preserve the user-visible behavior while adapting the structure:

- Keep existing input validation and useful error messages.
- Preserve URLs people may have bookmarked, or plan redirects explicitly.
- Identify components that depend on browser APIs before moving them.
- Keep private credentials out of code sent to the browser.
- Verify direct navigation and reloads, not only clicks from the home page.

Do not move every component to the server simply because the framework supports it. A browser-heavy editor may legitimately contain substantial client-side code. Begin with the responsibilities the feature already has, then move work when there is a clear benefit.

Likewise, keep established fetching and state tools when they solve real problems. A migration does not require replacing every working abstraction. Reconsider each one as the surrounding feature changes.

## Recognize the mistakes that slow learning down

One common reaction to a hook error is adding `'use client'` to the page, then to the layout, until the error disappears. Before doing that, find the smallest component that actually needs the hook. Often the page can keep loading data while a child owns the interaction.

Another mistake is treating server-side execution as automatic security. A query can run on the server and still return the wrong person's records. Check authorization where data is accessed, and send only the fields the interface should receive.

A third mistake is debugging stale content by changing cache settings at random. Write down the expected freshness behavior, reproduce the mismatch, and identify which read needs to change after the write. Make one focused adjustment and repeat the same scenario.

Finally, avoid learning through a collection of unfinished demos. One application with direct navigation, meaningful loading, error recovery, and one persistent write teaches more about delivery than several home pages that only work under ideal conditions.

Keep a short learning log. For each problem, record what you expected, what happened, and what explained the difference. That record becomes a more useful reference than a list of commands copied without context.

## Verify behavior rather than the folder structure

Having the expected filenames does not prove that the app works. Exercise the paths someone will actually use:

| Area | Check |
| --- | --- |
| Routing | Open a detail URL directly and reload it. |
| Navigation | Move between pages using the shared links. |
| Interaction | Operate the counter with a keyboard. |
| Loading | Slow the data source and inspect the waiting state. |
| Missing content | Request an invalid ID and a nonexistent post. |
| Request failure | Simulate an unavailable API and check error handling. |
| Persistence, when added | Save a change and confirm it survives a reload. |
| Authorization, when added | Try to access another account's private record. |

Use the browser console and network panel to understand what happens. Run the project's production build as well; a development server alone does not verify deployment behavior.

The code examples here have not been packaged or executed as a complete application. Use these checks when turning them into your own project.

## Follow a small learning roadmap

Treat these as milestones, with enough time to explain each one in your own words:

1. **Routes and layouts:** build three pages, shared navigation, and one dynamic route.
2. **Component boundaries:** add one interactive control and explain why it needs `'use client'`.
3. **Data and failure:** load a list and detail page, then handle missing content and failed requests.
4. **Loading:** introduce a loading state and observe a slow request.
5. **Persistence:** save one change with validation and useful feedback.
6. **Freshness and access:** confirm that updates appear correctly and private records stay private.

At each milestone, pause for a small explanation exercise. Describe the route without looking at the files. Explain why a component needs the browser. Predict what happens when the API returns a missing record. If you cannot explain the behavior yet, simplify the feature and observe it again.

Once the core flow is reliable, choose the next topic from an actual need. Public articles may benefit from better metadata. A large collection may need pagination. An editor may need stronger draft recovery. Learn that topic, apply it to the project, and verify the result before expanding again.

For continued study, use the official [Next.js Learn course](https://nextjs.org/learn) alongside the [App Router documentation](https://nextjs.org/docs/app). Match examples to the router and version used by your project, especially when following third-party articles.

Keep the first version small enough that you can trace a request from the URL to the displayed content. Then trace a user action from the form to storage and back to the updated screen.

That is the transition from React to Next: using familiar components while learning to place data access, rendering, and interaction where they belong. Build a small feature, observe the complete flow, and let the next requirement guide what you learn.
