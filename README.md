# 小丑牌

一个不依赖构建工具的浏览器版“小丑牌”原型，视觉和回合结构参考了手机端 `Balatro`。

## 本地运行

直接打开 `index.html` 即可开始。

如果你想用本地服务器，也可以在当前目录执行：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 手机上分享给朋友

这个项目是纯静态网页，最适合直接部署到静态托管平台。

### 推荐方案：Vercel

1. 把当前目录上传到一个 GitHub 仓库。
2. 打开 [Vercel](https://vercel.com/) 并导入这个仓库。
3. Framework 选择 `Other`。
4. `Build Command` 留空。
5. `Output Directory` 留空。
6. 点击部署。

部署完成后会得到一个公开网址，手机浏览器直接访问即可。

### 备选方案：Cloudflare Pages

1. 把当前目录上传到一个 GitHub 仓库。
2. 打开 [Cloudflare Pages](https://pages.cloudflare.com/) 并连接该仓库。
3. 构建命令留空。
4. 输出目录填 `/` 或留空。
5. 点击部署。

### GitHub Pages

1. 把当前目录上传到 GitHub 仓库。
2. 在仓库 `Settings > Pages` 中选择从 `main` 分支发布。
3. 发布目录选根目录。
4. 等待生成公开链接。

仓库里已经附带：

- `vercel.json`：给 Vercel 的静态站点配置。
- `.nojekyll`：避免 GitHub Pages 按 Jekyll 方式处理。
- `.gitignore`：忽略系统垃圾文件。

## 玩法

- 每个底注会依次挑战 `Small Blind`、`Big Blind` 和 `Boss Blind`。
- 每次可选择 1 到 5 张手牌出牌，左侧会实时显示预估筹码、倍率和总分。
- 牌型会升级，打赢后本次打出的牌型会提升等级，后续基础分更高。
- 过关后进入商店，可以购买小丑或花费 1 金币刷新货架。
- 当前实现是 `Balatro inspired` 原型，不是完整复刻版本。
