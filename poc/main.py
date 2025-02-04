import json
import requests
import re
import os
from bs4 import BeautifulSoup

# CVSS 3.1 评分指标
cvss_3_1_metrics = {
    # Base Metrics - Exploitability
    "Attack vector": ["Network", "Adjacent", "Local", "Physical"],
    "Attack complexity": ["Low", "High"],
    "Privileges required": ["None", "Low", "High"],
    "User interaction": ["None", "Required"],
    "Scope": ["Unchanged", "Changed"],
    
    # Base Metrics - Impact
    "Confidentiality": ["None", "Low", "High"],
    "Integrity impact": ["None", "Low", "High"],
    "Availability impact": ["None", "Low", "High"],
    
    # Temporal Metrics
    "Exploit Code Maturity (E)": ["Not Defined", "High", "Functional", "Proof of Concept", "Unproven"],
    "Remediation Level (RL)": ["Not Defined", "Official Fix", "Temporary Fix", "Workaround", "Unavailable"],
    "Report Confidence (RC)": ["Not Defined", "Confirmed", "Reasonable", "Unknown"],
    
    # Environmental Metrics
    "Confidentiality Requirement (CR)": ["Not Defined", "Low", "Medium", "High"],
    "Integrity Requirement (IR)": ["Not Defined", "Low", "Medium", "High"],
    "Availability Requirement (AR)": ["Not Defined", "Low", "Medium", "High"],
    "Modified Attack Vector (MAV)": ["Not Defined", "Network", "Adjacent", "Local", "Physical"],
    "Modified Attack Complexity (MAC)": ["Not Defined", "Low", "High"],
    "Modified Privileges Required (MPR)": ["Not Defined", "None", "Low", "High"],
    "Modified User Interaction (MUI)": ["Not Defined", "None", "Required"],
    "Modified Scope (MS)": ["Not Defined", "Unchanged", "Changed"],
    "Modified Confidentiality (MC)": ["Not Defined", "None", "Low", "High"],
    "Modified Integrity (MI)": ["Not Defined", "None", "Low", "High"],
    "Modified Availability (MA)": ["Not Defined", "None", "Low", "High"]
}

# 读取 JSON 文件
with open('cve.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# 提取所有的 vulnerabilities.id 字段
vulnerability_ids = set()  # 使用 set 去重
for package in data.get('packages', []):
    for vulnerability in package.get('vulnerabilities', []):
        vulnerability_ids.add(vulnerability.get('id'))

# 将结果转换为数组
unique_vulnerability_ids = list(vulnerability_ids)

# 打印结果
# print(unique_vulnerability_ids)

# 生成 URL 链接
cve_urls = [f"https://ubuntu.com/security/{cve_id}" for cve_id in unique_vulnerability_ids]

def fetch_severity_score_breakdown(url):
    # 发送HTTP GET请求
    response = requests.get(url)
    
    # 检查请求是否成功
    if response.status_code != 200:
        return None
    
    # 使用BeautifulSoup解析HTML
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # 查找Severity score breakdown章节
    section = soup.find('h2', text='Severity score breakdown')
    if not section:
        return None
    
    # 查找表格并解析其内容
    table = section.find_next_sibling('table')
    if not table:
        return None
    
    # 初始化存储结果的map
    result = {}
    
    # 遍历表格的每一行
    for row in table.find_all('tr'):
        cols = row.find_all('th') + row.find_all('td')
        if len(cols) == 2:
            # key = cols[0]
            pattern_vector = r'<th>(.*?)</th>'
            match = re.search(pattern_vector, str(cols[0]))
            if match:
                key = match.group(1)
            else:
                continue
            # 特别处理Base score，因为它包含图片和文本
            if key == 'Base score' or key == 'Vector':
                continue
            else:
                pattern_value = r'<td>(.*?)</td>'
                match_1 = re.search(pattern_value, str(cols[1]))
                if match_1:
                    value = match_1.group(1)
                else:
                    value = str(cols[1])
            result[key] = value
    
    return result

Init = False
my_metcis = {
    "Attack vector": [],
    "Attack vector from": "",
    "Attack complexity": [],
    "Attack complexity from": "",
    "Privileges required": [],
    "Privileges required from": "",
    "User interaction": [],
    "User interaction from": "",
    "Scope":[],
    "Scope from": "",
    "Confidentiality":[],
    "Confidentiality from": "",
    "Integrity impact":[],
    "Integrity impact from": "",
    "Availability impact":[],
    "Availability from": "",
}

# 打印结果
for url in cve_urls:
    print(url)
    cve_pattern = r"CVE-\d{4}-\d+"
    # 使用re.search()在URL中搜索CVE信息
    match = re.search(cve_pattern, url)
    if match:
        cve_info = match.group()

    severity_score_breakdown = fetch_severity_score_breakdown(url)
    
    if severity_score_breakdown:
        if (not Init):
            Init = True
            for key, value in severity_score_breakdown.items():
                my_metcis[key] = value
                my_metcis[key+" from"] = cve_info
            #print(f"{key}: {value}")
        else:
            for key, value in severity_score_breakdown.items():
                c_value = my_metcis[key]
                if cvss_3_1_metrics[key].index(c_value) > cvss_3_1_metrics[key].index(value):
                     my_metcis[key] = value
                     my_metcis[key+" from"] = cve_info
                if cvss_3_1_metrics[key].index(c_value) == cvss_3_1_metrics[key].index(value):
                     my_metcis[key+" from"] += ","+cve_info
    else:
        print("Severity score breakdown section not found.")


cvss_str=""

for metric, values in my_metcis.items():
    # print(f"{metric}: {values}")
    if not ("from" in metric):
        cvss_str+=" "+metric+":"+values+","

prompt = "请基于以下CVSS 3.1平分指标，从安全角度为容器书写对应的k8s部署yaml文件。" + cvss_str

print(prompt)
# 使用 GPT-3 模型生成文本
# response = openai.Completion.create(
#    engine="davinci",  # 使用 davinci 引擎，它是 GPT-3 的一个版本
#    prompt=prompt,
#    max_tokens=150,  # 生成文本的最大令牌数（tokens）
#    n=1,  # 生成一个完成项（completion）
#    stop=None,  # 没有特定的停止条件
#    temperature=0.7,  # 控制生成文本的随机性（0.0 表示完全确定，1.0 表示完全随机）
#)

LLM_url = "https://api.siliconflow.cn/v1/chat/completions"

payload = {
    "model": "deepseek-ai/DeepSeek-V3",
    "messages": [
        {
            "role": "user",
            "content": prompt,
        }
    ],
    "stream": False,
    "max_tokens": 512,
    "stop": ["null"],
    "temperature": 0.7,
    "top_p": 0.7,
    "top_k": 50,
    "frequency_penalty": 0.5,
    "n": 1,
    "response_format": {"type": "text"},
    "tools": [
        {
            "type": "function",
            "function": {
                "description": "<string>",
                "name": "<string>",
                "parameters": {},
                "strict": False
            }
        }
    ]
}

api_key = os.environ.get("API_KEY")  # 获取名为 "API_KEY" 的环境变量

headers = {
    "Authorization": "Bearer "+api_key,
    "Content-Type": "application/json"
}

response = requests.request("POST", LLM_url, json=payload, headers=headers)

print(response.text)

# 打印生成的文本
# print(response.choices.text.strip())