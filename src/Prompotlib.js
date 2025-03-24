/* eslint-disable filenames/match-regex */
const cveHelmPrompt = `please give me a pod deployment suggestion, according to CVSS 3.1
            scrore <%= cvssscore %> and deployment.yaml <%= deployment %>`
const godocPrompt = `please help generate go doc for this function, <%= code %>`
const jsunittestPrompt = `please help generate unit test for my nodejs code, <%= code %>`
const ccodeEnhancePrompt = `I want to know if this function has common vulnerabilities as nil pointer, free after use, out of memory, out of boundary issues. please help me evaluate all the those risks for the function, evaluate in score (0,10), 
if the function is safe, please say your are fine with it. 
if the score higher than 6, please provide fix suggestion, 
   please summary all fix suggestion in chapter summary with one code block, the fix suggestion should nit enough and keep original code block and logic as much as possible. 
here is the function, <%= code %> `
const cve_code_prompt = `please help create a report for developer to fix CVE, here are the confirmed information.
cve: <%= cveLink %>,
cve description: <%= vulnerability.description %>,
appears in project: <%= appears_at %>,
reference: <%= references_url %>
`
function predefinePrompt(control_group) {
  switch (control_group.runType) {
    case 'CVE2Deployment':
      return cveHelmPrompt
    case 'godoc':
      return godocPrompt
    case 'jsunittest':
      return jsunittestPrompt
    case 'ccodescan':
      return ccodeEnhancePrompt
    case 'CVEDependency':
      return cve_code_prompt
    default:
      // 如果没有匹配的 runType，可以返回一个默认值或抛出错误
      return '' // 或者 throw new Error('Unknown runType');
  }
}

module.exports = {
  predefinePrompt
}
