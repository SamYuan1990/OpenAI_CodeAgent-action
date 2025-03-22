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
