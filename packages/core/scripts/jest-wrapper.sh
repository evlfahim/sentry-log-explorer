#!/bin/bash
# Wrapper script that converts --grep to Jest's --testNamePattern
ARGS=()
while [ $# -gt 0 ]; do
  if [ "$1" = "--grep" ]; then
    shift
    ARGS+=("--testNamePattern" "$1")
  else
    ARGS+=("$1")
  fi
  shift
done
exec npx jest "${ARGS[@]}"
