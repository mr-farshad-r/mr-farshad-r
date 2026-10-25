---
layout: post
title: "How to Build Good Apps with AI"
date: 2026-10-25
lang: en
direction: ltr
description: "A practical guide to building reliable apps with AI: define the problem, provide context, work in small steps, and verify the result."
excerpt: "AI can generate an app quickly. Making it useful, reliable, and easy to change takes clear requirements, small changes, and real feedback."
image: /assets/images/posts/building-good-apps-with-ai.jpg
image_alt: "An AI processor assembles task cards into an app beside a glowing validation shield on a dark workbench."
---

Getting a working screen from AI is exciting. You describe an idea, wait a few minutes, and something appears that looks like a product.

Then you refresh the page and your data disappears. A failed request leaves the save button spinning. Adding one feature breaks another. The demo worked, but the app still needs engineering.

AI makes implementation faster. To turn that speed into a good application, you need a process that catches misunderstandings and mistakes while they are still cheap to fix.

Here is a practical workflow, using a small task manager as an example. Three projects also offer useful ideas along the way: Matt Pocock's engineering skills, REA, and ArtCraft. They serve different purposes; you do not need to install all three to follow this approach.

## Start with a problem someone can recognize

“Build a modern task manager” leaves almost every important decision open. Who uses it? Where do tasks live? What happens when saving fails?

Start with a short brief:

> Build a personal task manager for someone who needs to capture small tasks during the workday. The first version must let them create, edit, complete, and delete tasks. Saved tasks must survive a reload. Keep the initial release to one user and one task list.

Now define what would prove that it works:

- A user can create a task with a title and optional notes.
- A blank or whitespace-only title is rejected with a helpful message.
- Editing or completing a task persists after a reload.
- A failed save preserves the user's input and offers a retry.
- All core actions work with a keyboard.

These are acceptance criteria. They give both you and the agent a way to judge the result beyond whether the screen looks convincing.

Write down the features you are postponing, too. Shared workspaces, subscriptions, and automatic scheduling can wait until the basic workflow earns its place.

## Give the agent enough context to make good decisions

In an existing application, ask the agent to inspect the relevant code before editing it. Point it toward the current form components, storage layer, naming conventions, and checks.

A useful request looks like this:

> Read the task list, task form, and persistence code. Explain how a task moves from user input to storage. Identify the existing components and helpers you can reuse. Then propose the smallest change that adds task editing, including failure behavior and how you will verify it.

Keep recurring project instructions in a short file your coding agent reads, such as `AGENTS.md` where supported. Include real commands and constraints from your project: how to run checks, where validation belongs, and which existing components to reuse. Keep credentials and private customer data out of prompts and repository instructions.

For unfamiliar dependencies, have the agent check documentation for the installed version. A plausible API name is still a guess until it matches the actual library.

## Use skills to make good habits repeatable

