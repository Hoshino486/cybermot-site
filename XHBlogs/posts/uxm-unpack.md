---
title: "UXM 解包：只狼的文件结构，和从老头环里把模型与动画搬出来"
date: "2026-11-02T12:00:00+08:00"
description: "UXM 的按钮、只狼解包后十八个目录各是什么，以及用 UXM + Yabber + Noesis + DSAnimStudio 把艾尔登法环的脚本、场景模型与角色动画导进引擎的完整流程。"
cover: "/images/uxm-cover.webp"
tags: ["解包", "只狼", "艾尔登法环", "FromSoftware"]
---

把 FromSoftware 的游戏拆开看，是这十年里最稳定的一门手艺。工具链换过几轮，思路没怎么变：**先用地基工具把游戏的封包整个摊开，再按文件类型找对应的二次解包器，最后把模型和动画转成引擎认的格式**。

这篇把两份资料合在一起写：一份是 bilibili 只狼 wiki 上关于 **UXM** 的条目，讲工具本身和只狼解包后的目录结构；另一份是一篇 2022 年的艾尔登法环解包笔记，讲从 `eldenring.exe` 一路走到 `.fbx` 的实操。

> 原文：<https://wiki.biligame.com/sekiro/UXM> · <http://includedark.com/index.php/archives/427/>
>
> 两边的截图都保留在文中对应位置，顺序与原作一致。

## 一、UXM 是什么

解包 FS 社出品的游戏的源文件。它干的事情很单一：把游戏打好的 `.bhd` / `.bdt` 封包拆成一个个原始文件，同时可以再打回去。本 wiki 里主要描述只狼的相关用途，艾尔登法环、黑魂系列同理。

下载地址：

- <https://github.com/Nordgaren/UXM-Selective-Unpack>

进入网址后点击右侧 **Releases**，下载软件同名压缩包（一般为 zip、rar、7z 等后缀），并解压。

### 基本界面

![UXM 主界面](/images/uxm/uxm-interface.webp)

### 各按钮功能

| 按钮 | 作用 |
|---|---|
| **Browse** | 浏览并选择需要解包的 exe 文件 |
| **Explore** | 打开当前选择的 exe 文件所在文件夹 |
| **Unpack** | 开始解包游戏文件 |
| **View Files / Use Selected Files** | 勾选 Use Selected Files 后，再用 View Files 勾选特定文件，Unpack 将只解包选定的文件，即**部分解包** |
| **Patch** | 修改 exe 文件使其加载解包文件而不是原本的文件。注意：如果没有解包就使用这个功能会让游戏闪退；只狼用 mod 引擎即可，这个功能用不上 |
| **Restore** | 恢复游戏根目录的原貌，即删除所有解包文件 |
| **Abort** | 终止当前操作 |

### 基本流程

1. 下载并解压后，运行 `UXM.exe`；
2. 程序会自动选择 `sekiro.exe` 的游戏路径（若非 Steam 正版只狼用户，则需要自行查找路径）；
3. 点击"解压"进行解包；
4. 等待进度条完成。

## 二、解包之后：这些文件夹都是什么

解包完成后，游戏文件夹内会新增多个文件夹，分别对应不同功能的游戏文件。

### action

里面有 `hks`（havokscript），与敌人和玩家的行为定义有关，可能是 AI 程序和动作之间关联的桥梁。

### chr

角色相关，四种封包各管一摊：

- **anibnd**：玩家和敌人的动作性能，可用 AnimStudio 查看或编辑；
- **behbnd**：人物的行为注册等，当前可用 `HkxConverter.dll` 解包，再用 vscode 等文本工具编辑；
- **chrbnd**：角色的模型和贴图（部分敌人无贴图）；
- **texbnd**：贴图文件，部分包含模型的贴图；也有一些敌人的贴图在 chrbnd 里，而 texbnd 中只有一些其他贴图（如永真脖子上的伤口）。顾名思义，tex 代表 texture。

### cutscene

过场动画中，相关角色的骨骼运动等。暂时不知道如何编辑，但已知文件名和 CG 编号一一对应。

### event

事件，可用 DarkScript 查看或编辑。

### facegen

魂系列祖传下来的捏脸系统。只狼的 facegen 用途未知，内含两个脸的图片。

### font

字体文件。

- `dbgfont` 是开发者菜单使用的字体（可用 Yabber 解包后用 PhotoShop 编辑）；
- 其他文件夹按「语言 + 地区_用途」命名，如 `zhoch_map` 意味着中文 + 中国_地图提示文字。`zhoch` 为简体中文，后缀 `map` 为跨地图时游戏中显示的文本所使用的字体，后缀 `std` 则为其他情况下使用的字体（如道具介绍），后缀 `texteffect` 顾名思义为一些效果类文字的字体（但这个似乎并没有实际用途）。

