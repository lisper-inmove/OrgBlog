# 使用官方 Node.js 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# COPY package.json .
# 
# RUN npm install

# 暴露容器端口，与 Next.js 项目的运行端口相同
EXPOSE 3000

RUN apk add --no-cache make

# 复制项目源代码到工作目录
COPY . .

# 启动 Next.js 应用
# CMD ["npm", "start"]
CMD ["make", "start"]
