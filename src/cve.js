const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const core = require('@actions/core')

// CVSS 3.1 评分指标
const cvss_3_1_metrics = {
  // Base Metrics - Exploitability
  'Attack vector': ['Network', 'Adjacent', 'Local', 'Physical'],
  'Attack complexity': ['Low', 'High'],
  'Privileges required': ['None', 'Low', 'High'],
  'User interaction': ['None', 'Required'],
  Scope: ['Unchanged', 'Changed'],

  // Base Metrics - Impact
  Confidentiality: ['None', 'Low', 'High'],
  'Integrity impact': ['None', 'Low', 'High'],
  'Availability impact': ['None', 'Low', 'High'],

  // Temporal Metrics
  'Exploit Code Maturity (E)': [
    'Not Defined',
    'High',
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
  'Confidentiality Requirement (CR)': ['Not Defined', 'Low', 'Medium', 'High'],
  'Integrity Requirement (IR)': ['Not Defined', 'Low', 'Medium', 'High'],
  'Availability Requirement (AR)': ['Not Defined', 'Low', 'Medium', 'High'],
  'Modified Attack Vector (MAV)': [
    'Not Defined',
    'Network',
    'Adjacent',
    'Local',
    'Physical'
  ],
  'Modified Attack Complexity (MAC)': ['Not Defined', 'Low', 'High'],
  'Modified Privileges Required (MPR)': ['Not Defined', 'None', 'Low', 'High'],
  'Modified User Interaction (MUI)': ['Not Defined', 'None', 'Required'],
  'Modified Scope (MS)': ['Not Defined', 'Unchanged', 'Changed'],
  'Modified Confidentiality (MC)': ['Not Defined', 'None', 'Low', 'High'],
  'Modified Integrity (MI)': ['Not Defined', 'None', 'Low', 'High'],
  'Modified Availability (MA)': ['Not Defined', 'None', 'Low', 'High']
}
async function fetchSeverityScoreBreakdown(url) {
  try {
    // 发送HTTP GET请求
    core.info(`start to fetch CVE details ${url}`)
    const response = await axios.get(url)

    // 使用cheerio解析HTML
    const $ = cheerio.load(response.data)

    // 查找Severity score breakdown章节
    const section = $('h2').filter(
      (i, el) => $(el).text() === 'Severity score breakdown'
    )
    if (!section.length) {
      return null
    }

    // 查找表格并解析其内容
    const table = section.next('table')
    if (!table.length) {
      return null
    }

    // 初始化存储结果的map
    const result = {}

    // 遍历表格的每一行
    table.find('tr').each((i, row) => {
      const cols = $(row).find('th, td')
      if (cols.length === 2) {
        const key = $(cols[0]).text().trim()
        const value = $(cols[1]).text().trim()
        if (key !== 'Base score' && key !== 'Vector' && key !== 'Parameter') {
          result[key] = value
        }
      }
    })

    return result
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    return null
  }
}

let init = false
const myMetrics = {
  'Attack vector': [],
  'Attack vector from': '',
  'Attack complexity': [],
  'Attack complexity from': '',
  'Privileges required': [],
  'Privileges required from': '',
  'User interaction': [],
  'User interaction from': '',
  Scope: [],
  'Scope from': '',
  Confidentiality: [],
  'Confidentiality from': '',
  'Integrity impact': [],
  'Integrity impact from': '',
  'Availability impact': [],
  'Availability from': ''
}

async function fromCVEToPodDeployment() {
  core.info(`start process CVE to pod deployment`)
  // 读取 JSON 文件
  const data = JSON.parse(fs.readFileSync('./cve.json', 'utf8'))

  // 提取所有的 vulnerabilities.id 字段
  const vulnerabilityIds = new Set() // 使用 Set 去重
  data.packages.forEach(content => {
    core.info(`scan package ${content}`)
    content.vulnerabilities.forEach(vulnerability => {
      vulnerabilityIds.add(vulnerability.id)
    })
  })

  // 将结果转换为数组
  const uniqueVulnerabilityIds = Array.from(vulnerabilityIds)

  // 生成 URL 链接
  const cveUrls = uniqueVulnerabilityIds.map(
    cveId => `https://ubuntu.com/security/${cveId}`
  )

  for (const url of cveUrls) {
    const cvePattern = /CVE-\d{4}-\d+/
    const match = url.match(cvePattern)
    const cveInfo = match ? match[0] : null

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
      console.log('Severity score breakdown section not found.')
    }
  }

  let cvssStr = ''
  for (const [metric, values] of Object.entries(myMetrics)) {
    if (!metric.includes('from')) {
      cvssStr += ` ${metric}:${values},`
    }
  }

  const prompt = `${cvssStr}`
  console.log(prompt)
  return prompt
}

module.exports = {
  fromCVEToPodDeployment
}
