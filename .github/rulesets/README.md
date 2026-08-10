# GitHub Repository Rulesets

This directory contains repository ruleset configurations for Jira Quick Search.

## Available Rulesets

### 1. Branch Protection ([branch-protection.json](branch-protection.json))

Protects `main` and `master` with:

- Pull request requirements:
  - At least 1 approving review
  - Dismiss stale reviews on new commits
  - Require approval for the most recent push
  - Require review thread resolution
- Required status check:
  - `lint`
- Additional protections:
  - Prevent branch deletion
  - Prevent force pushes (non-fast-forward)
  - Require linear history

### 2. Release Tag Protection ([tag-protection.json](tag-protection.json))

Protects version tags (`v*`) with:

- Prevent tag deletion
- Prevent tag updates (moving tags)

## Applying Rulesets

### Option 1: GitHub Web UI

1. Go to repository Settings > Rules > Rulesets.
2. Click New ruleset > Import a ruleset.
3. Upload the JSON file or paste content.
4. Review and save.

### Option 2: GitHub CLI

```bash
gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --input .github/rulesets/branch-protection.json

gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --input .github/rulesets/tag-protection.json
```

## Notes

- The required status check name must match the actual check context in your repository.
- Rulesets include an admin bypass actor (RepositoryRole ID 5) for emergency operations.
