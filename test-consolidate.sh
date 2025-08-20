#!/bin/bash

# Test script to verify consolidate-batches action works
set -euo pipefail

echo "Creating test batch directory structure..."

# Create test batch directory
mkdir -p review-batch-0

# Create a dummy review file
cat > review-batch-0/test_file.cs.md << 'EOF'
# Review for test_file.cs

## Issues Found
- No issues found in this test file

## Recommendations
- This is a test file for verification purposes
EOF

# Create summary.json
cat > review-batch-0/summary.json << 'EOF'
{
  "files_reviewed": 1,
  "issues_found": 0,
  "recommendations": 0
}
EOF

echo "Test directory structure created:"
ls -la review-batch-0/

echo "Running consolidate-batches logic..."

# Simulate the consolidate-batches logic
PR_NUM="185"

# Create detailed review
echo "# AI Code Review - Detailed Report for PR #$PR_NUM" > consolidate_review.md
echo "" >> consolidate_review.md
echo "*Generated on $(date -u '+%Y-%m-%d %H:%M:%S UTC')*" >> consolidate_review.md
echo "" >> consolidate_review.md

# Check if we have batch artifacts
if ls review-batch-* 1> /dev/null 2>&1; then
  echo "Found batch results, consolidating individual reviews..."
  
  echo "## 📊 Review Summary" >> consolidate_review.md
  echo "" >> consolidate_review.md
  
  # Count total files reviewed
  TOTAL_FILES=0
  BATCH_COUNT=0
  
  # Process each batch artifact
  for batch_dir in review-batch-*; do
    if [ -d "$batch_dir" ]; then
      BATCH_COUNT=$((BATCH_COUNT + 1))
      echo "Processing batch: $batch_dir"
      
      # Count files in this batch - check both structures
      BATCH_FILES=0
      if [ -d "$batch_dir/reviews" ]; then
        BATCH_FILES=$(find "$batch_dir/reviews" -name "*.md" -type f | grep -v summary.json | wc -l)
      else
        BATCH_FILES=$(find "$batch_dir" -name "*.md" -type f | grep -v summary.json | wc -l)
      fi
      TOTAL_FILES=$((TOTAL_FILES + BATCH_FILES))
      echo "- **Batch $BATCH_COUNT:** $BATCH_FILES files reviewed" >> consolidate_review.md
    fi
  done
  
  echo "" >> consolidate_review.md
  echo "### Overall Statistics" >> consolidate_review.md
  echo "- **Total batches:** $BATCH_COUNT" >> consolidate_review.md
  echo "- **Total files reviewed:** $TOTAL_FILES" >> consolidate_review.md
  echo "" >> consolidate_review.md
  
  # Combine all individual file reviews
  echo "## 📝 File Reviews" >> consolidate_review.md
  echo "" >> consolidate_review.md
  
  # Process each batch directory and accumulate all reviews
  for batch_dir in review-batch-*; do
    if [ -d "$batch_dir" ]; then
      echo "### Batch $batch_dir" >> consolidate_review.md
      echo "" >> consolidate_review.md
      
      # Determine the path to search for review files
      SEARCH_PATH="$batch_dir"
      if [ -d "$batch_dir/reviews" ]; then
        SEARCH_PATH="$batch_dir/reviews"
      fi
      
      # Process each review file in the batch and add to detailed review
      for review_file in $(find "$SEARCH_PATH" -name "*.md" -type f | grep -v summary.json | sort); do
        if [ -f "$review_file" ]; then
          echo "Processing: $review_file"
          
          # Extract filename and create a clear heading
          filename=$(basename "$review_file" .md)
          original_path=$(echo "$filename" | sed 's/_/\//g' | sed 's/^\.\///')
          
          # Add file heading before the review content
          echo "### 📄 $original_path" >> consolidate_review.md
          echo "" >> consolidate_review.md
          
          # Add the review content
          cat "$review_file" >> consolidate_review.md
          echo "" >> consolidate_review.md
          echo "---" >> consolidate_review.md
          echo "" >> consolidate_review.md
        fi
      done
    fi
  done
  
  # Create summary
  echo "# AI Code Review - Summary for PR #$PR_NUM" > consolidate_summary.md
  echo "" >> consolidate_summary.md
  echo "*Generated on $(date -u '+%Y-%m-%d %H:%M:%S UTC')*" >> consolidate_summary.md
  echo "" >> consolidate_summary.md
  echo "## 📊 Review Statistics" >> consolidate_summary.md
  echo "" >> consolidate_summary.md
  echo "- **Total batches:** $BATCH_COUNT" >> consolidate_summary.md
  echo "- **Total files reviewed:** $TOTAL_FILES" >> consolidate_summary.md
  echo "" >> consolidate_summary.md
  echo "## 🎯 Executive Summary" >> consolidate_summary.md
  echo "" >> consolidate_summary.md
  echo "Test review completed successfully. No issues found in the test file." >> consolidate_summary.md
  
else
  echo "No batch results found." >> consolidate_review.md
  echo "No batch results found." >> consolidate_summary.md
fi

echo "🎉 Test consolidation complete!"
echo "📁 Detailed review: consolidate_review.md"
echo "📋 Summary: consolidate_summary.md"

echo ""
echo "=== CONSOLIDATE_REVIEW.MD ==="
cat consolidate_review.md

echo ""
echo "=== CONSOLIDATE_SUMMARY.MD ==="
cat consolidate_summary.md
