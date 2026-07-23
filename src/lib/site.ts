export const site = {
  name: "eric-xiang",
  title: "Eric Xiang",
  domain: "eric-xiang.com",
  url: "https://eric-xiang.com",
  description:
    "Eric Xiang's corner of the web: portfolio, a growing set of handy web tools, and Path of Exile resources.",
  author: "Eric Xiang",
  // Placeholder - update once the eric-xiang.com mailbox is set up.
  email: "contact@eric-xiang.com",
  social: {
    linkedin: "https://www.linkedin.com/in/eric-xiang-4b1385215/",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Tools", href: "/tools" },
  { label: "PoE", href: "/poe" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
