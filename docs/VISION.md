# Product vision — intent-first, concierge-simple

## The north star

A patient should never have to understand insurance, pick a "plan type," choose a "denial type," or
navigate tabs. They say what they want in plain words, and the tool does **everything** — asking only
the few questions it genuinely cannot avoid.

Two primary use cases drive the product:

1. **"I got a denial and I want to do everything I possibly can to overturn it and get my care."**
2. **"My insurance keeps underpaying me — I want to file a grievance."**

Everything else (plan types, deadlines, appeal levels, letters, document lists, regulators) is
**internal machinery** that produces a single, concierge-style **action plan**: *"Here's everything
we're doing for you, in order, and here's the one thing to do next."*

## Design principles

- **Intent first, not options first.** Start from the goal, not a form. The home screen is two or
  three plain-language goals, not five tabs of controls.
- **Ask the minimum.** Only ask what changes the answer (often just: which plan, and roughly when).
  Every question offers "I'm not sure" and the tool proceeds with safe defaults.
- **One next step, always visible.** The plan leads with the single most important action and its
  deadline. The rest is there, calm and collapsed, for when they want it (progressive disclosure).
- **Do the work for them.** Draft the letters, list the exact documents, compute the deadlines,
  name the regulator to escalate to, and point to free human help — assembled, not à la carte.
- **Safe by default.** Never guess a date a patient relies on; cite every deadline; "when in doubt,
  file early." No PHI leaves the device.

## Architecture consequence

- **`src/actionPlan.mjs` is the brain.** `buildActionPlan({ intent, ... })` assembles the full
  playbook for a patient from the existing engines (navigator → deadlines, letters → drafts, intake
  → documents) plus escalation and free-help steps. The eventual consumer UI is a thin shell over
  this one call.
- **The current tabbed web UI is the *engine console*.** It exposes each engine (navigator, audit,
  letters, intake) directly so we can develop and inspect "what should this patient do." It is a
  developer/operator tool, not the consumer product. The consumer entry point is the intent-first
  "Start here" flow.

## What "done" looks like (1.0)

Someone who knows nothing about insurance opens the app, taps *"I got denied — help me fight it,"*
answers a question or two, and gets a complete plan with their appeal letter already written, their
documents listed, their deadline tracked, and their next step crystal clear — eventually with their
documents pulled in automatically (see [CONNECTORS.md](./CONNECTORS.md)). The machinery in this repo
is what makes that one screen possible.