[Matt Pocock's skills repository](https://github.com/mattpocock/skills) contains composable workflows for engineering with coding agents. Its documented examples include clarifying requirements, test-driven development, and disciplined bug diagnosis.

The useful idea is to turn a recurring engineering task into a repeatable procedure. When requirements are unclear, ask questions before implementation. When fixing a bug, reproduce it before changing code. When adding behavior, establish a meaningful check and use its feedback.

Read a skill before adopting it. Choose one that addresses your current problem, adapt it to the repository, and check that its instructions fit your team's workflow. A larger collection of instructions can also create more conflict and maintenance work.

For the task manager, the first useful workflow might simply be: agree on save behavior, implement it, and verify persistence and failure recovery before moving on.

## Build one complete workflow at a time

Asking for the entire application at once produces too many decisions to review comfortably. Start with one path through the system:

1. Enter a task title.
2. Validate the input.
3. Save the task.
4. Show it in the list.
5. Reload and confirm it remains.

This is a vertical slice: enough interface, logic, and storage to deliver one useful outcome.

Once that works, add editing. Then completion. Then deletion and its recovery or confirmation behavior. Each step should leave the application usable.

Choose the simplest architecture that meets the actual constraints. A personal tool may need only local persistence. A shared application needs server-side identity and authorization. In that case, test that one user cannot read or change another user's tasks by modifying a request. Hiding a button does not enforce access control.

## Investigate existing behavior before recreating it

Sometimes it is easier to point to an existing interaction than to describe it. Perhaps another app has a search experience or keyboard flow you want to understand.

[REA, Reverse Engineer Anything](https://github.com/morluto/rea/tree/main), provides agent-oriented software investigation tools. Its README describes capabilities spanning native analysis and observation of website and Electron behavior, with support varying by target and platform. It emphasizes evidence and explicitly avoids claiming that it can recover original source code or automatically clone an app.

Use that kind of investigation to answer a bounded question:

> Investigate how this application's task search behaves. Separate observed behavior from inferred implementation. Record the evidence, then propose a version suited to our requirements.

For our task manager, useful observations could include whether search matches notes, how it handles empty queries, and what happens when no tasks match. Those observations become requirements and tests for your own implementation.

Use software you are authorized to inspect. When source code is already available, reading the relevant source may answer the question more directly.

## Give visual work a clear brief

A functioning app can still be uncomfortable to use. Check whether the primary action is obvious, labels explain what will happen, and the layout holds up with long titles and a narrow viewport.

References help make visual requests concrete. Describe what you want to learn from each one: compact task rows, a readable editing form, or a clear empty state. Then use the application's existing components and visual conventions to implement those decisions.

[ArtCraft](https://github.com/storytold/artcraft) is an application for interactive AI image and video creation, including canvas editing and 2D and 3D composition tools. It can be relevant when a product needs a custom illustration or other visual asset. It is a creative tool, rather than an application engineering workflow.

For a task manager, an empty-state illustration might be useful once the core interface works. Give it a specific brief: intended placement, available space, background, palette, and whether it needs transparency. Then check the exported asset at its actual display size and optimize its file size.

Keep controls and essential instructions as accessible interface elements. An illustration should support the workflow without making the user depend on text embedded in an image.

## Ask for proof of behavior

“Done” should come with evidence. Ask the agent to report which checks it actually ran, what passed, and what remains unverified.

For the task manager, useful checks include:

| Area | Evidence to look for |
| --- | --- |
| Validation | Blank titles are rejected without losing notes. |
| Persistence | Created and edited tasks survive a reload. |
| Failure recovery | A simulated save failure keeps input available for retry. |
| Accessibility | The form can be completed by keyboard, with visible focus and labeled inputs. |
| Layout | Long titles and a narrow viewport remain usable. |
| Authorization, if shared | A second account cannot access the first account's tasks. |

Automate checks for important rules and regressions. Also use the app in a browser: tests alone will not tell you whether a dialog is awkward or a message is confusing.

When a check fails, ask for the cause and a focused fix. Repeatedly adding patches without understanding the failure can make the next change harder.

## Review the change before shipping it

Read the diff while it is still small. Check for unnecessary dependencies, duplicated rules, unrelated edits, exposed secrets, and errors that disappear without a useful message.

Ask the agent:

> Explain the changed behavior and the important tradeoffs. List the checks you ran and their results. Identify any data migration, deployment requirement, or remaining limitation. Remove code that is unnecessary for the agreed scope.

Before release, verify the deployed configuration and exercise the main workflow in the target environment. If you store data people care about, establish backup and recovery behavior. A development demo does not verify a production deployment.

## A prompt you can adapt

Use this as a starting point, then replace the general terms with your actual feature and acceptance criteria:

> Read the relevant code and project instructions first. State the user problem, existing behavior, and acceptance criteria. Identify what can be reused and any assumptions that affect the implementation.
>
> Implement the smallest complete workflow. Preserve input on failure, validate at the appropriate boundaries, and keep the interface accessible. Avoid unrelated refactoring and new dependencies unless the task requires them.
>
> Run the relevant automated checks and inspect the interface when it changes. Report the results, distinguish verified behavior from assumptions, and explain what remains unchecked.

The most valuable part of working with AI is the shorter distance between an idea and something you can evaluate. Use that advantage often: make a small change, observe what it does, and decide what comes next. A good app grows from those decisions.
