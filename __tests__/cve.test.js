const fs = require('fs')
const path = require('path')
const { fromCVEToPodDeployment } = require('../src/onceoffTasks/cve')

const { fetchCveData, processSeverityScore } = require('../src/tools/cvetools')

// Mock the logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    Info: jest.fn()
  }
}))

// Mock the fs module
jest.mock('fs')

// Mock the https module
jest.mock('https')

describe('ProcessSeverityScoreBreakdown', () => {
  it('should return the correct CVSS metrics when the request is successful', async () => {
    const mockUrl = 'https://cveawg.mitre.org/api/cve/CVE-2023-1234'
    const mockData = JSON.stringify({
      extractPackageInfo: 'pkg:npm/%40babel/helpers@7.15.4',
      containers: {
        adp: [
          {
            metrics: [
              {
                cvssV3_1: {
                  attackVector: 'NETWORK',
                  attackComplexity: 'LOW',
                  privilegesRequired: 'NONE',
                  userInteraction: 'NONE',
                  scope: 'UNCHANGED',
                  confidentialityImpact: 'HIGH',
                  integrityImpact: 'HIGH',
                  availabilityImpact: 'HIGH'
                }
              }
            ]
          }
        ]
      }
    })

    require('https').request.mockImplementation((options, callback) => {
      const res = {
        on: jest.fn((event, handler) => {
          if (event === 'data') handler(mockData)
          if (event === 'end') handler()
        })
      }
      callback(res)
      return {
        on: jest.fn(),
        end: jest.fn()
      }
    })

    const cveawg_data = await fetchCveData(mockUrl)
    const cveawg_json = JSON.parse(cveawg_data)
    const result = processSeverityScore(cveawg_json)
    expect(result).toEqual({
      'Attack vector': 'NETWORK',
      'Attack complexity': 'LOW',
      'Privileges required': 'NONE',
      'User interaction': 'NONE',
      Scope: 'UNCHANGED',
      Confidentiality: 'HIGH',
      'Integrity impact': 'HIGH',
      'Availability impact': 'HIGH'
    })
  })
})

describe('fromCVEToPodDeployment', () => {
  it('should process CVE data and generate the correct CVSS string', async () => {
    const mockControlGroup = {
      folderName: './output'
    }

    const mockCveData = {
      packages: [
        {
          vulnerabilities: [
            { id: 'CVE-2023-1234', extractPackageInfo: 'pkg:npm' },
            { id: 'CVE-2023-5678', extractPackageInfo: 'pkg:npm' }
          ],
          coordinates: 'pkg:npm/%40babel/helpers@7.15.4'
        }
      ]
    }

    fs.readFileSync.mockReturnValue(JSON.stringify(mockCveData))

    const mockCveResponse = JSON.stringify({
      containers: {
        adp: [
          {
            metrics: [
              {
                cvssV3_1: {
                  attackVector: 'NETWORK',
                  attackComplexity: 'LOW',
                  privilegesRequired: 'NONE',
                  userInteraction: 'NONE',
                  scope: 'UNCHANGED',
                  confidentialityImpact: 'HIGH',
                  integrityImpact: 'HIGH',
                  availabilityImpact: 'HIGH'
                }
              }
            ]
          }
        ]
      }
    })

    require('https').request.mockImplementation((options, callback) => {
      const res = {
        on: jest.fn((event, handler) => {
          if (event === 'data') handler(mockCveResponse)
          if (event === 'end') handler()
        })
      }
      callback(res)
      return {
        on: jest.fn(),
        end: jest.fn()
      }
    })

    const result = await fromCVEToPodDeployment(mockControlGroup)
    expect(result).toContain('Attack vector:')
    expect(result).toContain('Attack complexity:')
    expect(result).toContain('Privileges required:')
    expect(result).toContain('User interaction:')
    expect(result).toContain('Scope:')
    expect(result).toContain('Confidentiality:')
    expect(result).toContain('Integrity impact:')
    expect(result).toContain('Availability impact:')

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockControlGroup.folderName, './cve_result.json'),
      expect.any(String)
    )
  })
})

describe('fetchCveData', () => {
  it('should fetch CVE data successfully', async () => {
    const mockUrl = 'https://cveawg.mitre.org/api/cve/CVE-2023-1234'
    const mockData = 'mock CVE data'

    require('https').request.mockImplementation((options, callback) => {
      const res = {
        on: jest.fn((event, handler) => {
          if (event === 'data') handler(mockData)
          if (event === 'end') handler()
        })
      }
      callback(res)
      return {
        on: jest.fn(),
        end: jest.fn()
      }
    })

    const result = await fetchCveData(mockUrl)
    expect(result).toBe(mockData)
  })

  it('should throw an error when the request fails', async () => {
    const mockUrl = 'https://cveawg.mitre.org/api/cve/CVE-2023-1234'

    require('https').request.mockImplementation((options, callback) => {
      const req = {
        on: jest.fn((event, handler) => {
          if (event === 'error') handler(new Error('Request failed'))
        }),
        end: jest.fn()
      }
      return req
    })

    await expect(fetchCveData(mockUrl)).rejects.toThrow('Request failed')
  })
})
