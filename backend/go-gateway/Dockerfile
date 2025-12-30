# Go 网关服务 Dockerfile
FROM golang:1.21-alpine AS builder

# 安装依赖
RUN apk add --no-cache git ca-certificates tzdata

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# 运行镜像
FROM alpine:3.18

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/main .
COPY --from=builder /app/configs ./configs

# 设置时区
ENV TZ=Asia/Shanghai

EXPOSE 8080 8081 9090

CMD ["./main"]

