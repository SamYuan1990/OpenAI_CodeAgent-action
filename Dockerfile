# 使用官方 Ubuntu 作为基础镜像
FROM ubuntu:24.04

# 设置环境变量以避免交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 安装依赖项
RUN apt-get update && \
    apt-get install -y \
    curl \
    wget \
    tar \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# 验证 Node.js 和 npm 安装
RUN node -v && npm -v

ENV GO_VERSION=1.21.0
ENV GO_ARCH=linux-amd64
ENV GO_TAR=go${GO_VERSION}.${GO_ARCH}.tar.gz
ENV GO_URL=https://go.dev/dl/${GO_TAR}

# 下载并安装 Go
RUN wget ${GO_URL} -P /tmp && \
    tar -C /usr/local -xzf /tmp/${GO_TAR} && \
    rm /tmp/${GO_TAR}

# 设置 Go 的环境变量
ENV GOPATH=/go
ENV PATH=$PATH:/usr/local/go/bin:$GOPATH/bin

RUN go version

# 设置工作目录
WORKDIR /app
# SBOM and CVE
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ./
RUN go install github.com/devops-kung-fu/bomber@latest 

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .
RUN cd ./goAST && go build -o goASTBin . && cd .. && mv ./goAST/goASTBin .

RUN ls -al /app/goASTBin
RUN mkdir -p /workdir

CMD ["node","./src/index.js"]
