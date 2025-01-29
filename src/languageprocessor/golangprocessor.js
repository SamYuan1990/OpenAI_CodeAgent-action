const fs = require('fs')
const readline = require('readline')

/**
 * 同步提取 Go 文件中的函数或测试用例
 * @param {string} filePath - 文件路径
 * @param {boolean} isTestFile - 是否是测试文件（默认 false）
 * @returns {Array} - 返回提取的函数或测试用例数组
 */
function extractGolangFunctions(filePath, isTestFile = false) {
  const functions = []
  const fileContent = fs.readFileSync(filePath, 'utf8').split('\n') // 同步读取文件并按行分割

  let inFunction = false
  let functionName = ''
  let functionBody = ''
  let inDescribe = false
  let describeName = ''
  let inIt = false
  let itName = ''

  for (const line of fileContent) {
    const trimmedLine = line.trim()

    if (isTestFile) {
      // 提取 Ginkgo 的 Describe 块
      if (inDescribe) {
        console.log(trimmedLine)
      }
      if (trimmedLine.startsWith('Describe(')) {
        inDescribe = true
        console.log('find Describe')
        describeName = trimmedLine.split('"')[1] // 获取 Describe 的描述
        console.log(describeName)
      } else if (inDescribe && trimmedLine.startsWith('It(')) {
        inIt = true
        console.log('find it')
        itName = trimmedLine.split('"')[1] // 获取 It 的描述
        console.log(itName)
      } else if (inIt && trimmedLine === '})') {
        inIt = false
        functions.push({
          type: 'testcase',
          describe: describeName,
          it: itName,
          content: functionBody.trim()
        })
        functionBody = ''
      } else if (inDescribe && trimmedLine === '})') {
        inDescribe = false
        describeName = ''
      }

      if (inIt) {
        functionBody += `${trimmedLine}\n`
      }
    } else {
      // 提取普通函数
      if (trimmedLine.startsWith('func ')) {
        inFunction = true
        functionName = trimmedLine.split(' ')[1].split('(')[0]
        functionBody = `${trimmedLine}\n`
      } else if (inFunction) {
        functionBody += `${trimmedLine}\n`

        if (trimmedLine === '}') {
          inFunction = false
          functions.push({
            type: 'function',
            name: functionName,
            content: functionBody.trim()
          })
          functionBody = ''
        }
      }
    }
  }

  return functions
}

module.exports = {
  extractGolangFunctions
}

// 提取 Go 文件中的函数
/*async function extractGolangFunctions_bak(filePath, isTestFile = false) {
  return new Promise((resolve, reject) => {
    const functions = []
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    })

    let inFunction = false
    let functionName = ''
    let functionBody = ''
    let inDescribe = false
    let describeName = ''
    let inIt = false
    let itName = ''

    rl.on('line', line => {
      line = line.trim()

      if (isTestFile) {
        // 提取 Ginkgo 的 Describe 块
        if (inDescribe) {
          console.log(line)
        }
        if (line.startsWith('Describe(')) {
          inDescribe = true
          console.log('find Describe')
          describeName = line.split('"')[1] // 获取 Describe 的描述
          console.log(describeName)
        } else if (inDescribe && line.startsWith('It(')) {
          inIt = true
          console.log('find it')
          itName = line.split('"')[1] // 获取 It 的描述
          console.log(itName)
        } else if (inIt && line === '})') {
          inIt = false
          functions.push({
            type: 'testcase',
            describe: describeName,
            it: itName,
            content: functionBody.trim()
          })
          functionBody = ''
        } else if (inDescribe && line === '})') {
          inDescribe = false
          describeName = ''
        }

        if (inIt) {
          functionBody += `${line}\n`
        }
      } else {
        // 提取普通函数
        if (line.startsWith('func ')) {
          inFunction = true
          functionName = line.split(' ')[1].split('(')[0]
          functionBody = `${line}\n`
        } else if (inFunction) {
          functionBody += `${line}\n`

          if (line === '}') {
            inFunction = false
            functions.push({
              type: 'function',
              name: functionName,
              content: functionBody.trim()
            })
            functionBody = ''
          }
        }
      }
    })

    rl.on('close', () => {
      resolve(functions)
    })

    rl.on('error', err => {
      reject(err)
    })
  })
}
*/

// 主函数
/*async function test() {
  try {
    // 提取 example.go 中的函数
    const functions = await extractFunctions('./example.go')
    console.log('Functions in example.go:')
    for (let i = 0; i < functions.length; i++) {
      const func = functions[i]
      console.log(`Type: ${func.type}, Name: ${func.name}`)
      console.log(`Body:\n${func.body}\n`)
    }

    // 提取 example_test.go 中的测试用例
    const testCases = await extractFunctions('./example_test.go', true)
    console.log('Test cases in example_test.go:')
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      console.log(`Describe: ${testCase.describe}, It: ${testCase.it}`)
      console.log(`Body:\n${testCase.body}\n`)
    }
  } catch (err) {
    console.error('Error:', err)
  }
}*/
