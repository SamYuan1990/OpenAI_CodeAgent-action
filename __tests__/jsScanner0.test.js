/* eslint-disable filenames/match-regex */
const fs = require('fs')
const { findUncoveredFiles } = require('../src/jsScanner') // Adjust the path accordingly

describe('findUncoveredFiles', () => {
  // Mock fs.readFileSync to return a specific test output
  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return `
  jsScanner.js         |       0 |        0 |       0 |       0 | 1-58              
  main.js              |       0 |      100 |       0 |       0 | 1-45              
  orchestration.js     |       0 |        0 |       0 |       0 | 1-77  
      `
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return an array of uncovered files', () => {
    const result = findUncoveredFiles('coverage.txt')
    expect(result).toEqual(['jsScanner.js', 'main.js', 'orchestration.js'])
  })

  it('should return an empty array if no uncovered files are found', () => {
    // Mock fs.readFileSync to return a test output with no uncovered files
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return `
  file1.js | 10 | 5 | 5 | 10 | 100%
  file2.js | 20 | 10 | 10 | 20 | 100%
      `
    })

    const result = findUncoveredFiles('coverage.txt')
    expect(result).toEqual([])
  })

  it('should handle empty input', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return ''
    })

    const result = findUncoveredFiles('coverage.txt')
    expect(result).toEqual([])
  })

  it('should handle malformed lines', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return `
  file1.js     |       0 |        0 |       0 |       0 | 1-77   
        malformed line
  file2.js     |       0 |        0 |       0 |       0 | 1-77   
      `
    })

    const result = findUncoveredFiles('coverage.txt')
    expect(result).toEqual(['file1.js', 'file2.js'])
  })
})
