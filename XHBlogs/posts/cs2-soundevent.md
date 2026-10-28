---
title: "CS2 SoundEvent 编写指南：从 .vsndevts 到批量生成"
date: "2026-10-28T23:10:00+08:00"
description: "CS2 声音事件的文件结构、KV3 写法、距离曲线、模板复用、编译试听，以及用在线 SoundEvent Generator 批量生成几十个事件的做法。"
cover: "/images/soundevent-cover.webp"
tags: ["CS2", "Source 2", "音频", "工具"]
---

在 CS2 里，声音不是「把一个音频文件丢进地图」就会响的。

地图里的 `ambient_generic`、`snd_event_point`，武器开火、脚步、UI、音乐盒，最后都指向同一个东西：**SoundEvent**。实体只认事件名，音量、距离、混响、用哪个音频文件，全都提前写在 `.vsndevts` 脚本里。

这篇分两部分：先把 SoundEvent 的文件结构和 KV3 写法讲清楚，再说怎么用在线工具少写一点、批量写一点。

> 在线工具：<https://cybermot.bomber.asia/tools/soundevent/>
> 它不负责编译，只负责把脚本写对、写快。编译和试听仍然在 CS2 Workshop Tools 里完成。

## 一、两层文件：音频与脚本

一个声音要进游戏，至少要经过两层：

| 层 | 源文件 | 编译后 | 作用 |
|---|---|---|---|
| 音频 | `sounds/.../wind_loop.wav` 或 `.mp3` | `.vsnd_c` | 真正被播放的声音 |
| 脚本 | `soundevents/.../*.vsndevts` | `.vsndevts_c` | 告诉引擎「怎么播」 |

目录大概是这样：

```text
content/csgo_addons/<addon>/
├─ soundevents/
│  └─ soundevents_addon.vsndevts
└─ sounds/
   └─ ambient/
      └─ wind_loop.wav

game/csgo_addons/<addon>/
├─ soundevents/
│  └─ soundevents_addon.vsndevts_c
└─ sounds/
   └─ ambient/
      └─ wind_loop.vsnd_c
```

`content` 是源文件，`game` 是编译产物。改完源文件，要在 Asset Browser 里重新编译，游戏里才会更新。

几个容易踩的点：

- 脚本里写的是 `.vsnd`，不是 `.wav` 或 `.mp3`。源文件格式无所谓，编译后会变成 `.vsnd_c`。
- 采样率按 44.1 kHz 准备，和 Source 2 保持一致，能省掉一些莫名其妙的变调问题。
- `soundevents_addon.vsndevts` 是 addon 的默认声音脚本。地图自己用，写在这里最省事；要做插件、或者多个地图共用，可以复制成 `abc.vsndevts`，但地图引用的默认文件不要随便改名。
- 一个 `.vsndevts` 里可以放很多个事件，不是「一个文件一个声音」。

## 二、一个事件的最小结构

先看一个能响的 3D 环境音：

```kv3
"Map.Ambient.Wind" =
{
    type = "csgo_mega"
    volume = 1.0
    pitch = 1.0
    use_distance_volume_mapping_curve = true
    vsnd_files_track_01 = [
        "sounds/ambient/wind_loop.vsnd",
    ]
    distance_volume_mapping_curve = [
        [ 0.0,   1.0, 0.0, 0.0, 2.0, 3.0 ],
        [ 900.0, 0.0, 0.0, 0.0, 2.0, 3.0 ],
    ]
}
```

拆开看：

| 字段 | 作用 | 备注 |
|---|---|---|
| `type` | 声音类型 | `csgo_mega` / `csgo_music`，下面单独说 |
| `volume` | 基础音量 | 默认 1.0，可以大于 1 |
| `pitch` | 音高 | 1.0 是原速，武器/脚步常用随机 pitch |
| `vsnd_files_track_01` | 音频文件列表 | **`csgo_mega` 用这个 key** |
| `vsnd_files` | 音频文件列表 | **`csgo_music` 用这个 key** |
| `use_distance_volume_mapping_curve` | 启用距离曲线 | 不写就按默认距离衰减 |
| `distance_volume_mapping_curve` | 距离—音量曲线 | 详见下一节 |
| `base` | 继承另一个事件 | 详见「模板」一节 |
| `vsnd_duration` | 音频时长 | 一般不用手写，编译时生成 |

