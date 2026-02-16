#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    error "package.json not found in current directory"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    error "jq is required but not installed"
    exit 1
fi

# Extract version from package.json
VERSION=$(jq -r .version package.json)
if [[ -z "$VERSION" || "$VERSION" == "null" ]]; then
    error "Could not extract version from package.json"
    exit 1
fi

log "Preparing release for version: $VERSION"

# Check if we're on the master branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "master" ]]; then
    warn "You are not on the master branch (currently on: $CURRENT_BRANCH)"
    read -p "Continue with release from $CURRENT_BRANCH? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Release cancelled"
        exit 0
    fi
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    warn "Working directory has uncommitted changes:"
    git status --short
    read -p "Continue with release? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Release cancelled"
        exit 0
    fi
fi

# Check if tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    error "Tag $VERSION already exists"
    exit 1
fi

# Create release commit
log "Creating release commit..."
git add package.json package-lock.json
STAGED_FILES=$(git diff --cached --name-only)
for FILE in $STAGED_FILES; do
    if [[ "$FILE" != "package.json" && "$FILE" != "package-lock.json" ]]; then
        error "Release commit can only include package.json and package-lock.json (found: $FILE)"
        exit 1
    fi
done
if git diff --cached --quiet; then
    warn "No changes to commit for package.json or package-lock.json"
else
    git commit -m "RELEASE $VERSION"
    success "Release commit created"
fi

# Create and push tag
log "Creating tag $VERSION..."
git tag -a "$VERSION" -m "Release $VERSION"
success "Tag $VERSION created"

log "Release process completed!"
