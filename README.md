# SB Dash (demo)

A public, click-around copy of SB Dash, the internal dashboard the Strategy Breakdowns team runs the business from: sponsorships, delivery, the Daily newsletter and the weekly one.

**Everything in it is made up.** Every company is a fictional brand (Hooli, Pied Piper, Globex and friends) with a drawn logo, every person outside the team is invented, and every number is synthetic. On the revenue tabs the numbers are also blurred and scrambled, so not even the page source shows a real-looking figure. Links out to Notion, the CRM, Slack and beehiiv are switched off.

The one exception is the Daily research: the stories about public companies (their charts and their primary sources) are the kind of thing we publish anyway.

## The Editor's Desk

The Daily Editor tab is where a Daily gets written. The research desk files the clippings (the brief, the chart, 3 angles, why it's timely, the source) and James and Tom do the rest by hand: move the clippings around, scribble on them, pin the ones that matter to the draft, and write the piece in their own words. Drag a clipping, double-click to edit it, drop it on the page to pin it.

## How it works

There is no backend. `mock/mock-api.js` answers every request the real front-end makes from the files in `mock/data`, so the demo runs the same code as the real dashboard. `mock/demo.js` swaps in the fictional logos and does the blurring. Anything you change lives in your browser until you reload.

Built with [Claude Code](https://claude.com/claude-code).
