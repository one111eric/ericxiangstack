import { defineCollection } from "astro:content";
import * as z from "zod/v4";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // When work on the project started, and (optionally) when it ended.
    // Omit `endDate` if the project is ongoing / you still maintain it.
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    repo: z.url().optional(),
    demo: z.url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const poe = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/poe" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, poe };
