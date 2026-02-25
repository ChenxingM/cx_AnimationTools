# cx AnimationTools

Adobe After Effects 动画制作流程工具面板，基于 CEP (Common Extensibility Platform) 构建。

## 概述

cx AnimationTools 是一个现代化的 AE 扩展面板，使用 React + TypeScript + Vite 替代传统 ScriptUI 面板，提供更流畅的 UI 体验和更灵活的扩展能力。

当前包含的子模块：

### Layer Style Controller

图层样式快速编辑器，支持 9 种图层样式的属性查看与编辑：

- 内阴影 / 斜面和浮雕 / 投影 / 外发光 / 内发光
- 光泽 / 颜色叠加 / 渐变叠加 / 描边

**主要功能：**

| 功能 | 说明 |
|------|------|
| 样式导航 | 10 宫格按钮，左键选择 / 右键添加或删除样式 |
| 属性编辑 | 数值输入、拖拽 scrub、颜色拾色器、混合模式下拉 |
| 关键帧操作 | 添加 (K) / 前一帧 (◀) / 后一帧 (▶) / 删除 (－) / 全部 Hold (■) |
| P_Color 色块 | 最多 8 个颜色效果按钮，左键拾色 / 右键开关 |
| 图层命名 | 快速命名预设 + 后缀追加 |
| Solo / FX 切换 | 独立显示、效果一括开关（排除 Color Key） |
| 塗りの不透明度 | Blend Options 中 Fill Opacity 的独立控制 |
| 帧导航 | 前后帧移动 + 关键帧展开 (U) |

## 技术栈

- **[Bolt CEP](https://github.com/hyperbrew/bolt-cep)** — Vite + React + TypeScript 的 CEP 开发框架
- **React 19** — UI 渲染
- **TypeScript** — 面板侧 (ESNext) + 宿主侧 (ES3 ExtendScript)
- **Vite** — 面板侧打包 + HMR
- **Rollup + Babel** — ExtendScript 编译

## 项目结构

```
src/
├── js/                              # 面板侧 (React)
│   ├── main/
│   │   ├── index.html               # 入口 HTML
│   │   ├── index-react.tsx           # React 启动
│   │   ├── main.tsx                  # App 根组件
│   │   ├── components/
│   │   │   └── layer-style/
│   │   │       ├── LayerStylePanel.tsx     # 主面板
│   │   │       ├── HeaderRow.tsx           # 图层名 + 操作按钮
│   │   │       ├── PColorRow.tsx           # P_Color 色块
│   │   │       ├── StyleNavGrid.tsx        # 样式导航 10 宫格
│   │   │       ├── PropertyPanel.tsx       # 属性列表 + 塗り不透明度
│   │   │       ├── PropertyRow.tsx         # 单个属性行
│   │   │       └── hooks/
│   │   │           └── useLayerStyleState.ts  # 轮询 Hook
│   │   └── styles/
│   │       └── layer-style.css        # 全部样式
│   └── lib/                           # Bolt CEP 库 (CSInterface 等)
├── jsx/                              # 宿主侧 (ExtendScript)
│   ├── index.ts                      # 入口，注册命名空间
│   └── aeft/
│       └── aeft.ts                   # 16 个宿主函数
└── shared/                           # 双侧共享
    ├── layer-style-types.ts          # 接口 + 常量
    ├── shared.ts                     # CEP 配置
    └── universals.d.ts               # 事件类型
```

## 通信架构

```
React 面板                              AE 宿主 (ExtendScript)
─────────                              ──────────────────────
useLayerStyleState                     getLayerStyleState()
  │                                      │
  ├─ setInterval (200ms / 1000ms)        ├─ 读取选中图层
  │    └─ evalTS("getLayerStyleState")   ├─ 采集样式状态
  │         → JSON ──────────────────→   ├─ 采集属性值
  │         ← LayerStylePanelState ←──   └─ 返回完整状态 JSON
  │
  ├─ 用户操作
  │    └─ evalTS("setPropertyValue")     setPropertyValue()
  │    └─ evalTS("operateKeyframe")      operateKeyframe()
  │    └─ evalTS("toggleSolo")           toggleSolo()
  │    └─ ...                            ...
  │
  └─ 自适应轮询
       活跃时 200ms，空闲 3 秒后降至 1000ms
```

## 开发

### 环境要求

- Node.js 18+
- Adobe After Effects 2020 (v17.0) 及以上
- CEP 调试模式已启用

### 启用 CEP 调试模式

Windows (在注册表中设置)：

```
# AE 2020-2023 (CSXS 10)
reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f

# AE 2024+ (CSXS 11)
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

### 安装与开发

```bash
# 安装依赖
npm install

# 创建 CEP 扩展符号链接 (首次)
npm run symlink

# 启动开发服务器 (HMR)
npm run dev

# 在 AE 中打开: Window > Extensions > cx AnimationTools
```

### 构建

```bash
# 生产构建
npm run build

# 打包为 ZXP
npm run zxp

# 打包为 ZIP
npm run zip
```

## 兼容性

| 环境 | 版本 |
|------|------|
| After Effects | 2020 (v17.0) — 2026 (v26.0) |
| 操作系统 | Windows 10/11 |
| CEP Runtime | 9.0+ |
| Node.js (开发) | 18+ |

## 从 ScriptUI 版的改进

| ScriptUI (旧) | CEP React (新) |
|----------------|----------------|
| `onDraw` 自定义绘制 | CSS `background-color` + 伪元素斜线 |
| `scheduleTask` 200ms 固定轮询 | `setInterval` 自适应轮询 |
| `EditText` + 手动 scrub | `<input>` + `mousedown/move/up` |
| `DropDownList` | `<select>` |
| `win.layout.layout(true)` | React 自动 re-render |
| 不可扩展，单脚本 | 模块化组件，可添加新子面板 |
