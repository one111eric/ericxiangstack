---
title: "eric-xiang.com"
description: "This site - a personal portfolio, web tools suite, and Path of Exile companion, built on Astro and Cloudflare."
startDate: 2026-07-15
tags: ["Astro", "Cloudflare", "TypeScript", "Tailwind"]
repo: "https://github.com/one111eric/ericxiangstack"
demo: "https://eric-xiang.com"
featured: false
order: 4
---

## Overview

This very website. It brings together three things I care about into one place:

- A **portfolio** of projects and work.
- A suite of **web tools** I actually use.
- **Path of Exile** resources, including live pricing data.

## Stack

- **Astro** for fast, mostly-static pages with interactive islands where needed.
- **React** for the interactive tool widgets.
- **Tailwind CSS** for styling.
- **Cloudflare Pages + Functions** for hosting and the lightweight backend
  (API proxying with edge caching).

## Why this stack

The whole thing runs comfortably on Cloudflare's free tier, with room to grow
into a real backend (D1, KV, R2) whenever a feature needs it.
