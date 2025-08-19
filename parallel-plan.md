# Parallel Batch Review Restoration Plan

## 🎯 Objective
Enable **concurrent PR reviews** - allowing multiple PRs to be reviewed simultaneously while maintaining the improved AI quality and summary generation from the sequential system.

## 📋 Planning Instructions
- Tasks must be ticked off as completed
- Clear, incremental changes that can be run independently
- Provision for reverting if any task goes wrong
- Success criteria for each phase
- Any omissions/corrections discovered during execution will be confirmed with user and added to plan

## 🔄 Current State
- ✅ Sequential processing working with improved AI quality
- ✅ Enhanced summary generation (500-word AI summaries)
- ✅ Fixed YAML syntax and composite action issues
- ✅ Smart comment posting (summary vs detailed review)
- 📁 Archived actions available for reference

## 📦 Available Archives
- `archive/process-batch/` - Original batch processing action
- `archive/_prepare.yml` - Original prepare workflow
- `archive/_review-batch.yml` - Original batch review workflow
- `archive/_summarize.yml` - Original summarize workflow

---

## 🚀 Phase 1: Foundation & Preparation

### Task 1.1: Analyze Archived Components
- [x] Review `archive/process-batch/` action structure
- [x] Compare with current `process-file-sequential/` action
- [x] Identify reusable components and improvements
- [x] Document differences and migration strategy

**Success Criteria:** Complete analysis document with migration path ✅
**Revert Plan:** No changes made yet

### Task 1.2: Create Enhanced Batch Processing Action
- [x] Create new `process-batch-enhanced/` action
- [x] Incorporate improved AI prompts from sequential system
- [x] Add debug prompt saving functionality
- [x] Include progress tracking and error handling
- [ ] Test action independently

**Success Criteria:** Action processes files correctly with improved AI quality ✅
**Revert Plan:** Delete `process-batch-enhanced/` directory

### Task 1.3: Create Enhanced Consolidation Action
- [x] Create new `consolidate-batches/` action
- [x] Incorporate AI summary generation from `consolidate-reviews/`
- [x] Handle batch artifacts merging
- [x] Generate both detailed and summary outputs
- [ ] Test consolidation independently

**Success Criteria:** Action consolidates batch results with AI summaries ✅
**Revert Plan:** Delete `consolidate-batches/` directory

---

## 🚀 Phase 2: Workflow Restoration

### Task 2.1: Create Enhanced Prepare Workflow
- [x] Create `_prepare-enhanced.yml` workflow
- [x] Incorporate file batching logic from archives
- [x] Add batch size configuration
- [x] Maintain current file filtering and policy handling
- [ ] Test prepare workflow independently

**Success Criteria:** Workflow generates proper batch configuration ✅
**Revert Plan:** Delete `_prepare-enhanced.yml`

### Task 2.2: Create Enhanced Batch Review Workflow
- [x] Create `_review-batch-enhanced.yml` workflow
- [x] Implement matrix strategy for parallel processing within a PR
- [x] Use enhanced batch processing action
- [x] **Remove concurrency controls** to allow multiple PRs to run simultaneously
- [ ] Test batch review workflow independently

**Success Criteria:** Workflow processes batches in parallel successfully AND allows concurrent PR reviews ✅
**Revert Plan:** Delete `_review-batch-enhanced.yml`

### Task 2.3: Create Enhanced Summarize Workflow
- [x] Create `_summarize-enhanced.yml` workflow
- [x] Use enhanced consolidation action
- [x] Maintain current commit and comment logic
- [x] Add batch result merging
- [ ] Test summarize workflow independently

**Success Criteria:** Workflow consolidates and publishes results correctly ✅
**Revert Plan:** Delete `_summarize-enhanced.yml`

### Task 2.4: Create Main Parallel Workflow
- [x] Create `gemini-pr-review-parallel.yml` main workflow
- [x] Orchestrate enhanced prepare, review, and summarize jobs
- [x] Add proper job dependencies and conditions
- [x] Maintain current input/output structure
- [ ] Test complete workflow

**Success Criteria:** Complete workflow runs successfully with parallel processing ✅
**Revert Plan:** Delete `gemini-pr-review-parallel.yml`

---

## 🚀 Phase 3: Integration & Optimization

### Task 3.1: Update Calling Workflow
- [x] Update `pr-review.yml` to use new parallel workflow
- [x] Add batch configuration inputs
- [x] Maintain backward compatibility
- [ ] Test calling workflow

**Success Criteria:** Calling workflow triggers parallel system correctly ✅
**Revert Plan:** Revert `pr-review.yml` to sequential workflow

### Task 3.2: Concurrency & Performance Testing
- [ ] **Test concurrent PR reviews** (create 2-3 PRs simultaneously)
- [ ] Verify no blocking/queuing between different PR reviews
- [ ] Test with various file counts within each PR (1-5, 5-15, 15+ files)
- [ ] Measure performance vs sequential system
- [ ] Optimize batch sizes for single PR processing
- [ ] Document concurrency and performance characteristics

**Success Criteria:** Multiple PRs can run simultaneously without interference
**Revert Plan:** Switch back to sequential workflow

### Task 3.3: Documentation Updates
- [ ] Update `README.md` with parallel system details
- [ ] Update `REVIEW_SETUP.md` with new workflow
- [ ] Update `TESTING_GUIDE.md` with parallel scenarios
- [ ] Document performance expectations

**Success Criteria:** Documentation accurately reflects parallel system
**Revert Plan:** Revert documentation changes

---

## 🎯 Success Criteria - Overall System

### Concurrency (Primary Goal)
- [ ] **Multiple PRs can be reviewed simultaneously** (PR #1 and PR #2 running at same time)
- [ ] **No blocking or queuing** between different PR reviews
- [ ] **Independent execution** - each PR review runs in isolation
- [ ] **Resource isolation** - no shared state conflicts between PR reviews

### Performance
- [ ] Parallel processing shows 2-3x speed improvement for 5+ files within a single PR
- [ ] Maintains AI review quality from sequential system
- [ ] Handles concurrency without conflicts

### Functionality
- [ ] Generates AI summaries (500-word limit)
- [ ] Posts smart comments (summary vs detailed)
- [ ] Commits results to repository
- [ ] Handles all file types and sizes

### Reliability
- [ ] No YAML syntax errors
- [ ] Proper error handling and retries
- [ ] Graceful degradation for failures
- [ ] Maintains existing input/output compatibility

---

## 🔄 Rollback Strategy

### Quick Rollback (if parallel system fails)
1. Revert `pr-review.yml` to use `gemini-pr-review-sequential.yml`
2. Keep sequential system as primary
3. Investigate parallel issues separately

### Complete Rollback (if needed)
1. Delete all enhanced parallel components
2. Restore sequential system as primary
3. Archive parallel attempts for future reference

---

## 📝 Notes
- Sequential system remains as backup throughout process
- Each phase builds on previous phase success
- **Concurrency testing is critical** - must verify multiple PRs can run simultaneously
- Maintain all current improvements (AI quality, summaries, etc.)
- **Key difference from sequential**: No concurrency controls that block multiple PR reviews

**Ready to proceed with Phase 1, Task 1.1 when confirmed.**
