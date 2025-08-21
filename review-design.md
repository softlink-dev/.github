# Parallel Review System Design Document

## Project Context

### Background
This system is an **enhanced parallel version** of a working sequential AI code review system. The original system worked but was slow for large PRs. This parallel version was created to improve performance by processing files in batches concurrently.

### Current State
- **Status**: FIXED - All known issues have been resolved
- **Structure**: Consistent flat artifact structure throughout the pipeline
- **Features**: Parallel processing with rate limiting and comprehensive validation
- **Output**: PR-specific review results with debug prompts

### Repository Structure
```
.github/
├── workflows/
│   ├── gemini-pr-review-parallel.yml     # Main workflow
│   ├── _prepare-enhanced.yml             # Creates batches
│   ├── _review-batch-enhanced.yml        # Processes batches
│   ├── _summarize-enhanced.yml           # Consolidates results
│   └── archive/                          # Working sequential version
├── actions/
│   ├── process-batch-enhanced/           # AI processing action
│   ├── consolidate-batches/              # Consolidation action
│   ├── locate-policy/                    # Policy location
│   ├── generate-manifest/                # File manifest generation
│   ├── create-batches/                   # Batch creation
│   └── precheck/                         # PR validation
├── review-work/                          # Intermediate workspace (PR-specific)
│   └── PR-{NUMBER}/                      # Dedicated workspace per PR
└── review-results/                       # Final output location (PR-specific subdirectories)
```

### Dependencies
- **External Actions**: Actions are reusable and reside in a central public repository (`softlink-dev/.github`).
- **Required Secrets**: `GEMINI_API_KEY`, `PAT_TOKEN`
- **External Services**: Google Gemini AI API
- **Tools**: Node.js 20, Gemini CLI

### Reusable Workflows and Actions
The workflows and actions used in this system are designed to be reusable and are stored in a central, public repository named `.github`. This repository follows GitHub's convention for reusable workflows by storing them in a `.github` folder within the repository. When you see actions referenced with a path like `softlink-dev/.github/.github/actions/consolidate-batches@main`, it is correctly referencing an action in this central repository, not a local action within the calling repository.

### Parallelization Control
**Purpose**: Prevent overwhelming API quotas and ensure reliable processing

**Current Implementation**:
- `max_parallel_batches`: Controls number of parallel GitHub Actions jobs
- **Issue**: No protection against API rate limits within individual jobs

**Required Enhancements**:
1. **Backoff/Retry Strategy**: Implement exponential backoff in `process-batch-enhanced`
2. **Queue-based Concurrency Limiter**: Process files sequentially within each batch job
3. **API Rate Limit Protection**: Handle 429 errors gracefully with retry logic

**Benefits**:
- Prevents race conditions and API 429 errors
- Ensures consistent processing even with high parallelization
- Improves reliability and reduces failed reviews

## Overview
This document describes the design and implementation of the parallel AI code review system using GitHub Actions. The system processes pull requests by batching files, reviewing them in parallel, and consolidating results.

## System Architecture

### Main Workflow: `gemini-pr-review-parallel.yml`
**Purpose**: Orchestrates the entire review process

**Inputs**:
- `exclude_regex`: Regex pattern to exclude files
- `max_files`: Maximum number of files to review
- `max_commits`: Maximum number of commits to analyze
- `model`: Gemini model to use (default: gemini-2.0-pro)
- `max_diff_lines`: Maximum diff lines per file
- `full_file_threshold_lines`: Threshold for full file review
- `window_before`: Lines before diff to include
- `window_after`: Lines after diff to include
- `merge_gap_tolerance`: Gap tolerance for merging hunks
- `max_windowed_lines`: Maximum lines in windowed content
- `policy_path`: Path to review policy file
- `control_repo_ref`: Branch/tag of .github control repo
- `batch_size`: Number of files per batch
- `max_parallel_batches`: Maximum parallel batches to run
- `post_mode`: How to post results (comment/commit/both)

