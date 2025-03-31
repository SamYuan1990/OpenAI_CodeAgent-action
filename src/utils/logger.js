const winston = require('winston')

// 定义自定义日志级别（数字越小优先级越高）
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

const logger = {
  instance: winston.createLogger({
    levels: customLevels, // 使用自定义级别
    level: 'info', // 默认日志级别
    transports: [new winston.transports.Console()]
  }),

  Info(string) {
    this.instance.log({
      level: 'info',
      message: string
    })
  },

  Debug(string) {
    this.instance.log({
      level: 'debug',
      message: string
    })
  },

  Error(string) {
    this.instance.log({
      level: 'error',
      message: string
    })
  },

  Warn(string) {
    this.instance.log({
      level: 'warn',
      message: string
    })
  }
}

module.exports = {
  logger
}

/*
{ 
  error: 0, 
  warn: 1, 
  info: 2, 
  http: 3, 
  verbose: 4, 
  debug: 5, 
  silly: 6 
}
*/
