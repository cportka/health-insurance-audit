# Legal, safety, and privacy notice

## Not legal or medical advice

This software provides **general information** to help people understand and exercise their health
insurance appeal and grievance rights in the United States. It is **not legal advice, not medical
advice, and not tax advice**, and it does not create an attorney–client or any professional
relationship. It is not a substitute for your plan documents, your insurer, or a licensed
professional.

## Deadlines and rights vary — confirm them

The deadlines, levels, and rights in this tool are encoded from primary sources (CMS, HHS, the
Department of Labor, Medicare.gov, Medicaid.gov, and the Code of Federal Regulations) and are
intended to reflect the **standard federal framework**. But:

- **Your plan or state may differ.** Self-funded vs. fully-insured status, state law, plan documents,
  and grandfathered status all change the rules.
- **Some figures adjust annually** (for example, Medicare amount-in-controversy thresholds).
- **Some plan types have weaker rights** (short-term limited-duration plans are not ACA-regulated).

Always confirm the exact deadline printed on **your own denial notice** and with your plan or the
listed regulator. **When in doubt, file early** — an early filing is rarely harmful; a late one can
forfeit your rights.

## Privacy

The core library is **offline and dependency-free**. It does not transmit your information anywhere.
Any future feature that connects to an insurer, uses an external API, or calls a language model will
be **opt-in**, clearly disclosed, and documented in [CONNECTORS.md](./CONNECTORS.md). Protected
Health Information (PHI) should be handled accordingly; do not commit real claim data to the repo.

## Where to get free help

- **Your State Department of Insurance** — complaints about fully-insured and individual plans.
- **Consumer Assistance Programs (CAP)** — free appeal help in many states.
- **State Health Insurance Assistance Program (SHIP)** — free Medicare counseling.
- **State Medicaid ombudsman / managed-care ombudsman** — Medicaid issues.
- **U.S. Department of Labor, EBSA (1-866-444-3272)** — job-based (ERISA) plans.
- **No Surprises Help Desk (1-800-985-3059)** — surprise/balance billing.

## Accuracy and contributions

The knowledge base is maintained as cited data. If you find an out-of-date deadline or citation, open
an issue or a PR that updates the relevant file in `src/data/` **with a primary source**. Every
pathway step is required by test to carry an `authority` and a `sources` link.
