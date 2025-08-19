# AI Code Review Workflow

A GitHub Actions workflow that provides AI-powered code reviews using Google's Gemini AI. This system analyzes pull request changes and provides detailed, actionable feedback.

## 🚀 Features

- **Sequential File Processing**: Files are reviewed one by one for better focus and debugging
- **AI-Powered Reviews**: Uses Google Gemini AI for intelligent code analysis
- **Multiple Output Modes**: Artifacts, repository commits, and PR comments
- **Configurable Exclusions**: Skip irrelevant files (build artifacts, dependencies, etc.)
- **Progress Tracking**: Clear visibility into review progress
- **Error Handling**: Graceful handling of failures with detailed logging

## 📁 Repository Structure

```
.github/
├── workflows/
│   ├── gemini-pr-review-sequential.yml    # Main sequential review workflow
│   ├── pr-review.yml                      # Calling workflow template
│   └── _summarize.yml                     # Legacy summarize workflow
├── actions/
│   ├── process-file-sequential/           # Sequential file processor
│   ├── consolidate-reviews/               # Review consolidator
│   ├── precheck/                          # Pre-review checks
│   ├── locate-policy/                     # Policy file locator
│   └── generate-manifest/                 # File manifest generator
└── review/
    └── REVIEW_POLICY.md                   # Review policy template
```

## 🔧 Quick Setup

1. **Copy the calling workflow** to your repository:
   ```yaml
   # .github/workflows/pr-review.yml
   name: Gemini PR Review
   
   on:
     pull_request:
       types: [opened, synchronize, reopened]
   
   jobs:
     review:
       uses: softlink-dev/.github/.github/workflows/gemini-pr-review-sequential.yml@main
       secrets: inherit
   ```

2. **Configure secrets** in your repository:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `PAT_TOKEN`: GitHub Personal Access Token with repo permissions

3. **Optional**: Add a review policy file at `.github/review/REVIEW_POLICY.md`

## 📊 Review Output

The system generates two main files:
- **`DETAILED-REVIEW.md`**: Complete review with all file analyses
- **`SUMMARY.md`**: Brief overview with statistics and file list

## 🎯 Post Modes

- **`both`** (Recommended): Commits files + posts PR comments
- **`artifact_only`**: Only workflow artifacts
- **`commit`**: Commits files to repository
- **`comment`**: Posts PR comments only

## 📚 Documentation

- [Setup Guide](REVIEW_SETUP.md) - Detailed configuration and usage
- [Review Policy](review/REVIEW_POLICY.md) - Customize review criteria

## 🔄 Recent Changes

This system has been refactored from a complex batching approach to a simple sequential file-by-file review process for better maintainability and debugging.

## 🤝 Contributing

This is a shared workflow repository. Changes here affect all repositories using this workflow.
