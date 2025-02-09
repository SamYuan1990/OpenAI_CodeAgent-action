const core = require('@actions/core')
const crypto = require('crypto')

async function invokeAIviaAgent(openai, model, prompt, dryRun, fileContent) {
  core.info(' We are going to talk with Gen AI with Model', model)
  core.info(' We are going to talk with Gen AI with prompt and file content')
  core.info(`${prompt}\n${fileContent}`)
  const final_prompt = `${prompt}\n${fileContent}`
  const hash = crypto.createHash('sha256')
  hash.update(final_prompt)
  const hashValue = hash.digest('hex')
  // process hash and prompt metric here
  // hash
  // prompt metric
  const prompt_precent = calculatePercentage(prompt, final_prompt)
  const content_precent = calculatePercentage(fileContent, final_prompt)
  const prompt_info = {
    model,
    final_prompt,
    hashValue,
    prompt_precent,
    content_precent
  }

  if (!dryRun) {
    core.info('--------Invoke generate AI:--------')
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
    core.info('--------This is output from generate AI:--------')
    core.info(completion.choices[0].message.content)
    core.info('--------End of generate AI output--------')
    // hash
    // prompt metric
    // response
    prompt_info.response = completion.choices[0].message.content
  } else {
    core.info(`just dry run for, ${prompt}\n${fileContent}`)
    // hash
    // prompt metric
    prompt_info.response = ''
  }
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

module.exports = {
  invokeAIviaAgent
}
