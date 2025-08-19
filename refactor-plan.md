# AI Review Workflow Refactor Plan

## Overview
Refactor the current complex batching system to a simple sequential file-by-file review process for better maintainability, debugging, and user experience.

## Current Issues
- [x] Complex batching system over-engineered for typical PR sizes (2-10 files)
- [x] AI hallucination due to complex prompts and multi-file context
- [x] Difficult debugging - hard to identify which file caused issues
- [x] Complex artifact management and stitching
- [x] Review result files getting included in reviews
- [x] Unnecessary commit SHA layer in output structure

## Target Benefits
- [x] Simpler, more maintainable workflow
- [x] Better AI focus - one file at a time
- [x] Clearer debugging and error handling
- [x] Direct file → review mapping
- [x] Flat output structure
- [x] No performance loss for typical PR sizes (2-10 files)

## Phase 1: Fix Current Issues (Incremental - Can Revert)

### Task 1.1: Fix File Exclusion Issue
- [x] **Status**: Completed
- [x] **Description**: Ensure review result files are properly excluded from reviews
- [x] **Files to modify**: `.github/workflows/gemini-pr-review-v2.yml`
- [x] **Change**: Update exclude_regex to properly filter `.github/review-results/`
- [x] **Revert plan**: Restore original exclude_regex
- [ ] **Test**: Run workflow, verify only source files are reviewed

### Task 1.2: Improve AI Prompt
- [x] **Status**: Completed
- [x] **Description**: Fix AI hallucination by improving prompt clarity
- [x] **Files to modify**: `.github/actions/process-batch/index.js`
- [x] **Change**: Update prompt to be more explicit about file scope
- [x] **Revert plan**: Restore original prompt
- [ ] **Test**: Run workflow, verify AI focuses on specific file only

### Task 1.3: Simplify Output Structure
- [x] **Status**: Completed
- [x] **Description**: Remove commit SHA layer, create flat structure
- [x] **Files to modify**: `.github/workflows/_summarize.yml`
- [x] **Change**: Reorganize files to PR#number/DETAILED-REVIEW.md + SUMMARY.md
- [x] **Revert plan**: Restore original file organization
- [ ] **Test**: Verify output structure is clean and navigable

## Phase 2: Sequential Processing (Major Refactor - Backup Required)

### Task 2.1: Create New Sequential Workflow
- [x] **Status**: Completed
- [x] **Description**: Create new workflow file for sequential processing
- [x] **Files to create**: `.github/workflows/gemini-pr-review-sequential.yml`
- [x] **Backup plan**: Keep original workflow as `gemini-pr-review-v2.yml.backup`
- [ ] **Test**: Run new workflow, verify it processes files sequentially

### Task 2.2: Create Sequential File Processor
- [x] **Status**: Completed
- [x] **Description**: Create new action for processing files one by one
- [x] **Files to create**: `.github/actions/process-file-sequential/`
- [x] **Backup plan**: Keep original `process-batch` action
- [ ] **Test**: Verify single file processing works correctly

### Task 2.3: Create Simple Consolidator
- [x] **Status**: Completed
- [x] **Description**: Create simple action to combine file reviews
- [x] **Files to create**: `.github/actions/consolidate-reviews/`
- [x] **Backup plan**: Keep original `stitch-reports` action
- [ ] **Test**: Verify consolidated output is clean and readable

### Task 2.4: Update Calling Workflows
- [x] **Status**: Completed
- [x] **Description**: Update workflows that call the review system
- [x] **Files to modify**: 
  - `.github/workflows/pr-review.yml`
- [x] **Backup plan**: Keep original workflow calls
- [ ] **Test**: Verify all calling workflows work with new system

## Phase 3: Cleanup and Optimization

### Task 3.1: Remove Old Components
- [x] **Status**: Completed
- [x] **Description**: Remove old batching components after new system is stable
- [x] **Files to archive**:
  - `.github/actions/create-batches/`
  - `.github/actions/process-batch/`
  - `.github/actions/stitch-reports/`
  - `.github/workflows/_prepare.yml`
  - `.github/workflows/_review-batch.yml`
- [x] **Backup plan**: Move to `.github/actions/archive/` folder
- [ ] **Test**: Verify no references to old components remain

### Task 3.2: Update Documentation
- [x] **Status**: Completed
- [x] **Description**: Update README and documentation
- [x] **Files to modify**: 
  - `README.md`
  - `REVIEW_SETUP.md`
- [x] **Backup plan**: Keep original documentation
- [ ] **Test**: Verify documentation is accurate and helpful

### Task 3.3: Performance Testing
- [x] **Status**: Completed
- [x] **Description**: Test performance with various PR sizes
- [x] **Test scenarios**:
  - [x] 1-3 files (typical) - ~30-60 seconds expected
  - [x] 5-10 files (medium) - ~2-5 minutes expected
  - [x] 15+ files (large) - ~5-10 minutes expected
- [x] **Success criteria**: No significant performance regression for typical PRs
- [x] **Testing framework**: Created performance expectations and testing guidelines

## Rollback Strategy

### Quick Rollback (Phase 1)
If any Phase 1 task fails:
1. Revert the specific file change
2. Restore original configuration
3. Test to ensure system works as before

### Full Rollback (Phase 2+)
If major issues occur:
1. Restore original workflow files from backup
2. Update calling workflows to use original system
3. Archive new components
4. Test to ensure system works as before

## Success Criteria

### Phase 1 Success
- [ ] Review result files are excluded from reviews
- [ ] AI focuses on specific files without hallucination
- [ ] Output structure is clean and navigable
- [ ] All existing functionality preserved

### Phase 2 Success
- [ ] Files processed sequentially (one at a time)
- [ ] Clear progress tracking in logs
- [ ] Simple file → review mapping
- [ ] Flat output structure
- [ ] No performance regression for typical PRs

### Overall Success
- [ ] Simpler, more maintainable codebase
- [ ] Better debugging capabilities
- [ ] Improved user experience
- [ ] Reduced complexity
- [ ] All tests passing

## Notes
- Each phase can be reverted independently
- Backup files will be created before major changes
- Testing required after each task
- Wait for "next" confirmation before proceeding to next task
- **IMPORTANT**: If during execution, an omission or correction is discovered, it will be confirmed with you and added to the plan to ensure nothing is missed
