/* eslint-disable no-useless-catch */
const fs = require('fs')
const path = require('path')
const { logger } = require('../utils/logger')
const { collectInformation } = require('../tools/cvetools')
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

async function fromCVEToPodDeployment(control_group) {
  logger.Info(`start process CVE to pod deployment`)
  const information = await collectInformation(control_group)
  for (let i = 0; i < information.length; i++) {
    if (information[i].CVEscore) {
      if (!init) {
        init = true
        for (const [key, value] of Object.entries(information[i].CVEscore)) {
          myMetrics[key] = value
          myMetrics[`${key} from`] = information[i].cveLink
        }
      } else {
        for (const [key, value] of Object.entries(information[i].CVEscore)) {
          const cValue = myMetrics[key]
          if (
            cvss_3_1_metrics[key].indexOf(cValue) >
            cvss_3_1_metrics[key].indexOf(value)
          ) {
            myMetrics[key] = value
            myMetrics[`${key} from`] = information[i].cveLink
          }
          if (
            cvss_3_1_metrics[key].indexOf(cValue) ===
            cvss_3_1_metrics[key].indexOf(value)
          ) {
            myMetrics[`${key} from`] += `,${information[i].cveLink}`
          }
        }
      }
    } else {
      logger.Info('Severity score breakdown section not found.')
    }
  }
  const filePath = path.join(control_group.folderName, './cve_result.json')
  fs.writeFileSync(filePath, JSON.stringify(myMetrics, null, 2))
  let cvssStr = ''
  for (const [metric, values] of Object.entries(myMetrics)) {
    if (!metric.includes('from')) {
      cvssStr += `${metric}:${values},`
    }
  }
  return cvssStr
}

module.exports = {
  fromCVEToPodDeployment
}
