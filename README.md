# 拍照答题系统

基于千问QVQ-Max大模型的拍照答题系统，可以上传题目图片并获取AI解答。系统使用专业的题目解答提示词，能够准确地对图片中的作业题进行解答，并给出详细的解题思路和答案。

## 功能特点

- 简洁的单页面应用
- 支持图片上传（拖拽或点击上传）
- 使用千问QVQ-Max大模型进行题目解析
- 实时流式响应，支持Markdown格式化显示
- 专业的题目解答提示词，输出格式规范
- 支持Docker一键部署

## 快速开始

### 设置API密钥

在使用前，您需要获取阿里云DashScope的API密钥：

1. 访问[阿里云DashScope](https://dashscope.aliyun.com/)并注册/登录账号
2. 在控制台中获取您的API密钥
3. 打开项目根目录下的`.config`文件，将您的API密钥填入：

```
DASHSCOPE_API_KEY=your_api_key_here
```

### 本地运行

您可以通过以下方式在本地运行应用：

1. 直接在浏览器中打开`index.html`文件
2. 或使用任何静态文件服务器，例如：

```bash
# 使用Python的HTTP服务器
python -m http.server

# 或使用Node.js的http-server（需要先安装）
npx http-server
```

### Docker部署

使用Docker可以快速部署应用：

1. 构建Docker镜像：

```bash
docker build -t photo-qa-app .
```

2. 运行Docker容器：

```bash
docker run -p 8080:80 photo-qa-app
```

3. 在浏览器中访问 `http://localhost:8080`

## 使用方法

1. 上传题目图片（点击上传区域或拖拽图片）
2. 点击"获取答案"按钮
3. 等待AI分析并查看解答结果

系统会自动使用专业的提示词指导模型进行解答，确保输出格式规范、解题思路清晰。

## 技术说明

- 前端：纯HTML/CSS/JavaScript实现
- API：使用阿里云DashScope的千问QVQ-Max模型
- 流式响应：实时显示AI回答，支持Markdown格式化
- 专业提示词：内置专业的题目解答提示词，确保输出格式规范
- 部署：支持静态部署和Docker容器化部署

## 注意事项

- API密钥请妥善保管，不要泄露给他人
- 本应用仅用于学习和测试目的
- 在生产环境中使用时，建议增加更多的安全措施

## 许可证

MIT
