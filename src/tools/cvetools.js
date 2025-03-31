/* eslint-disable no-prototype-builtins */
/* eslint-disable no-useless-catch */
const https = require('https')
const { logger } = require('../utils/logger')
const fs = require('fs')
const path = require('path')
const { grepSync } = require('./grep')

function extractPackageInfo(coordinates) {
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

function readCVEdata() {
  // 读取 cve.json 文件
  const data = fs.readFileSync(`/workdir/cve.json`, 'utf8')
  logger.Debug(`read from cve.json as`)
  logger.Debug(`${data}`)
  const jsonData = JSON.parse(data)
  return jsonData
}

function httpsGetPromise(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        resolve(data)
      })
    })
    req.on('error', e => {
      reject(e)
    })
    req.end()
  })
}

async function fetchCveData(url) {
  try {
    const options = {
      hostname: new URL(url).hostname,
      path: new URL(url).pathname + new URL(url).search,
      method: 'GET'
    }
    const data = await httpsGetPromise(options)
    return data
  } catch (error) {
    throw error
  }
}

function processSeverityScore(cveawg_json) {
  let cvssMetrics = null
  for (let i = 0; i < cveawg_json.containers.adp.length; i++) {
    if (
      cveawg_json.containers.adp[i]['metrics'] !== null &&
      cveawg_json.containers.adp[i]['metrics'] !== undefined
    ) {
      cvssMetrics = cveawg_json.containers.adp[i].metrics[0]
      logger.Debug(`cvss info from web ${cvssMetrics}`)
      break
    }
  }
  if (cvssMetrics && cvssMetrics.cvssV3_1) {
    const cvssV3_1 = cvssMetrics.cvssV3_1
    return {
      //baseSeverity: cvssV3_1.baseSeverity,
      'Attack vector': cvssV3_1.attackVector,
      'Attack complexity': cvssV3_1.attackComplexity,
      'Privileges required': cvssV3_1.privilegesRequired,
      'User interaction': cvssV3_1.userInteraction,
      Scope: cvssV3_1.scope,
      Confidentiality: cvssV3_1.confidentialityImpact,
      'Integrity impact': cvssV3_1.integrityImpact,
      'Availability impact': cvssV3_1.availabilityImpact
    }
  } else {
    return {}
  }
}

async function collectInformation(control_group) {
  logger.Info(`start collect information for CVE with dependency`)

  const jsonData = readCVEdata()
  // 用于去重的 Map
  const uniquePackages = new Map()

  // 遍历 packages
  for (let i = 0; i < jsonData.packages.length; i++) {
    const pkg = jsonData.packages[i]
    const coordinates = pkg.coordinates
    const dependency_name = extractPackageInfo(coordinates)
    let dependencyName = ''
    if (dependency_name.packageName.startsWith('golang.org/x/')) {
      // 提取最后一个斜杠后的部分
      dependencyName = dependency_name.packageName.split('/').pop()
    } else {
      dependencyName = dependency_name.packageName
    }
    logger.Info(`find pkg as ${dependencyName}`)
    // 检查依赖是否出现在指定目录中
    const appears_at = grepSync(dependencyName, control_group.dirPath)

    // 如果依赖未出现，跳过当前包
    if (appears_at.files.length === 0) {
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
      if (!vulnId.startsWith('CVE')) {
        logger.Info(`skip this for now as not on https://www.cve.org/CVERecord`)
        continue
      }
      const cveLink = `https://www.cve.org/CVERecord?id=${vulnId}`
      const cveapilink = `https://cveawg.mitre.org/api/cve/${vulnId}`

      // 获取 CVE 信息
      const CVEINFO = await fetchCveData(cveapilink) // 假设 fetchCveData 是异步函数
      const cveawg_json = JSON.parse(CVEINFO)
      const references_url = extractReferencesUrls(cveawg_json)
      const severityScoreBreakdown = processSeverityScore(cveawg_json)
      // 使用 coordinates 和 vulnId 作为 key
      const key = `${dependencyName}|${vulnId}`
      const appears = appears_at.matches
      const files = appears_at.files
      // 如果 Map 中不存在该 key，则添加
      if (!uniquePackages.has(key)) {
        const value = {
          coordinates,
          cveLink,
          dependencyName,
          appears_at: appears,
          files,
          references_url,
          vulnerability: vuln,
          CVEscore: severityScoreBreakdown
        }
        const loginfo = JSON.stringify(value, null, 2)
        logger.Info(`package detail ${loginfo}`)
        uniquePackages.set(key, value)
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
  processSeverityScore,
  fetchCveData,
  readCVEdata,
  collectInformation
}
