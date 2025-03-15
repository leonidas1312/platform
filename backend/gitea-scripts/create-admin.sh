#!/bin/sh

sudo setcap 'cap_net_bind_service=+ep' ./gitea

echo "Waiting for Gitea to be ready..."
until curl -s -I localhost:3000 > /dev/null; do
  sleep 5
done

echo "Creating admin user..."
docker exec -it -u git gitea gitea admin user create \
  --username papaflesas \
  --password "aeraPateraLewKalimera" \
  --email "admin@example.com" \
  --admin

echo "Admin user created successfully!"
