/* eslint-disable filenames/match-regex */
const cveHelmPrompt = `please give me a pod deployment suggestion, according to CVSS 3.1
            scrore and deployment.yaml,`
const godocPrompt = `please help generate go doc for this function, `
const jsunittestPrompt = `please help generate unit test for my nodejs code, `
const ccodeEnhancePrompt = `I want to know if this function has common vulnerabilities as nil pointer, free after use, out of memory, out of boundary issues. please help me evaluate all the those risks for the function, evaluate in score (0,10), if the function is safe, please say your are fine with it. if the score higher than 6, please provide fix suggestion and summary all fix suggestion in one code block, the fix suggestion should nit enough and keep original code block and logic as much as possible., here is the function, `

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
  if (control_group.runType === 'ccodescan') {
    return ccodeEnhancePrompt
  }
}

module.exports = {
  predefinePrompt
}
