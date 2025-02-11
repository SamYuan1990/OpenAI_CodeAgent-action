/* eslint-disable no-shadow */
/* eslint-disable github/array-foreach */
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

// 读取 Jest 生成的覆盖率报告
function readCoverageReport(dirpath) {
  const coverageFilePath = path.join(
    dirpath,
    '../coverage',
    'coverage-summary.json'
  )
  if (!fs.existsSync(coverageFilePath)) {
    throw new Error(
      `覆盖率报告未找到，请先运行 \`npx jest --coverage\` 生成报告。${coverageFilePath}`
    )
  }
  const rawData = fs.readFileSync(coverageFilePath, 'utf-8')
  return JSON.parse(rawData)
}

// 将覆盖率报告转换为 coverageMap
function generateCoverageMap(coverageReport) {
  const coverageMap = {}

  for (const [filePath, coverageData] of Object.entries(coverageReport)) {
    const functions = coverageData.fnMap || {}
    const functionCoverage = coverageData.f || {}

    coverageMap[filePath] = {
      functions: Object.keys(functions).map(key => {
        const fn = functions[key]
        const hits = functionCoverage[key] || 0
        return {
          name: fn.name,
          line: fn.loc.start.line,
          hits,
          isCovered: hits > 0
        }
      })
    }
  }

  return coverageMap
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

// 提取函数信息
function extractFunctionInfo(coverageMap, filePath, ast, fileContent) {
  const functions = []

  traverse(ast, {
    FunctionDeclaration(path) {
      const functionNode = path.node
      const functionName = functionNode.id.name
      // eslint-disable-next-line no-undef
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
      const isCovered = isFunctionCovered(coverageMap, filePath, functionName)

      functions.push({
        fileName: filePath,
        functionname: functionName,
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
function isFunctionCovered(coverageMap, filePath, functionName) {
  const coverage = coverageMap[filePath]
  if (!coverage) return false

  const functionCoverage = coverage.functions.find(
    fn => fn.name === functionName
  )
  return functionCoverage && functionCoverage.hits > 0
}

// 扫描整个目录
function scanDirectory(coverageMap, directory) {
  const results = []

  function scan(coverageMap, dir) {
    console.log(`start scan dir ${dir}`)
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      console.log(file)
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scan(coverageMap, filePath)
      } else if (path.extname(file) === '.js') {
        const { ast, fileContent } = parseFile(filePath) // 解析文件并获取 AST 和文件内容
        const functions = extractFunctionInfo(
          coverageMap,
          filePath,
          ast,
          fileContent
        )
        results.push(...functions)
      }
    })
  }

  scan(coverageMap, directory)
  return results
}

module.exports = {
  readCoverageReport,
  generateCoverageMap,
  scanDirectory
}

// 主函数
/*function main() {
  const directory = './src' // 你要扫描的目录

  const coverageReport = readCoverageReport(directory)
  const coverageMap = generateCoverageMap(coverageReport)

  const results = scanDirectory(coverageMap, directory)

  // 输出 JSON 结果
  fs.writeFileSync('ast_scan_results.json', JSON.stringify(results, null, 2))
  console.log('AST 扫描结果已保存到 ast_scan_results.json')
}

main()
*/