### 三种 type

- **`csgo_mega`**：常规 3D 声音。有距离衰减、有左右声道，枪声、脚步、爆炸、环境音都用它。
- **`csgo_music`**：非定位声音。UI、音乐、音乐盒用它，玩家听到的效果和位置无关，音量通常还受 `snd_musicvolume` 影响。
- **`csgo_3d`**：早期遗留类型。官方脚本里几乎见不到，Hammer 里也不一定认，别用。

最坑的一点是文件列表的 key：

```kv3
// csgo_mega
vsnd_files_track_01 = [ "sounds/a.vsnd" ]

// csgo_music
vsnd_files = [ "sounds/b.vsnd" ]
```

写反了不会报错，也不会响。排查「为什么完全没声音」时，先看这里。

### 命名

事件名建议用 `a.b` 或 `a.b.c` 的分层写法：

```text
Map.Ambient.Wind
Map.Ambient.Water
Weapon_Custom.Single
UI.Map.Click
```

名字里不要有空格、引号、换行；工具里的事件名就是 KV3 的 key，填的时候不用自己加引号。

## 三、距离与曲线

`csgo_mega` 不写曲线时，默认的衰减距离很短，大概只有一百多个单位。想让声音传得远，就要自己写 `distance_volume_mapping_curve`。

曲线是一个数组，每个点 6 个数字：

```kv3
distance_volume_mapping_curve = [
    [ 0.0,   1.0, 0.0, 0.0, 2.0, 3.0 ],
    [ 200.0, 1.0, 0.0, 0.0, 2.0, 3.0 ],
    [ 900.0, 0.0, 0.0, 0.0, 2.0, 3.0 ],
]
```

只需要关心前两个：

- 第一个是**距离**（单位）；
- 第二个是**该距离处的音量系数**，会再乘上 `volume`。

后面四个是曲线切线之类的参数，照抄常见值即可。做环境音时，两到三个点就够：

- `0 → 1.0`：贴脸最响；
- `200 → 1.0`：保留一段近场；
- `900 → 0.0`：900 单位外听不见。

也可以做成「近处小、中间大、远处小」的起伏，但不要为了好看堆几十个点，编译和调试都会变麻烦。

两个常见误解：

1. **曲线拉到 99999 不等于 music。** 它仍然是 3D 声源，左右声道会随玩家朝向变化，只是距离衰减几乎没有了。
2. **`volume` 是总音量。** 曲线里的 1.0 不是「最大声」，只是「在这个距离上不打折」。

## 四、模板：用 base 复用参数

如果十几个事件的类型、音量、距离曲线完全一样，只是音频文件不同，可以抽一个 `base`：

```kv3
"Map.Ambient.Base" =
{
    type = "csgo_mega"
    volume = 0.8
    use_distance_volume_mapping_curve = true
    distance_volume_mapping_curve = [
        [ 0.0,   1.0, 0.0, 0.0, 2.0, 3.0 ],
        [ 1200.0, 0.0, 0.0, 0.0, 2.0, 3.0 ],
    ]
}

"Map.Ambient.Wind" =
{
    base = "Map.Ambient.Base"
    vsnd_files_track_01 = [ "sounds/ambient/wind_loop.vsnd" ]
}

"Map.Ambient.Water" =
{
    base = "Map.Ambient.Base"
    vsnd_files_track_01 = [ "sounds/ambient/water_loop.vsnd" ]
}
```

子事件里写了的字段会覆盖 `base` 的同名字段，没写的就继承。

注意：**base 名不要和服务器上其他 `.vsndevts_c` 重名**。多个 addon 的脚本同时加载时，重名的 base 可能互相串参数，表现是「某个声音突然变远/变响」。给自己的 base 加个前缀（比如 `Map.Ambient.Base`）最稳。

