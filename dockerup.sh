#!/bin/bash
# Invoke with a config file:
# ./dockerup.sh ./proxy.json

set -e
set -x

if ! vagrant status | grep "default *running "
then
  vagrant up
else
  vagrant provision
fi

vagrant ssh -c "docker run -i -t -p 4040:4040 node-api-proxy $1"


