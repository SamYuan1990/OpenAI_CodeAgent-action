const core = require('@actions/core')
const { scanGoCodeDirectory } = require('./golangScanner')

const taskQueue = {
  GoFunctions: [],
  tasks: [], // 任务队列
  counter: 0, // 计数器
  maxIterations: 10, // 最大循环次数
  dirPath: '',

  InitGoRepo() {
    this.GoFunctions = scanGoCodeDirectory(this.dirPath)
  },

  GenerateGoDocTasks() {
    this.InitGoRepo(this.dirPath)
    for (let index = 0; index < this.GoFunctions.length; index++) {
      if (!this.GoFunctions[index].hasGoDoc) {
        this.tasks.push(this.GoFunctions[index])
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
  async run(model, prompt, openai, dryRun, processOutput) {
    core.info(this.counter)
    core.info(this.maxIterations)
    core.info(this.tasks.length)
    core.info(dryRun)
    while (this.counter < this.maxIterations && this.tasks.length > 0) {
      const task = this.tasks.shift() // 从队列中取出一个任务
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
        core.info(completion.choices[0].message.content)
      } else {
        core.info(`just dry run for, ${prompt}\n${task.content}`)
      }
      core.info('--------End of generate AI output--------')
      this.counter++ // 增加计数器
    }

    if (this.counter >= this.maxIterations) {
      core.info('Reach out maxIterations exit')
    } else {
      core.info('All tasks done')
    }
  }
}

module.exports = {
  taskQueue
}
