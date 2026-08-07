---
applyTo: '**'
---

# Git Commit Style Guide for AI Coding Agent

## Format
```
<type>(<scope>): <description>
```

## Types
| Type | Use For |
|------|---------|
| `feat` | New features or functionality |
| `fix` | Bug fixes or error corrections |
| `docs` | Documentation changes |
| `style` | Code formatting, whitespace, semicolons |
| `refactor` | Code restructuring without feature changes |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Manifest, dependencies, build system |
| `chore` | Maintenance, file organization |

## Common Scopes
| Scope | Files/Areas |
|-------|-------------|
| `popup` | popup.html, popup.js |
| `background` | index.js, service worker |
| `options` | options.html, options.js |
| `i18n` | _locales/ translation files |
| `manifest` | manifest.json |
| `icons` | Extension icons/assets |
| `api` | JIRA API integration |

## Examples
```bash
# Features
feat(popup): add keyboard shortcut support
feat(i18n): add French translation

# Bug Fixes
fix(background): handle invalid JIRA URLs
fix(popup): resolve Enter key not working

# Documentation
docs(readme): update installation guide
docs: add troubleshooting section

# Maintenance
chore(icons): optimize icon file sizes
build(manifest): update version to 1.0.7
```

## Rules
- Use imperative mood: "Add feature" not "Added feature"
- Keep subject under 50 characters
- Capitalize first letter, no ending period
- Use body to explain "why" not "what"

## Pre-Commit Checklist
- [ ] Extension loads without errors
- [ ] All features work in popup/options
- [ ] No console errors
- [ ] Translation strings updated
- [ ] Version updated if needed