# 使用官方 Ubuntu 作为基础镜像
FROM ubuntu:24.04

# 设置环境变量以避免交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 安装依赖项
RUN apt-get update && \
    apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# 验证 Node.js 和 npm 安装
RUN node -v && npm -v

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

RUN npx local-action . src/main.js .env.example

CMD [echo, hello]
