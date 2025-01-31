const fs = require('fs')
const path = require('path')
const {
  extractGolangFunctions
} = require('./languageprocessor/golangprocessor')

/**
 * 扫描 Go 代码目录并构建数据结构队列
 * @param {string} dirPath - 要扫描的 Go 代码目录路径
 * @returns {Array} - 返回一个包含文件名、函数名和是否存在 Go Doc 的数据结构队列
 */
function scanGoCodeDirectory(dirPath) {
  const resultQueue = [] // 结果队列

  // 递归遍历目录
  function traverseDirectory(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const item of items) {
      const itemPath = path.join(currentPath, item.name)

      if (item.isDirectory()) {
        // 如果是目录，递归遍历
        traverseDirectory(itemPath)
      } else if (
        item.isFile() &&
        item.name.endsWith('.go') &&
        !item.name.endsWith('_test.go')
      ) {
        // 如果是 Go 文件，解析文件内容
        const funcsfound = extractGolangFunctions(itemPath)
        parseGoFile(resultQueue, itemPath, currentPath, funcsfound)
      }
    }
  }
  // 开始遍历目录
  traverseDirectory(dirPath)

  return resultQueue
}

// 解析 Go 文件
function parseGoFile(resultQueue, filePath, currentPath, funcsfound) {
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath)

  // 正则表达式匹配函数定义和 Go Doc
  const functionRegex = /(\/\/[^\n]*\n)?\s*func\s+([A-Za-z_]\w*)\s*\(/g

  let match

  while ((match = functionRegex.exec(fileContent)) !== null) {
    const goDoc = match[1] ? match[1].trim() : null // 提取 Go Doc
    const functionname = match[2] // 提取函数名
    for (let index = 0; index < funcsfound.length; index++) {
      if (funcsfound[index].name === functionname) {
        const content = funcsfound[index].content
        resultQueue.push({
          currentPath,
          fileName,
          functionname,
          content,
          hasGoDoc: !!goDoc // 是否存在 Go Doc
        })
      }
    }
  }
}

module.exports = {
  scanGoCodeDirectory,
  parseGoFile
}

// 示例用法
//const goCodeDir = path.join(__dirname, '../example') // 替换为你的 Go 代码目录路径
//const result = scanGoCodeDirectory(goCodeDir)

//console.log(result)
