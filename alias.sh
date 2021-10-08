#!/bin/sh

alias back-dev-up='docker compose -f docker-compose.dev.yml up'
alias back-dev-up-build='docker compose -f docker-compose.dev.yml up --build'
alias back-dev-down='docker compose -f docker-compose.dev.yml down'
alias back-dev-rm-db='docker volume rm $(docker volume ls -q --filter dangling=true) && rm -rf db'