模板适合「参数长期统一」的场景。如果只是这次要生成几十个事件，之后各改各的，用下一节的批量生成更直接。

## 五、用在线工具写

工具地址：<https://cybermot.bomber.asia/tools/soundevent/>

它做的是「可视化表单 ↔ KV3 代码」双向同步：

![SoundEvent Generator 的可视化属性面板与 KV3 编辑器](/images/soundevent-editor.webp)

左边是属性面板，右边是实时 KV3。改左边，右边跟着变；直接改右边，左边也会同步解析。

界面分几块：

- **预设场景**：3D 环境音、UI、武器、脚步、音乐盒等常用模板，先选一个再改，比从空白开始快。
- **事件名称**：就是最终 KV3 的 key。
- **过滤与搜索**：按英文键名、中文名或说明搜属性，140 多个属性不用翻列表。
- **属性分组**：通用、播放、淡入淡出、3D 定位、距离曲线、遮挡混响、DSP、子事件、混音器等，按需展开。
- **实时编辑器**：CodeMirror，带 KV3 高亮、补全和校验；右上角绿色「格式正确」表示当前代码能通过解析。
- **属性注释**：打开后生成的代码里会带中文注释，适合教学或交付；正式文件里一般关掉。
- **分享**：把当前配置压进 URL 的 `#s=`，复制链接就能发给别人。
- **复制代码**：把当前事件块复制到剪贴板。

一个推荐流程：

1. 选一个最接近的预设；
2. 改事件名；
3. 只打开需要的属性，改音量、距离曲线、音频文件；
4. 看右栏的 KV3 是否符合预期，顺手点一下「格式化」；
5. 确认徽章是绿色，再复制。

工具的配置只存在浏览器本地（localStorage），刷新不会丢；换浏览器、清缓存就会回到默认值，重要配置记得复制出去。

## 六、批量生成

这是工具里专门为「几十个同参数事件」加的功能。点右上角「批量生成」：

![批量生成面板：每行一个事件，可单独指定音频路径](/images/soundevent-batch.webp)

输入规则很简单，每行一个事件：

```text
Map.Ambient.Wind
Map.Ambient.Water | ambient/water_loop.vsnd
Map.Ambient.Fire  | ambient/fire_loop.vsnd
Map.Ambient.Birds | ambient/birds_loop.vsnd
```

- 竖线 `|` 或 Tab 分隔「事件名」和「音频路径」；
- 不写路径的行，沿用当前可视化配置里的音频文件；
- 空行和 `#` 开头的行会被忽略；
- 「统一前缀」可以少打重复的 `Map.Ambient.`；
- 「包含 KV3 文件头」只在生成**独立文件**时勾选；粘贴进现有 `.vsndevts` 时不要勾。

生成前会做几项检查：事件名是否合法、是否重复、路径里有没有引号/花括号之类的非法字符。通过之后，右栏就是完整的多个事件块，可以复制，也可以直接下载 `.vsndevts`。

几个实践建议：

- **一次只批量同一类参数的事件。** 环境音、UI、脚步分开生成，别混在一个批次里。
- **命名先定好。** 事件名是地图/插件里要引用的，后面再改就要同步改调用方。
- **音频路径写相对 `sounds/` 的路径。** 例如 `ambient/water_loop.vsnd`，工具会自动补 `.vsnd`。
- **批量不处理 base。** 需要模板继承的，先在可视化面板里把 `base` 配好，再批量复制。

## 七、把结果放回文件

工具生成的是**事件块**，不是完整文件。最稳妥的做法是粘贴到现有 `.vsndevts` 的外层大括号里：

