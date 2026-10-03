# GitHub Actions — Basic Exam Cheatsheet

## Basic tutorial: 5 points

### 1. Create a workflow

Save a YAML file in `.github/workflows/`, for example `ci.yml`.
A workflow defines **when** automation runs and **what** it does.

```yaml
name: CI
on: [push, pull_request]
```

### 2. Add a job and runner

A **job** contains steps and runs on a **runner** (a machine).
Jobs run in parallel unless dependencies are specified.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
```

Common hosted runners: `ubuntu-latest`, `windows-latest`, `macos-latest`.

### 3. Add steps: `uses` versus `run`

Steps within a job run sequentially.

```yaml
steps:
  - name: Download repository
    uses: actions/checkout@v4
  - name: Run a shell command
    run: echo "Hello!"
```

- `uses`: runs a reusable action; `@v4` is its version/ref.
- `run`: executes shell commands.
- `with`: supplies inputs to an action.
- Checkout makes repository files available to later steps.

### 4. Configure environment and a matrix

```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [20, 22]
runs-on: ${{ matrix.os }}
```

This creates **4 job combinations** (2 operating systems × 2 Node versions).
`fail-fast: false` prevents one matrix failure from cancelling the others.
Use `actions/setup-node` with `node-version: ${{ matrix.node }}` to install the selected version.

`env` is optional and can be set at workflow, job, or step scope:

```yaml
env:
  APP_ENV: test
```

### 5. Run and inspect the workflow

Push the workflow to GitHub, then cause its trigger event (such as opening a PR).
Open the repository's **Actions** tab to inspect runs, jobs, logs, and failures.
`workflow_dispatch` also allows manual execution; the workflow must exist on the default branch.

## YAML syntax essentials

```yaml
# Comment
name: CI                       # key: value
on: [push, pull_request]        # inline list
permissions:                   # nested mapping
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:                     # list of step mappings
      - name: Multiple commands
        run: |                 # preserves line breaks
          echo "First"
          echo "Second"
```

- Use **spaces, not tabs**; keep indentation consistent (commonly 2 spaces).
- `-` starts a list item; `key: value` defines a mapping entry.
- `|` preserves line breaks; `>` folds most line breaks into spaces.
- Quote strings with special YAML characters, for example `"Result: OK"`.
- Quote glob patterns such as `'**.js'` or `'!docs/**'`.
- `${{ ... }}` is a **GitHub expression**, not ordinary YAML syntax.

## Important triggers

| Trigger | Purpose / exam note |
| --- | --- |
| `push` | Commit or tag pushed to a repository. |
| `pull_request` | PR activity; defaults to `opened`, `synchronize`, and `reopened`. |
| `workflow_dispatch` | Manually start a workflow; supports inputs. |
| `schedule` | Scheduled run using cron; uses the default branch. |
| `workflow_call` | Allows other workflows to call a reusable workflow. |
| `release` | Release activity; commonly filtered to `published`. |
| `issues` | Issue activity, such as opening or labeling an issue. |
| `pull_request_target` | Runs in the base repository's context; **do not run untrusted PR code with privileged access**. |

### Multiple events and activity types

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
  workflow_dispatch:
```

**Important:** For `pull_request`, `branches` filters the PR's **target/base branch**, not its source branch.

### Manual inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: Deployment environment
        required: true
        default: staging
        type: choice
        options: [staging, production]
```

Access the value with `${{ inputs.environment }}`.

### Scheduled runs

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'
```

Runs Mondays at 09:00 UTC. Scheduled runs can be delayed.

```text
minute  hour  day-of-month  month  day-of-week
0       9     *             *      1
```

## Branch, tag, and path filters

### Include branches and paths

```yaml
on:
  push:
    branches:
      - main
      - 'feature/**'
    paths:
      - 'src/**'
      - '.github/workflows/**'
```

When branch and path filters are both present, **both must match**.

### Ignore branches or paths

```yaml
on:
  push:
    branches-ignore: ['docs/**']
    paths-ignore: ['docs/**', '**.md']
```

`paths-ignore` skips a run when **all changed files** match ignored patterns.

- Do not combine `branches` and `branches-ignore` for the same event.
- Do not combine `paths` and `paths-ignore` for the same event.
- The same restriction applies to `tags` and `tags-ignore`.
- To mix inclusion and exclusion, use negative patterns:

```yaml
on:
  push:
    branches:
      - 'release/**'
      - '!release/**-alpha'
```

Pattern order matters: a later negative pattern excludes an earlier match.

### Tag pushes

```yaml
on:
  push:
    tags: ['v*']
```

This runs on matching tag pushes, not branch pushes. Path filters are not evaluated for tag pushes.

### Filter on the PR source branch

Use a job condition instead of the trigger's `branches` filter:

```yaml
jobs:
  test:
    if: startsWith(github.head_ref, 'feature/')
    runs-on: ubuntu-latest
    steps:
      - run: echo "Feature branch PR"
```

## Common workflow keywords

| Keyword | Meaning |
| --- | --- |
| `name` | Display name of a workflow or step. |
| `on` | Events that trigger the workflow. |
| `jobs` | Jobs in the workflow. |
| `runs-on` | Runner selection. |
| `steps` | Ordered actions and commands within a job. |
| `uses` | Action reference; also used at job level to call a reusable workflow. |
| `run` | Shell command(s). |
| `with` | Inputs passed to an action or reusable workflow. |
| `env` | Environment variables. |
| `strategy.matrix` | Runs a job for multiple parameter combinations. |
| `needs` | Job dependencies, e.g. `needs: test`. |
| `if` | Conditional execution of a job or step. |
| `permissions` | Controls `GITHUB_TOKEN` access. |
| `working-directory` | Directory for a `run` step. |
| `defaults.run` | Shared defaults for `run` steps, not `uses` steps. |
| `timeout-minutes` | Maximum job/step execution time. |
| `continue-on-error` | Allows execution to continue despite a failure. |
| `concurrency` | Groups runs/jobs to limit simultaneous execution. |

## Variables, secrets, and expressions

```yaml
env:
  APP_ENV: test
  API_KEY: ${{ secrets.API_KEY }}
  REGION: ${{ vars.REGION }}
```

- `secrets.NAME`: sensitive value configured in GitHub; never hardcode credentials.
- `vars.NAME`: non-sensitive configuration variable.
- `env.NAME`: environment variable in expressions.
- `github.ref`: full triggering ref, e.g. `refs/heads/main` on a branch push.
- `github.head_ref`: PR source branch name.
- `github.base_ref`: PR target branch name.
- `github.event_name`: event name, such as `pull_request`.
- `matrix.NAME`: current matrix value.
- In a Linux shell, read an environment variable with `$APP_ENV`.
- Fork PRs normally do not receive repository secrets; their token is restricted.

### Conditions and dependencies

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing"
  deploy:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying after successful tests"
```

Common condition functions: `success()`, `failure()`, `always()`, `cancelled()`.
Most steps run only if preceding steps succeeded; `if: always()` can run cleanup after failure.

## Complete basic example

```yaml
name: JavaScript checks

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [20, 22]
    runs-on: ${{ matrix.os }}
    env:
      NODE_ENV: test
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

This example assumes a project with a `package-lock.json` and an npm `test` script; it is not a ready-to-run test configuration for every repository.

