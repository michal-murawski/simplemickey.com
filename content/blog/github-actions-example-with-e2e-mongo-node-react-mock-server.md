---
title: Github actions example with e2e mongo, node, react, mock server
date: 2020-07-06T20:55:23.430Z
tags: test
---
## PR.yaml

```yaml
name: E2E Tests
on:
  pull_request:
    branches:
      - master
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v1
      - name: Check if action should run
        run: |
          if (git diff --name-only HEAD HEAD~1 | grep "^e2e/\|^services/SERVICE_DIR/"); then \
            echo "::set-env name=RUN_E2E_TESTS::true"
          fi
      - name: Build mongo container
        if: ${{ env.RUN_E2E_TESTS }}
        run: make -C platform/mongodb container; // examples with make files
      - name: Build all SERVICE containers
        if: ${{ env.RUN_E2E_TESTS }}
        run: make -C services/SERVICE container;
      - name: Set up kind
        if: ${{ env.RUN_E2E_TESTS }}
        uses: engineerd/setup-kind@v0.4.0
        with:
            version: "v0.8.1"
      - name: Run services
        if: ${{ env.RUN_E2E_TESTS }}
        run: |
              kind load docker-image s2-mongodb
              kind load docker-image s2-SERVICE-json-server
              kind load docker-image s2-SERVICE-backend
              kind load docker-image s2-SERVICE-frontend
              kubectl create namespace s2
              kubectl apply -f ./deploy/dev-SERVICE/spec/frontend.yaml
              for i in {1..30}; do kubectl get -n s2 po | grep s2-portal-frontend | grep Running && break || sleep 2; done
              kubectl port-forward -n s2 svc/s2-portal-frontend 3000:80 --address=0.0.0.0 &
      - name: Cypress
        if: ${{ env.RUN_E2E_TESTS }}
        uses: cypress-io/github-action@v1
        with:
          working-directory: e2e
          wait-on: http://localhost:3000/
          config-file: cypress.json
        env:
          CYPRESS_baseUrl: http://localhost:3000/
```