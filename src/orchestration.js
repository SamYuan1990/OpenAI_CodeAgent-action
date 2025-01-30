const core = require('@actions/core')
const { scanGoCodeDirectory } = require('./golangScanner')
const { scanJSCodeDirectory } = require('./jsScanner')

const taskQueue = {
  Functions: [],
  tasks: [], // 任务队列
  counter: 0, // 计数器
  maxIterations: 10, // 最大循环次数
  dirPath: '',

  InitJsRepo() {
    this.Functions = scanJSCodeDirectory(this.dirPath)
  },

  InitGoRepo() {
    this.Functions = scanGoCodeDirectory(this.dirPath)
  },

  GenerateJsUnitTestTask() {
    this.InitJsRepo(this.dirPath)
    for (let index = 0; index < this.Functions.length; index++) {
      this.tasks.push(this.Functions[index])
    }
  },

  GenerateGoDocTasks() {
    this.InitGoRepo(this.dirPath)
    for (let index = 0; index < this.Functions.length; index++) {
      if (!this.Functions[index].hasGoDoc) {
        this.tasks.push(this.Functions[index])
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
  async run(model, prompt, openai, dryRun) {
    const result = []
    core.info(this.counter)
    core.info(this.maxIterations)
    core.info(this.tasks.length)
    core.info(dryRun)
    while (this.counter < this.maxIterations && this.tasks.length > 0) {
      const task = this.tasks.shift() // 从队列中取出一个任务
      const currentPath = task.currentPath
      const filename = task.fileName
      const functionname = task.functionname
      let GenAIContent = ''
      // 执行任务
      core.info('--------Invoke generate AI:--------')
      if (!dryRun) {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            {
              role: 'user',
              content: `${prompt}\n${task.content}`
            }
          ],
          model
        })
        core.info('--------This is output from generate AI:--------')
        GenAIContent = completion.choices[0].message.content
        core.info(GenAIContent)
        core.info('--------End of generate AI output--------')
        result.push({
          currentPath,
          filename,
          functionname,
          GenAIContent
        })
      } else {
        result.push({
          currentPath,
          filename,
          functionname,
          GenAIContent
        })
        core.info(`just dry run for, ${prompt}\n${task.content}`)
      }
      this.counter++ // 增加计数器
    }
    if (this.counter >= this.maxIterations) {
      core.info('Reach out maxIterations exit')
    } else {
      core.info('All tasks done')
    }
    return result
  }
}

module.exports = {
  taskQueue
}
