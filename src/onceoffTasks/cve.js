/* eslint-disable no-useless-catch */
const fs = require('fs')
const path = require('path')
const { logger } = require('../utils/logger')
const { getInputOrDefault } = require('../utils/inputFilter')

// CVSS 3.1 评分指标
const cvss_3_1_metrics = {
  // Base Metrics - Exploitability
  'Attack vector': ['NETWORK', 'ADJACENT', 'LOCAL', 'PHYSICAL'],
  'Attack complexity': ['LOW', 'HIGH'],
  'Privileges required': ['NONE', 'LOW', 'HIGH'],
  'User interaction': ['NONE', 'REQUIRED'],
  Scope: ['UNCHANGED', 'CHANGED'],

  // Base Metrics - Impact
  Confidentiality: ['NONE', 'LOW', 'HIGH'],
  'Integrity impact': ['NONE', 'LOW', 'HIGH'],
  'Availability impact': ['NONE', 'LOW', 'HIGH'],

  // Temporal Metrics
  'Exploit Code Maturity (E)': [
    'Not Defined',
    'HIGH',
    'Functional',
    'Proof of Concept',
    'Unproven'
  ],
  'Remediation Level (RL)': [
    'Not Defined',
    'Official Fix',
    'Temporary Fix',
    'Workaround',
    'Unavailable'
  ],
  'Report Confidence (RC)': [
    'Not Defined',
    'Confirmed',
    'Reasonable',
    'Unknown'
  ],

  // Environmental Metrics
  'Confidentiality Requirement (CR)': ['Not Defined', 'LOW', 'Medium', 'HIGH'],
  'Integrity Requirement (IR)': ['Not Defined', 'LOW', 'Medium', 'HIGH'],
  'Availability Requirement (AR)': ['Not Defined', 'LOW', 'Medium', 'HIGH'],
  'Modified Attack Vector (MAV)': [
    'Not Defined',
    'Network',
    'ADJACENT',
    'LOCAL',
    'PHYSICAL'
  ],
  'Modified Attack Complexity (MAC)': ['Not Defined', 'LOW', 'HIGH'],
  'Modified Privileges Required (MPR)': ['Not Defined', 'None', 'LOW', 'HIGH'],
  'Modified User Interaction (MUI)': ['Not Defined', 'None', 'REQUIRED'],
  'Modified Scope (MS)': ['Not Defined', 'UNCHANGED', 'CHANGED'],
  'Modified Confidentiality (MC)': ['Not Defined', 'None', 'LOW', 'HIGH'],
  'Modified Integrity (MI)': ['Not Defined', 'None', 'LOW', 'HIGH'],
  'Modified Availability (MA)': ['Not Defined', 'None', 'LOW', 'HIGH']
}
async function fetchSeverityScoreBreakdown(url) {
  try {
    // 发送HTTP GET请求
    logger.Info(`start to fetch CVE details ${url}`)
    const cveawg_data = await fetchCveData(url)
    const cveawg_json = JSON.parse(cveawg_data)
    let cvssMetrics = null
    for (let i = 0; i < cveawg_json.containers.adp.length; i++) {
      if (
        cveawg_json.containers.adp[i]['metrics'] !== null &&
        cveawg_json.containers.adp[i]['metrics'] !== undefined
      ) {
        cvssMetrics = cveawg_json.containers.adp[i].metrics[0]
        logger.Info(
          `cvss info from web ${cveawg_json.containers.adp[i].metrics[0].cvssV3_1.vectorString}`
        )
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
      return null
    }
  } catch (error) {
    logger.Info(`Error fetching ${url}:`, error)
    return null
  }
}

let init = false
const myMetrics = {
  'Attack vector': [''],
  'Attack vector from': '',
  'Attack complexity': [''],
  'Attack complexity from': '',
  'Privileges required': [''],
  'Privileges required from': '',
  'User interaction': [''],
  'User interaction from': '',
  Scope: [],
  'Scope from': '',
  Confidentiality: [''],
  'Confidentiality from': '',
  'Integrity impact': [''],
  'Integrity impact from': '',
  'Availability impact': [''],
  'Availability from': ''
}

async function fromCVEToPodDeployment() {
  logger.Info(`start process CVE to pod deployment`)
  // 读取 JSON 文件
  const data = JSON.parse(fs.readFileSync('./cve.json', 'utf8'))

  // 提取所有的 vulnerabilities.id 字段
  const vulnerabilityIds = new Set() // 使用 Set 去重
  // eslint-disable-next-line github/array-foreach
  data.packages.forEach(content => {
    logger.Info(`scan package ${content}`)
    // eslint-disable-next-line github/array-foreach
    content.vulnerabilities.forEach(vulnerability => {
      vulnerabilityIds.add(vulnerability.id)
    })
  })

  // 将结果转换为数组
  const uniqueVulnerabilityIds = Array.from(vulnerabilityIds)

  // 生成 URL 链接
  const cveUrls = uniqueVulnerabilityIds.map(
    cveId => `https://cveawg.mitre.org/api/cve/${cveId}`
  )

  for (const url of cveUrls) {
    const cvePattern = /CVE-\d{4}-\d+/
    const match = url.match(cvePattern)
    const cveInfo = match ? match[0] : null

    if (cveInfo === null) {
      continue
    }

    const severityScoreBreakdown = await fetchSeverityScoreBreakdown(url)

    if (severityScoreBreakdown) {
      if (!init) {
        init = true
        for (const [key, value] of Object.entries(severityScoreBreakdown)) {
          myMetrics[key] = value
          myMetrics[`${key} from`] = cveInfo
        }
      } else {
        for (const [key, value] of Object.entries(severityScoreBreakdown)) {
          const cValue = myMetrics[key]
          if (
            cvss_3_1_metrics[key].indexOf(cValue) >
            cvss_3_1_metrics[key].indexOf(value)
          ) {
            myMetrics[key] = value
            myMetrics[`${key} from`] = cveInfo
          }
          if (
            cvss_3_1_metrics[key].indexOf(cValue) ===
            cvss_3_1_metrics[key].indexOf(value)
          ) {
            myMetrics[`${key} from`] += `,${cveInfo}`
          }
        }
      }
    } else {
      logger.Info('Severity score breakdown section not found.')
    }
  }
  const folderName = getInputOrDefault('output_path', '/workdir/GenAI_output')
  fs.mkdirSync(folderName, {
    recursive: true,
    permission: 0o755
  })
  const filePath = path.join(folderName, './cve_result.json')
  fs.writeFileSync(filePath, JSON.stringify(myMetrics, null, 2))
  let cvssStr = ''
  for (const [metric, values] of Object.entries(myMetrics)) {
    if (!metric.includes('from')) {
      cvssStr += ` ${metric}:${values},`
    }
  }
  return cvssStr
}

const https = require('https')

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

module.exports = {
  fromCVEToPodDeployment
}
