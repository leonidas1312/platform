# Rastion Backend

## Install

run `start_backend.sh`

Explanation:
Runs `docker-compose up -d` that deploys the gitea, mysql and backend-server containers.  
Then runs all the scripts in the gitea-scripts directory.

 - `create-admin.sh` : automatically set-up administratos so that we can deploy in production without the browser gitea initialization.

## TODOs

Move all tokens and passwords in an .env file