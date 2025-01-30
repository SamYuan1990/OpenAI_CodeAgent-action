/* eslint-disable filenames/match-regex */
const path = require('path')
const { parseJSFile } = require('../src/jsScanner') // Adjust the path to your file

describe('parseJSFile', () => {
  let resultQueue

  beforeEach(() => {
    resultQueue = []
    global.resultQueue = resultQueue // Assuming resultQueue is a global variable
  })

  it('should add non-anonymous functions to the resultQueue', () => {
    const filePath = '/some/path/to/file.js'
    const currentPath = '/some/path'
    const funcsfound = [
      { name: 'function1', content: 'function function1() {}' },
      { name: 'anonymous', content: 'function() {}' },
      { name: 'function2', content: 'function function2() {}' }
    ]

    parseJSFile(resultQueue, filePath, currentPath, funcsfound)

    expect(resultQueue).toEqual([
      {
        currentPath: '/some/path',
        fileName: 'file.js',
        functionname: 'function1',
        content: 'function function1() {}'
      },
      {
        currentPath: '/some/path',
        fileName: 'file.js',
        functionname: 'function2',
        content: 'function function2() {}'
      }
    ])
  })

  it('should not add anonymous functions to the resultQueue', () => {
    const filePath = '/some/path/to/file.js'
    const currentPath = '/some/path'
    const funcsfound = [{ name: 'anonymous', content: 'function() {}' }]

    parseJSFile(resultQueue, filePath, currentPath, funcsfound)

    expect(resultQueue).toEqual([])
  })

  it('should handle empty funcsfound array', () => {
    const filePath = '/some/path/to/file.js'
    const currentPath = '/some/path'
    const funcsfound = []

    parseJSFile(resultQueue, filePath, currentPath, funcsfound)

    expect(resultQueue).toEqual([])
  })
})
