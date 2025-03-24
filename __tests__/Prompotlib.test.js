/* eslint-disable filenames/match-regex */
const { predefinePrompt } = require('../src/Prompotlib') // Adjust the path accordingly

// Mock prompts
const cveHelmPrompt = `please give me a pod deployment suggestion, according to CVSS 3.1
            scrore <%= cvssscore %> and deployment.yaml <%= deployment %>`
const godocPrompt = `please help generate go doc for this function, <%= code %>`
const jsunittestPrompt = `please help generate unit test for my nodejs code, <%= code %>`

describe('predefinePrompt', () => {
  it('should return cveHelmPrompt when runType is CVE2Deployment', () => {
    const control_group = { runType: 'CVE2Deployment' }
    expect(predefinePrompt(control_group)).toBe(cveHelmPrompt)
  })

  it('should return godocPrompt when runType is godoc', () => {
    const control_group = { runType: 'godoc' }
    expect(predefinePrompt(control_group)).toBe(godocPrompt)
  })

  it('should return jsunittestPrompt when runType is jsunittest', () => {
    const control_group = { runType: 'jsunittest' }
    expect(predefinePrompt(control_group)).toBe(jsunittestPrompt)
  })

  it('should return undefined when runType is not recognized', () => {
    const control_group = { runType: 'unknown' }
    expect(predefinePrompt(control_group)).toBe('')
  })

  it('should return undefined when runType is not provided', () => {
    const control_group = {}
    expect(predefinePrompt(control_group)).toBe('')
  })
})