### map

地图文件。一般地图编辑器仅用于编辑 `map/mapstudio` 中的文件，这些文件定义了每个地图中有哪些敌人、有哪些物品、敌人和物品的位置、出现的条件以及一些相关参数。

### menu

`.gfx` 文件定义了图片文件如何划分网格以及每个网格对应的编号等等；`hi` 文件夹和 `low` 文件夹分别表示 high 和 low，也就是高清图片文件和低清图片文件，可用 Yabber 解包并用 Photoshop 编辑。

menu 中包含游戏中的各类图片素材：教程配图、buff 图标、各种载入页面背景、各种再战配图、各种鬼佛图片等等。

### msg

文本文件，按照「语言 + 地区_用途」命名。每个语言内的 `item` 文件包含 NPC 名称、道具、技能等描述，`menu` 文件则为各种菜单选项以及对话，可用 Yabber 解包及解码。

### mtd

材质文件，负责管理模型的贴图，可以用 MTD Editor 编辑和查看。

### obj

物品文件，如宝箱、火把、屏风等。其中 **007 系列为植被，253 系列为建筑模型，00909 系列为山体**（低模或贴图）。

物品文件类型 `.flver` 可用 FlverEditor 导出为 dae 格式，或者 Bloodborn Model Tool 导出为保留绑定信息的 `.smd` 格式。需要注意的是，两种方法提取出来的模型 UV 有存在差异的可能，其中 FlverEditor 导出的模型 UV 可以完美适配使用 Yabber 解包后 `.tpf` 文件中的贴图。

在 `.tpf` 文件中：

- 贴图后缀 **a**（Albedo）为漫反射（颜色）贴图；
- 后缀 **n** 为法线（Normal）贴图，也可视为**粗糙度／金属度**贴图与**高度**贴图的合并 —— 考虑到节省游戏性能的特点，这里更有可能为 bump 类型 —— 可使用渲染器的 RGB 通道提取功能分别从 B 通道和 G 通道中提取。

### other

和游戏内通用污渍图（decal texture）以及一部分地形贴图（map texture）有关。

### param

顾名思义为 parameter：

- `drawparam` 内含渲染参数，如光照设置等；
- `gameparam` 为游戏参数，可直接用参数编辑工具或者 Yapped 进行查看和编辑，但是用 Yabber 解包后便无法直接编辑；
- `graphicsconfig` 包含各类图形显示参数。

### parts

玩家的所有模型。命名规则：`am` = arm、`bd` = body、`fc` = face、`hd` = head（实际上应该是头发）、`lg` = leg、`wp` = weapon，靠前的 `_m` 表示 male。

这个文件夹内包含原皮、所有皮肤、废案皮肤；`wp` 开头的包含楔丸、不死斩和所有义手忍具；还有一些文件，后缀 `_I` 表示"模型备份"，后缀 `_m` 表示"贴图备份"。

- **90XX 和 91XX** 为狼的外观文件（头的话为 01X0 或 02X0），其他的为废案（如 9500、991X 等等）；
- 武器 **300** 为楔丸，**310** 为拜泪，**7XX** 为忍具，其他的为废案（如 9XXX）。

parts 里的文件用 Yabber 解包后可以使用 FlverEditor 进行修改，`tpf` 后缀文件可以再用 Yabber 解包后用 Photoshop 修改。

### script

脚本文件，大多数为敌人的 AI 文件，包括行为逻辑和战斗逻辑，需要使用 Yabber 解包后再用 LuaDecompiler 进行解码。

`talk` 文件夹内包含与对话、鬼佛功能有关的信息，用 Yabber 解包后无法编辑，需要用 Esdtool 解包。

### sfx

视觉特效文件。解包后内含三个文件夹：

- `effect`：视觉效果，用 FXMLR 进行编辑解包、编辑和打包，使用方法和 Yabber 基本一样；
- `model`：模型，用 FlverEditor 进行修改；
- `tex`：贴图，用 Yabber 解包后再用 PhotoShop 编辑。

### sound

音频文件，可用 DSSI 读取和替换。

- `fsb` 文件为 fmod sound bank，也就是 fmod 制作的音频包（内含多个音频）；
- `fev` 为 fmod event，即播放音频时用于控制的事件，指导了 fsb 中的音频应该何时按何顺序播放。

可以使用 fmod studio 实现新增音频。

### _backup 与 _unknown

分别表示备份和未知（unknown 里也会包括重复解出的文件），实际用途未知。

