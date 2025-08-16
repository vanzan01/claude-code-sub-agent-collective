#!/bin/bash
# test-manual.sh - Create test environment for manual interactive testing

set -e

echo "🧪 Setting up manual testing environment..."

# Get package name and version from package.json
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

echo "📦 Package: $PACKAGE_NAME v$PACKAGE_VERSION"

# Step 1: Create package
echo "📦 Creating package tarball..."
npm pack

TARBALL_NAME="${PACKAGE_NAME}-${PACKAGE_VERSION}.tgz"
echo "✅ Created: $TARBALL_NAME"

# Step 2: Create npm-tests directory and find next available test directory
NPM_TESTS_DIR="../npm-tests"
if [ ! -d "$NPM_TESTS_DIR" ]; then
    echo "📁 Creating npm-tests directory: $NPM_TESTS_DIR"
    mkdir "$NPM_TESTS_DIR"
fi

TEST_BASE="$NPM_TESTS_DIR/ccc-manual"
TEST_DIR="${TEST_BASE}-v1"
COUNTER=1

while [ -d "$TEST_DIR" ]; do
    COUNTER=$((COUNTER + 1))
    TEST_DIR="${TEST_BASE}-v${COUNTER}"
done

echo "📁 Creating test directory: $TEST_DIR"
mkdir "$TEST_DIR"

# Step 3: Install package
echo "📥 Installing package in test directory..."
cd "$TEST_DIR"

# Calculate correct path to tarball based on our new location
TARBALL_PATH="../../taskmaster-agent-claude-code/$TARBALL_NAME"
npm install "$TARBALL_PATH"

echo ""
echo "✅ Manual testing environment ready!"
echo ""
echo "🎯 You are now in: $(pwd)"
echo "📦 Package version check:"
npx "$PACKAGE_NAME" --version
echo ""
echo "🧪 Manual testing commands:"
echo "   npx $PACKAGE_NAME init            # Interactive installation"
echo "   npx $PACKAGE_NAME init --minimal  # Minimal installation"
echo "   npx $PACKAGE_NAME status          # Check status"
echo "   npx $PACKAGE_NAME validate        # Validate installation"
echo "   npx $PACKAGE_NAME --help          # Help information"
echo ""
echo "🧹 When done testing, run: cd ../../taskmaster-agent-claude-code && ./scripts/cleanup-tests.sh"