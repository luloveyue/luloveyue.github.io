# 写给悦宝宝的一封信

一个部署在 GitHub Pages 上的沉浸式信件网页。

## 页面体验

- 点击信封后播放翻盖、抽出信纸和场景淡入动画
- 适配桌面端与移动端
- 支持系统“减少动态效果”设置

## 目录结构

```text
.
├─ index.html
└─ assets
   ├─ css
   │  └─ style.css
   └─ js
      └─ main.js
```

## 本地预览

在项目根目录运行：

```powershell
python -m http.server 8765
```

然后访问 <http://127.0.0.1:8765/>。
