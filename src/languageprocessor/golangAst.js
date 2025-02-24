/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable github/array-foreach */
const fs = require('fs')
const path = require('path')
const Parser = require('tree-sitter')
const Go = require('tree-sitter-go')
const { logger } = require('../utils/logger')

/**
 * 递归扫描目录并解析 Go 文件
 * @param {string} dir - 当前扫描的目录路径
 * @param {Parser} parser - tree-sitter 解析器实例
 * @param {Object} astResults - 存储 AST 结果的对象
 */
function scanDirectory(dir, parser, astResults) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    // 跳过 vendor 目录
    if (stat.isDirectory() && file === 'vendor') {
      logger.Info(`跳过 vendor 目录: ${filePath}`)
      return
    }

    // 如果是目录，递归扫描
    if (stat.isDirectory()) {
      scanDirectory(filePath, parser, astResults)
    }

    // 只处理 .go 文件
    if (stat.isFile() && path.extname(file) === '.go') {
      try {
        const code = fs.readFileSync(filePath, 'utf-8')
        const tree = parser.parse(code)
        astResults[filePath] = tree.rootNode.toString()
      } catch (parseError) {
        logger.Info(`fail to parse file ${filePath}: ${parseError}`)
        astResults[filePath] = { error: `解析失败: ${parseError.message}` }
      }
    }
  })
}

/**
 * 使用 tree-sitter-go 解析 Go 代码目录并生成 JSON 结果
 * @param {string} codeDir - Golang 代码目录路径
 * @returns {Promise<Object>} - 返回解析后的 JSON 结果
 */
function scanGolangCode(codeDir) {
  logger.Info(`start scanGolangCode`)

  return new Promise((resolve, reject) => {
    const parser = new Parser()
    parser.setLanguage(Go)

    const astResults = {}

    try {
      // 递归扫描目录
      scanDirectory(codeDir, parser, astResults)

      // 将结果保存为 JSON 文件
      const jsonFilePath = path.join(codeDir, 'golangAST.json')
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(astResults, null, 2),
        'utf-8'
      )

      resolve(astResults)
    } catch (err) {
      logger.Info(`fail to scan directory: ${err}`)
      reject(`扫描目录失败: ${err.message}`)
    }
  })
}

module.exports = {
  scanGolangCode
}

// 示例调用
/*async function test() {
  try {
    const codeDir = '/Users/yuanyi/OpenSource/kubeedge/pkg'
    const result = await scanGolangCode(codeDir)
    console.log('扫描结果:', result)
  } catch (error) {
    console.error('发生错误:', error)
  }
}
test()
*/
