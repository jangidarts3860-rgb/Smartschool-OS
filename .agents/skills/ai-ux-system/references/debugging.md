# Systematic Debugging Principles

Use this file as a reference for investigating bugs, test failures, or unexpected UI behaviors. 

## The Iron Law of Debugging
Seek the root cause before attempting fixes. Symptom fixes often create new bugs.

## Recommended Debugging Phases

### Phase 1: Root Cause Investigation
Before proposing a fix, consider:
1. **Read Error Messages Carefully**: Read stack traces completely, noting file paths and error codes.
2. **Reproduce Consistently**: Identify the exact steps to trigger the bug. If it's not reproducible, gather more data.
3. **Check Recent Changes**: Git diffs, new dependencies, and config changes are prime suspects.
4. **Gather Evidence in Multi-Component Systems**: Add diagnostic instrumentation at component boundaries (e.g. logging data in and out) to locate the failure point.
5. **Trace Data Flow**: Trace backward from where the bad value appears to where it originated.

### Phase 2: Pattern Analysis
Find the pattern before fixing:
1. Find working examples in the same codebase.
2. Compare the broken code against reference implementations.
3. Identify differences, however small.
4. Understand dependencies, environmental assumptions, and configuration.

### Phase 3: Hypothesis and Testing
1. Form a single, specific hypothesis ("I think X is the root cause because Y").
2. Make the smallest possible change to test the hypothesis (one variable at a time).
3. Verify if the change worked before continuing.

### Phase 4: Implementation
1. **Create a Failing Test Case** (if possible) before implementing the fix.
2. Implement a single fix addressing the root cause. Avoid bundled refactoring.
3. Verify the fix against the test case and ensure no side effects occurred.
4. If multiple fixes fail, step back and question the architecture. The pattern itself might be fundamentally flawed.

## Red Flags (Indicators to reconsider your approach)
- "Quick fix for now, investigate later"
- "Add multiple changes, run tests"
- Each fix reveals a new problem in a different place (Architectural smell).

*Note: This is a guideline for complex issues. Simple, obvious typos do not strictly require this rigorous process, but they do require validation.*
