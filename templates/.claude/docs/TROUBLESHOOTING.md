# Claude Code Sub-Agent Collective - Troubleshooting Guide

## Common Installation Issues

### Template Files Not Found
**Problem**: Warning messages about missing template files during installation.
**Solution**: 
1. Ensure you're using the latest version: `npx claude-code-collective@latest`
2. Clear npm cache: `npm cache clean --force`
3. Try installing with `--force` flag: `npx claude-code-collective --force`

### Permission Errors
**Problem**: EACCES errors when installing hooks or files.
**Solution**:
1. Run with appropriate permissions
2. Check directory ownership: `ls -la .claude/`
3. Fix permissions: `chmod +x .claude/hooks/*.sh`

### Hook Execution Failures
**Problem**: Hooks fail to execute or show permission denied.
**Solution**:
1. Make hooks executable: `chmod +x .claude/hooks/*.sh`
2. Check shell compatibility (bash required)
3. Verify hook syntax: `bash -n .claude/hooks/directive-enforcer.sh`

## Agent System Issues

### Agent Not Found
**Problem**: Agent files exist but system doesn't recognize them.
**Solution**:
1. Check file extension (should be `.md`)
2. Verify agent metadata format
3. Restart Claude Code to refresh agent registry

### Routing Failures
**Problem**: Requests don't route to expected agents.
**Solution**:
1. Check CLAUDE.md routing patterns
2. Verify agent capabilities in metadata
3. Enable debug logging: add `--verbose` to commands

### Test Failures
**Problem**: TDD handoff tests fail unexpectedly.
**Solution**:
1. Run tests individually: `npm test -- --testNamePattern="specific test"`
2. Check contract definitions in test files
3. Verify agent implementations match contracts

## Configuration Issues

### Settings Not Applied
**Problem**: Changes to `.claude/settings.json` don't take effect.
**Solution**:
1. Restart Claude Code completely
2. Check JSON syntax: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json'))"`
3. Verify hook configuration syntax

### Metrics Collection Disabled
**Problem**: Research metrics aren't being collected.
**Solution**:
1. Enable in research.config.json: `"enabled": true`
2. Check storage permissions in metrics directory
3. Verify MetricsCollector initialization

## Performance Issues

### Slow Agent Spawning
**Problem**: Agent creation takes longer than expected.
**Solution**:
1. Check JIT loading configuration
2. Reduce template complexity
3. Monitor resource usage during spawning

### High Memory Usage
**Problem**: System uses excessive memory during operations.
**Solution**:
1. Adjust cleanup thresholds in AgentRegistry
2. Enable periodic garbage collection
3. Limit concurrent agent operations

## Debug Mode

Enable verbose logging for detailed troubleshooting:

```bash
# Set debug environment
export DEBUG=claude-collective:*

# Run with verbose output
npx claude-code-collective --verbose --debug
```

## Getting Help

1. **Documentation**: Check `.claude/docs/README.md` for system overview
2. **Test Results**: Run `npm test` in `.claude-collective/` for system health
3. **Log Files**: Check `.claude-collective/logs/` for detailed error logs
4. **GitHub Issues**: Report bugs at the project repository

## System Validation

Run the built-in validation to check system health:

```bash
cd .claude-collective
npm test
npm run validate
```

Expected output: All tests passing, no validation errors.

## Reset Instructions

To completely reset the collective system:

```bash
# Remove all collective files
rm -rf .claude/agents/*
rm -rf .claude/hooks/*
rm -rf .claude-collective/

# Reinstall
npx claude-code-collective --force
```

**Warning**: This will remove all customizations and configurations.