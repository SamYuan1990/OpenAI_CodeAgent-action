const crypto = require('crypto')
const { logger } = require('./utils/logger')
const { encode } = require('gpt-tokenizer')

async function invokeAIviaAgent(openai, model, prompt, dryRun, fileContent) {
  logger.Info(' We are going to talk with Gen AI with Model', model)
  logger.Info(' We are going to talk with Gen AI with prompt and file content')
  logger.Info(`${prompt}\n${fileContent}`)
  const final_prompt = `${prompt}\n${fileContent}`
  const hash = crypto.createHash('sha256')
  hash.update(final_prompt)
  const hashValue = hash.digest('hex')
  // process hash and prompt metric here
  // hash
  // prompt metric
  const prompt_precent = calculatePercentage(prompt, final_prompt)
  const content_precent = calculatePercentage(fileContent, final_prompt)
  const response = ''
  const meta = {}
  const time_usage = 0
  const startTime = process.hrtime()
  let endTime = ''
  const inputToken = calculateTokenCount(`${prompt}\n${fileContent}`)
  const outputToken = 0
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
    meta
  }

  if (!dryRun || dryRun !== 'true') {
    try {
      logger.Info('--------Invoke generate AI:--------')
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: `${prompt}\n${fileContent}`
          }
        ],
        model
      })
      logger.Info('--------This is output from generate AI:--------')
      logger.Info(completion.choices[0].message.content)
      logger.Info('--------End of generate AI output--------')
      // hash
      // prompt metric
      // response
      // todo: error handle
      prompt_info.response = completion.choices[0].message.content
      prompt_info.outputToken = calculateTokenCount(
        completion.choices[0].message.content
      )
    } catch (error) {
      logger.Info(`error happen from LLM response ${error}`)
      prompt_info.response = ''
    }
  } else {
    logger.Info(`just dry run for, ${prompt}\n${fileContent}`)
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

module.exports = {
  invokeAIviaAgent
}
