# AI Review System Testing Guide

## Overview
This guide provides testing scenarios and performance expectations for the new sequential AI review system.

## Performance Expectations

### Typical PR Performance (Sequential System)
- **1-3 files**: ~30-60 seconds total
- **5-10 files**: ~2-5 minutes total  
- **15+ files**: ~5-10 minutes total

### Comparison with Old Batching System
- **Sequential**: Better for typical PRs (2-10 files)
- **Batching**: Better for very large PRs (20+ files)
- **Overhead**: Sequential has minimal overhead, batching has parallel coordination overhead

## Testing Scenarios

### Scenario 1: Small PR (1-3 files)
**Purpose**: Test basic functionality and quick response
**Expected Duration**: 30-60 seconds
**Success Criteria**:
- [ ] All files processed successfully
- [ ] Progress tracking visible in logs
- [ ] Consolidated output generated
- [ ] PR comment posted (if enabled)
- [ ] Files committed to repository (if enabled)

**Test Steps**:
1. Create PR with 1-3 small files
2. Trigger review workflow
3. Monitor progress in logs
4. Verify output files
5. Check PR comment and committed files

### Scenario 2: Medium PR (5-10 files)
**Purpose**: Test typical use case performance
**Expected Duration**: 2-5 minutes
**Success Criteria**:
- [ ] All files processed sequentially
- [ ] Clear progress indicators
- [ ] No timeout issues
- [ ] Consolidated output complete
- [ ] Performance within expected range

**Test Steps**:
1. Create PR with 5-10 files of varying sizes
2. Monitor sequential processing
3. Check for rate limiting issues
4. Verify final output quality
5. Measure total duration

### Scenario 3: Large PR (15+ files)
**Purpose**: Test system limits and error handling
**Expected Duration**: 5-10 minutes
**Success Criteria**:
- [ ] System handles large PRs gracefully
- [ ] Individual file failures don't stop processing
- [ ] Summary includes failure information
- [ ] Performance degradation is acceptable
- [ ] No memory or timeout issues

**Test Steps**:
1. Create PR with 15+ files
2. Monitor resource usage
3. Check error handling for failed files
4. Verify summary includes all results
5. Test with mixed file types

## Error Testing

### File Processing Failures
**Test**: Include files that might cause processing issues
**Expected**: Individual failures logged, processing continues
**Success**: Other files still processed, summary shows failures

### API Rate Limiting
**Test**: Process many files quickly
**Expected**: Built-in delays prevent rate limiting
**Success**: All files processed without API errors

### Invalid File Types
**Test**: Include binary files, very large files
**Expected**: Proper handling and exclusion
**Success**: Only appropriate files processed

## Output Validation

### File Structure
- [ ] `DETAILED-REVIEW.md` contains all file reviews
- [ ] `SUMMARY.md` contains statistics and file list
- [ ] File paths are correctly displayed
- [ ] Review content is properly formatted

### Content Quality
- [ ] AI reviews are focused on specific files
- [ ] No hallucination about other files
- [ ] Reviews provide actionable feedback
- [ ] Technical accuracy is maintained

### Integration
- [ ] PR comments are properly formatted
- [ ] Committed files are in correct location
- [ ] Artifacts are downloadable
- [ ] Links and references work correctly

## Performance Monitoring

### Key Metrics to Track
- **Total Duration**: End-to-end workflow time
- **File Processing Time**: Average time per file
- **API Call Success Rate**: Percentage of successful Gemini calls
- **Error Rate**: Percentage of failed file reviews
- **Resource Usage**: Memory and CPU utilization

### Baseline Expectations
- **Sequential Processing**: ~10-20 seconds per file
- **API Response Time**: ~2-5 seconds per call
- **Consolidation Time**: ~5-10 seconds total
- **Total Overhead**: ~30-60 seconds for setup/teardown

## Regression Testing

### Compare with Old System
- [ ] Same functionality preserved
- [ ] Output quality maintained or improved
- [ ] Performance acceptable for typical PRs
- [ ] Error handling improved
- [ ] Debugging capabilities enhanced

### Migration Testing
- [ ] Old calling workflows updated correctly
- [ ] New parameters work as expected
- [ ] Output structure changes handled
- [ ] No breaking changes for users

## Automated Testing

### Workflow Validation
```yaml
# Test workflow structure
- Validate YAML syntax
- Check action references
- Verify input parameters
- Test conditional logic
```

### Action Testing
```bash
# Test individual actions
- process-file-sequential: Test single file processing
- consolidate-reviews: Test file combination
- precheck: Test review triggering logic
```

## Manual Testing Checklist

### Setup Testing
- [ ] Secrets configured correctly
- [ ] Workflow triggers on PR events
- [ ] File exclusions work properly
- [ ] Policy files are located correctly

### Execution Testing
- [ ] Progress tracking is visible
- [ ] Error messages are clear
- [ ] Timeouts are appropriate
- [ ] Rate limiting is handled

### Output Testing
- [ ] Files are generated correctly
- [ ] Content is properly formatted
- [ ] Links work as expected
- [ ] Integration points function

## Troubleshooting Guide

### Common Issues
1. **Workflow not triggering**: Check PR event types and file exclusions
2. **API errors**: Verify Gemini API key and rate limits
3. **Missing files**: Check file exclusion patterns
4. **Timeout issues**: Review file size limits and processing time
5. **Output issues**: Verify consolidation action and file paths

### Debug Steps
1. Check workflow logs for error messages
2. Verify input parameters and secrets
3. Test individual actions in isolation
4. Review file processing logs
5. Check API response times and errors

## Success Criteria

### Functional Success
- [ ] All files processed successfully
- [ ] Output quality maintained
- [ ] Error handling works properly
- [ ] Integration points function correctly

### Performance Success
- [ ] Typical PRs complete within expected time
- [ ] No significant performance regression
- [ ] Resource usage is reasonable
- [ ] Scalability is maintained

### User Experience Success
- [ ] Progress tracking is clear
- [ ] Error messages are helpful
- [ ] Output is well-organized
- [ ] Migration is smooth for users
