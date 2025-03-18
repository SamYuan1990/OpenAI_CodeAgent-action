/* eslint-disable filenames/match-regex */
const { getInputOrDefault } = require('../../src/utils/inputFilter') // 替换为你的模块路径
const core = require('@actions/core')

// Mock @actions/core 和 process.env
jest.mock('@actions/core')

describe('getInputOrDefault', () => {
  beforeEach(() => {
    // 在每个测试用例之前重置所有的 mock
    jest.resetAllMocks()
    // 清空 process.env
    process.env = {}
  })

  it('应该返回 GitHub Actions 输入的值', () => {
    // 模拟 core.getInput 返回一个值
    core.getInput.mockReturnValue('action-value')

    const result = getInputOrDefault('INPUT_NAME', 'default-value')
    expect(result).toBe('action-value')
    expect(core.getInput).toHaveBeenCalledWith('INPUT_NAME')
  })

  it('应该返回环境变量的值，当 GitHub Actions 输入为空时', () => {
    // 模拟 core.getInput 返回空值
    core.getInput.mockReturnValue('')
    // 设置环境变量
    process.env.INPUT_NAME = 'env-value'

    const result = getInputOrDefault('INPUT_NAME', 'default-value')
    expect(result).toBe('env-value')
    expect(core.getInput).toHaveBeenCalledWith('INPUT_NAME')
  })

  it('应该返回默认值，当 GitHub Actions 输入和环境变量都为空时', () => {
    // 模拟 core.getInput 返回空值
    core.getInput.mockReturnValue('')
    // 不设置环境变量

    const result = getInputOrDefault('INPUT_NAME', 'default-value')
    expect(result).toBe('default-value')
    expect(core.getInput).toHaveBeenCalledWith('INPUT_NAME')
  })

  it('应该优先返回 GitHub Actions 输入的值，即使环境变量也存在', () => {
    // 模拟 core.getInput 返回一个值
    core.getInput.mockReturnValue('action-value')
    // 设置环境变量
    process.env.INPUT_NAME = 'env-value'

    const result = getInputOrDefault('INPUT_NAME', 'default-value')
    expect(result).toBe('action-value')
    expect(core.getInput).toHaveBeenCalledWith('INPUT_NAME')
  })

  it('应该正确处理 undefined 和 null 值', () => {
    // 模拟 core.getInput 返回 undefined
    core.getInput.mockReturnValue(undefined)
    // 设置环境变量为 null
    process.env.INPUT_NAME = null

    const result = getInputOrDefault('INPUT_NAME', 'default-value')
    expect(result).toBe('default-value')
    expect(core.getInput).toHaveBeenCalledWith('INPUT_NAME')
  })
})
