const core = require('@actions/core')
const { logger } = require('./logger')

function getInputOrDefault(inputName, defaultValue) {
  // 优先从GitHub Actions输入获取
  logger.Debug(`checking value for ${inputName}`)
  const coreValue = core.getInput(inputName)
  if (coreValue !== undefined && coreValue !== null && coreValue !== '') {
    return coreValue
  }

  // 其次尝试从操作系统环境变量获取（同名变量）
  const envValue = process.env[inputName]
  if (envValue !== undefined && envValue !== null && envValue !== '') {
    return envValue
  }

  logger.Info(`use default value for ${inputName}`)
  // 最终返回默认值
  return defaultValue
}

module.exports = {
  getInputOrDefault
}
