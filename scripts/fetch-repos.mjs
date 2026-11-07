#!/usr/bin/env node
/**
 * Refreshes data/repos.json from the public GitHub API.
 *
 *   node scripts/fetch-repos.mjs
 *
 * Curated titles, descriptions, categories and the featured order live in OVERRIDES
 * below so a refresh keeps the hand-written copy instead of GitHub's raw text.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "DwainSnickles";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data", "repos.json");

/** Repos to leave out of the index. */
const EXCLUDE = new Set(["DwainSnickles", "TestGithub"]);

/** Featured order (first is the lead card). */
const FEATURED = [
  "RibbonWinForms",
  "GraphicsWorkshop",
  "DesignSurfaceCSharp",
  "AutoUpdater.NET.XML-Creator-master",
  "MOTW-Cleaner",
  "Maui-basic-VLC-Player-Tutorial"
];

const OVERRIDES = {
  RibbonWinForms: {
    title: "Ribbon for WinForms",
    description:
      "Office-style ribbon control for Windows Forms, ported to .NET 10 with working out-of-process designer support. Published as Dwain.RibbonLib.",
    category: "ui",
    nuget: true
  },
  DissolvingPanel: {
    title: "DissolvingPanel",
    description:
      "WinForms panel that dissolves its contents away and back with 21 PowerPoint-style transitions, an optional slide-in and a designer smart tag. Published as DissolvingPanel.",
    category: "ui",
    nuget: true
  },
  GraphicsWorkshop: {
    title: "Graphics Workshop",
    description:
      "Work-in-progress WinForms graphics workstation: edit graphics, place the objects on a design surface and rotate them in place.",
    category: "graphics"
  },
  DesignSurfaceCSharp: {
    title: "Design Surface",
    description:
      "Design-surface control and graphic object model (GraphicObjects + GraphicsSurface) used by Graphics Workshop.",
    category: "graphics"
  },
  "AutoUpdater.NET.XML-Creator-master": {
    title: "AutoUpdater XML Creator",
    description:
      "Generates the manifest XML that drives AutoUpdater.NET, so desktop apps can update themselves without hand-editing files.",
    category: "updater"
  },
  "MOTW-Cleaner": {
    title: "MOTW Cleaner",
    description: "Strips Mark of the Web from downloaded files so Windows stops blocking them.",
    category: "security"
  },
  "Maui-basic-VLC-Player-Tutorial": {
    title: "MAUI VLC Player Tutorial",
    description:
      "Starter .NET MAUI app that plays MP4 and HLS streams with LibVLCSharp, walking through wiring VLC into MAUI on .NET 8.",
    category: "media"
  },
  "MauiVLCPlayer-dotnet-8-": {
    title: "MAUI VLC Player",
    description:
      "Cross-platform .NET MAUI player for MP4 and HLS streams built on LibVLCSharp, with Visual Studio 2022 and .NET 8.",
    category: "media"
  },
  "YouTubeDownloader-and-Video-Conveter": {
    title: "YouTube Downloader & Converter",
    description: "Desktop downloader and video editing software built on ffmpeg.",
    category: "media"
  },
  Youtuber: {
    title: "Youtuber",
    description: "Desktop app that pulls files from YouTube.",
    category: "media"
  },
  "Libvlc-Youtube": {
    title: "LibVLC YouTube",
    description: "Streams YouTube into a LibVLCSharp VideoView.",
    category: "media"
  },
  Win_Recorder: {
    title: "Win_Recorder",
    description: "Windows Forms desktop video recorder built on ScreenRecordLib.",
    category: "media"
  },
  Windows_Forms_Dotnet_Controls: {
    title: "WinForms Control Pack",
    description: "A one-stop collection of custom controls for Windows Forms.",
    category: "ui"
  },
  ControlCrop: {
    title: "ControlCrop",
    description: "Adds image cropping to any control that has an image or background image.",
    category: "graphics"
  },
  "ControlCrop-2": {
    title: "ControlCrop 2",
    description: "Second pass at ControlCrop with several improvements to the original code.",
    category: "graphics"
  },
  TextEffects: {
    title: "TextEffects",
    description: "Creates shadowed text with GDI+ and saves the result to an image.",
    category: "graphics"
  },
  CustomCursor: {
    title: "CustomCursor",
    description: "Custom cursor drawn through a PictureBox, with a configurable cursor size.",
    category: "ui"
  },
  "MDI-Form-Communications": {
    title: "MDI Form Communications",
    description: "Lets a parent MDI form and its child forms share information cleanly.",
    category: "ui"
  },
  "FormsApp_Communicate2-way": {
    title: "Two-Way Form Messaging",
    description: "Delegate-based example for sending strings between forms in both directions.",
    category: "ui"
  },
  SharpUpdate: {
    title: "SharpUpdate",
    description:
      "Windows Forms self-updater: reads an update XML from your server, fetches the new build and restarts the app.",
    category: "updater"
  },
  "StartButton-Fix": {
    title: "Start Button Fix",
    description:
      "Fixes a Start menu button that stopped responding by correcting the related registry key.",
    category: "security"
  },
  "ZXing-Scanner-Overlay-with-Torch-Buttons": {
    title: "ZXing Torch Overlay",
    description:
      "ZXing barcode scanner with a custom overlay and torch on/off buttons at runtime, tested on Android 9.1.",
    category: "qr"
  },
  "ZXing-Custom-Overlay-with-Torh-On-Off-Buttons": {
    title: "ZXing Custom Overlay",
    description: "Simple ZXing app with torch on/off buttons at runtime.",
    category: "qr"
  },
  "ZXing-Flash-Example-Using-Custom-Overlay": {
    title: "ZXing Flash Overlay",
    description: "Lets the end user turn the camera flash on and off at runtime.",
    category: "qr"
  },
  DealorNoDeal: {
    title: "Deal or No Deal",
    description: "Windows Forms take on the game show, written in C#.",
    category: "other"
  },
  Bifrost: {
    title: "Bifrost",
    description:
      "Experimental .NET Core 2 project for writing IoT applications that target Ubuntu and Windows with the same code.",
    category: "other"
  },
  postfixadmin: {
    title: "PostfixAdmin",
    description: "Web-based virtual user administration interface for Postfix mail servers.",
    category: "web"
  },
  projectswebsite: {
    title: "Projects Website (legacy)",
    description: "Earlier version of this GitHub Pages site.",
    category: "web"
  },
  "dwainsnickles.github.io": {
    title: "This Website",
    description: "Source of this site: static HTML, CSS and JavaScript, with the repository index in data/repos.json.",
    category: "web"
  }
};

