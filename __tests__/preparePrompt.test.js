/* eslint-disable filenames/match-regex */
const { preparePrompt } = require('../src/agents/aiagent') // 替换为实际路径
const ejs = require('ejs')
const crypto = require('crypto')
const path = require('path')

// Mock 外部依赖
jest.mock('ejs')
jest.mock('crypto')
jest.mock('path')

describe('preparePrompt', () => {
  beforeEach(() => {
    // 重置所有 mock 的状态
    jest.clearAllMocks()
  })

  it('should generate prompt content correctly', () => {
    // 模拟输入
    const prompt = 'Hello <%= name %>!'
    const fileContent = { name: 'World' }
    const control_group = { folderName: 'testFolder' }

    // 模拟 ejs.render
    ejs.render.mockReturnValue('Hello World!')

    // 模拟 crypto.createHash
    const hashMock = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mockHashValue')
    }
    crypto.createHash.mockReturnValue(hashMock)
    // 模拟 path.join
    path.join.mockReturnValue('testFolder/file_mockHashValue.out')

    // 调用函数
    const result = preparePrompt(prompt, fileContent, control_group)

    // 验证 ejs.render 调用
    expect(ejs.render).toHaveBeenCalledWith(prompt, fileContent)
    // 验证 crypto.createHash 调用
    expect(crypto.createHash).toHaveBeenCalledWith('sha256')
    expect(hashMock.update).toHaveBeenCalledWith('Hello World!')
    expect(hashMock.digest).toHaveBeenCalledWith('hex')
    // 验证 path.join 调用
    expect(path.join).toHaveBeenCalledWith(
      'testFolder',
      'file_mockHashValue.out'
    )

    // 验证返回的对象
    expect(result).toEqual({
      final_prompt: 'Hello World!',
      hashValue: 'mockHashValue',
      prompt_precent: 150,
      content_precent: -50,
      inputToken: 3,
      filePath: 'testFolder/file_mockHashValue.out'
    })
  })

  it('should handle empty file content', () => {
    // 模拟输入
    const prompt = 'Hello <%= name %>!'
    const fileContent = {}
    const control_group = { folderName: 'testFolder' }

    // 模拟 ejs.render
    ejs.render.mockReturnValue('Hello !')

    // 模拟 crypto.createHash
    const hashMock = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mockHashValue')
    }
    crypto.createHash.mockReturnValue(hashMock)
    // 模拟 path.join
    path.join.mockReturnValue('testFolder/file_mockHashValue.out')

    // 调用函数
    const result = preparePrompt(prompt, fileContent, control_group)

    // 验证 ejs.render 调用
    expect(ejs.render).toHaveBeenCalledWith(prompt, fileContent)

    // 验证返回的对象
    expect(result).toEqual({
      final_prompt: 'Hello !',
      hashValue: 'mockHashValue',
      prompt_precent: 257.14285714285717,
      content_precent: -157.14285714285717,
      inputToken: 2,
      filePath: 'testFolder/file_mockHashValue.out'
    })
  })
})
