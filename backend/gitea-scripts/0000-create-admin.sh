#!/bin/sh

main() {
  echo "Waiting for Gitea to be ready..."
  until curl -s -I localhost:3000 > /dev/null; do
    sleep 5
  done

  ENV_FILE=".env"

  echo "Creating admin user..."
  CREATE_ADMIN_COMMAND="gitea admin user create --username $GITEA_ADMIN --password $GITEA_ADMIN_PW --email $GITEA_ADMIN_EMAIL --admin --must-change-password=false"
  CREATE_ADMIN_OUTPUT="$(docker exec -u git gitea sh -c "$CREATE_ADMIN_COMMAND" 2>&1)"

  echo "$CREATE_ADMIN_OUTPUT"

  # If user exists, skip generating token (return)
  echo "$CREATE_ADMIN_OUTPUT" | grep -qi "user already exists"
  if [ $? -eq 0 ]; then
    echo "Admin user already exists. Using token from .env..."

    # Parse the token from .env
    ADMIN_TOKEN=$(grep GITEA_ADMIN_TOKEN_RECEIVED "$ENV_FILE" | cut -d '=' -f2)
    if [ -z "$ADMIN_TOKEN" ]; then
      echo "No token found in .env. Exiting..."
      exit 1
    fi

    echo "Waiting for backend server to be ready..."
    until curl -s -I localhost:4000 > /dev/null; do
      sleep 5
    done

    BODY="{\"value\":\"$ADMIN_TOKEN\"}"
    curl --header "Content-Type: application/json" \
      --request POST --data "${BODY}" http://localhost:4000/set-admin-token

    echo # newline
    # Return here instead of exiting the entire script
    return
  fi

  echo "Waiting for Gitea to be ready..."
  until curl -s -I localhost:3000 > /dev/null; do
    sleep 5
  done

  echo "Generating admin token..."
  ADMIN_TOKEN_COMMAND="gitea admin user generate-access-token --username $GITEA_ADMIN --token-name $ADMIN_TOKEN_NAME --scopes all"
  ADMIN_TOKEN_OUTPUT="$(docker exec -u git gitea sh -c "$ADMIN_TOKEN_COMMAND")"
  echo "$ADMIN_TOKEN_OUTPUT"

  # Parse the token from the output
  ADMIN_TOKEN="$(echo "$ADMIN_TOKEN_OUTPUT" | tail -1 | sed 's/.* //' | sed 's/\r$//')"

  # If token already exists, fallback to the one in .env
  if echo "$ADMIN_TOKEN_OUTPUT" | grep -qi "Command error: access token name has been used already"; then
    echo "ADMIN TOKEN WAS ALREADY SET. USING .env fallback"
    ADMIN_TOKEN=$(grep GITEA_ADMIN_TOKEN_RECEIVED "$ENV_FILE" | cut -d '=' -f2)
    exit 1
  fi

  # If new token was generated, save it to .env
  if ! echo "$ADMIN_TOKEN_OUTPUT" | grep -qi "already"; then
    echo "Saving new admin token to .env"
    if grep -q "GITEA_ADMIN_TOKEN_RECEIVED=" "$ENV_FILE"; then
      # Replace existing line
      sed -i "s|GITEA_ADMIN_TOKEN_RECEIVED=.*|GITEA_ADMIN_TOKEN_RECEIVED=$ADMIN_TOKEN|" "$ENV_FILE"
    else
      # Append new line
      echo "GITEA_ADMIN_TOKEN_RECEIVED=$ADMIN_TOKEN" >> "$ENV_FILE"
    fi
  fi

  # Exit if still no token
  if [ -z "$ADMIN_TOKEN" ]; then
    echo "ADMIN_TOKEN could not be determined. Exiting..."
    exit 1
  fi

  echo "Waiting for backend server to be ready..."
  until curl -s -I localhost:4000 > /dev/null; do
    sleep 5
  done

  BODY="{\"value\":\"$ADMIN_TOKEN\"}"
  curl --header "Content-Type: application/json" \
    --request POST --data "${BODY}" http://localhost:4000/set-admin-token

  echo # print newline
}

# -- Call the function --
main

echo "Script continues here if you'd like..."
# do other tasks
