const { execSync } = require('child_process')
const { logger } = require('../utils/logger')

function grepSync(pattern, filePath) {
  const grep_result = {
    matches: [],
    files: []
  }
  try {
    // 执行 grep 命令并获取输出
    const grepcmd = `grep ${pattern} -rw ${filePath} --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.git --exclude=sbom.json --exclude=syft --exclude=cve.json --exclude=yarn.lock --exclude=package.json --exclude=go.mod --exclude=go.sum`
    logger.Debug(grepcmd)
    const stdout = execSync(grepcmd).toString()
    // 将输出按行拆分并存入数组
    const result = stdout.split('\n').filter(line => line.trim() !== '')
    // 提取文件名并去重
    const fileList = result
      .map(line => line.split(':')[0]) // 提取文件名（grep 输出格式为 "filename:matched content"）
      .filter((file, index, self) => self.indexOf(file) === index) // 去重
    if (result.length > 0) {
      grep_result.matches = result
      grep_result.files = fileList
    }
    return grep_result
  } catch (error) {
    // 如果命令执行失败，返回空数组或抛出错误
    // console.error(`Error: ${error.stderr.toString()}`)
    logger.Info(error)
    return grep_result
  }
}

module.exports = {
  grepSync
}
