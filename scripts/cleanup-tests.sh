#!/bin/bash
# cleanup-tests.sh - Clean up test directories and tarballs

echo "🧹 Cleaning up test files..."

# Remove tarballs from current directory
if ls claude-code-collective-*.tgz 1> /dev/null 2>&1; then
    rm claude-code-collective-*.tgz
    echo "✅ Removed tarball files"
else
    echo "ℹ️  No tarball files to remove"
fi

# Find and list test directories
TEST_DIRS=$(find .. -maxdepth 1 -name "ccc-testing-v*" -type d 2>/dev/null || true)

if [ -n "$TEST_DIRS" ]; then
    echo "📁 Found test directories:"
    echo "$TEST_DIRS" | while read dir; do
        echo "  - $dir"
    done
    echo ""
    
    read -p "🗑️  Remove all test directories? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$TEST_DIRS" | while read dir; do
            rm -rf "$dir"
            echo "✅ Removed: $dir"
        done
        echo "🎉 All test directories cleaned up!"
    else
        echo "ℹ️  Test directories preserved"
    fi
else
    echo "ℹ️  No test directories found"
fi

echo "✨ Cleanup complete!"