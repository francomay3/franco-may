#!/bin/bash

# Batch commit and push script
# Usage: ./batch_commit.sh [batch_size] [commit_message]

BATCH_SIZE=${1:-1000}
COMMIT_MESSAGE=${2:-"Batch commit: file cleanup"}

echo "Starting batch commit with batch size: $BATCH_SIZE"
echo "Commit message: $COMMIT_MESSAGE"
echo "Total files to process: $(git status --porcelain | wc -l)"

# Get all files that need to be committed
git status --porcelain | awk '{print $2}' > /tmp/files_to_commit.txt
TOTAL_FILES=$(wc -l < /tmp/files_to_commit.txt)

echo "Processing $TOTAL_FILES files in batches of $BATCH_SIZE"

BATCH_NUM=1
CURRENT_LINE=1

while [ $CURRENT_LINE -le $TOTAL_FILES ]; do
    echo "Processing batch $BATCH_NUM (files $CURRENT_LINE to $((CURRENT_LINE + BATCH_SIZE - 1)))"
    
    # Extract current batch of files
    sed -n "${CURRENT_LINE},$((CURRENT_LINE + BATCH_SIZE - 1))p" /tmp/files_to_commit.txt > /tmp/current_batch.txt
    
    # Handle both new/modified and deleted files
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            # Check if file exists (new/modified) or is deleted
            if [ -f "$file" ]; then
                git add "$file" 2>/dev/null || echo "Warning: Could not add $file"
            else
                git rm "$file" 2>/dev/null || echo "Warning: Could not remove $file"
            fi
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
            echo "You may need to resolve conflicts or check your remote repository"
            exit 1
        fi
    else
        echo "Error: Failed to commit batch $BATCH_NUM"
        exit 1
    fi
    
    CURRENT_LINE=$((CURRENT_LINE + BATCH_SIZE))
    BATCH_NUM=$((BATCH_NUM + 1))
    
    # Small delay to avoid overwhelming git/remote
    sleep 1
done

# Clean up temporary files
rm -f /tmp/files_to_commit.txt /tmp/current_batch.txt

echo "All batches completed successfully!"
echo "Total batches processed: $((BATCH_NUM - 1))"
