#!/bin/sh

# Start Docker Compose
docker-compose up -d

echo "Running all scripts in ./gitea-scripts directory..."
for script in ./gitea-scripts/*; do
  if [ -x "$script" ]; then
    echo "Executing: $script"
    "$script"
  else
    echo "Skipping: $script (not executable)"
  fi
done

echo "All scripts executed!"
