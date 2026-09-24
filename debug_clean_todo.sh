#!/bin/bash

# Read TODO.md
mapfile -t todo_entries < TODO.md

# Create a temporary file for the new TODO.md
NEW_TODO=$(mktemp)

for entry in "${todo_entries[@]}"; do
  # Remove any potential carriage returns
  clean_entry=$(echo "$entry" | tr -d '\r' | xargs)
  
  # If entry is empty, skip
  if [ -z "$clean_entry" ]; then
    continue
  fi

  # Check if the entry (as a header) exists in NOTES.md
  # We look for "## $clean_entry"
  if grep -Fq "## $clean_entry" NOTES.md; then
    echo "Found $clean_entry in NOTES.md, skipping..."
  else
    echo "Not found $clean_entry in NOTES.md, adding to NEW_TODO"
    echo "$clean_entry" >> "$NEW_TODO"
  fi
done

# Move the new TODO.md to the original location
mv "$NEW_TODO" TODO.md
