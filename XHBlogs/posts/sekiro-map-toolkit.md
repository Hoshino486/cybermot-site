---
title: "Sekiro Map Toolkit：把只狼整张地图搬进 Blender"
date: "2026-11-04T12:00:00+08:00"
description: "自建的只狼地图导出工具：MSB 摆放 + FLVER 模型 + MTD 材质 + TPF 贴图一键转成 .blend，坐标与 DSMapStudio 完全一致，附带内置工具管理器。"
cover: "/images/sekiro-map-toolkit-cover.webp"
tags: ["工具", "只狼", "Blender", "解包"]
---

解包只狼不难，难的是把解出来的东西**摆回原位**。

UXM 拆开游戏之后，你拿到的是几万个 `.flver`、几千个 `.msb`、一堆 `.mtd` 和 `.tpf`。模型能单独打开，但它们在哪、朝哪边、缩放多少 —— 这些信息散在 MSB 里，得自己解析、自己换算坐标、自己把贴图一个个对上。一个 m10 就有 6900 个物件、62 万个网格实例、1180 万顶点，手动摆是不可能的。

**Sekiro Map Toolkit** 就是为这一步写的：勾一张地图，它把摆放数据、模型、材质、贴图全解析出来，调 Blender 生成一个能直接打开的 `.blend`。位置、旋转、缩放和 DSMapStudio 里看到的完全一致。

> 仓库：<https://github.com/Hoshino486/SekiroMapToolkit>

## 一、它到底做了什么

一句话：**MSBS 摆放 + FLVER2 模型 + MTD 材质 + TPF 贴图 → Blender**。

拆开看是四件事：

1. **解析 MSB**：读出每个物件的模型名、位置、四元数旋转、缩放；
2. **解析 FLVER**：从 `mapbnd` / `objbnd` 里提取顶点、法线、UV、索引；
3. **解析 MTD + TPF**：把材质槽位对上贴图，DDS 转成不透明 PNG；
4. **拼装**：写 `meshes.bin` + `scene.json`，再让 Blender 跑脚本生成 `.blend`。

灯光、碰撞、导航、事件、敌人参数**一律不导** —— 目标是"拿到能看能渲染的地图"，不是还原游戏逻辑。

## 二、界面

![主页](/images/sekiro-map-toolkit/01-home.webp)

Avalonia 11 的无边框圆角窗，Fluent 暗色，左侧固定导航。七个页面各司其职：

| 页面 | 做什么 |
|---|---|
| **主页** | 数据规模统计（地图 / 地图块 / 物件）、一键导出全部 |
| **地图导出** | 勾地图 → 解析 → 调 Blender 出 `.blend` |
| **解包与校验** | 内置解包器一键下载启动，9 项完整性体检 |
| **贴图工具** | DDS 批量转不透明 PNG |
| **场景预览** | 读 `scene.json` 出统计，或渲一张缩略图 |
| **内置工具** | 各类解包/编辑工具 GitHub 直连下载 |
| **使用说明** | 流程、坐标约定、命令行、已知限制 |

每页配一张 1920×1080 的只狼插画背景，启动随机轮换，挂机每 4 分钟自动换图，也可以换成自己的图。

## 三、上手：三步

### 1. 准备文件

去 Releases 拿 `SekiroMapToolkit.exe`（自包含单文件，不用装 .NET），另外需要 `oo2core_6_win64.dll`。

这个 dll 是 Oodle 解压库，版权归 Epic Games，仓库不附带 —— 从你的只狼游戏目录或任意 Souls 工具包里拿一份放 exe 旁边就行，程序启动时也会自动去游戏根目录找。

### 2. 解包游戏

打开软件 → **解包与校验** → 点「下载并启动 Nuxe」（推荐）或 UXM：

![解包与校验](/images/sekiro-map-toolkit/03-unpack.webp)

