# e-Nyayalaya — Landing Page Build Reference
### GIGW 3.0 compliance · accessibility bar · real data sourcing · citizen content

This file is the source of truth for the landing page build. Attach it
alongside the build prompt so your coding assistant has the actual
government standard, not a paraphrase of it.

---

## 1. Why this file exists

Two official references govern this page:
- **GIGW 3.0** — Guidelines for Indian Government Websites and Apps
  (`guidelines.india.gov.in`) — the compliance standard.
- **DBIM Toolkit** — Digital Branding & Identity Manual, MeitY
  (`dbimtoolkit.digifootprint.gov.in`) — the visual design system for
  government digital products (components, spacing, type).

You are not a registered `.gov.in` entity for this hackathon build, so
full GIGW *certification* doesn't apply to you — but a judge evaluating
a "digital court" project will absolutely notice whether it *looks and
behaves* like it takes these standards seriously. Build to the
standard; don't claim certification you don't have.

---

## 2. GIGW 3.0 — what applies to a landing page specifically

### Minimum content on the homepage (mandatory list, GIGW 3.0 §5.1.18)
1. Organisation/project name
2. State Emblem of India or project logo, displayed in correct ratio
   and colour — **only use the actual State Emblem if you are a
   verified government entity; for a hackathon build, use your own
   project logo instead.** Misusing the State Emblem is a criminal
   offence under the State Emblem of India (Prohibition of Improper
   Use) Act, 2005 — don't put it on a student project.
3. About section (what the platform is, main function)
4. Links to all major modules/sections
5. Link to citizen-facing services (if any are public-facing)
6. "Contact Us" link
7. "Feedback" link
8. Link to the National Portal (`india.gov.in`) — appropriate to
   reference, not to fake ownership of
9. Search / sitemap
10. Terms and conditions of use

### Ownership & trust signals
- Ownership information visible in header or footer on every page.
- Last-updated date shown on the homepage.
- If external data (e.g. NJDG figures) is reproduced, its source,
  owning organisation, and date of the figures must be stated —
  never presented as your own live data.

### Accessibility (WCAG 2.1, adopted wholesale into GIGW 3.0)
Non-negotiable ones for a landing page:
- Every image has meaningful alt text; decorative images have empty
  alt attributes so screen readers skip them.
- Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text (18pt+,
  or 14pt+ bold).
- Text resizes to 200% without breaking layout.
- Fully keyboard-operable — no mouse-only interaction, visible focus
  indicator on every interactive element.
- Page has a proper heading hierarchy (H1 → H2 → H3, no skipped
  levels) and a "skip to main content" link.
- Page title is descriptive: `e-Nyayalaya — [purpose] | India` pattern,
  not just the project name alone.
- Language attribute (`lang="en"` / `lang="hi"`) set and toggled
  correctly if you offer a Hindi/regional-language version.
- Forms: every input has a visible label, errors are described in
  text (not colour alone), and there's a confirm/review step before
  any irreversible submission.

### Cybersecurity baseline (relevant even for a demo)
- No plaintext secrets in source or config.
- Custom error pages — never expose a stack trace or raw exception.
- CAPTCHA or equivalent on the login form.
- Cookies marked Secure and HttpOnly.
- Directory listing disabled; no default admin paths exposed.

---

## 3. DBIM — visual identity notes

DBIM's public chapters describe the visual system used across MeitY
digital properties: a components library (buttons, cards, forms,
navigation) built for consistency and accessibility across government
apps. For this build, the practical takeaways are:
- Favor a restrained, high-contrast palette — deep blue/navy,
  white, a single accent colour (commonly a maroon/red or saffron
  used sparingly for CTAs) — over a busy "tech startup" palette.
  Reference: Tricolour-adjacent but not literal (avoid using the
  National Flag's exact colours/proportions as a design motif — this
  is legally sensitive under the Flag Code of India).
- Consistent, predictable navigation — same position across pages
  (this is also a direct GIGW requirement, not just a DBIM
  preference).
- Serif or a clean grotesk for body text over anything display/
  decorative — matches the register of the court-document templates
  already built for this project, so the landing page and the actual
  in-app documents feel like one product.

---

## 4. Sourcing the case statistics (do not skip this)

**Do not hardcode invented case counts.** Two acceptable approaches:

**Option A — Link out to the real source**
```
[Section: "Judicial System at a Glance"]
"For live, verified national case-pendency statistics, see the
National Judicial Data Grid (NJDG) — the Government of India's
official case-tracking system under the eCourts Project."
[Button: View on NJDG →  https://njdg.ecourts.gov.in/ ]
```
This satisfies GIGW's sourcing requirement automatically, because
you're not claiming the data as your own — you're directing to it.

**Option B — Show your own platform's numbers, honestly labeled**
```sql
-- Example query against your own schema — this is REAL data,
-- just scoped to your platform, not the nation
select
  o.district,
  count(*) filter (where c.stage not in ('disposed','closed')) as active_cases
from cases c
join organisations o on o.id = c.court_org_id
group by o.district;
```
Label this explicitly: **"Cases tracked on e-Nyayalaya"** — never
"Active cases in India." The distinction matters both for GIGW's
accuracy requirement and for basic honesty to whoever's evaluating
the project.

For the demo, Option B is what will actually render real numbers, so
use it as the working dashboard — and add Option A as a secondary
"compare with national data" link. That combination is the most
defensible answer if a judge asks "is this live data?"

---

## 5. Citizen-facing content — basic laws & responsibilities

Keep this section short, accurate, and sourced to the Constitution
itself. Suggested content block:

### Fundamental Duties (Article 51A, Constitution of India)
A landing page for a justice-system platform pairing rights language
with duties language reads as more credible to judges than rights
alone. Pick 4–5, not all eleven, for a landing page — the full list
belongs on an "About" or "Learn" page:
- To abide by the Constitution and respect its ideals and institutions
- To uphold and protect the sovereignty, unity and integrity of India
- To develop scientific temper, humanism and the spirit of inquiry
- To safeguard public property and to abjure violence
- To strive towards excellence in all spheres of individual and
  collective activity

### Know your basic rights when interacting with the justice system
Short, plain-language, non-legal-advice framing:
- Right to be informed of the grounds of arrest (Article 22)
- Right to legal aid if unable to afford a lawyer (Article 39A,
  Legal Services Authorities Act, 1987)
- Right to a fair and speedy trial (Article 21, as interpreted by
  the Supreme Court)
- Right to file a Zero FIR at any police station, regardless of
  jurisdiction (now codified under BNSS, 2023)

**Add a visible disclaimer under this section:**
> "This information is provided for general civic awareness and does
> not constitute legal advice. For guidance on a specific matter,
> consult a licensed advocate or your nearest Legal Services Authority
> (NALSA / SLSA)."

This disclaimer isn't optional decoration — a platform in this space
making legal-sounding statements without one is a real liability
question, and it directly protects you in front of judges who will
ask about it.

---

## 6. What NOT to put on the landing page

- Any real case data, party names, or document content — even as a
  "demo" — since these read as sensitive/evidentiary in front of a
  panel that includes the exact ministry this data belongs to.
- The actual State Emblem, unless you are prepared to explain why a
  student project is displaying it (you aren't; don't).
- Screenshots of your own app's internal dashboard views (cards,
  badges, etc.) as if they were the final polished product — this is
  the exact "looks like an app, not a document" problem from earlier
  in this build, applied to marketing instead of documents.
- Any login credential, token, or example OTP, even fictional-looking
  ones, in a public-facing static page.
