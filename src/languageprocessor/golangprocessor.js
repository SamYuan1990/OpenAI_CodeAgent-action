const fs = require('fs')
const readline = require('readline')

// 提取 Go 文件中的函数
function extractGolangFunctions(filePath, isTestFile = false) {
  console.log('debug', isTestFile)
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

module.exports = {
  extractGolangFunctions
}

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
