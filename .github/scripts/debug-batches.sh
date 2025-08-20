#!/bin/bash

echo "🔍 Debug: Starting batches output analysis..."

# Safely output batches content
echo "Batches output: $1"

# Safely write to temp file with fallback
echo "$1" > /tmp/batches.json || echo "{}" > /tmp/batches.json

# Safely check if jq is available
if ! command -v jq &> /dev/null; then
  echo "⚠️  WARNING: jq not available, skipping JSON analysis"
  echo "Batches length: unknown (jq not available)"
  echo "First batch: unknown (jq not available)"
  exit 0
fi

# Safely analyze JSON with error handling
echo "Batches length: $(jq -r 'length // 0' /tmp/batches.json 2>/dev/null || echo 'error')"
echo "First batch: $(jq -r '.[0] // "none"' /tmp/batches.json 2>/dev/null || echo 'error')"

echo "✅ Debug: Batches output analysis completed"