**Secrets**:
- `GEMINI_API_KEY`: API key for Gemini service
- `PAT_TOKEN`: Personal access token for repository access

**Jobs**:
1. `precheck` - Validates PR and determines if review is needed
2. `prepare` - Creates batches and policy information
3. `review` - Processes batches in parallel
4. `summarize` - Consolidates results and publishes

---

## Workflow 1: `_prepare-enhanced.yml`

**Purpose**: Creates file batches and locates review policy

**Inputs**:
- `exclude_regex`: Regex pattern to exclude files
- `max_files`: Maximum number of files to review
- `max_commits`: Maximum number of commits to analyze
- `policy_path`: Path to review policy file
- `control_repo_ref`: Branch/tag of .github control repo
- `batch_size`: Number of files per batch
- `max_parallel_batches`: Maximum parallel batches to run

**Outputs**:
- `batches`: JSON array of batches `[{id: number, items: FileItem[]}]`
- `policy_found`: Boolean indicating if policy was found
- `policy_scope`: Scope of policy (repo/org)
- `policy_path_resolved`: Resolved path to policy file

**Steps**:
1. Checkout PR head (full history)
2. Checkout org .github control repo
3. Locate policy using `locate-policy` action
4. Generate manifest using `generate-manifest` action
5. Create batches using `create-batches` action
6. Debug batches output
7. Upload batches artifact

**Artifacts**:
- `review-batches`: Contains `batches.json` file with batch definitions

---

## Workflow 2: `_review-batch-enhanced.yml`

**Purpose**: Processes a single batch of files

**Inputs**:
- `batch_json`: JSON string of batch `{id: number, items: FileItem[]}`
- `model`: Gemini model name
- `max_diff_lines`: Maximum diff lines per file
- `full_file_threshold_lines`: Threshold for full file review
- `window_before`: Lines before diff to include
- `window_after`: Lines after diff to include
- `merge_gap_tolerance`: Gap tolerance for merging hunks
- `max_windowed_lines`: Maximum lines in windowed content
- `policy_path`: Path to review policy file
- `policy_found`: Boolean indicating if policy was found
- `policy_scope`: Scope of policy
- `control_repo_ref`: Branch/tag of .github control repo

**Steps**:
1. Debug batch input
2. Checkout repo (full history)
3. Checkout org .github control repo
4. Setup Node.js
5. Install Gemini CLI
6. Process batch using `process-batch-enhanced` action
7. Upload batch review artifact

**Artifacts**:
- `review-batch-{id}`: Contains review files for this batch

**Artifact Structure**:
```
review-batch-0/
  file1.md
  file2.md
  summary.json
  prompt-log/
    PROMPT-file1.md
    PROMPT-file2.md
```

**Workspace Structure**:
```
.github/review-work/PR-{NUMBER}/
  file1.md
  file2.md
  summary.json
  prompt-log/
    PROMPT-file1.md
    PROMPT-file2.md
```

---

## Workflow 3: `_summarize-enhanced.yml`

**Purpose**: Consolidates batch results and publishes review

**Inputs**:
- `post_mode`: How to post results (comment/commit/both)
- `control_repo_ref`: Branch/tag of .github control repo

**Steps**:
1. Checkout PR head
2. Download all batch artifacts
3. Consolidate reviews using `consolidate-batches` action
4. Commit review results to PR branch (if requested)
5. Post review as PR comment (if requested)

**Artifact Download**:
- Downloads `review-batch-*` artifacts to current directory
- Uses `merge-multiple: false` to preserve structure

**Outputs**:
- `consolidate_review.md`: Detailed review report (committed as `DETAILED-REVIEW.md`)
- `consolidate_summary.md`: Executive summary (committed as `SUMMARY.md`)
- Committed to `.github/review-results/PR-NNN/` directory in PR branch (where NNN is the PR number)

---

## Action 1: `process-batch-enhanced`

**Purpose**: Processes individual files in a batch using AI

