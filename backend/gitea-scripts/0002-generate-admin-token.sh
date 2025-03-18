#!/bin/sh

echo "Waiting for Gitea to be ready..."
until curl -s -I localhost:3000 > /dev/null; do
  sleep 5
done

echo "Generating admin token..."
ADMIN_TOKEN_COMMAND="gitea admin user generate-access-token --username $GITEA_ADMIN --token-name $ADMIN_TOKEN_NAME --scopes all"
ADMIN_TOKEN="$(docker exec -it -u git gitea $ADMIN_TOKEN_COMMAND | sed 's/.* //' | sed 's/\r$//')"

if [ -z "${ADMIN_TOKEN}" ]; then
    echo "ADMIN_TOKEN could not be fetched from gitea. Exiting..."
    exit
fi

if [ "$ADMIN_TOKEN" = "already" ]; then 
    echo "ADMIN TOKEN WAS ALREADY SET. TRYING TO FETCH FROM MySQL."
    SQL_CODE="SELECT token_hash FROM access_token WHERE name=\"$ADMIN_TOKEN_NAME\" and uid IN (SELECT id FROM user WHERE is_admin=1);"
    SQL_COMMAND="mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE -s -e '$SQL_CODE'"
    ADMIN_TOKEN="$(eval docker exec -it mysql-gitea-db $SQL_COMMAND | tail -1 | sed 's/\r$//')"
fi;

echo "Waiting for backend server to be ready..."
until curl -s -I localhost:4000 > /dev/null; do
  sleep 5
done

if [ -z "${SECRET_TOKEN}" ]; then
    echo "SECRET_TOKEN is unset or set to the empty string. Exiting..."
    exit
fi

BODY="{\"SECRET_TOKEN\":\"$SECRET_TOKEN\",\"value\":\"$ADMIN_TOKEN\"}"

curl --header "Content-Type: application/json" \
--request POST --data ${BODY} http://localhost:4000/set-admin-token

echo #print a new line after curl response
