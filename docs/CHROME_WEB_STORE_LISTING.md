# Chrome Web Store Listing - Jira Quick Search

This document is the ready-to-paste listing content for Chrome Web Store submission.

## Alerts

- Product details: complete all required fields below.
- Graphic assets: screenshot dimensions must be exactly `1280x800` or `640x400`.
- Screenshot format: `JPEG` or `24-bit PNG` with **no alpha channel**.

## Product Details

### Title (from package)

Jira Quick Search

### Summary (from package)

Search Jira tickets, keep search query history, and cache ticket details offline.

### Description (paste in full)

Jira Quick Search is a productivity extension for Jira users who need fast issue lookups, quick filtering, and reliable offline access to recently used tickets.

Use it to search by issue key, summary text, assignee, labels, or JQL. The extension includes autocomplete suggestions, reusable query history, and one-click filters for common workflows like High Priority, In Progress, and Assigned to Me.

For day-to-day execution, Jira Quick Search lets you open issues in a new tab, pin and watch important tickets, and perform faster status-focused triage from a compact interface. Cached ticket data enables offline fallback and rapid re-access when network conditions are poor.

Security and reliability are built in:

- API token values are separated from plain settings storage.
- JSON export/import excludes token fields.
- Search-result caching is controlled by the Auto-Cache setting.

This extension is ideal for engineers, QA, support, and managers who want Jira context quickly without repeatedly loading the full Jira UI.

### Category

Productivity

### Language

English

## Graphic Assets

### Store icon (required)

- Required size: `128x128`
- Suggested file: `public/icons/icon128.png`

### Global promo video (optional)

- YouTube URL (optional): leave blank for now.

### Screenshots (up to 5, at least 1 required)

Rules:

- Exactly `1280x800` or `640x400`
- JPEG or 24-bit PNG (no alpha)

Current source screenshots in repo:

1. `src/assets/images/extension_search.png`
2. `src/assets/images/extension_activity.png`
3. `src/assets/images/extension_offline_cache.png`
4. `src/assets/images/extension_history.png`
5. `src/assets/images/extension_settings.png`

Note:

- Upload these resized files from `docs/store-assets/`:

1. `docs/store-assets/extension_search-1280x800.jpg`
2. `docs/store-assets/extension_activity-1280x800.jpg`
3. `docs/store-assets/extension_offline_cache-1280x800.jpg`
4. `docs/store-assets/extension_history-1280x800.jpg`
5. `docs/store-assets/extension_settings-1280x800.jpg`

### Small promo tile (optional)

- Canvas: `440x280`
- JPEG or 24-bit PNG (no alpha)

### Marquee promo tile (optional)

- Canvas: `1400x560`
- JPEG or 24-bit PNG (no alpha)

## Additional Fields

### Official URL

Use your verified GitHub Pages site once registered in Google Search Console.

- Target domain: `https://rajendarreddyj.github.io/jira-quick-search-extension/`

### Homepage URL

`https://rajendarreddyj.github.io/jira-quick-search-extension/`

### Support URL

`https://rajendarreddyj.github.io/jira-quick-search-extension/support.md`

### Description URL (recommended)

`https://rajendarreddyj.github.io/jira-quick-search-extension/`

### Mature content

No

## Chrome Web Store Compliance Fields

### Single purpose

Jira Quick Search has one clear purpose: help users quickly find and triage Jira issues from a compact browser extension without opening the full Jira interface each time. It supports issue lookup by key, text, labels, assignee, and JQL, and improves productivity with query history, pin/watch states, and optional local caching for faster re-access and offline fallback. The extension does not provide unrelated features such as ad blocking, social sharing, analytics tracking, or content manipulation on arbitrary websites.

### Permission justification

#### storage justification

The `storage` permission is required to save user-configured Jira settings, secure credential references, query history, pinned/watched tickets, recently viewed items, and cached issue metadata used for offline fallback. Without `storage`, the extension cannot persist core user preferences or productivity context between popup sessions.

#### alarms justification

The `alarms` permission is used to schedule periodic maintenance tasks such as cache refresh and stale-cache cleanup according to user settings. This keeps cached issue data current and prevents unbounded local storage growth without requiring the user to manually trigger background cleanup.

#### Host permission justification

Host permission `https://*.atlassian.net/*` is required so the extension can call Jira Cloud REST APIs for the user's Atlassian tenant(s) to execute searches and retrieve issue details. Access is scoped to Atlassian Jira domains only, and is used solely to fulfill the extension's single purpose (issue lookup and triage support).

### Remote code

Are you using remote code?

- No, I am not using Remote code.

Justification:

All executable JavaScript is packaged with the extension bundle. The extension does not load or execute remote JS/Wasm, does not inject external script tags/modules, and does not use `eval()` to run downloaded code.

### Data usage

What user data do you plan to collect from users now or in the future?

- Personally identifiable information: **Yes** (user-provided Jira account email used for authentication and API calls).
- Authentication information: **Yes** (Jira API token/credential provided by user for Jira access).
- Health information: **No**.
- Financial and payment information: **No**.
- Personal communications: **No**.
- Location: **No**.
- Web history: **No**.
- User activity: **No**.
- Website content: **No**.

I certify that the following disclosures are true:

- I do not sell or transfer user data to third parties, outside approved use cases: **Yes**.
- I do not use or transfer user data for purposes unrelated to the item's single purpose: **Yes**.
- I do not use or transfer user data to determine creditworthiness or for lending purposes: **Yes**.

### Privacy policy

Privacy policy URL:

`https://rajendarreddyj.github.io/jira-quick-search-extension/privacy.md`

### Trader declaration (EEA)

Declare whether your publisher account is a trader or non-trader under EEA consumer protection laws.

Use one of the following in the Chrome Web Store form:

- **Non-trader**: Select this if you publish as an individual acting outside your trade, business, craft, or profession.
- **Trader**: Select this if you publish as a business, company, sole proprietorship, or if the extension is offered in a professional/commercial context.

If you select **Trader**, prepare these details exactly as registered:

- Legal entity or full legal name
- Registered business address
- Contact email for consumer communication
- Phone number (if requested by the form)

Publisher decision for this release:

- [ ] Trader
- [ ] Non-trader

Note:

- This is a legal/compliance declaration and should match your official publisher status.

## Item Support

### Visibility

Recommended rollout:

1. Unlisted (initial validation)
2. Public (after smoke testing)

### Support channel

- GitHub Issues: `https://github.com/rajendarreddyj/jira-quicksearch-extension/issues`
- Support page: `https://rajendarreddyj.github.io/jira-quick-search-extension/support.md`

## Final Submission Checklist

- [ ] Title and summary match package metadata
- [ ] Description pasted and reviewed
- [ ] Category set to Productivity
- [ ] Language set to English
- [ ] Store icon uploaded (128x128)
- [ ] 1-5 screenshots uploaded at required dimensions
- [ ] Homepage URL and Support URL set
- [ ] Official URL verified in Search Console (optional but recommended)
- [ ] Mature content set to No
- [ ] Visibility set as intended (Unlisted/Public)
