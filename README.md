# 桌面小狗

一只常驻 Windows 桌面的透明悬浮电子宠物。它会眨眼、发呆、摇尾巴，偶尔（而非持续）转头看向鼠标；双击可以摸它。外部服务可通过 HTTP 推送消息，消息只有点击“我知道了”后才会消失，重启应用也不会丢失。

## 运行

需要 Node.js 20 或更高版本：

```powershell
npm install
npm start
```

打包 Windows 安装包和免安装版：

```powershell
npm run pack:win
```

产物位于 `dist`。托盘菜单可打开实际生效的用户配置文件；修改后重启应用生效。
如果所在网络访问 GitHub 较慢，可先设置 `ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/`。

## 发送消息

默认监听 `0.0.0.0:17321`，可从本机或局域网访问。部署时应设置 API Key，并将防火墙访问范围限制为可信网络：

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:17321/api/messages `
  -ContentType 'application/json' `
  -Body '{"title":"温馨提醒","text":"该起来喝水啦！","source":"健康助手","priority":"normal"}'
```

接口：

- `POST /api/messages`：新增消息，`text` 必填；可选 `title`、`source`、`priority`（`low|normal|high`）。
- `GET /api/messages`：查看所有尚未确认的消息。
- `POST /api/messages/{id}/ack`：确认消息。
- `GET /health`：健康检查。

设置 `server.apiKey` 后，调用时增加 `Authorization: Bearer <apiKey>` 请求头。Windows 防火墙建议仅允许 `LocalSubnet` 访问 TCP 17321，而不是暴露到公网。

## 可配置项

配置涵盖宠物名称/尺寸/停靠位置、随机注视概率及持续时间、眨眼和发呆频率、同时显示的消息数量、监听地址和鉴权密钥、开机启动与置顶行为。首次启动后，从托盘右键菜单选择“打开配置文件”即可编辑。

> 背景区域为鼠标穿透，不妨碍操作桌面；宠物、消息按钮及右键菜单区域可交互。
