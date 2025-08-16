name: Test NPX Package

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    strategy:
      matrix:
        node-version: [20.x, 22.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Run Jest tests  
      run: npm run test:jest

    - name: Test NPX package installation
      run: |
        npm pack
        mkdir test-install
        cd test-install
        npm init -y
        npm install ../claude-code-collective-*.tgz
        echo "NPX package installs successfully"