```kv3
<!-- kv3 encoding:text:version{e21c7f3c-8a33-41c5-9977-a76d3a32aa0d} format:generic:version{7412167c-06e9-4698-aff2-e63eb59037e7} -->
{
    "Map.Ambient.Wind" =
    {
        type = "csgo_mega"
        volume = 1.0
        vsnd_files_track_01 = [
            "sounds/ambient/wind_loop.vsnd",
        ]
    }

    "Map.Ambient.Water" =
    {
        type = "csgo_mega"
        volume = 1.0
        vsnd_files_track_01 = [
            "sounds/ambient/water_loop.vsnd",
        ]
    }
}
```

如果是新建一个独立的 `.vsndevts`，才需要文件头；工具里的「包含 KV3 文件头」只负责加第一行注释，不会替你加外层大括号。

事件之间留空行，纯属好读，不影响编译。

## 八、编译

打开 CS2 Workshop Tools，进 Asset Browser：

1. 搜索你的 `.vsndevts`；
2. 把脚本和用到的音频一起选中；
3. 右键 → **Full Recompile**。

编译完成后：

- `.vsndevts` → `.vsndevts_c`
- `.wav` / `.mp3` → `.vsnd_c`

产物在 `game/csgo_addons/<addon>/` 下。游戏读取的是 `_c` 文件，不是源文件。

Hammer 开着的时候，改 `.vsndevts` 通常会触发自动编译；如果没有，就手动 Full Recompile。还有一个常见的 Hammer 现象：新加的事件在 Sound Event Picker 里不出现，在 Asset Browser 里对文件做一次 Reload，再打开 Picker 就有了。

## 九、试听、实体与排查

### 控制台试听

```text
play Map.Ambient.Wind
```

事件名要和脚本里的 key 完全一致，大小写敏感。

### 实体播放

- `snd_event_point`：点声源，适合大部分环境音。
- `ambient_generic`：也能播，但记得勾选 **Is NOT Looped (32)**。不勾的话，很多情况下反而完全不播。

实体改不了脚本里写死的音量和距离，想调只能回脚本改。

### 常见问题

| 现象 | 优先检查 |
|---|---|
| 完全没声音 | `type` 和文件 key 是否匹配（mega 用 `vsnd_files_track_01`，music 用 `vsnd_files`） |
| 完全没声音 | 音频路径是否相对 `sounds/`、是否编译出 `.vsnd_c` |
| 完全没声音 | 事件名是否和 `play`/实体里填的一致 |
| 声音很小 | `volume`、距离曲线、`snd_musicvolume`（music 类型） |
| 远处听不见 | 没写曲线，或曲线终点距离太短 |
| 多个声音串参数 | `base` 名字和其他 `.vsndevts_c` 重名 |
| 变调/爆音 | 采样率不是 44.1 kHz，或 `pitch` 写错 |
| Picker 里没有 | 没编译，或 Hammer 没 Reload |

## 十、一份检查清单

写完一批事件，按这个顺序过一遍：

- [ ] 事件名统一、无空格、无重复；
- [ ] `type` 和文件 key 对得上；
- [ ] 每个路径都能在 `sounds/` 下找到对应的源文件；
- [ ] 距离曲线至少两个点，终点距离符合玩法；
- [ ] 需要模板的用了 `base`，且 base 名带前缀；
- [ ] 批量生成时没有混入不同参数的事件；
- [ ] 粘贴后外层大括号没有重复；
- [ ] Full Recompile 通过，`_c` 文件已生成；
- [ ] `play` 或实体试听正常；
- [ ] 换地图/换服务器后没有 base 串参数。

---

工具在这里：<https://cybermot.bomber.asia/tools/soundevent/>

它解决的是「写」的问题：可视化、校验、批量、分享。编译、试听、实体摆放仍然要在 Workshop Tools 里做——这几步目前没有捷径。

文件结构与编译流程部分参考了浊心陈布衣的《[Counter-Strike 2 音频自定义编写与编译](https://buyi.dev/2024/cs2-snd/)》，以及 Valve 的 [Addon Sounds](https://developer.valvesoftware.com/wiki/Counter-Strike_2_Workshop_Tools/Addon_Sounds) 文档；工具和批量生成部分来自这个站点的实践。