> ⚠️ **注意：任何人脸、眼球的贴图文件都不建议深夜打开。**

## 三、换个游戏：艾尔登法环

只狼的结构上面讲完了，但从"解包"到"能用的模型"，中间还要过一串工具。下面这段是老头环的流水线，流程本身对只狼同样成立。

### 解包相关工具

| 工具 | 功能 | 相关链接 | 需求 |
|---|---|---|---|
| UXM | 用于对游戏本体进行解包与打包 | <https://github.com/JKAnderson/UXM> | .NET 4.7.2 |
| Yabber | 对文件进行解包，支持 .bnd、.bhd/.bdt、.dcx、.fltparam、.fmg、.gparam、.luagnl、.luainfo、.tpf 格式 | <https://github.com/JKAnderson/Yabber> | .NET 4.7.2 |
| Yapped | 用于对参数进行修改 | <https://github.com/JKAnderson/Yapped> | .NET 4.7.2 |
| Noesis | 用于转换文件格式，将 .flevr 转为 .fbx | 无 | - |
| FLVER_Editor | 用于编辑 .flevr 模型文件 | <https://github.com/asasasasasbc/FLVER_Editor> | - |
| DSAnimStudio | 用于编辑查看 .TAE 动画文件 | <https://github.com/Meowmaritus/DSAnimStudio> | .NET 5.0 |
| DSLua | 用于反编译二进制 Lua 文件 | <https://github.com/katalash/DSLuaDecompiler> | - |
| BloodborneTools | 将 .flver 文件解包获得 .smd 与 .ascii 格式 | 无 | - |
| Flver2Smd&Ascii | 用于批处理的 .bat 文件 | 无 | - |
| FromSoftware-Blender-Importer | 用于将 .dcx 格式的模型导入 Blender 的插件 | <https://github.com/FelixBenter/FromSoftware-Blender-Importer> | - |
| Havok Content Tools | 将动画资源格式进行转换（暂时不支持法环资源） | 无 | - |
| HavorkMax | 3DsMax 插件，用于将解包的动画文件导入（不支持法环的 2018 havok 动画资源，需要降版本至 2014 及以下） | <https://github.com/PredatorCZ/HavokMax> | - |

### 解包游戏本体

> 解包前建议备份一份游戏本体。**在不禁用 EasyAntiCheat 的情况下进入被修改的游戏会直接封号。**

首先需要 UXM 对游戏本体进行解包：点击 **Browse** 找到 `eldenring.exe` 路径，点击 **Unpack** 进行解包。

![选择 exe 并解包](/images/uxm/step-01.webp)

解包后已经可以通过文件名大致了解包含内容，接下来需要使用 Yabber 再次进行解包。由于不同格式文件所需解包方法不同，下面拆成脚本文件、场景模型、角色动画分别讲。

![解包出来的目录](/images/uxm/step-02.webp)

### 脚本文件解包

找到 `script` 文件夹，将所有 `.dcx` 文件选中后拖拽至 Yabber 上。

![拖拽 dcx 到 Yabber](/images/uxm/step-03.webp)

现在每一份 `.dcx` 文件都被提取出了 `.lua` `.luagnl` `.luainfo` 三份文件，我们将所有 `.lua` 文件复制出来放到一个文件夹内。

接下来需要对 `.lua` 文件进行反编译：将 `.lua` 文件默认打开方式改为 `DSLuaDecompiler.exe`，在 DSLua 文件夹下即可找到，反编译后的文件名末位会出现 `.dec` 字段，现在修改打开方式为你的 IDE 工具便可以查看脚本源码。

通过查看 `goal_list.dec` 文件可以找到对应的脚本编号。

![goal_list.dec 里的脚本编号](/images/uxm/step-04.webp)

### 解包场景模型

找到 `map` 文件夹，里面 `m10`、`m11`、`m12`…… 中包含地图关卡模型，目前未找到编号与关卡的对应表，只能逐个测试。

我们打开 `m10` → `m10_00_00_00`，这里包含了史东薇尔城的相关模型，将所有 `.mapbnd.dcx` 拖拽到 Yabber 工具上进行解包。

![m10 目录](/images/uxm/step-05.webp)

每个 `.dcx` 都提取出了 `.flver` 与 `.grass` 文件，我们将所有 `.flver` 文件复制到一个新文件夹下，将 `.flver` 文件默认打开方式改为 `BloodBorne_model_v3.exe`，在 BloodborneToolsByDaemon 文件夹下可以找到。

![flver 与 grass](/images/uxm/step-06.webp)

再将 `Flver2Smd&Ascii.bat` 文件复制到刚才新文件夹的根目录下，运行该文件对 `.flver` 文件进行批处理。