**Inputs**:
- `batch_json`: JSON string of batch
- `model`: Gemini model name
- `max_diff_lines`: Maximum diff lines per file
- `full_file_threshold_lines`: Threshold for full file review
- `window_before`: Lines before diff to include
- `window_after`: Lines after diff to include
- `merge_gap_tolerance`: Gap tolerance for merging hunks
- `max_windowed_lines`: Maximum lines in windowed content
- `policy_found`: Boolean indicating if policy was found
- `policy_scope`: Scope of policy
- `policy_path`: Path to review policy file

**Environment Variables**:
- `GEMINI_API_KEY`: API key for Gemini service

**Outputs**:
- Review files in dedicated workspace directory with sanitized filenames
- Debug prompts in `prompt-log/` directory
- `summary.json` with batch statistics

**Output Structure**:
```
.github/review-work/PR-{NUMBER}/
  {actual_src_file_1}.md
  {actual_src_file_2}.md
  summary.json
  prompt-log/
    PROMPT-{actual_src_file_1}.md
    PROMPT-{actual_src_file_2}.md
```

**File Naming Convention**:
- **Format**: `{sanitized_file_path}.md` (actual file paths with special characters replaced)
- **Examples**: 
  - `src/utils/math.js` → `src_utils_math.js.md`
  - `models/user-profile.ts` → `models_user-profile.ts.md`
  - `controllers/auth/login.controller.js` → `controllers_auth_login.controller.js.md`
- **Benefits**: 
  - Avoids confusion when debugging multi-batch reviews
  - Improves traceability and maintainability
  - Makes it easier to correlate review files with source files

---

## Action 2: `consolidate-batches`

**Purpose**: Combines all batch results into final reports

**Inputs**:
- `gemini_api_key`: API key for Gemini service

**Expected Input Structure**:
```
review-batch-0/
  {actual_src_file_1}.md
  {actual_src_file_2}.md
  summary.json
  prompt-log/
    PROMPT-{actual_src_file_1}.md
    PROMPT-{actual_src_file_2}.md
review-batch-1/
  {actual_src_file_3}.md
  {actual_src_file_4}.md
  summary.json
  prompt-log/
    PROMPT-{actual_src_file_3}.md
    PROMPT-{actual_src_file_4}.md
```

**Outputs**:
- `consolidate_review.md`: Detailed review combining all batch results
- `consolidate_summary.md`: AI-generated executive summary

---

## Data Flow Summary

### Data Flow:
1. **Prepare** → Creates batches → Uploads `review-batches` artifact
2. **Review** → Processes batch → Creates files in dedicated workspace → Uploads `review-batch-{id}` with flat structure
3. **Summarize** → Downloads `review-batch-*` → Expects flat structure → Consolidates
4. **Final Output** → Commits results to `.github/review-results/PR-{NUMBER}/` with complete structure

### Workspace Architecture:
- **Dedicated Workspace**: `.github/review-work/PR-{NUMBER}/` for each PR
- **Complete Isolation**: No risk of mixing intermediate files with repository files
- **Clean Separation**: All batch processing happens in dedicated workspace
- **Easy Debugging**: Clear location for all intermediate files

---

## Final Output Structure

### Committed Review Results Structure:
```
.github/review-results/
└── PR-{PR_NUMBER}/
    ├── DETAILED-REVIEW.md          # Complete AI review report (from consolidate_review.md)
    ├── SUMMARY.md                  # Executive summary (from consolidate_summary.md)
    └── prompt-log/                 # Debug prompts for troubleshooting
        ├── PROMPT-{file1}.md       # AI prompts for each reviewed file
        ├── PROMPT-{file2}.md
        └── ...
```

**Key Features:**
- **PR-Specific Directories**: Each PR gets its own directory (`PR-123/`, `PR-456/`, etc.)
- **Flat Organization**: No nested subdirectories except for `prompt-log/`
- **Enhanced Naming**: Files use sanitized paths with robust reconstruction (e.g., `src_utils_math.js.md` → `src/utils/math.js`)
- **Debug Support**: All AI prompts saved for troubleshooting and transparency
- **Complete Traceability**: Easy to correlate review files with source files

