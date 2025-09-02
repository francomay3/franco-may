#!/bin/bash

# Safe batch commit script that preserves all changes
# Usage: ./safe_batch_commit.sh [batch_size] [commit_message]

BATCH_SIZE=${1:-1000}
COMMIT_MESSAGE=${2:-"Batch commit: file cleanup"}

echo "Starting SAFE batch commit with batch size: $BATCH_SIZE"
echo "Commit message: $COMMIT_MESSAGE"

# First, stage ALL changes to make sure nothing is lost
echo "Staging all changes to preserve them..."
git add -A

# Check how many files are staged
STAGED_FILES=$(git diff --cached --name-only | wc -l)
echo "Total staged files: $STAGED_FILES"

if [ $STAGED_FILES -eq 0 ]; then
    echo "No changes to commit. Exiting."
    exit 0
fi

echo "All changes have been safely staged. Now committing in batches..."

# Create a list of staged files
git diff --cached --name-only > /tmp/staged_files.txt

TOTAL_FILES=$(wc -l < /tmp/staged_files.txt)
echo "Processing $TOTAL_FILES staged files in batches of $BATCH_SIZE"

BATCH_NUM=1
CURRENT_LINE=1

# If we have fewer files than batch size, just commit everything at once
if [ $TOTAL_FILES -le $BATCH_SIZE ]; then
    echo "Total files ($TOTAL_FILES) is less than batch size ($BATCH_SIZE). Committing all at once."
    git commit -m "$COMMIT_MESSAGE"
    if [ $? -eq 0 ]; then
        echo "All files committed successfully"
        git push
        if [ $? -eq 0 ]; then
            echo "Successfully pushed to remote"
        else
            echo "Error: Failed to push. You may need to resolve conflicts."
            exit 1
        fi
    else
        echo "Error: Failed to commit"
        exit 1
    fi
else
    # Process in batches using soft reset approach
    while [ $CURRENT_LINE -le $TOTAL_FILES ]; do
        echo "Processing batch $BATCH_NUM (files $CURRENT_LINE to $((CURRENT_LINE + BATCH_SIZE - 1)))"
        
        # Get current batch of files
        sed -n "${CURRENT_LINE},$((CURRENT_LINE + BATCH_SIZE - 1))p" /tmp/staged_files.txt > /tmp/current_batch.txt
        
        # Reset staging area but keep working directory changes
        git reset HEAD > /dev/null
        
        # Stage only the current batch
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                git add "$file" 2>/dev/null || echo "Warning: Could not stage $file"
            fi
        done < /tmp/current_batch.txt
        
        # Commit the batch
        git commit -m "$COMMIT_MESSAGE - Batch $BATCH_NUM"
        
        if [ $? -eq 0 ]; then
            echo "Batch $BATCH_NUM committed successfully"
            
            # Push the batch
            echo "Pushing batch $BATCH_NUM..."
            git push
            
            if [ $? -eq 0 ]; then
                echo "Batch $BATCH_NUM pushed successfully"
            else
                echo "Error: Failed to push batch $BATCH_NUM"
                echo "Staging remaining files to preserve them..."
                git add -A
                exit 1
            fi
        else
            echo "Error: Failed to commit batch $BATCH_NUM"
            echo "Staging remaining files to preserve them..."
            git add -A
            exit 1
        fi
        
        CURRENT_LINE=$((CURRENT_LINE + BATCH_SIZE))
        BATCH_NUM=$((BATCH_NUM + 1))
        
        # Small delay to avoid overwhelming git/remote
        sleep 1
    done
fi

# Clean up temporary files
rm -f /tmp/staged_files.txt /tmp/current_batch.txt

echo "All batches completed successfully!"
echo "Total batches processed: $((BATCH_NUM - 1))"