![批处理 flver](/images/uxm/step-07.webp)

现在我们通过 `.flver` 得到了一份 `.smd` 文件，一份 `.ascii` 文件。

![smd 与 ascii](/images/uxm/step-08.webp)

打开 `Noesis.exe` 应用，将 `.flver` 转为我们引擎可以使用的 `.fbx` 格式。找到刚才新文件夹的根目录，点击 **Tools → Batch Process** 进行格式转换。

这里点击 FLVER 文件可以预览模型，但会出现线条乱飞的情况，选择 ASCII 格式的文件可以看到修复后的效果。

![Noesis 批量转换](/images/uxm/step-09.webp)

将输出格式改为 `fbx`，点击 **Folder batch** 选择输出路径，最后点击 **Export** 进行导出。

![导出为 fbx](/images/uxm/step-10.webp)

现在我们获取到了 `.fbx` 格式的文件，导入到引擎中看一下效果。

![导入引擎](/images/uxm/step-11.webp)

### 解包角色动画

打开 `DS ANIM STUDIO.exe`（在 `PATREON_DSAS_4.0.1.1_BETA` 文件夹下），确保软件版本在 4.0 及以上，运行环境需要 .NET 5.0。

![DSAnimStudio 版本](/images/uxm/step-12.webp)

点击 **File → Open**，找到本体解包后目录下的 `chr`，打开任一后缀为 `.anibnd.dcx` 的文件，确保前面仅有 c0000 数字组合，如：`c2010.anibnd.dcx`。

通过查看 `goal_list.dec` 文件中前四位数字可以找到对应角色动画。

![goal_list.dec 前四位](/images/uxm/step-04.webp)

打开 `.anibnd.dcx` 后会提示我们选择模型文件，我们找到相同编号的 `.chrbnd.dcx` 文件。

![选择 chrbnd](/images/uxm/step-13.webp)

![载入模型](/images/uxm/step-14.webp)

现在可以在 DS ANIM STUDIO 中看到动画事件并可以直接进行编辑。

![动画事件](/images/uxm/step-15.webp)

#### 将动画格式转为 fbx 的方法

由于老头环导出的动画文件为 havok 2018 版本，目前插件并不支持导入，需要降版本至 2014 及以下才能导入。

最新的 DSAnim 4.1 版本加入了降版本工具，可以将动画降至 2010.2 的 `.hkx` 文件。

![降版本工具](/images/uxm/step-16.webp)

使用 3DMax 导入插件，在 3DMax 中进行格式转换。插件地址 <https://github.com/PredatorCZ/HavokMax>，安装方法：将下载好的 `.dlu` 文件放置在根目录下的 `Plugins` 文件夹内后重启软件即可。

在 3DMax 中选择 **File → Import → Import**，找到 `skeleton.hkx` 骨骼文件打开。

![导入 skeleton.hkx](/images/uxm/step-17.webp)

导入轴向按照下图所示。

![导入轴向](/images/uxm/step-18.webp)

现在已经导入了我们的骨骼，接下来按照相同的流程，导入 `.hkx` 的动画文件，具体动画对应可以在 DSAnim 中进行预览。

![导入动画 hkx](/images/uxm/step-19.webp)

导出时选择 **File → Export → Export**，选择想要的格式导出即可。

> 由于没有导入模型，想要在引擎中看到表现效果需要自行蒙皮或重定向。

## 四、收尾

走到这里，一条完整的链路就通了：

```
UXM 解整个包  →  Yabber 拆 bnd/dcx  →  按类型分头处理
                                        ├─ 模型：FlverEditor / BloodborneTools → Noesis → fbx
                                        ├─ 脚本：LuaDecompiler → dec
                                        └─ 动画：DSAnimStudio → 降版本 → 3dsMax → fbx
```

几个真正会卡住人的点，单独拎出来：

1. **先备份游戏本体**，并且注意 EAC —— 带反作弊进修改过的游戏是直接封号，不是警告；
2. **UV 会不一样**：FlverEditor 导出的 UV 与 Yabber 拆出的 `.tpf` 贴图对得上，Bloodborne 那条 smd 路线可能对不上，得自己校；
3. **动画要先降版本**，havok 2018 的 `.hkx` 现在没有能直接吃的插件；
4. **`.tpf` 里的 `n` 不是单纯的 Normal**，它把粗糙度、金属度、高度打包进了 RGB 通道，做 PBR 时要按通道拆；
5. 名字里带 `_backup`、`_unknown` 的，多数情况下可以不管 —— 它们本来就是解包过程的副产物。

最后再重复一遍 wiki 上那句提醒：**别深夜翻人脸和眼球的贴图。**
