#!/bin/sh

echo "Waiting for Gitea to be ready..."
until curl -s -I localhost:3000 > /dev/null; do
  sleep 5
done

echo "Creating admin user..."
CREATE_ADMIN_COMMAND="gitea admin user create --username $GITEA_ADMIN --password $GITEA_ADMIN_PW --email $GITEA_ADMIN_EMAIL --admin"
docker exec -it -u git gitea $CREATE_ADMIN_COMMAND
