# AI Review Workflow Setup

## Overview
This repository includes an AI-powered code review workflow using Google's Gemini AI. The workflow analyzes PR changes and provides detailed code reviews.

## Post Modes

The workflow supports different ways to deliver review results:

### 1. `artifact_only` (Default)
- ✅ Review files uploaded as workflow artifacts
- ❌ No files committed to repository
- ❌ No PR comments posted
- **Use case**: When you want to review results manually from artifacts

### 2. `commit`
- ✅ Review files committed to PR branch in `.github/review-results/`
- ✅ Review files uploaded as workflow artifacts
- ❌ No PR comments posted
- **Use case**: When you want review files in the repository for reference

### 3. `comment`
- ✅ Review summary posted as PR comment
- ✅ Review files uploaded as workflow artifacts
- ❌ No files committed to repository
- **Use case**: When you want immediate visibility of review results in PR

### 4. `both` (Recommended)
- ✅ Review files committed to PR branch
- ✅ Review summary posted as PR comment
- ✅ Review files uploaded as workflow artifacts
- **Use case**: Maximum visibility and accessibility of review results

## Configuration

### Default Settings
The workflow is configured with these defaults:
- `post_mode: "both"` - Commits files and posts PR comments
- `force_review: true` - Reviews all PRs regardless of size
- `min_lines_threshold: 15` - Minimum lines changed to trigger review

### Required Secrets
- `GEMINI_API_KEY` - Your Google Gemini API key
- `PAT_TOKEN` - GitHub Personal Access Token with repo permissions

## Usage

### Automatic PR Reviews
The workflow runs automatically on PR events when configured in your repository.

### Manual Testing
Use the test workflow to manually trigger reviews:
1. Go to Actions → Test AI Review
2. Select desired post mode
3. Click "Run workflow"

## Review Results Location

### Artifacts
- Download from workflow run artifacts
- Contains individual file reviews in markdown format

### Repository Files (commit mode)
- Location: `.github/review-results/`
- Structure:
  ```
  .github/review-results/
  ├── SUMMARY.md          # Overview of all reviews
  ├── PR-REPORT.md        # Complete PR-level report
  └── {commit-sha}/       # Per-commit reviews
      └── {filename}.md   # Individual file reviews
  ```

### PR Comments (comment mode)
- Posted directly to PR as a comment
- Contains summary of all review findings
- Links to full artifacts for detailed review

## Troubleshooting

### No Review Files Visible
1. Check if workflow completed successfully
2. Verify `post_mode` setting
3. Check workflow artifacts for review files
4. Ensure PR is not from a fork (commit mode requires direct access)

### No PR Comments
1. Verify `post_mode` includes comment functionality
2. Check PAT_TOKEN has sufficient permissions
3. Ensure PR is not from a fork
4. Review workflow logs for API errors

### Review Not Triggered
1. Check PR size (lines changed)
2. Verify `force_review` setting
3. Check if PR is in draft status
4. Review precheck job logs
