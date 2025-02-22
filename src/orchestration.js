const { scanGoCodeDirectory } = require('./golangScanner')
const { scanJSCodeDirectory } = require('./jsScanner')
const { invokeAIviaAgent } = require('./aiagent')
const { scanDirectory } = require('./languageprocessor/cAst')
const { logger } = require('./utils/logger')

const taskQueue = {
  Functions: [],
  tasks: [], // 任务队列
  counter: 0, // 计数器
  maxIterations: 10, // 最大循环次数
  dirPath: '',

  InitCCodeRepo() {
    this.Functions = scanDirectory(this.dirPath)
    let counter = 0
    for (let index = 0; index < this.Functions.length; index++) {
      this.tasks.push(this.Functions[index])
      counter++
      if (counter > this.maxIterations) {
        break
      }
    }
  },

  InitJsRepo() {
    this.Functions = scanJSCodeDirectory(this.dirPath)
  },

  async InitGoRepo() {
    logger.Info('start InitGoRepo')
    this.Functions = await scanGoCodeDirectory(this.dirPath)
  },

  GenerateJsUnitTestTask() {
    this.InitJsRepo(this.dirPath)
    let counter = 0
    for (let index = 0; index < this.Functions.length; index++) {
      if (!this.Functions[index].isCovered) {
        this.tasks.push(this.Functions[index])
        counter++
        if (counter > this.maxIterations) {
          break
        }
      }
    }
  },

  async GenerateGoDocTasks() {
    logger.Info('start GenerateGoDocTasks')
    await this.InitGoRepo(this.dirPath)
    let counter = 0
    for (let index = 0; index < this.Functions.length; index++) {
      if (!this.Functions[index].hasGoDoc) {
        this.tasks.push(this.Functions[index])
        counter++
        if (counter > this.maxIterations) {
          break
        }
      }
    }
  },

  setdirPath(dirPath) {
    this.dirPath = dirPath
  },

  setmaxIterations(maxIterations) {
    if (maxIterations) {
      this.maxIterations = maxIterations
    }
  },

  // 运行任务队列
  async run(openai, model, prompt, dryRun) {
    const result = []
    while (this.counter < this.maxIterations && this.tasks.length > 0) {
      const task = this.tasks.shift() // 从队列中取出一个任务
      const filename = task.fileName
      const functionname = task.functionname
      const GenAIContent = await invokeAIviaAgent(
        openai,
        model,
        prompt,
        dryRun,
        task.content
      )
      const meta = {
        filename,
        functionname
      }
      GenAIContent.meta = meta
      // 执行任务
      result.push(GenAIContent)
      this.counter++ // 增加计数器
      logger.Info('complete for one task with llm.')
    }
    if (this.counter >= this.maxIterations) {
      logger.Info('Reach out maxIterations exit')
    } else {
      logger.Info('All tasks done')
    }
    logger.Info(`complete ${result.length} jobs`)
    return result
  }
}

module.exports = {
  taskQueue
}
