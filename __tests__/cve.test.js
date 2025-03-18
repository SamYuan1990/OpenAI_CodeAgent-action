const fs = require('fs')
const path = require('path')
const {
  fromCVEToPodDeployment,
  fetchSeverityScoreBreakdown,
  fetchCveData
} = require('../src/onceoffTasks/cve')

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

describe('fetchSeverityScoreBreakdown', () => {
  it('should return the correct CVSS metrics when the request is successful', async () => {
    const mockUrl = 'https://cveawg.mitre.org/api/cve/CVE-2023-1234'
    const mockData = JSON.stringify({
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

    const result = await fetchSeverityScoreBreakdown(mockUrl)
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

  it('should return null when the request fails', async () => {
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

    const result = await fetchSeverityScoreBreakdown(mockUrl)
    expect(result).toBeNull()
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
          vulnerabilities: [{ id: 'CVE-2023-1234' }, { id: 'CVE-2023-5678' }]
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
    expect(result).toContain('Attack vector:NETWORK')
    expect(result).toContain('Attack complexity:LOW')
    expect(result).toContain('Privileges required:NONE')
    expect(result).toContain('User interaction:NONE')
    expect(result).toContain('Scope:UNCHANGED')
    expect(result).toContain('Confidentiality:HIGH')
    expect(result).toContain('Integrity impact:HIGH')
    expect(result).toContain('Availability impact:HIGH')

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
