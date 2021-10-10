#!/bin/sh

alias back-dev='docker compose -f docker-compose.dev.yml'
alias back-dev-up='docker compose -f docker-compose.dev.yml up'
alias back-dev-up-build='docker compose -f docker-compose.dev.yml up --build'
alias back-dev-down='docker compose -f docker-compose.dev.yml down'
alias back-dev-db-rm='docker volume rm $(docker volume ls -q --filter dangling=true) && rm -rf db'

## typeorm
alias back-dev-typeorm='docker compose -f docker-compose.dev.yml exec dev npm run typeorm'

##docker related commands
alias docker-rm-all-images='docker rmi $(docker images -a -q)'
alias docker-rm-all-containers='docker rm $(docker ps -a -q)'
alias docker-rm-all-volumes='docker volume rm $(docker volume ls -q --filter dangling=true)'
alias docker-rm-all='docker stop $(docker ps -a -q) ; docker-rm-all-containers; docker-rm-all-images; docker-rm-all-volumes'

alias back-dev-remove-all-everything='back-dev-down; back-dev-db-rm; docker-rm-all'
