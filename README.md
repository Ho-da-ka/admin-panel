# ZF 青少年体能培训教务管理平台 - 管理后台

## 技术栈
- Vue 3 + Vite
- Vue Router
- Element Plus
- Axios

## 运行方式
```bash
npm install
npm run dev
```

默认访问: `http://localhost:5173`

## 联调说明
- 前端代理 `/api` 到 `http://localhost:8080`
- 后端当前使用 HTTP Basic 认证
- 默认账号:
  - `admin / Admin@123`
  - `coach / Coach@123`

## 页面模块
- 仪表盘
- 学员管理
- 课程管理
- 考勤管理
- 体测管理
- 健康检查
