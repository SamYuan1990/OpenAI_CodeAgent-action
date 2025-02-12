/* eslint-disable github/array-foreach */
/* eslint-disable no-shadow */
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

/**
 * 解析 lcov.info 文件并生成函数覆盖数据结构
 * @param {string} lcovFilePath - lcov.info 文件的路径
 * @returns {Object} - 函数覆盖数据结构
 */
function parseLcovFile(lcovFilePath) {
  const lcovContent = fs.readFileSync(lcovFilePath, 'utf-8')
  const lines = lcovContent.split('\n')

  const coverageData = {}
  let currentFile = null

  lines.forEach(line => {
    if (line.startsWith('SF:')) {
      // 解析文件路径
      const filePath = line.replace('SF:', '').trim()
      currentFile = filePath
      coverageData[currentFile] = { functions: {} }
    } else if (line.startsWith('FN:')) {
      // 解析函数定义
      const line_match_rs = line.match(/FN:(\d+),(\w+)/)
      if (line_match_rs === null) {
        return
      }
      const [, lineNumber, functionName] = line_match_rs
      if (currentFile) {
        coverageData[currentFile].functions[functionName] = {
          line: parseInt(lineNumber, 10),
          covered: false // 默认未覆盖
        }
      }
    } else if (line.startsWith('FNDA:')) {
      // 解析函数调用次数
      const linematchFNDA_rs = line.match(/FNDA:(\d+),(\w+)/)
      if (linematchFNDA_rs === null) {
        return
      }
      const [, hits, functionName] = linematchFNDA_rs
      if (currentFile && coverageData[currentFile].functions[functionName]) {
        coverageData[currentFile].functions[functionName].covered = hits > 0
      }
    } else if (line === 'end_of_record') {
      // 重置当前文件
      currentFile = null
    }
  })

  return coverageData
}

// 读取 JavaScript 文件并解析为 AST
function parseFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return {
    ast: parser.parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx']
    }),
    fileContent // 返回文件内容
  }
}

// 检查函数是否被导出
function isFunctionExported(ast, functionName) {
  let isExported = false

  traverse(ast, {
    AssignmentExpression(path) {
      const { left, right } = path.node

      // 检查是否是 module.exports 或 exports 的赋值
      if (
        left.type === 'MemberExpression' &&
        left.object.name === 'module' &&
        left.property.name === 'exports'
      ) {
        // 检查是否导出了当前函数
        if (right.type === 'Identifier' && right.name === functionName) {
          isExported = true
        } else if (right.type === 'ObjectExpression') {
          // 检查对象中的属性是否包含当前函数
          right.properties.forEach(property => {
            if (
              property.value.type === 'Identifier' &&
              property.value.name === functionName
            ) {
              isExported = true
            }
          })
        }
      } else if (
        left.type === 'Identifier' &&
        left.name === 'exports' &&
        right.type === 'Identifier' &&
        right.name === functionName
      ) {
        isExported = true
      }
    }
  })

  return isExported
}

// 提取函数信息
function extractFunctionInfo(coverageData, filePath, ast, fileContent) {
  const functions = []

  traverse(ast, {
    FunctionDeclaration(path) {
      const functionNode = path.node
      const functionName = functionNode.id.name

      // 检查函数是否被导出
      if (!isFunctionExported(ast, functionName)) {
        return
      }

      const functionContent = fileContent.slice(
        functionNode.start,
        functionNode.end
      )
      const leadingComments = functionNode.leadingComments || []
      const hasComment = leadingComments.length > 0
      const commentContent = hasComment
        ? leadingComments.map(comment => comment.value).join('\n')
        : ''

      // 检查函数是否被测试覆盖
      const isCovered = isFunctionCovered(coverageData, filePath, functionName)

      functions.push({
        fileName: filePath,
        functionName,
        content: functionContent,
        hasComment,
        commentContent,
        isCovered
      })
    }
  })

  return functions
}

// 检查函数是否被测试覆盖
function isFunctionCovered(coverageData, filePath, functionName) {
  const fileObj = coverageData[filePath]
  if (fileObj && fileObj.functions && fileObj.functions[functionName]) {
    return fileObj.functions[functionName].covered
  }
  return false
}

// 扫描整个目录
function scanDirectory(coverageData, directory) {
  const results = []

  function scan(coverageData, dir) {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scan(coverageData, filePath)
      } else if (path.extname(file) === '.js') {
        const { ast, fileContent } = parseFile(filePath) // 解析文件并获取 AST 和文件内容
        const functions = extractFunctionInfo(
          coverageData,
          filePath,
          ast,
          fileContent
        )
        results.push(...functions)
      }
    })
  }

  scan(coverageData, directory)
  return results
}

module.exports = {
  parseLcovFile,
  scanDirectory
}

// 主函数
/*function main() {
  const directory = './src' // 你要扫描的目录
  const lcovFilePath = path.join('./', 'coverage', 'lcov.info')
  const coverageData = parseLcovFile(lcovFilePath)

  const results = scanDirectory(coverageData, directory)

  // 输出 JSON 结果
  fs.writeFileSync('ast_scan_results1.json', JSON.stringify(results, null, 2))
  console.log('AST 扫描结果已保存到 ast_scan_results1.json')
}

main()
*/
