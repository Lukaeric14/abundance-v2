#!/bin/bash

# Git Workflow Shortcuts
# Usage: ./scripts/git-workflows.sh [command] [optional-message]

case "$1" in
  "save")
    # Add, commit with timestamp, and push
    git add .
    if [ -n "$2" ]; then
      git commit -m "$2"
    else
      git commit -m "Save progress: $(date '+%Y-%m-%d %H:%M')"
    fi
    git push
    echo "✅ Changes saved and pushed to remote"
    ;;

  "quick")
    # Quick add, commit, and push
    git add .
    if [ -n "$2" ]; then
      git commit -m "$2"
    else
      git commit -m "Quick update"
    fi
    git push
    echo "✅ Quick update pushed"
    ;;

  "sync")
    # Pull, add, commit, and push
    echo "🔄 Pulling latest changes..."
    git pull
    git add .
    if [ -n "$2" ]; then
      git commit -m "$2"
    else
      git commit -m "Sync: $(date '+%Y-%m-%d %H:%M')"
    fi
    git push
    echo "✅ Synced with remote"
    ;;

  "deploy")
    # Build, add, commit, and push
    echo "🏗️  Building project..."
    npm run build
    if [ $? -eq 0 ]; then
      git add .
      git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
      git push
      echo "🚀 Deployed successfully"
    else
      echo "❌ Build failed, deployment cancelled"
    fi
    ;;

  *)
    echo "Git Workflow Shortcuts:"
    echo "  ./scripts/git-workflows.sh save [message]    - Add, commit, push with timestamp"
    echo "  ./scripts/git-workflows.sh quick [message]   - Quick add, commit, push"
    echo "  ./scripts/git-workflows.sh sync [message]    - Pull, add, commit, push"
    echo "  ./scripts/git-workflows.sh deploy           - Build, add, commit, push"
    echo ""
    echo "Examples:"
    echo "  ./scripts/git-workflows.sh save \"Added login page\""
    echo "  ./scripts/git-workflows.sh quick"
    echo "  ./scripts/git-workflows.sh sync \"Fixed styling issues\""
    ;;
esac