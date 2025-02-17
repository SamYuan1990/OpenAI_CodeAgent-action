/* eslint-disable filenames/match-regex */
const cveHelmPrompt = `please give me a pod deployment suggestion, according to CVSS 3.1
            scrore and deployment.yaml,`
const godocPrompt = `please help generate go doc for this function, `
const jsunittestPrompt = `please help generate unit test for my nodejs code, `

function predefinePrompt(control_group) {
  if (control_group.runType === 'CVE2Deployment') {
    return cveHelmPrompt
  }
  if (control_group.runType === 'godoc') {
    return godocPrompt
  }
  if (control_group.runType === 'jsunittest') {
    return jsunittestPrompt
  }
}

module.exports = {
  predefinePrompt
}