const CATEGORY_LABELS = {
  graphics: "Graphics & design",
  ui: "UI components",
  media: "Media & video",
  qr: "Scanners & QR",
  updater: "Updaters",
  security: "Security & fixes",
  web: "Web & admin",
  other: "Other"
};

const TOPIC_CATEGORY = {
  graphics: "graphics",
  "design-surface": "graphics",
  "image-editor": "graphics",
  "image-cropping": "graphics",
  "text-effects": "graphics",
  ribbon: "ui",
  controls: "ui",
  "custom-controls": "ui",
  ui: "ui",
  winforms: "ui",
  mdi: "ui",
  cursor: "ui",
  video: "media",
  "video-player": "media",
  youtube: "media",
  recorder: "media",
  "screen-recorder": "media",
  ffmpeg: "media",
  libvlc: "media",
  barcode: "qr",
  "qr-code": "qr",
  zxing: "qr",
  overlay: "qr",
  updater: "updater",
  "auto-update": "updater",
  "self-update": "updater",
  security: "security",
  unblock: "security",
  motw: "security",
  fix: "security",
  troubleshooting: "security",
  php: "web",
  postfix: "web",
  "mail-server": "web",
  website: "web",
  "github-pages": "web",
  game: "other",
  iot: "other"
};

function inferCategory(repo) {
  const topics = repo.topics || [];
  for (const topic of topics) {
    if (TOPIC_CATEGORY[topic]) return TOPIC_CATEGORY[topic];
  }
  return "other";
}

function inferLanguage(repo) {
  if (repo.language) return repo.language;
  const topics = repo.topics || [];
  if (topics.includes("csharp")) return "C#";
  if (topics.includes("php")) return "PHP";
  if (/\.(html|css|js)$/i.test(repo.name)) return "HTML";
  return "Other";
}

function humanize(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word.length <= 2 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

async function main() {
  const response = await fetch(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=pushed`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "dwainsnickles-site-repo-index",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  const repos = raw
    .filter((repo) => !EXCLUDE.has(repo.name))
    .map((repo) => {
      const override = OVERRIDES[repo.name] || {};
      const category = override.category || inferCategory(repo);
      const featuredIndex = FEATURED.indexOf(repo.name);
      return {
        name: repo.name,
        title: override.title || humanize(repo.name),
        description: (override.description || repo.description || "No description yet.")
          .replace(/\s+/g, " ")
          .trim(),
        language: inferLanguage(repo),
        category,
        categoryLabel: CATEGORY_LABELS[category] || CATEGORY_LABELS.other,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        fork: repo.fork,
        nuget: Boolean(override.nuget) || Boolean(repo.homepage && repo.homepage.includes("nuget.org")),
        topics: (repo.topics || []).slice(0, 6),
        updated: repo.pushed_at.slice(0, 10),
        homepage: repo.homepage || null,
        url: repo.html_url,
        featured: featuredIndex > -1,
        featuredRank: featuredIndex
      };
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.updated.localeCompare(a.updated);
    });

  const languages = new Set(repos.map((repo) => repo.language));
  const payload = {
    owner: OWNER,
    generated: new Date().toISOString().slice(0, 10),
    totals: {
      repos: repos.length,
      stars: repos.reduce((sum, repo) => sum + repo.stars, 0),
      forks: repos.reduce((sum, repo) => sum + repo.forks, 0),
      languages: languages.size
    },
    repos
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`wrote ${repos.length} repositories to ${OUT}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
