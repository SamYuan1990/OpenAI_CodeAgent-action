/* eslint-disable no-prototype-builtins */
/* eslint-disable github/array-foreach */
const fs = require('fs')
const { execSync } = require('child_process')
const { fetchCveData } = require('./cve')
const path = require('path')
const { logger } = require('../utils/logger')
const { preparePrompt, invokeAIviaAgent } = require('../aiagent')

function grepSync(pattern, filePath) {
  try {
    // 执行 grep 命令并获取输出
    logger.Info(`grep ${pattern} -rw ${filePath}`)
    const stdout = execSync(`grep ${pattern} -r ${filePath}`).toString()
    // 将输出按行拆分并存入数组
    const result = stdout.split('\n').filter(line => line.trim() !== '')
    return result
  } catch (error) {
    // 如果命令执行失败，返回空数组或抛出错误
    // console.error(`Error: ${error.stderr.toString()}`)
    return []
  }
}

const extractPackageInfo = coordinates => {
  // 使用正则表达式提取包名和版本
  const match = coordinates.match(/pkg:(npm|golang|java)\/(?:%40)?(.*?)@(.*)$/)
  if (match) {
    const packageName = match[2] // async
    const version = match[3] // 2.6.3
    return { packageName, version }
  } else {
    logger.Info(coordinates)
    throw new Error('Invalid coordinates format')
  }
}

function extractReferencesUrls(cveawg_json) {
  const urls = new Set() // 使用 Set 去重

  /**
   * 递归遍历对象，提取 references 的 url
   * @param {Object|Array} obj - 当前遍历的对象或数组
   */
  function traverse(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return // 如果不是对象或数组，直接返回
    }

    // 如果是数组，遍历每个元素
    if (Array.isArray(obj)) {
      for (const item of obj) {
        traverse(item) // 递归遍历数组元素
      }
      return
    }

    // 如果是对象，遍历每个键值对
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]

        // 如果当前键是 references，并且值是数组
        if (key === 'references' && Array.isArray(value)) {
          for (const ref of value) {
            if (ref.url) {
              urls.add(ref.url) // 提取 url 并添加到 Set 中
            }
          }
        } else {
          traverse(value) // 递归遍历其他字段
        }
      }
    }
  }

  traverse(cveawg_json) // 开始递归遍历
  return Array.from(urls) // 将 Set 转换为数组并返回
}

async function CVEDependency(openai, model_parameters, control_group, dryRun) {
  logger.Info(`start process CVE with dependency`)

  const information = await collectInformation(control_group)
  const result = []
  // in a for loop of information
  for (let i = 0; i < information.length; i++) {
    // todo use a template to generate prompt
    const promptContent = preparePrompt(
      information[i].prompt,
      '',
      control_group
    )
    if (fs.existsSync(promptContent.filePath)) {
      logger.Info('output file exisit, skip')
      continue
    }
    const LLMresponse = await invokeAIviaAgent(
      openai,
      model_parameters.model,
      dryRun,
      promptContent
    )
    result.push(LLMresponse)
  }
  return result
}

async function collectInformation(control_group) {
  logger.Info(`start collect information for CVE with dependency`)
  // 读取 cve.json 文件
  const data = fs.readFileSync(`/workdir/cve.json`, 'utf8')
  logger.Info(`read from cve.json as`)
  logger.Info(`${data}`)
  const jsonData = JSON.parse(data)

  // 用于去重的 Map
  const uniquePackages = new Map()

  // 遍历 packages
  for (let i = 0; i < jsonData.packages.length; i++) {
    const pkg = jsonData.packages[i]
    const coordinates = pkg.coordinates
    const dependency_name = extractPackageInfo(coordinates)
    const dependencyName = dependency_name.packageName
    logger.Info(`find pkg as ${dependencyName}`)
    // 检查依赖是否出现在指定目录中
    const appears_at = grepSync(dependencyName, control_group.dirPath)

    // 如果依赖未出现，跳过当前包
    if (appears_at.length === 0) {
      logger.Info(
        `seems the package doesn't appears in code as direct dependency, skip`
      )
      continue
    }

    // 遍历 vulnerabilities
    for (let j = 0; j < pkg.vulnerabilities.length; j++) {
      const vuln = pkg.vulnerabilities[j]

      const vulnId = vuln.id
      logger.Info(`found CVE as ${vulnId}`)
      const cveLink = `https://www.cve.org/CVERecord?id=${vulnId}`

      // 获取 CVE 信息
      const url = `https://cveawg.mitre.org/api/cve/${vulnId}`
      const CVEINFO = await fetchCveData(url) // 假设 fetchCveData 是异步函数
      const cveawg_json = JSON.parse(CVEINFO)
      const references_url = extractReferencesUrls(cveawg_json)
      // 使用 coordinates 和 vulnId 作为 key
      const key = `${dependencyName}|${vulnId}`

      const prompt = `
      please help create a report for developer to fix CVE, here are the confirmed information.
      cve: ${cveLink},
      cve description: ${vuln.description},
      appears in project: ${appears_at},
      reference: ${references_url}
      `
      // 如果 Map 中不存在该 key，则添加
      if (!uniquePackages.has(key)) {
        uniquePackages.set(key, {
          coordinates,
          cveLink,
          dependencyName,
          appears_at,
          references_url,
          prompt,
          vulnerability: vuln
        })
      }
    }
  }

  // 将去重后的结果转换为数组
  const result = Array.from(uniquePackages.values())

  // 输出结果
  logger.Info(`we have total ${result.length} result need to verfiy`)
  // 如果需要将结果保存到文件
  const filePath = path.join(control_group.folderName, './unique_packages.json')
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2))
  return result
}

module.exports = {
  CVEDependency
}
