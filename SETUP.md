# Setup Walkthrough

One-time setup to get this project living on GitHub. Written for someone who has never used git or GitHub before. Follow it in order. Every stage ends with **"You should see…"** — if you don't see that, stop and say so rather than continuing.

**Time:** about 25 minutes, most of it waiting on installers.

---

## Vocabulary, once

You'll see these words constantly. Read this once and the rest will make sense.

| Word | What it actually means |
|---|---|
| **Git** | A program that tracks every change to a folder over time. Already installed on your machine. |
| **GitHub** | A website that stores a copy of that folder online. Git is the tool; GitHub is the place. |
| **Repository** ("repo") | One project's folder, tracked by git. Ours will be the `repo` folder in your Drive. |
| **Commit** | A saved snapshot of your changes, with a note about what you changed. Like "Save As" with a message. |
| **Push** | Upload your commits to GitHub. |
| **Pull** | Download changes from GitHub that you don't have yet. |
| **Branch** | A parallel version of the project. We only use one, called `main`. Ignore branches for now. |
| **GitHub Actions** | Free computers GitHub runs for you on a schedule. This is what will scrape the resort sites nightly. |
| **GitHub Pages** | Free website hosting straight out of your repo. This is where the app will live. |

---

## What you already have

Checked on 2026-08-09:

- Git 2.55 — installed, never configured (that's fine, GitHub Desktop will configure it)
- Node.js v24.15 — installed
- npm 11.12 — installed
- GitHub account — you have one

Nothing to install except the two apps in Stage 1.

---

## Stage 1 — Install the two apps

### 1a. GitHub Desktop

1. Go to **https://desktop.github.com**
2. Click the download button for Windows. You'll get `GitHubDesktopSetup-x64.exe`.
3. Run it. There are no options to choose — it installs and opens itself.
4. When it opens, click **Sign in to GitHub.com**. Your browser will open; log in there and approve the request.
5. Back in GitHub Desktop, it will ask you to configure git with your name and email. **Accept the defaults.** If it offers an email ending in `@users.noreply.github.com`, use that one — it keeps your real email out of public records.
6. On the "Let's get started" screen, don't create or clone anything yet. Just leave it open.

**You should see:** the GitHub Desktop window with your username in the top-right area, and no repository loaded.

### 1b. VS Code

1. Go to **https://code.visualstudio.com**
2. Click the big blue Windows download button, run the installer.
3. During install, when you reach the "Select Additional Tasks" screen, **tick the box that says "Add to PATH."** Leave the rest as-is.
4. Finish and let it open.

**You should see:** VS Code's welcome screen.

> VS Code is just a text editor with syntax coloring. You don't need to learn it — you'll mostly be reading files, not writing them.

---

## Stage 2 — Turn your folder into a repository

**✅ Done — 2026-08-09.** The repository lives at:

```
C:\Users\tanne\My Drive\01_Projects\Mountain Events\mountain-events
```

> **What tripped us up, recorded so it doesn't happen twice.** GitHub Desktop's "Create a repository" dialog treats **Local path** as the *parent* directory, then creates a new subfolder named after the repository. Pointing it at `Mountain Events` produced a brand-new empty `mountain-events` folder rather than converting the existing `repo` folder — so the first publish contained only GitHub Desktop's auto-generated `.gitattributes` file and none of the project docs.
>
> Fixed by rewriting the docs into `mountain-events\` and deleting the stray `repo\` folder. The folder is now named the same as the repository, which is clearer anyway.
>
> **Rule of thumb:** in that dialog, Local path is where the folder will be *created inside*, not the folder itself.

**You should see** in GitHub Desktop: "mountain-events" as the current repository, with 6 changed files listed in the left panel — `.gitignore`, `CLAUDE.md`, `DECISIONS.md`, `PLAN.md`, `README.md`, `SETUP.md`. Clicking any of them shows its contents in green, meaning "all new."

> **This is the verification view you asked for.** From now on, any time anything changes in this folder, this panel shows you exactly what — line by line, additions in green, deletions in red. Nothing gets uploaded without appearing here first.

---

## Stage 3 — Make your first commit and publish

### 3a. Commit

1. At the bottom-left, there's a box with placeholder text like "Update .gitignore". Type a summary:
   ```
   Add project plan, architecture, and decision log
   ```
2. Click the blue **Commit 6 files to main** button.

**You should see:** the file list empties out and the panel says "No local changes." That's correct — your changes are now saved as a snapshot. They are still only on your computer.

### 3b. Push

The repository is already published and public at **https://github.com/the-climaxt/mountain-events** — that part is done. You just need to send up the six files.

1. After committing, click **Push origin** at the top.

**You should see:** the button stops showing a number badge. Refresh the GitHub page in your browser and all six files will be listed.

> Publishing already happened, so the "Keep this code private" checkbox is behind you — and it was unchecked correctly. The repo shows **Public** on GitHub, which is what free Pages hosting and unlimited Actions minutes require.

---

### 🛑 Stop here and report back

Confirm the six files appear on github.com. Then we move to Stage 4.

---

## Stage 4 — Turn on GitHub Pages

_Do this after Stage 3 is confirmed and there's a web page to serve._

1. Go to your repository on github.com
2. Click the **Settings** tab (top of the page, with the gear icon)
3. In the left sidebar, under **Code and automation**, click **Pages**
4. Under **Build and deployment → Source**, choose **Deploy from a branch**
5. Set the branch dropdown to **main**, and the folder dropdown to **/docs**
6. Click **Save**

**You should see:** a message saying your site is being built. After a minute or two, refresh — it'll show a live URL in the format:

```
https://<your-username>.github.io/mountain-events/
```

That's the app's permanent address. Nothing to pay, nothing to renew.

---

## Stage 5 — Confirm the nightly scraper

_Comes with Phase 0. Placeholder._

Once the scraper exists, you'll verify it in the repository's **Actions** tab, where every scheduled run appears with a green check or a red X. You can also trigger it manually from there rather than waiting for the overnight run.

---

## Day-to-day, from here on

You only ever need three things:

1. **Open GitHub Desktop** and click **Fetch origin** (top bar) to pull down anything new — including the nightly data the scraper commits.
2. **Review changes** in the left panel. This is your verification step.
3. If you changed something yourself: write a summary, click **Commit to main**, then click **Push origin**.

That's the whole workflow. You will not need the command line.

---

## Things that will go wrong, and what they mean

| What you see | What it means | Fix |
|---|---|---|
| "Authentication failed" when publishing | GitHub Desktop lost its login | File → Options → Accounts → sign out and back in |
| A file shows as changed that you didn't touch | The nightly scraper committed data, or Google Drive touched a file | Normal. Review the diff; if it's `data/*.json`, it's the scraper |
| "Merge conflict" | You and the scraper changed the same file | Rare here. Tell me and I'll walk you through it |
| Pages URL shows a 404 | The site hasn't built yet, or `/docs` is empty | Wait two minutes, then check Settings → Pages for the build status |
| Repo shows "Private" | The checkbox in Stage 3b was left ticked | Settings → General → scroll to bottom → Change visibility → Public |

---

## The one rule about Google Drive

This repository lives inside your Google Drive folder, which is convenient — it's backed up and available anywhere. One caveat: **do not open and work in this folder from two computers at the same time.** Drive syncing git's internal files from two machines at once is the one scenario that reliably corrupts a repository. One machine at a time is completely safe.

If you ever do want it off Drive, the fix is one drag-and-drop plus re-adding the folder in GitHub Desktop. Nothing is locked in.
