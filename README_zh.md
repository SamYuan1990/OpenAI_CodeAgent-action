# Hello! OpenAI 代码助手

[![代码规范检查](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/linter.yml)
[![持续集成](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/SamYuan1990/OpenAI_CodeAgent/actions/workflows/ci.yml)

## 场景与功能

本项目旨在将现有软件生产流程中的源代码与各类工具检测报告结合，并在特定场景下提交给大语言模型（LLM）。无需使用 RAG 或微调模型，即可实现对检测报告的智能化分析处理，并将该能力集成至 CI/CD 流程中。

| **分类**         | **工具示例**                 | **扫描目的**                     | **报告内容**                                           | **报告与源代码的关联**                           | **发现问题后的措施**                           |
| ---------------- | ---------------------------- | -------------------------------- | ------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------- |
| **单元测试**     | JUnit, pytest, Mocha         | 验证代码模块功能正确性           | 测试通过率、失败用例、代码覆盖率                       | 直接关联到代码中的测试类和被测模块               | 修复失败的测试用例，补充覆盖率不足的代码       |
| **静态代码分析** | ESLint, Pylint, SonarQube    | 检查代码风格、潜在缺陷和复杂度   | 代码异味（Code Smell）、复杂度指标、重复代码、规范违规 | 直接关联到代码文件和行号                         | 重构复杂代码，删除重复逻辑，遵循编码规范       |
| **依赖扫描**     | Snyk, OWASP Dependency-Check | 检测第三方依赖的已知漏洞         | 漏洞 CVE 编号、风险等级、受影响的依赖版本              | 关联项目配置文件（如 `pom.xml`、`package.json`） | 升级依赖版本，替换不安全库，或添加漏洞缓解措施 |
| **安全扫描**     | OWASP ZAP, SonarQube         | 检测代码漏洞（如 SQL 注入、XSS） | 漏洞类型、风险等级、受影响代码位置                     | 直接关联到代码文件和行号                         | 修复漏洞代码，更新依赖库，重新扫描验证         |

目前支持以下场景：

| 分类         | 工具         | 语言/对象       | 场景                                                                              | 示例                                                      |
| ------------ | ------------ | --------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **单元测试** | Jest         | JavaScript      | 自动补全单元测试代码，提高测试覆盖率                                              | [链接](./.github/workflows/ExampleJSunittestGenerate.yml) |
| **文档补全** |              | Go              | 基于 AST 自动生成 Go 代码文档                                                     | [链接](./.github/workflows/ExampleGODocGenerate.yml)      |
| **安全扫描** | Syft, Bomber | deployment.yaml | 结合 Syft 和 Bomber 收集项目 CVE 漏洞，并根据 Kubernetes Pod 安全策略提出改进建议 | [链接](./.github/workflows/ExampleCVEToDeployment.yml)    |

## 合作流程

项目整体设计如下：  
![总体设计](./docs/pictures/Design.png)

欢迎试用或在 GitHub Issue 中提交您的场景需求！  
**技术贡献说明**：  
如需适配新语言，需提供以下支持：

- [ ] AST 扫描工具适配
- [ ] 大模型结果过滤规则

---

## 非功能指标与运行控制

### 循环控制

对于 AST 类任务，可通过 `maxIterations` 控制大模型调用次数，或启用 `dry run`
模式。

### 日志与归档

- 基于哈希值的追踪：输出文件哈希值用于日志追踪（哈希值为最终提示词的 SHA256 值）。

### 指标

- [x] 每轮任务追踪
- [x] Token 消耗统计（关联成本）
- [x] 提示词组件分析（如单轮提示、ReAct 模式等）
- [ ] 输出有效性统计（过滤无效响应比例）

---

## 输出示例

| 输出字段            | 描述                                     |
| ------------------- | ---------------------------------------- |
| avg_prompt_precent  | 提示词（用户意图）在最终输入中的平均占比 |
| avg_content_precent | 任务背景内容在最终输入中的平均占比       |
| LLMresponse         | 大模型的响应内容（单次调用）             |
| final_prompt        | 发送至大模型的完整提示词                 |
| avg_time_usage      | 大模型平均响应时间                       |
| avg_inputToken      | 大模型平均输入token数                    |
| avg_outputToken     | 大模型平均数醋token数                    |

AST 任务的输出示例（目录：`./GenAI_output`）：

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

## 当前结果

| Metric\Task               | Document generate | Deployment suggestion | Code enhancement |
| ------------------------- | ----------------- | --------------------- | ---------------- |
| Prompt percent            | 16%               | 5.6%                  | 54.2%            |
| Content percent           | 83%               | 93%                   | 45%              |
| Output Token              | 430               | 1207                  | 742              |
| LLM response time(second) | 26                | 61                    | 43               |

---

## 使用建议

- **伦理规范**：建议通过 GitHub
  Issue 或独立分支提交大模型的修改，由用户审核后合并。
- **本地运行**：
  ```bash
  npm install
  npx local-action . src/main.js .env.example
  ```
  或容器
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

## 预发布检查

1. 扫描本仓库以验证单元测试生成逻辑
2. 扫描 KubeEdge 以验证文档生成逻辑
3. 扫描 Kepler 仓库以验证 CVE 扫描逻辑

---

## 待办事项

- 增强单元测试生成逻辑
- 支持函数级/文件级跳过规则
- 框架灵活化适配
