#!/bin/sh
# block-destructive-commands.sh
# PreToolUse Hook - Block destructive commands before execution
# Exit code 2 = BLOCK execution, Exit code 0 = ALLOW execution

# Set up logging
LOG_FILE="/tmp/blocked-commands.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Read JSON input from stdin
INPUT_JSON=$(cat)

# Parse JSON using robust extraction (similar to test-driven-handoff.sh pattern)
TOOL_NAME=""
COMMAND=""

# Try direct jq extraction first
if command -v jq >/dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_name' 2>/dev/null)
    COMMAND=$(echo "$INPUT_JSON" | jq -r '.tool_input.command // ""' 2>/dev/null)
fi

# Fallback to grep/sed if jq fails or returns null
if [ -z "$TOOL_NAME" ] || [ "$TOOL_NAME" = "null" ]; then
    TOOL_NAME=$(echo "$INPUT_JSON" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$COMMAND" ] || [ "$COMMAND" = "null" ]; then
    COMMAND=$(echo "$INPUT_JSON" | grep -o '"command":"[^"]*"' | sed 's/.*"command":"\([^"]*\)".*/\1/')
fi

# Only check Bash tool commands
if [ "$TOOL_NAME" != "Bash" ]; then
    log "Skipping non-Bash tool: $TOOL_NAME"
    exit 0
fi

log "Checking command for destructive patterns: $COMMAND"

# Function to block command with reason
block_command() {
    local reason="$1"
    local command="$2"
    
    echo "🚫 BLOCKED: $reason" >&2
    echo "Command: $command" >&2
    echo "Use manual approval or sandbox environment for dangerous operations" >&2
    
    log "BLOCKED: $reason - Command: $command"
    exit 2  # Claude Code convention for blocking
}

# Check for filesystem destruction patterns
check_filesystem_destruction() {
    local cmd="$1"
    
    # Recursive force deletion
    if echo "$cmd" | grep -qiE "rm\s+.*-.*r.*f|rm\s+.*-.*f.*r"; then
        block_command "recursive force deletion (rm -rf)" "$cmd"
    fi
    
    # Recursive deletion without confirmation
    if echo "$cmd" | grep -qiE "rm\s+.*-r\s+"; then
        block_command "recursive deletion without confirmation" "$cmd"
    fi
    
    # Format commands
    if echo "$cmd" | grep -qiE "mkfs\.|format\s+"; then
        block_command "filesystem formatting command" "$cmd"
    fi
    
    # Direct device writing
    if echo "$cmd" | grep -qiE "dd\s+.*of=/dev/"; then
        block_command "direct device writing with dd" "$cmd"
    fi
    
    # System directory modifications
    if echo "$cmd" | grep -qE ">\s*/etc/|>\s*/boot/|>\s*/sys/|>\s*/proc/"; then
        block_command "writing to critical system directories" "$cmd"
    fi
}

# Check for git destructive operations
check_git_destruction() {
    local cmd="$1"
    
    # Hard reset (loses uncommitted changes)
    if echo "$cmd" | grep -qiE "git\s+reset\s+--hard"; then
        block_command "git hard reset loses uncommitted changes" "$cmd"
    fi
    
    # Force clean working directory
    if echo "$cmd" | grep -qiE "git\s+clean\s+.*-.*f.*d|git\s+clean\s+.*-.*d.*f"; then
        block_command "git force clean removes untracked files" "$cmd"
    fi
    
    # Force push (can overwrite remote history)
    if echo "$cmd" | grep -qiE "git\s+push\s+.*--force"; then
        block_command "git force push can overwrite remote history" "$cmd"
    fi
    
    # Rebase with force
    if echo "$cmd" | grep -qiE "git\s+rebase\s+.*--force"; then
        block_command "git force rebase can lose commits" "$cmd"
    fi
}

# Check for package manager destructive operations
check_package_manager_destruction() {
    local cmd="$1"
    
    # npm create commands (can overwrite directories)
    if echo "$cmd" | grep -qiE "npm\s+create\s+"; then
        block_command "npm create can overwrite existing directories" "$cmd"
    fi
    
    # npx create commands
    if echo "$cmd" | grep -qiE "npx\s+create-"; then
        block_command "npx create commands can overwrite files" "$cmd"
    fi
    
    # yarn create commands
    if echo "$cmd" | grep -qiE "yarn\s+create\s+"; then
        block_command "yarn create can overwrite directories" "$cmd"
    fi
    
    # pnpm create commands
    if echo "$cmd" | grep -qiE "pnpm\s+create\s+"; then
        block_command "pnpm create can overwrite directories" "$cmd"
    fi
    
    # Force package installations (can break dependencies)
    if echo "$cmd" | grep -qiE "npm\s+install\s+.*--force"; then
        block_command "npm install --force can break dependencies" "$cmd"
    fi
    
    # pip force reinstall
    if echo "$cmd" | grep -qiE "pip\s+install\s+.*--force-reinstall"; then
        block_command "pip force reinstall can break dependencies" "$cmd"
    fi
}

# Check for database destruction
check_database_destruction() {
    local cmd="$1"
    
    # Drop database/table commands
    if echo "$cmd" | grep -qiE "drop\s+(database|table|schema)"; then
        block_command "database/table/schema drop command" "$cmd"
    fi
    
    # Truncate table commands
    if echo "$cmd" | grep -qiE "truncate\s+table"; then
        block_command "table truncation command" "$cmd"
    fi
    
    # Dangerous DELETE statements
    if echo "$cmd" | grep -qiE "delete\s+from.*where\s+1\s*=\s*1"; then
        block_command "delete all rows statement" "$cmd"
    fi
}

# Check for docker/container destruction
check_container_destruction() {
    local cmd="$1"
    
    # Docker system prune
    if echo "$cmd" | grep -qiE "docker\s+system\s+prune\s+.*-f"; then
        block_command "docker force system prune removes all unused data" "$cmd"
    fi
    
    # Docker remove all containers
    if echo "$cmd" | grep -qiE "docker\s+rm\s+.*\$\(docker\s+ps"; then
        block_command "docker remove all containers command" "$cmd"
    fi
    
    # Kubernetes force delete
    if echo "$cmd" | grep -qiE "kubectl\s+delete\s+.*--force"; then
        block_command "kubectl force delete can cause data loss" "$cmd"
    fi
}

# Check for network/download risks (Anthropic recommends blocking curl/wget)
check_network_risks() {
    local cmd="$1"
    
    # curl downloads to sensitive locations
    if echo "$cmd" | grep -qiE "curl\s+.*>\s*/etc/|curl\s+.*>\s*/usr/|curl\s+.*>\s*/bin/"; then
        block_command "curl download to system directories" "$cmd"
    fi
    
    # wget downloads to sensitive locations  
    if echo "$cmd" | grep -qiE "wget\s+.*-O\s*/etc/|wget\s+.*-O\s*/usr/|wget\s+.*-O\s*/bin/"; then
        block_command "wget download to system directories" "$cmd"
    fi
    
    # Piping untrusted content directly (Anthropic warns against this)
    if echo "$cmd" | grep -qiE "curl\s+.*\|\s*(sh|bash|zsh)|wget\s+.*\|\s*(sh|bash|zsh)"; then
        block_command "piping downloaded content to shell is dangerous" "$cmd"
    fi
}

# Check for process/system destruction
check_system_destruction() {
    local cmd="$1"
    
    # Kill all processes
    if echo "$cmd" | grep -qiE "killall\s+.*-9"; then
        block_command "killall with SIGKILL can cause data loss" "$cmd"
    fi
    
    # System shutdown/reboot
    if echo "$cmd" | grep -qiE "shutdown\s+|reboot\s+|halt\s+"; then
        block_command "system shutdown/reboot command" "$cmd"
    fi
    
    # chmod 777 on system directories
    if echo "$cmd" | grep -qE "chmod\s+777\s+/"; then
        block_command "chmod 777 on system directories is dangerous" "$cmd"
    fi
    
    # Suspicious bash with encoded content
    if echo "$cmd" | grep -qiE "bash\s+-c\s+.*base64|sh\s+-c\s+.*base64"; then
        block_command "suspicious encoded bash execution" "$cmd"
    fi
}

# Run all destructive command checks
check_filesystem_destruction "$COMMAND"
check_git_destruction "$COMMAND"
check_package_manager_destruction "$COMMAND" 
check_database_destruction "$COMMAND"
check_container_destruction "$COMMAND"
check_network_risks "$COMMAND"
check_system_destruction "$COMMAND"

# If we get here, command is safe to execute
log "ALLOWED: $COMMAND"
exit 0