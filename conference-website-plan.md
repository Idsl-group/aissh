# Conference Website Plan
## "Aligning AI for Safety, Sustainability, and Humanity"
### UWO × University of Waterloo Joint Conference

---

## 1. Overview & Goals

This document outlines the full plan — UI/UX, architecture, data layer, and implementation — for a static conference website. The site must:

- Communicate the conference theme visually and intellectually
- Serve as a single source of truth for schedule, speakers, and logistics
- Accept abstract submissions via a custom form
- Remain easy for non-developers to update via data files (YAML/JSON)
- Be fully static — no server required — deployable to GitHub Pages, Netlify, or any CDN

---

## 2. Technical Stack

| Concern | Choice | Rationale |
|---|---|---|
| **Site Generator** | [Hugo](https://gohugo.io/) | Natively reads YAML data files; zero JS runtime; fast builds; no Node dependency |
| **Styling** | Vanilla CSS with CSS custom properties | No build overhead; maintainable; full control |
| **Interactivity** | Vanilla JS (ES modules) | Lightweight; no framework bloat for a static info site |
| **Data Layer** | YAML files in `/data/` | Human-readable, comment-friendly, Hugo-native |
| **Form** | Custom HTML → Google Forms POST | Zero backend; submissions land in Google Sheets |
| **Hosting** | GitHub Pages or Netlify (free tier) | Auto-deploys on git push; custom domain support |
| **Icons** | Lucide or Phosphor (SVG sprite, self-hosted) | No CDN dependency; consistent line-weight icons |
| **Fonts** | Self-hosted via Google Fonts download | Avoids GDPR/privacy issues with external font calls |

> **Why Hugo over plain HTML?** Hugo lets you store all speakers, schedule rows, and committee members in clean YAML files and loop over them in templates — so adding a speaker means editing one YAML file, not hunting through HTML. If Hugo feels like too much, an alternative is to serve JSON files and load them with `fetch()` in vanilla JS, but you lose the benefit of static rendering.

---

## 3. Design System

### 3.1 Theme Direction — "Organic Precision"

The visual language sits at the intersection of **natural warmth** and **technological clarity** — reflecting the conference's mandate to make AI align with human and ecological values. The aesthetic is **refined editorial**: scholarly, forward-looking, and warm — never cold or sterile.

**Avoid:** generic "tech conference" blues and purples, stock neural-network wireframe imagery, overused gradient meshes, generic sans-serif monotony.

### 3.2 Colour Palette

```
--color-deep:      #0D1F2D   /* Near-black navy — authority, depth */
--color-forest:    #2D6A4F   /* Deep green — sustainability, nature */
--color-sage:      #74C69D   /* Mid green — harmony, life */
--color-sand:      #F4E9D8   /* Warm cream — humanity, warmth */
--color-amber:     #E07B39   /* Burnt orange accent — energy, urgency */
--color-slate:     #4A5568   /* Mid grey — body text */
--color-white:     #FDFCF8   /* Warm off-white background */

/* University accent pair */
--color-uwo:       #4F2683   /* UWO purple */
--color-waterloo:  #FFC72C   /* Waterloo gold */
```

**Usage rules:**
- Dark navy `--color-deep` is the primary header/hero background
- Warm cream `--color-sand` is the main page background (not pure white — too clinical)
- Forest green `--color-forest` is used for section headings and primary CTAs
- Amber `--color-amber` is a sparingly-used accent (deadlines, key callouts)
- UWO purple and Waterloo gold appear only in the footer co-branding strip and the "Organized by" section — not used as general palette colours

### 3.3 Typography

```
Display / Hero:    "Cormorant Garamond" — Serif, elegant, scholarly (weight 600–700)
Section Headings:  "DM Sans" — Geometric humanist sans, clean (weight 500–600)
Body Text:         "Source Serif 4" — Highly readable serif for longer content
Mono / Code:       "JetBrains Mono" — Used for timestamps, form labels
```

**Type scale (rem):**
```
Hero:    5.0 / line-height 1.05
H2:      2.5 / line-height 1.2
H3:      1.5 / line-height 1.3
Body:    1.0 / line-height 1.7
Small:   0.85
Caption: 0.75
```

### 3.4 Visual Motifs & UI Elements

These recurring visual elements reinforce the theme:

1. **Tessellated leaf + circuit trace pattern** — A subtle SVG background texture blending organic leaf veins with PCB trace lines. Used in the hero section and section dividers at low opacity.

2. **Concentric ring decoration** — Thin circle arcs (like a radar/ripple) around key callout elements (e.g., submission deadline countdown). Suggests both technology and humanity's shared horizons.

3. **Split-rule section dividers** — A horizontal line that splits into three strands (left: green, centre: dark, right: amber) — symbolising the three pillars: Safety, Sustainability, Humanity.

4. **Speaker cards with tinted overlay** — Speaker headshots displayed in a desaturated + forest-green-tinted treatment, switching to full-colour on hover with a smooth CSS transition.

5. **Timeline track for schedule** — The schedule is displayed as a vertical timeline with coloured session-type indicators (keynote = forest green, break = sand, awards = amber).

6. **University logo strip** — Both logos sit side-by-side in the header and footer, separated by an "×" in a neutral colour, conveying joint partnership without hierarchy.

### 3.5 Spacing & Layout

- Maximum content width: `1200px`, centred
- Section vertical padding: `6rem` (top and bottom)
- 12-column CSS Grid for internal layout
- Card grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Generous whitespace used intentionally — content is dense (academic), so breathing room is important

### 3.6 Accessibility

- Minimum contrast ratio 4.5:1 for all body text (WCAG AA)
- All interactive elements reachable by keyboard, with visible `:focus` ring
- ARIA labels on all icon-only buttons
- `prefers-reduced-motion` media query wrapping all CSS animations
- Semantic HTML throughout (`<main>`, `<nav>`, `<article>`, `<section>`, `<time>`)

---

## 4. Site Architecture

### 4.1 Pages & Routes

```
/                    → Home (Hero + About blurb + Key dates + Keynote preview)
/speakers/           → All Keynote Speakers
/schedule/           → Full Programme
/call-for-abstracts/ → CFP details + Submission form
/organizers/         → Organizing committee with photos
/contact/            → Contact information
```

### 4.2 Persistent Elements

**Header (sticky, full-width):**
- Left: UWO logo × Waterloo logo (small)
- Centre: Conference name (abbreviated or wordmark)
- Right: Navigation links + "Submit Abstract" pill CTA button
- On mobile: hamburger menu, logos only
- Behaviour: transparent on hero, transitions to solid `--color-deep` on scroll

**Footer:**
- Conference name + year + tagline
- University co-branding (both logos, full colour)
- Quick links (all pages)
- Contact emails
- "IT Chair: Aarat Satsangi" credit line

---

## 5. Page-by-Page Specification

### 5.1 Home (`/`)

**Sections in order:**

**① Hero**
- Full-viewport height
- Background: `--color-deep` navy with the tessellated leaf+circuit SVG texture at 8% opacity
- Headline (Cormorant Garamond, large): _"Aligning AI for Safety, Sustainability, and Humanity"_
- Subline (DM Sans): Date + Venue (TBD)
- Two CTA buttons: `View Programme` (outlined) and `Submit Abstract` (filled forest green)
- Animated: headline words stagger-fade in on load (CSS `animation-delay`)
- Bottom: gentle scroll-indicator chevron animation

**② Hosted by**
- Clean centred strip: "A joint workshop organized by" → UWO logo + Waterloo logo side by side
- One sentence description of the collaboration

**③ About the Conference**
- Two-column layout: left = short descriptive paragraph about the theme and goals; right = three "pillar cards" for Safety / Sustainability / Humanity with icon + one-sentence description each
- Pillar cards use a subtle border-left coloured stripe (amber, green, navy respectively)

**④ Key Dates**
- Horizontal timeline (desktop) / vertical (mobile)
- Entries loaded from `data/dates.yaml`
- Overdue dates shown greyed out; upcoming highlighted with amber

**⑤ Keynote Speakers (preview)**
- Show 4 speaker cards in a 2×2 grid (or horizontal scroll on mobile)
- Each card: photo (green-tinted, full-colour on hover) + name + affiliation + short tag line
- "See All Speakers →" link

**⑥ Quick Schedule**
- A condensed version of the day's timeline (session name + time only)
- Links to `/schedule/` for full details

**⑦ Call for Abstracts Banner**
- Full-width coloured band (forest green background)
- Deadline prominently displayed with the concentric ring decoration
- "Submit Your Abstract" button

---

### 5.2 Speakers (`/speakers/`)

**Layout:** Masonry-style or uniform card grid (3 columns → 2 → 1)

**Speaker card contents (all from `data/speakers.yaml`):**
- Headshot image (aspect ratio 1:1, object-fit cover, green-tint CSS filter, desaturated → full colour on hover)
- Name (DM Sans, semi-bold)
- Title + Institution
- Brief bio (2–3 sentences, collapsible on mobile with "Read more")
- Talk topic/title (if confirmed)
- Status badge: `Confirmed` (green) or unlabelled

**Interaction:** Clicking a card opens a modal overlay with the full bio and talk abstract if available. This avoids creating individual speaker pages for a static site.

**Data-driven:** Add a speaker by adding one block to `data/speakers.yaml`. No HTML editing needed.

---

### 5.3 Schedule (`/schedule/`)

**Layout:** Full-page vertical timeline

**Visual design:**
- Timeline spine runs left of centre (desktop) or left edge (mobile)
- Each row = one session block
- Session type determines left-border colour and icon:
  - `keynote` → forest green + microphone icon
  - `break` → sand/warm + coffee icon
  - `session` → slate + list icon
  - `awards` → amber + trophy icon
  - `registration` → slate + clipboard icon
  - `networking` → sage + people icon
  - `lunch` → sand + fork icon

**Session block contents:**
- Time (monospace, small, left-aligned)
- Session title (DM Sans, semi-bold)
- Speaker name + affiliation (if applicable)
- Short details note

**Full schedule from `data/schedule.yaml`** — see Section 6.2 for the YAML structure.

---

### 5.4 Call for Abstracts (`/call-for-abstracts/`)

**Sections:**

**① Overview**
- What we're looking for (extended abstracts, 1 page max excl. references)
- Who can submit (students)
- What happens to selected abstracts (potential book chapter invitation)
- Three broad thematic areas (pulled from `data/areas.yaml`)

**② Important Dates**
- Reused from `data/dates.yaml`, filtered to submission-related entries

**③ Submission Guidelines**
- Format: PDF, 1 page, references on additional pages
- Recommended structure: motivation, approach, preliminary results, implications
- Formatting: standard academic format (font size, margins — specify)
- Recommended areas (listed, from `data/areas.yaml`)

**④ The Submission Form** — see Section 7 in full detail

---

### 5.5 Organizers (`/organizers/`)

**Three groups displayed:**

**Contacts / General Chairs**
```
Umair Rehman      [photo] [email — TBD]
Atrisha Sarkar    [photo] [email — TBD]
Apurva Narayan    [photo] [email — TBD]
```

**Student & Logistics Coordinators**
```
Arsh Chowdhry     [photo] — Student Poster Coordinator
Daya Kumar        [photo] — Logistics and Local Arrangements
Aarat Satsangi    [photo] — IT and Web Chair
```

**Layout:** Large card format. Each card: circular photo (or initials avatar as fallback), name, role, institution, email icon link.

**Data-driven:** from `data/organizers.yaml`. Photos stored in `static/images/organizers/`.

---

### 5.6 Contact (`/contact/`)

**Layout:** Clean two-column or centred single-column

**Contents:**
- General enquiries → email links for the three main contacts
- Specific enquiries routed to appropriate coordinator (poster → Arsh, logistics → Daya, web/IT → Aarat)
- Physical location / venue (once confirmed)
- Optional: embedded static map (can use a simple image link to OpenStreetMap)

---

## 6. Data Layer (YAML Files)

All dynamic content lives in `/data/`. Editors never touch HTML or templates.

### 6.1 `data/conference.yaml` — Global Info

```yaml
# Core conference metadata
title: "Aligning AI for Safety, Sustainability, and Humanity"
short_title: "AI Alignment Workshop 2025"
date: "TBD"           # e.g. "October 15, 2025"
venue: "TBD"
city: "TBD"

# Submission deadlines etc. (also used in dates.yaml)
submission_deadline: "2025-08-15"
notification_date: "2025-09-01"

# Google Form submission URL (see Section 7)
google_form_action_url: ""   # Fill in after creating the form

organizers:
  - University of Western Ontario
  - University of Waterloo
```

### 6.2 `data/schedule.yaml` — Programme

```yaml
# Session types: registration | keynote | break | session | lunch | networking | awards
sessions:
  - time: "08:30"
    type: registration
    title: "Registration"
    details: "Check-in and Morning Refreshments"

  - time: "09:00"
    type: session
    title: "Opening Remarks"
    details: "Welcome and Workshop Objectives"

  - time: "09:15"
    type: keynote
    title: "Keynote Speaker I"
    speaker: "Prof. Catherine Burns"
    affiliation: ""   # Add institution
    status: confirmed
    details: ""       # Add talk title once known

  - time: "09:45"
    type: keynote
    title: "Keynote Speaker II"
    speaker: "Prof. Joshua Pearce"
    affiliation: ""
    status: confirmed
    details: ""

  - time: "10:30"
    type: break
    title: "Networking Break"
    details: "Coffee and Interdisciplinary Networking"

  - time: "11:00"
    type: keynote
    title: "Keynote Speaker III"
    speaker: "Kerstin Dautenhahn"
    affiliation: ""
    status: confirmed
    details: ""

  - time: "11:30"
    type: keynote
    title: "Keynote Speaker IV"
    speaker: "Marsha Chechik"
    affiliation: ""
    status: confirmed
    details: ""

  - time: "12:00"
    type: lunch
    title: "Lunch"
    details: ""

  - time: "13:30"
    type: keynote
    title: "Keynote Speaker V"
    speaker: "Alice Huang"
    affiliation: ""
    status: confirmed
    details: ""

  - time: "14:00"
    type: session
    title: "Selected Short Talks"
    details: "15 minutes each"
    # Speakers populated after acceptance decisions

  - time: "15:00"
    type: break
    title: "Poster Session + Coffee"
    details: ""

  - time: "16:00"
    type: awards
    title: "Awards & Closing Remarks"
    details: "Best Poster Award, Best Talk Award, Closing Remarks"

  - time: "16:30"
    type: networking
    title: "Networking"
    details: ""
```

### 6.3 `data/speakers.yaml` — Keynote Speakers

```yaml
speakers:
  - id: catherine-burns
    name: "Prof. Catherine Burns"
    affiliation: ""     # Add institution
    title: ""           # Academic title / role
    bio: ""             # Full bio paragraph
    talk_title: ""      # Keynote talk title
    photo: "catherine-burns.jpg"   # Stored in static/images/speakers/
    status: confirmed

  - id: joshua-pearce
    name: "Prof. Joshua Pearce"
    affiliation: ""
    title: ""
    bio: ""
    talk_title: ""
    photo: "joshua-pearce.jpg"
    status: confirmed

  - id: kerstin-dautenhahn
    name: "Kerstin Dautenhahn"
    affiliation: ""
    title: ""
    bio: ""
    talk_title: ""
    photo: "kerstin-dautenhahn.jpg"
    status: confirmed

  - id: marsha-chechik
    name: "Marsha Chechik"
    affiliation: ""
    title: ""
    bio: ""
    talk_title: ""
    photo: "marsha-chechik.jpg"
    status: confirmed

  - id: alice-huang
    name: "Alice Huang"
    affiliation: ""
    title: ""
    bio: ""
    talk_title: ""
    photo: "alice-huang.jpg"
    status: confirmed
```

### 6.4 `data/organizers.yaml` — Committee

```yaml
contacts:
  - name: "Umair Rehman"
    role: "General Contact"
    email: ""           # Add later
    photo: "umair-rehman.jpg"
    institution: ""

  - name: "Atrisha Sarkar"
    role: "General Contact"
    email: ""
    photo: "atrisha-sarkar.jpg"
    institution: ""

  - name: "Apurva Narayan"
    role: "General Contact"
    email: ""
    photo: "apurva-narayan.jpg"
    institution: ""

coordinators:
  - name: "Arsh Chowdhry"
    role: "Student Poster Coordinator"
    email: ""
    photo: "arsh-chowdhry.jpg"
    institution: ""

  - name: "Daya Kumar"
    role: "Logistics and Local Arrangements"
    email: ""
    photo: "daya-kumar.jpg"
    institution: ""

  - name: "Aarat Satsangi"
    role: "IT and Web Chair"
    email: ""
    photo: "aarat-satsangi.jpg"
    institution: ""
```

### 6.5 `data/dates.yaml` — Key Dates

```yaml
dates:
  - label: "Abstract Submission Deadline"
    date: "2025-08-15"   # ISO format; templates format for display
    category: submission
    highlight: true

  - label: "Notification of Acceptance"
    date: "2025-09-01"
    category: submission
    highlight: false

  - label: "Camera-Ready Deadline"
    date: "2025-09-20"   # If applicable
    category: submission
    highlight: false

  - label: "Conference Day"
    date: "2025-10-15"   # Update when confirmed
    category: conference
    highlight: true
```

### 6.6 `data/areas.yaml` — Conference Theme Areas

```yaml
# Broad thematic areas for the abstract submission form dropdown
# These also appear in the CFP page
areas:
  - id: safety
    label: "AI Safety and Alignment"
    description: "Robustness, interpretability, value alignment, red-teaming, safe deployment"

  - id: sustainability
    label: "AI for Sustainability"
    description: "Energy-efficient AI, climate applications, sustainable computing, green AI"

  - id: human-ai
    label: "Human-AI Interaction"
    description: "Explainability, trust, participatory design, accessibility, HCI"

  - id: ethics-governance
    label: "AI Ethics and Governance"
    description: "Fairness, accountability, policy, regulation, societal impact"

  - id: healthcare
    label: "AI in Healthcare and Wellbeing"
    description: "Medical AI, mental health, assistive technology, patient safety"

  - id: education
    label: "AI in Education"
    description: "Learning tools, equitable access, AI literacy, pedagogical AI"

  - id: other
    label: "Other (please specify in abstract)"
    description: ""
```

---

## 7. Abstract Submission Form

### 7.1 Strategy: Google Form Hijacking

We build a fully custom-styled HTML form on the website. On submit, the form data is POSTed directly to the hidden Google Form endpoint using the native Google Forms submission URL. Responses land automatically in the linked Google Sheet — no backend required.

**Setup steps (IT Chair — Aarat):**
1. Create a Google Form with fields matching the ones below
2. From the form, right-click "Submit" → inspect network request → extract the `action` URL (e.g. `https://docs.google.com/forms/d/e/XXXXXXX/formResponse`)
3. Map each Google Form field's `entry.XXXXXXXXX` ID to our HTML field names
4. Paste the action URL into `data/conference.yaml` → `google_form_action_url`
5. Set the form's `action` attribute to that URL in the template

**CORS note:** Google Forms doesn't return a proper CORS response to AJAX `fetch()`. Use a hidden `<iframe>` as the form target — the form submits synchronously and the iframe silently absorbs Google's response page. The user is then shown our own success message via JS.

```html
<!-- Pattern -->
<form id="submission-form" 
      method="POST" 
      action="{{ .Site.Data.conference.google_form_action_url }}"
      target="hidden-iframe"
      enctype="multipart/form-data">
  ...fields...
</form>
<iframe name="hidden-iframe" style="display:none"></iframe>
```

```javascript
// On submit: prevent default, show spinner, then actually submit
form.addEventListener('submit', (e) => {
  showLoadingState();
  setTimeout(() => showSuccessMessage(), 1500); // Show success after submission
  // Don't preventDefault — let the real POST fire to Google
});
```

### 7.2 Form Fields

| Field | Type | Google entry ID | Notes |
|---|---|---|---|
| `abstract_title` | `text` | `entry.XXXX` | *Recommended addition — important for review* |
| `name` | `text` | `entry.XXXX` | First + last |
| `email` | `email` | `entry.XXXX` | |
| `department` | `text` | `entry.XXXX` | |
| `university` | `text` | `entry.XXXX` | Could also be a `select` with "Other" option |
| `year_of_study` | `select` | `entry.XXXX` | Undergrad / Masters / PhD / Postdoc — *students only* |
| `supervisor` | `text` | `entry.XXXX` | *Recommended: supervisor name for student submissions* |
| `author_names` | `textarea` | `entry.XXXX` | All authors, one per line or comma-separated |
| `area` | `select` | `entry.XXXX` | Options from `data/areas.yaml` |
| `abstract` | `textarea` | `entry.XXXX` | The abstract text body |
| `pdf_link` | `url` | `entry.XXXX` | *Recommended: Google Drive or Dropbox link to PDF* |
| `presentation_pref` | `radio` | `entry.XXXX` | Talk / Poster / Either — *Recommended addition* |
| `consent` | `checkbox` | *(no Google field)* | "I confirm this is original work and I am a student" — validated client-side only |

> **Recommended additions (summary):**
> - **Abstract Title** — essential for reviewers to distinguish submissions
> - **Year of Study** — helps reviewers contextualise the work level
> - **Supervisor Name** — useful for academic accountability
> - **PDF Link** — allows the 1-page formatted PDF to be submitted (plain text box can't enforce formatting)
> - **Presentation Preference** — talk vs poster helps with scheduling

### 7.3 Form UX Design

- Multi-step form displayed as a single scrollable page with sticky section headers (not a wizard/multi-page — keeps it simple and static)
- Field groups visually separated by thin rule + group label ("About You" / "Your Submission" / "Submission Preferences")
- Character counter on `abstract` textarea (Google Form limit is ~500k chars, so this is informational)
- Client-side validation before allowing submit: required fields, email format, at least one area selected
- On submit: button shows spinner + "Submitting…" text; on iframe load: replaced by green success banner "Your abstract has been received! We'll be in touch."
- Form is intentionally not resettable after success (prevents accidental double-submit)
- Mobile: all fields full-width; tap targets minimum 44px

---

## 8. File & Folder Structure

```
conference-site/
│
├── config.yaml                  # Hugo site config (title, baseURL, etc.)
│
├── data/                        # ← ALL editable content lives here
│   ├── conference.yaml
│   ├── schedule.yaml
│   ├── speakers.yaml
│   ├── organizers.yaml
│   ├── dates.yaml
│   └── areas.yaml
│
├── content/                     # Hugo content files (mostly front-matter only)
│   ├── _index.md                # Home page
│   ├── speakers.md
│   ├── schedule.md
│   ├── call-for-abstracts.md
│   ├── organizers.md
│   └── contact.md
│
├── layouts/                     # Hugo HTML templates
│   ├── _default/
│   │   ├── baseof.html          # Base layout (header + footer)
│   │   └── single.html
│   ├── index.html               # Home page template
│   ├── partials/
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── speaker-card.html
│   │   ├── schedule-row.html
│   │   ├── organizer-card.html
│   │   ├── key-dates.html
│   │   └── submission-form.html
│   └── shortcodes/
│       └── pillar-card.html
│
├── static/
│   ├── css/
│   │   ├── main.css             # Core styles + CSS variables
│   │   ├── components.css       # Cards, timeline, modal
│   │   └── form.css             # Form-specific styles
│   ├── js/
│   │   ├── main.js              # Nav scroll behaviour, mobile menu
│   │   ├── form.js              # Form validation + iframe submit
│   │   └── modal.js             # Speaker bio modal
│   ├── images/
│   │   ├── logos/
│   │   │   ├── uwo-logo.svg
│   │   │   └── waterloo-logo.svg
│   │   ├── speakers/            # One file per speaker (square, min 400×400px)
│   │   ├── organizers/          # One file per organizer
│   │   └── hero-texture.svg     # The leaf+circuit SVG pattern
│   └── fonts/                   # Self-hosted font files
│
└── .github/
    └── workflows/
        └── deploy.yml           # GitHub Actions: hugo build → GitHub Pages
```

---

## 9. Implementation Phases

### Phase 1 — Foundation (Week 1)
- [ ] Initialise Hugo project; set up `config.yaml`
- [ ] Create all `data/` YAML files with placeholder content
- [ ] Build base layout (`baseof.html`): header, footer, nav
- [ ] Implement CSS custom properties / design tokens
- [ ] Self-host fonts
- [ ] Create hero section SVG texture
- [ ] Set up GitHub repo + deploy workflow

### Phase 2 — Core Pages (Week 2)
- [ ] Home page: hero, About, Key Dates, Speaker preview, CFP banner
- [ ] Speakers page: cards + bio modal
- [ ] Schedule page: timeline component
- [ ] Style all components to match design system

### Phase 3 — Form & CFP (Week 3)
- [ ] Create Google Form (Aarat + contacts to confirm fields)
- [ ] Build custom submission form HTML
- [ ] Implement iframe-submit pattern + client-side validation
- [ ] Wire up Google Form entry IDs
- [ ] Build Call for Abstracts page with form

### Phase 4 — People & Polish (Week 4)
- [ ] Organizers page (pending photos from all committee members)
- [ ] Contact page
- [ ] Mobile responsiveness audit across all pages
- [ ] Accessibility audit (keyboard nav, ARIA, contrast)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance check (image optimisation, font loading)
- [ ] Populate all real content as it is confirmed

### Phase 5 — Launch & Maintenance
- [ ] DNS/domain setup (if custom domain)
- [ ] Final content review with all contacts
- [ ] Go live
- [ ] Post-launch: update schedule short-talks as abstracts are accepted, add talk titles when confirmed

---

## 10. Content Still Needed

The following items are needed from the organising committee to complete the site:

| Item | Owner | Status |
|---|---|---|
| Conference date (confirmed) | Contacts | Pending |
| Venue / location | Contacts | Pending |
| Speaker affiliations + bios | Contacts | Pending |
| Speaker photos | Contacts | Pending |
| Talk titles for all speakers | Contacts | Pending |
| Organizer photos (all 6) | Each person | Pending |
| Organizer contact emails | Contacts | Pending |
| UWO logo file | Aarat | Pending |
| University of Waterloo logo file | Aarat | Pending |
| Google Form created + entry IDs | Aarat | Pending |
| Abstract submission deadline date | Contacts | Pending |
| Short-talk submission details (15 min?) | Contacts | Pending |
| Full paper / book publication details | Contacts | Pending |

---

## 11. Notes & Decisions Log

- **YAML vs JSON for data:** Hugo natively parses YAML in `/data/`, which allows inline comments — use YAML. If the site generator is switched to plain HTML + JS `fetch()`, convert YAML to JSON (or add a `js-yaml` build step).
- **No CMS:** Given the small team and one-off nature of the conference, a headless CMS (Contentful, Sanity) is overkill. YAML files edited directly in GitHub are sufficient.
- **Speaker "Confirmed" status:** Keep the `status` field in `speakers.yaml`. Template can conditionally render a "Confirmed" badge. Remove the field or set `status: tba` for any unconfirmed additions.
- **Short talks:** The 14:00 slot "Selected Short Talks" will be populated after abstract acceptance. The `schedule.yaml` entry can contain a `speakers` list (array) added once decisions are made.
- **Book publication details:** Once the publisher/editor details are confirmed, add a `publication` section to `data/conference.yaml` and surface it on the CFP page.
- **"Marsha Chechik" spelling:** The original schedule lists "Marscha Chechik" — this appears to be a typo. The correct spelling is "Marsha Chechik" (University of Toronto). Please confirm.
