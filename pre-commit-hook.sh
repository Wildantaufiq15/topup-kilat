#!/bin/bash
# Pre-commit hook to prevent secrets from being committed
# Install: cp pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# Patterns that should never be committed
PATTERNS=(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"  # Supabase JWT prefix
    "KEY-OjHNVb3GvAgB8DdReQCcscE6p"
    "SANBOX-lcM0nntF4B7xL0rUFDdCudHIjDY"
    "hjUySZbckJNmtyvWqsya"
    "DLaQ4_anfDuzXmNRzTZkBUtrx1fcHoEaDIUdcZJboOw"
)

# Files that are allowed to have these patterns
ALLOWED_FILES=(
    ".env.local"
    ".env"
    "PROGRESS_REPORT.md"
    "README.md"
)

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

for pattern in "${PATTERNS[@]}"; do
    for file in $STAGED_FILES; do
        # Skip allowed files
        skip=0
        for allowed in "${ALLOWED_FILES[@]}"; do
            if [[ "$file" == *"$allowed"* ]]; then
                skip=1
                break
            fi
        done

        if [[ $skip -eq 1 ]]; then
            continue
        fi

        # Check if file contains the pattern
        if grep -q "$pattern" "$file" 2>/dev/null; then
            echo "❌ ERROR: Possible secret detected in $file"
            echo "   Pattern: $pattern"
            echo ""
            echo "If this is a false positive, add the file to ALLOWED_FILES in pre-commit-hook.sh"
            echo "Or use: git commit --no-verify (NOT recommended)"
            exit 1
        fi
    done
done

echo "✅ No secrets detected!"
exit 0
