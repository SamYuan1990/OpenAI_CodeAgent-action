/* eslint-disable filenames/match-regex */
const cveHelmPrompt = `please give me a pod deployment suggestion, according to CVSS 3.1
            scrore and deployment.yaml,`
const godocPrompt = `please help generate go doc for this function, `
const jsunittestPrompt = `please help generate unit test for my nodejs code, `
const ccodeEnhancePrompt = `this c language function may have general risk as nil pointer, free after use, out of memory , out of boundary issues, which may causes CVE report. please help me evaluate all the risk for the function, summarize in score (0,10), if the risk is higher than 6, please provide fix suggestion,the fix suggestion should nit enough and keep original code block and logic as much as possible, here is the function, `

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
