#!/bin/bash
# test-automated.sh - Automated backup testing

set -e

echo "🧪 Setting up automated backup testing environment..."

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

TEST_BASE="$NPM_TESTS_DIR/ccc-automated"
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
echo "✅ Automated testing environment ready!"
echo ""
echo "🎯 You are now in: $(pwd)"

# Step 4: Run initial install
echo "🚀 Step 1: Initial install"
npx "$PACKAGE_NAME" init --yes --force

# Step 5: Modify a hook file
echo "🔧 Step 2: Modifying a hook file to test backup"
echo "#!/bin/bash" > .claude/hooks/test-driven-handoff.sh
echo "# Modified content for testing backup" >> .claude/hooks/test-driven-handoff.sh

# Step 6: Run install again to test backup
echo "🔄 Step 3: Reinstalling to test backup functionality"
npx "$PACKAGE_NAME" init --yes --force

# Step 7: Check if backup was created
echo "🔍 Step 4: Checking for backup files..."
if [ -d ".claude-backups" ]; then
    echo "✅ SUCCESS: .claude-backups directory created!"
    ls -la .claude-backups/
    echo ""
    echo "📁 Backup contents:"
    find .claude-backups -type f -exec ls -la {} \;
else
    echo "❌ FAILURE: No .claude-backups directory found!"
fi

echo ""
echo "🧹 When done, run: cd ../../taskmaster-agent-claude-code && ./scripts/cleanup-tests.sh"