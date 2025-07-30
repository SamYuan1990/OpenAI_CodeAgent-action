# Hello! OpenAI Code Agent

[![Lint Codebase](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml)
[![Continuous Integration](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml)

[中文文档](./README_zh.md)

From an engineering perspective, for the tasks in our pipeline today, we need to
gather sufficient information and construct a series of specific instructions.
By directly issuing these instructions to the large model, we can avoid
fine-tuning and RAG (Retrieval-Augmented Generation), thereby integrating the
large model into the pipeline. This approach enables intelligent solutions to
specific problems, ultimately achieving the goal of enhancing production
efficiency.

## Todo after Community over code

It's very greatful as communitication on Community over code.
### High level to do
- [ ] We need to have an AST graph and consider with memory trace.
- [ ] We need to make each single step as atom as possible, Pluggable to support scan for:
  - [ ] Static scan scope.
  - [ ] CVE scan scope.
  - [ ] OWASP 10 socpe.
  - [ ] Customer design.
  - [ ] Provide design for interface, so everyone can contribute a new plugin for us.
  - [ ] At the interface level, impls context management.
- [ ] We need test case, can use ebpf based obversibility as DeepFlow MCP may have demo to how it works.
- [ ] Provide metrics, log for further analysis and audit usage.
- [ ] Continue support for container, GHA way to run it.
### To achieve aboves
- [ ] We need prompts and tested with juice shop as test suits to evaluate our prompts.
  - [ ] From readme or usage file to start up sandbox for testing as long term memory.
  - [ ] Go through AST.(in hard code)
  - [ ] We make 1 from top 10 as case for one term.
  - [ ] Pluggable by prompts, each prompt has it's own content base same structured output.
  - [ ] Attack on the sandbox.
  - [ ] Run a full scan on juice shop to see ROI.
  - [ ] As it's juice shop, so we can have our total score as final result.
  - [ ] Consider a realy case, we need LLM to give us the verify steps.
- [ ] We need a java, golang, or muti language based restful server from prompt to walk through AST graph.
  - [ ] We need an rest api structure.
  - [ ] We need sample vul project for ourself base on each language.
  - [ ] Which inluding graph inovkes, vul cases, points to the vuls types for unit test.
- [ ] We also need to consider the report format, as security owner should know code path, attack approach, verify result, and a sandbox to reproduce, fix suggestion is optional.
- [ ] We need test with real CVE(in the past to see if we can works), and also impacts from other CVEs.
- [ ] Go to test with real case, try to find any.

## Features

| Category                       | Tools        | Language/Target | Scenario                                                 | Example                                                     |
| ------------------------------ | ------------ | --------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **Unit Test**                  | Jest         | JavaScript      | Auto-generate unit tests to improve coverage             | [Link](./.github/workflows/ExampleJSunittestGenerate.yml)   |
| **Doc Gen**                    |              | Go              | Generate GoDoc comments via AST analysis                 | [Link](./.github/workflows/ExampleGODocGenerate.yml)        |
| **CVE Scan with Pod security** | Syft, Bomber | deployment.yaml | Detect CVEs and suggest Pod Security Policy improvements | [Link](./.github/workflows/ExampleCVEToDeployment.yml)      |
| **CVE Scan with project**      | Syft, Bomber | n/A             | Detect CVEs and the affect to your repo                  | [Link](./.github/workflows/YouOwnCVEDependency.yml)         |
| **Code Vulnerabilities Scan**  |              | C               | Detect common CVE reasons as null pointer for code       | [Link](./.github/workflows/ExampleCVulnerabilitiesscan.yml) |

### Reuslt:

- CVE Scan with project: we already get 3 confrimed CVE upgrade from a cloud
  related project.
- Code Vulnerabilities Scan: we already submit one PR to an Apache project.

## Design

Workflow Design:  
![OverAllDesign](./docs/pictures/Design.png)

---

## Non-Functional Metrics

### Logging & Archiving

- Hash-based tracing (SHA256 of final prompt).

### Metrics

- [x] Per-task tracing
- [x] Token cost analysis
- [x] Prompt component analysis (e.g., one-shot vs. ReAct)
- [ ] Output effectiveness (filtered invalid responses)

---

## Output Examples

| Field               | Description                                   |
| ------------------- | --------------------------------------------- |
| avg_prompt_precent  | Average percentage of user intent in prompts  |
| avg_content_precent | Average percentage of task context in prompts |
| LLMresponse         | Raw LLM response (single call)                |
| final_prompt        | Full prompt sent to LLM                       |
| avg_time_usage      | Average time spend when invoke LLM            |
| avg_inputToken      | Average input token to LLM                    |
| avg_outputToken     | Average output token from LLM                 |

AST task output (directory: `./GenAI_output`):

```json
{
  "model": "deepseek-chat",
  "final_prompt": "...",
  "hashValue": "600e13336953ff55998a56a86644a01abfabe33513abcf01b8d945c61664e0c2",
  "response": "",
  "prompt_precent": 12.71,
  "content_precent": 87.03,
  "meta": {
    "filename": "src/aiagent.js",
    "functionname": "calculatePercentage"
  }
}
```

## Current preformance result

| Metric\Task               | Document generate | Deployment suggestion | Code enhancement |
| ------------------------- | ----------------- | --------------------- | ---------------- |
| Prompt percent            | 16%               | 5.6%                  | 54.2%            |
| Content percent           | 83%               | 93%                   | 45%              |
| Output Token              | 430               | 1207                  | 742              |
| LLM response time(second) | 26                | 61                    | 43               |

---

## Usage Tips

- **Container Run**:
  ```bash
  npm install
  npx local-action . src/main.js .env.example
  ```
  or container
  ```bash
  docker run -e baseURL="https://api.deepseek.com" \
           -e apiKey="dummy" \
           -e model="deep-seek" \
           -e dirPath="/workdir/src" \
           -e dryRun="true" \
           -e runType="jsunittest" \
           -e maxIterations=1 \
           -e deploymentfile= \
           -e prompt= \
           -e output_path= \
           -e githubIssueReport= \
           -e token= \
           -e GITHUB_REPOSITORY= \
           -v "$(pwd)":/workdir \
           ghcr.io/samyuan1990/openai_codeagent-action:latest
  ```
- **Local Run**: You can generate GenAI_output and download it to your local,
  then use [./localCS](./localCS)'s simple UI to check and review the content.
  To run localCS, `export apiKey=xxx && node server.js`