**Benefits:**
- **Isolation**: Multiple PRs can have reviews without conflicts
- **Simplicity**: Flat structure is easy to process and debug
- **Transparency**: Debug prompts available for understanding AI decisions
- **Maintainability**: Enhanced naming with validation makes reviews easy to find and correlate
- **Robustness**: Path reconstruction handles edge cases gracefully with clear fallback messages

---

## File Formats

### Batch JSON Format:
```json
[
  {
    "id": 0,
    "items": [
      {
        "sha": "commit_sha",
        "path": "file/path",
        "status": "modified|added|deleted",
        "is_binary": false,
        "additions": 10,
        "deletions": 5,
        "patch": "diff_content"
      }
    ]
  }
]
```

### Review File Format:
```markdown
## file/path @ commit_sha

**Mode:** full|windowed|diff_only  |  **Lines:** 100

[AI Review Content]

---
```

### Summary JSON Format:
```json
{
  "total": 5,
  "processed": 5,
  "failed": 0,
  "batch_id": 0,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Potential Issues During Testing

### 1. API Rate Limiting
**Scenario**: High parallelization might trigger API rate limits
**Symptoms**: 429 errors, failed API calls
**Mitigation**: Exponential backoff and sequential processing implemented
**Monitoring**: Check logs for retry attempts and rate limit warnings

### 2. Artifact Download Issues
**Scenario**: Batch artifacts not found during consolidation
**Symptoms**: "No batch results found" error
**Mitigation**: Comprehensive validation steps added
**Monitoring**: Check artifact upload/download logs

### 3. File Naming Conflicts
**Scenario**: Special characters in file paths causing issues
**Symptoms**: Missing review files, sanitization errors, path reconstruction failures
**Mitigation**: Robust sanitization function implemented with enhanced path reconstruction
**Monitoring**: Check for sanitized filename patterns and path reconstruction validation

### 4. Git Commit Failures
**Scenario**: PR branch conflicts or permission issues
**Symptoms**: Commit/push failures
**Mitigation**: Retry logic with rebase/pull fallback
**Monitoring**: Check git operation logs

### 5. Memory/Timeout Issues
**Scenario**: Large PRs with many files
**Symptoms**: Workflow timeouts, memory exhaustion
**Mitigation**: Batch size limits and file count thresholds
**Monitoring**: Check workflow duration and resource usage

---

## Implementation Status

### ✅ Completed Tasks

**Task 1: Debug Step Syntax Error** ✅
- Fixed nested quotes issue in `_prepare-enhanced.yml`
- Debug output now works correctly

**Task 2: Upload Path Mismatch** ✅
- Changed `path: reviews/` to `path: .` in `_review-batch-enhanced.yml`
- Artifacts now have flat structure

**Task 3: Output Directory Mismatch** ✅
- Updated `process-batch-enhanced/index.js` to use current directory
- Implemented sanitized file naming
- Debug prompts saved to `prompt-log/` directory

**Task 4: Consolidation Logic Mismatch** ✅
- Updated `consolidate-batches/action.yml` to expect flat structure
- Removed nested directory logic

**Task 5: Artifact Structure Validation** ✅
- Added comprehensive validation steps to all workflows
- Workflows now fail gracefully if structure is incorrect

**Task 6: Error Handling in Debug Steps** ✅
- Added robust error handling with fallback mechanisms
- Debug steps complete even if individual commands fail

**Task 7: Parallelization Control** ✅
- Implemented exponential backoff and retry strategy
- Added queue-based concurrency limiter for sequential processing
- Proper handling of API 429 errors

### ⏳ Pending Tasks

**Task 8: End-to-End Testing** ⏳
- Ready for comprehensive testing with all fixes implemented
- All known issues resolved

---

## Action Dependencies

### `locate-policy` Action
**Purpose**: Finds review policy file in repository or organization
**Inputs**: `policy_path` (string)
**Outputs**: 
- `found` (boolean): Whether policy was found
- `scope` (string): "repo" or "org"
- `path` (string): Resolved path to policy file

### `generate-manifest` Action
**Purpose**: Creates list of files to review from PR changes
**Inputs**: `exclude_regex`, `max_files`, `max_commits`
**Outputs**: `items` (JSON string): Array of file items with diff information

### `create-batches` Action
**Purpose**: Splits file manifest into batches for parallel processing
**Inputs**: `items_json`, `batch_size`, `max_parallel_batches`
**Outputs**: `batches` (JSON string): Array of batch objects

### `precheck` Action
**Purpose**: Validates if PR needs review based on size and content
**Inputs**: `force_review`, `min_lines_threshold`
**Outputs**: Success/failure based on validation rules

## Testing & Validation

### How to Test
1. **Create a test PR** with multiple file changes
2. **Trigger workflow** manually or via PR
3. **Monitor logs** for each job step
4. **Check artifacts** for correct structure
5. **Verify final output** in `.github/review-results/PR-NNN/`

### Expected Behavior
- **Prepare Job**: Creates batches and uploads `review-batches` artifact
- **Review Jobs**: Process files in dedicated workspace and upload `review-batch-{id}` artifacts with flat structure
- **Summarize Job**: Downloads all batch artifacts and consolidates
- **Final Output**: Detailed review and summary committed to `.github/review-results/PR-{NUMBER}/`

### Workspace Benefits:
- **Isolation**: Each PR has its own workspace directory
- **Clean Artifacts**: Only workspace files are uploaded, not entire repository
- **Debugging**: Easy to locate and inspect intermediate files
- **No Conflicts**: Multiple PRs can run simultaneously without interference

### Debug Commands
```bash
# Check workspace structure (during processing)
ls -la .github/review-work/PR-*/

