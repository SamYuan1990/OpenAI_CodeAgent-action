# Hello, World! OpenAI Code Agent

[![Lint Codebase](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml)
[![Continuous Integration](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml)

[中文文档](./README_zh.md)

## Scenarios & Features

This project integrates source code and tool-generated reports (e.g., test
results, security scans) into Large Language Models (LLMs) to enable intelligent
analysis without RAG or fine-tuning. The capability is embedded into CI/CD
pipelines.

| **Category**        | **Tools**                    | **Purpose**              | **Report Content**                     | **Relation to Source Code**                    | **Actions on Issues**              |
| ------------------- | ---------------------------- | ------------------------ | -------------------------------------- | ---------------------------------------------- | ---------------------------------- |
| **Unit Testing**    | JUnit, pytest, Mocha         | Validate module logic    | Pass rate, failed cases, code coverage | Directly linked to test classes and modules    | Fix failed tests, improve coverage |
| **Static Analysis** | ESLint, Pylint, SonarQube    | Check style & defects    | Code smells, complexity, duplication   | Directly linked to code files and line numbers | Refactor code, enforce standards   |
| **Dependency Scan** | Snyk, OWASP Dependency-Check | Detect third-party risks | CVEs, severity, affected versions      | Linked to config files (e.g., `pom.xml`)       | Upgrade dependencies, apply fixes  |
| **Security Scan**   | OWASP ZAP, SonarQube         | Find vulnerabilities     | Vulnerability types, locations         | Directly linked to code files and line numbers | Patch code, rescan                 |

### Supported Scenarios

| Category                      | Tools        | Language/Target | Scenario                                                 | Example                                                     |
| ----------------------------- | ------------ | --------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **Unit Test**                 | Jest         | JavaScript      | Auto-generate unit tests to improve coverage             | [Link](./.github/workflows/ExampleJSunittestGenerate.yml)   |
| **Doc Gen**                   |              | Go              | Generate GoDoc comments via AST analysis                 | [Link](./.github/workflows/ExampleGODocGenerate.yml)        |
| **CVE Scan**                  | Syft, Bomber | deployment.yaml | Detect CVEs and suggest Pod Security Policy improvements | [Link](./.github/workflows/ExampleCVEToDeployment.yml)      |
| **Code Vulnerabilities Scan** |              | C               | Detect common CVE reasons as null pointer for code       | [Link](./.github/workflows/ExampleCVulnerabilitiesscan.yml) |

## Collaboration

Workflow Design:  
![OverAllDesign](./Design.png)

**Contribution Guidelines**:  
To add language support, provide:

- [ ] AST scanning tool adaptation
- [ ] LLM output filtering rules

---

## Non-Functional Metrics

### Loop Control

Set `maxIterations` for AST tasks or enable `dry run` mode.

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

---

## Usage Tips

- **Ethical AI**: Submit LLM-generated changes via GitHub Issues or branches for
  review.
- **Local Run**:
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

---

## Pre-Release Checks

1. Scan this repo for unit test generation
2. Scan KubeEdge for doc generation
3. Scan Kepler for CVE detection

---

## Roadmap

- Enhance unit test generation
- Add function/file-level skip rules
- Framework flexibility improvements
