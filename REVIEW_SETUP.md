# AI Review Workflow Setup

## Overview
This repository includes an AI-powered code review workflow using Google's Gemini AI. The workflow analyzes PR changes sequentially (file by file) and provides detailed code reviews.

## 🆕 New Sequential System

The workflow has been refactored to use **sequential file processing** instead of batching:
- **Files processed one by one** for better focus and debugging
- **Clear progress tracking** in workflow logs
- **Simplified architecture** with fewer components
- **Better error handling** with individual file failure isolation
- **Direct file → review mapping** for easier troubleshooting

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
- `max_files: 15` - Maximum files to review per PR
- `max_diff_lines: 4000` - Maximum diff lines per file

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
- Contains consolidated review files:
  - `DETAILED-REVIEW.md` - Complete review with all file analyses
  - `SUMMARY.md` - Brief overview with statistics

### Repository Files (commit mode)
- Location: `.github/review-results/`
- Structure:
  ```
  .github/review-results/
  └── PR#{number}/
      ├── DETAILED-REVIEW.md    # Complete review report
      └── SUMMARY.md            # Review summary
  ```

### PR Comments (comment mode)
- Posted directly to PR as a comment
- Contains summary of all review findings
- Links to full artifacts for detailed review

## Workflow Architecture

### Sequential Processing Flow
1. **Precheck**: Determine if review is needed
2. **Prepare**: Generate file manifest and locate policy
3. **Review**: Process files sequentially (one by one)
4. **Summarize**: Consolidate reviews and publish results

### Key Components
- **`process-file-sequential`**: Processes individual files
- **`consolidate-reviews`**: Combines file reviews into final reports
- **`precheck`**: Determines if review should run
- **`generate-manifest`**: Creates list of files to review
- **`locate-policy`**: Finds review policy file

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

### Sequential Processing Issues
1. Check individual file processing logs
2. Verify Gemini API key is valid
3. Review file exclusion patterns
4. Check for rate limiting issues

## Performance

### Typical PR Performance
- **1-3 files**: ~30-60 seconds total
- **5-10 files**: ~2-5 minutes total
- **15+ files**: ~5-10 minutes total

### Sequential vs Batching
- **Sequential**: Better for typical PRs (2-10 files)
- **Clearer debugging**: Each file processed individually
- **No parallel overhead**: Simpler resource management
- **Better error isolation**: One file failure doesn't affect others

## Migration from Old System

If you're migrating from the old batching system:
1. Update your calling workflow to use `gemini-pr-review-sequential.yml`
2. Remove batching parameters (`batch_size`, `max_parallel_batches`)
3. Review output structure changes (flat vs nested)
4. Test with a small PR to verify functionality