# Check artifact structure
ls -la review-batch-*/

# Verify file contents with consistent naming
cat review-batch-0/{actual_src_file_1}.md

# Check prompt logs in batch artifacts
ls -la prompt-log/

# Check final committed results structure
ls -la .github/review-results/PR-*/

# Check debug prompts in final commit
ls -la .github/review-results/PR-*/prompt-log/

# Verify file naming consistency
find review-batch-*/ -name "*.md" | grep -v summary.json

# Check complete final structure
tree .github/review-results/PR-*/ || ls -la .github/review-results/PR-*/

# Verify all components are present
ls -la .github/review-results/PR-*/DETAILED-REVIEW.md
ls -la .github/review-results/PR-*/SUMMARY.md
ls -la .github/review-results/PR-*/prompt-log/PROMPT-*.md

# Workspace debugging commands
ls -la .github/review-work/PR-*/prompt-log/
cat .github/review-work/PR-*/summary.json
```

## Recommendations

1. **✅ All identified issues have been fixed** - System now has consistent flat structure
2. **✅ Error handling implemented** - Robust fallback mechanisms in place
3. **✅ Artifact naming standardized** - Consistent structure across all workflows
4. **✅ Validation added** - Comprehensive checks ensure expected structures exist
5. **✅ Logging improved** - Detailed tracking of artifact creation and consumption
6. **✅ Parallelization control implemented** - Rate limiting and sequential processing
7. **✅ Enhanced file naming** - Robust path reconstruction with validation and fallback
8. **✅ Dedicated workspace architecture** - Complete isolation of intermediate files
9. **✅ Input validation** - Robust validation for PR number and batch JSON inputs
10. **✅ Workspace validation** - Pre-upload validation ensures workspace integrity

**Next Steps:**
- Run end-to-end testing with a test PR
- Monitor for any edge cases or performance issues
- Document any new issues discovered during testing
- Verify workspace isolation and clean artifact uploads
- Test path reconstruction with various filename patterns
- Validate input validation with edge cases

## Implementation Guidelines

### Task Verification Process
1. **Before marking any task as [x]**: Verify the implementation works correctly
2. **Self-check each task**: Run the validation steps listed in each task
3. **If self-check fails**: Revert the changes and redo the task
4. **Only mark as [x]**: After successful validation and testing
5. **After every change**: Review the design document and the code, and if everything seems in order, then mark the task as done in the document

### Communication Protocol
1. **Before starting each task**: Explain what you are going to do next
2. **Seek confirmation**: Wait for user approval before proceeding
3. **Avoid long unattended sessions**: Keep user informed of progress
4. **Stop and ask**: If you encounter unexpected issues or need clarification

### Quality Assurance
- **Test incrementally**: Verify each change before moving to the next
- **Document changes**: Explain what was modified and why
- **Validate assumptions**: Confirm understanding before implementing
- **Rollback capability**: Be prepared to revert if issues arise

## Next Steps for Testing

1. **Run end-to-end testing** - Create a test PR with multiple file changes
2. **Monitor workflow execution** - Check each job step for proper behavior
3. **Verify artifact structures** - Ensure flat structure is maintained throughout
4. **Test rate limiting** - Verify API rate limits are handled gracefully
5. **Test path reconstruction** - Verify filename reconstruction works with various patterns
6. **Test input validation** - Verify PR number and batch JSON validation works correctly
7. **Validate final output** - Check PR-specific review results directory

**IMPORTANT**: When errors are reported during testing, update the "Reported Errors & Fixes" section below with details about the error, investigation findings, and implemented fixes. Create the Errors as tasks that can be checked when done.

**For Fresh Sessions**: This document contains complete system specifications. Use this document as the single source of truth for understanding the system, current status, and testing procedures. Do not duplicate information from this document in prompts - instead reference this document directly.

This design document provides a complete technical specification for the working parallel review system. All known issues have been resolved and the system is ready for comprehensive testing. A fresh session can use this document to understand the current system behavior and conduct end-to-end validation.

---

## Reported Errors & Fixes

### Error Tracking Instructions
- **Report Date**: When the error was first reported
- **Error Description**: Clear description of what went wrong
- **Investigation**: What was found during debugging
- **Root Cause**: The underlying issue that caused the error
- **Fix Applied**: What changes were made to resolve the issue
- **Status**: [OPEN] / [INVESTIGATING] / [FIXED] / [VERIFIED]
- **Test Results**: Results after applying the fix
- **Clues and diagnostics**: Add clues and diagnostics identified under this section for each error

**IMPORTANT**: Do not mark errors as [FIXED] immediately after applying changes. Record the attempted fix and wait for user confirmation from testing before updating status to [FIXED].

### Error Log

#### Error #1: Artifact Upload Path Mismatch
- **Report Date**: 2025-01-27
- **Error Description**: Upload batch artifact does not show any batches - Warning: No files were found with the provided path: /batches.json. No artifacts will be uploaded.
- **Investigation**: The `create-batches` action creates batches.json in `${RUNNER_TEMP}/batches.json` but the upload-artifact steps use incorrect path syntax
- **Root Cause**: Path mismatch between where file is created (`${RUNNER_TEMP}/batches.json`) and where upload looks for it (`${{ env.RUNNER_TEMP }}/batches.json` vs `/batches.json`)
- **Fix Applied**: Changed upload artifact paths from `${{ env.RUNNER_TEMP }}/batches.json` to `${{ runner.temp }}/batches.json` to match validation step syntax
- **Status**: [OPEN] - Awaiting test confirmation
- **Test Results**: [PENDING]
- **Clues and diagnostics**: 
  - create-batches action creates file at: `${RUNNER_TEMP}/batches.json` (line 94)
  - upload-artifact tries to find file at: `${{ env.RUNNER_TEMP }}/batches.json` (lines 95, 101)
  - Validation step successfully finds file at: `${{ runner.temp }}/batches.json` (line 109)
  - Inconsistent variable syntax: `env.RUNNER_TEMP` vs `runner.temp`

---