1. Browse 指向 `sekiro.exe`
2. 点 Unpack；只想省空间就只勾 `map` / `obj` / `mtd`
3. 结果落在 `<游戏根>\文件\`，工具默认指向这里

导出真正用得上的只有四类文件：

```text
文件\map\mapstudio\m*.msb.dcx      摆放数据（哪些物件、在哪、怎么转）
文件\map\m*\m*_*.mapbnd.dcx        地图块模型（地形、建筑）
文件\obj\*.objbnd.dcx              场景物件模型（草木、宝箱、灯笼…）
文件\mtd\*.mtd                      材质定义（贴图槽位与默认贴图）
```

### 3. 导出

「地图导出」页确认三个路径（会自动探测）→ 勾地图 → **开始导出**。

![地图导出](/images/sekiro-map-toolkit/02-export.webp)

单张 m10 的规模：约 6900 物件、62 万网格实例、1180 万顶点。**35 秒出数据**，再做 `.blend` 大约 740 MB。

## 四、输出结构与几个关键设计

```text
<输出目录>\<地图名>\
├─ meshes.bin        每模型一份网格：顶点 / 法线 / UV / 索引，已是 Blender Z-up
├─ scene.json        材质表 + 每个物件的 loc / quat(w,x,y,z) / scale
├─ tex\*.dds         材质引用的原始贴图
└─ <地图名>.blend    最终场景（贴图已打包，换电脑也不丢图）
```

### 网格去重是能秒开的关键

`meshes.bin` 里**每个模型只存一份网格**，7000 多个物件靠 `scene.json` 的变换重复引用。所以 1800 万面打开还是很快 —— 如果每个物件都存一份顶点，文件会大到没边。

### 坐标只做一次换算

MSB 是 **X 右 / Y 前 / Z 上**，Blender 是 **X 右 / Y 进屏 / Z 上**。导出统一做 `(x, z, -y)`，四元数按 `(w,x,y,z)` 写入。

> 这一条别自己再改。物件的旋转顺序一旦被动过，场景会挤成一坨或者整体镜像。

### 材质与贴图

- albedo → Base Color（sRGB 色彩空间）
- normal → Normal Map（Non-Color）
- Roughness 固定 0.75，Metallic 0，双面不剔除
- DDS 在建模阶段就转成不透明 RGB PNG，**透明像素用邻域扩散填充**

最后这条是踩过坑的：树叶、纸片、栅栏这类带 alpha 的贴图，如果保留透明通道直接进 Blender，背面会发黑。用周围像素把透明区填满，等于给 mipmap 留了正确的边缘色。

## 五、剩下几个页面

### 贴图工具

![贴图工具](/images/sekiro-map-toolkit/04-textures.webp)

批量把 DDS 转 PNG，就是这个转换的独立入口。想手动处理某几张贴图时用。

### 场景预览

![场景预览](/images/sekiro-map-toolkit/05-preview.webp)

不用打开 Blender 也能先看一眼：读 `scene.json` 出统计信息，或者让 Blender 渲一张缩略图 —— 渲出来可以一键设为软件背景。

导出一张 m10 之后渲的整体效果：

![地图预览](/images/sekiro-map-toolkit/08-map-preview.webp)

### 内置工具

![内置工具](/images/sekiro-map-toolkit/06-tools.webp)

DSMapStudio、Nuxe、UXM、FLVER Editor、Yabber、DS Anim Studio、SoulsFormats、Havok Toolset —— 全部走 GitHub Release 直连下载，装好就能直接启动，不用再一个个去翻链接。

工具多的时候 GitHub 会限速，可以在设置里填一个 PAT 绕开。

## 六、命令行

界面之外也能跑，适合批量：

```bat
SekiroMapToolkit.exe --cli --root "E:\SteamLibrary\steamapps\common\Sekiro\文件" ^
  --out "E:\SteamLibrary\steamapps\common\Sekiro\文件\map\临时文件夹" ^
  --maps m10_00_00_00,m15_00_00_00 --blend
```

| 参数 | 含义 |
|---|---|
| `--root` | 解包目录（含 `map` / `obj` / `mtd`） |
| `--out` | 输出根目录 |
| `--maps` | 逗号分隔的地图名；省略或 `*` = 全部 |
| `--limit N` | 只导前 N 个模型（试跑用，0 = 全部） |
| `--blend` | 顺带生成 `.blend` |
| `--blender` | 指定 `blender.exe` |

内置工具也能命令行装：

```bat
SekiroMapToolkit.exe --cli --tools --list          :: 看状态
SekiroMapToolkit.exe --cli --tools                 :: 装全部
SekiroMapToolkit.exe --cli --tools --only Nuxe,Yabber
```

日志落在 `<输出目录>\cli_export.log`。

## 七、踩过的坑

| 现象 | 原因 / 处理 |
|---|---|
| `NoOodleFoundException` | 缺 `oo2core_6_win64.dll`，放 exe 旁边 |
| 提示「找不到 msb」 | `--root` 指错，或没解包 `map/mapstudio` |
| 物件挤成一坨 / 镜像 | `scene.json` 的 quat 被改过顺序，必须保持 `(w,x,y,z)` |
| 贴图缺一堆 | `obj` 的 TPF 名和材质路径对不上，先跑「完整性校验」 |
| `.blend` 打不开 / 卡死 | 用 Blender 4.2+，且命令行 `-b` 模式跑 |
| 内存爆 | 单张 m10 约 1800 万顶点，用 `--limit` 试跑或分批导 |
| 工具下载 404 | Release 资产改名了，去对应仓库 `/releases` 看一眼 |

## 八、已知限制

说清楚边界，比吹功能有用：

- 只导**模型 + 贴图 + 摆放**；光源、碰撞体、导航、事件、敌人参数一律不导；
- 云雾 / 天空壳体默认跳过（不透明雾壳会把整个场景挡死），可在设置里取消；
- 材质只做 Principled 近似（albedo + normal + 固定粗糙度），不还原游戏 shader 的视差、遮罩、顶点色；
- `m89_00_00_99` 是空测试图，导出来基本没东西，属正常现象；
- 界面壁纸为网络收集的同人插画，版权归原作者，仅供装饰。

## 九、许可

代码 MIT。只狼资源版权归 FromSoftware / 动视所有，**本工具不附带任何游戏资产** —— 所有模型和贴图都得你自己从正版游戏里解出来。

从源码编译需要 .NET 9 SDK：

```bat
git clone https://github.com/Hoshino486/SekiroMapToolkit.git
cd SekiroMapToolkit\src\SekiroMapToolkit.Avalonia

dotnet publish -c Release -r win-x64 --self-contained true ^
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true ^
  -p:EnableCompressionInSingleFile=true -o ..\..\_publish
```

产物 `_publish\SekiroMapToolkit.exe`，约 50 MB。

---

写这个工具的直接原因，是之前那篇 [UXM 解包](/posts/uxm-unpack) 里最后卡住的地方：模型导出来了，动画也能看了，但**整张地图摆不回去**。现在这一步被自动化了 —— 剩下的工作就是打开 Blender，调灯光，然后渲染。
