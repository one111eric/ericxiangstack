export type Tool = {
  slug: string;
  title: string;
  description: string;
  category: "Converters" | "Text" | "Developer" | "Time" | "Color";
  available: boolean;
};

/**
 * Registry of tools shown on /tools. Add an entry here and create a matching
 * page at src/pages/tools/<slug>.astro to ship a new tool.
 */
export const tools: Tool[] = [
  {
    slug: "unit-converter",
    title: "Unit Converter",
    description:
      "Convert length, mass, temperature, and data sizes with instant, precise results.",
    category: "Converters",
    available: true,
  },
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description: "Pretty-print, minify, and validate JSON right in the browser.",
    category: "Developer",
    available: false,
  },
  {
    slug: "base64",
    title: "Base64 Encode / Decode",
    description: "Encode and decode Base64 text and URLs client-side.",
    category: "Developer",
    available: false,
  },
  {
    slug: "timestamp",
    title: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates.",
    category: "Time",
    available: false,
  },
  {
    slug: "color-picker",
    title: "Color Converter",
    description: "Convert between HEX, RGB, and HSL and preview colors.",
    category: "Color",
    available: false,
  },
];

export const toolCategories = [
  "Converters",
  "Text",
  "Developer",
  "Time",
  "Color",
] as const;
