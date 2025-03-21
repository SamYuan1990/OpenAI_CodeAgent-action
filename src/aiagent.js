const crypto = require('crypto')
const { logger } = require('./utils/logger')
const { encode } = require('gpt-tokenizer')
const path = require('path')

async function invokeAIviaAgent(openai, model, dryRun, promptContent) {
  // decouple prompt and hash value from here
  // so that support hash skip before invoke
  logger.Info(' We are going to talk with Gen AI with Model', model)
  // process hash and prompt metric here
  // hash
  // prompt metric
  const response = ''
  const meta = {}
  const time_usage = 0
  const startTime = process.hrtime()
  let endTime = ''
  const outputToken = 0
  const final_prompt = promptContent.final_prompt
  const hashValue = promptContent.hashValue
  const prompt_precent = promptContent.prompt_precent
  const content_precent = promptContent.content_precent
  const inputToken = promptContent.inputToken
  const filePath = promptContent.filePath
  // todo remove reviewed option
  const reviewed = false
  const prompt_info = {
    model,
    final_prompt,
    hashValue,
    response,
    prompt_precent,
    content_precent,
    time_usage,
    inputToken,
    outputToken,
    filePath,
    reviewed,
    meta
  }

  if (!dryRun) {
    try {
      logger.Info('--------Invoke generate AI:--------')
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: `${final_prompt}`
          }
        ],
        model
      })
      logger.Info('--------This is output from generate AI:--------')
      logger.Info(completion.choices[0].message.content)
      logger.Info('--------End of generate AI output--------')
      prompt_info.response = completion.choices[0].message.content
      prompt_info.outputToken = calculateTokenCount(
        completion.choices[0].message.content
      )
    } catch (error) {
      logger.Info(`error happen from LLM response ${error}`)
      prompt_info.response = ''
    }
  } else {
    logger.Info(`just dry run for, ${final_prompt}`)
    // hash
    // prompt metric
    prompt_info.response = ``
  }
  endTime = process.hrtime(startTime)
  const executionTime = endTime[0] * 1000 + endTime[1] / 1000000
  prompt_info.time_usage = executionTime
  return prompt_info
}

function calculatePercentage(substring, totalString) {
  const substringLength = substring.length
  const totalStringLength = totalString.length
  if (totalStringLength === 0) {
    throw new Error('Total string length must be greater than zero')
  }

  // 计算百分比
  const percentage = (substringLength / totalStringLength) * 100
  return percentage
}

function calculateTokenCount(Text) {
  const Tokens = encode(Text).length
  return Tokens
}

function preparePrompt(prompt, fileContent, control_group) {
  // todo use a template to generate prompt
  logger.Info(' We are going to talk with Gen AI with prompt and file content')
  const final_prompt = `${prompt}\n${fileContent}`
  logger.Info(`final prompt genrated as ${final_prompt}`)
  const hash = crypto.createHash('sha256')
  hash.update(final_prompt)
  const hashValue = hash.digest('hex')
  const prompt_precent = calculatePercentage(prompt, final_prompt)
  const content_precent = calculatePercentage(fileContent, final_prompt)
  const inputToken = calculateTokenCount(`${final_prompt}`)
  const folderName = control_group.folderName
  const filePath = path.join(folderName, `file_${hashValue}.out`)
  const promptContent = {
    final_prompt,
    hashValue,
    prompt_precent,
    content_precent,
    inputToken,
    filePath
  }
  return promptContent
}

module.exports = {
  invokeAIviaAgent,
  preparePrompt
}
