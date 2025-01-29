const core = require('@actions/core')

const taskQueue = {
  tasks: [], // 任务队列
  counter: 0, // 计数器
  maxIterations: 10, // 最大循环次数

  // 添加任务到队列
  addTask(task) {
    this.tasks.push(task)
  },

  setmaxIterations(maxIterations) {
    this.maxIterations = maxIterations
  },

  // 运行任务队列
  run() {
    while (this.counter < this.maxIterations && this.tasks.length > 0) {
      const task = this.tasks.shift() // 从队列中取出一个任务
      task() // 执行任务
      this.counter++ // 增加计数器
    }

    if (this.counter >= this.maxIterations) {
      core.log('循环达到最大次数，终止执行。')
    } else {
      core.log('所有任务执行完毕。')
    }
  }
}

module.exports = {
  taskQueue
}
