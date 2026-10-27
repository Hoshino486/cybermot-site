---
title: "从零搭一个 CS2 跑图服，并装上 ZePractice"
date: "2026-10-27T15:40:00+08:00"
description: "SteamCMD 装专服、Metamod 与 CS2Fixes 打底、CounterStrikeSharp 跑插件、配置 ZePractice，再到全部练习与管理命令。"
cover: "/images/local-server-cover.webp"
tags: ["工具", "CS2", "教程"]
---

这篇把整条路走完：**从一台空机器，到一个能 `connect` 进去、能敲 `!zemenu` 的跑图服。**

中间要装四层东西（专服 → Metamod → CS2Fixes → CounterStrikeSharp），最后才是 ZePractice 这个插件。每一步都写清楚「装到哪、怎么验证」，以及会卡住人的点。

## 零、准备

| 项目 | 要求 |
|---|---|
| 系统 | Windows x64 |
| 磁盘 | 60 GB 以上 |
| SteamCMD | 下载专服本体，匿名登录，不用买游戏 |
| Steam 客户端 | **要装**，工坊下载依赖它，但不用登录也不用买游戏 |
| .NET | 10.0 运行时（跑 CSS）；10.0 SDK 只在你自己编译插件时需要 |
| 时间 | 首次下载 20～40 分钟 |

开服的机器和你打游戏的机器可以是同一台，本机连 `127.0.0.1` 就行。

## 一、装专服本体

建一个根目录，比如 `D:\cs2server`，把 SteamCMD 解压进去：

```text
D:\cs2server\
└── steamcmd\
    └── steamcmd.exe
```

在 `steamcmd` 目录里新建 `download.bat`：

```bat
steamcmd.exe +force_install_dir D:\cs2server\cs2 +login anonymous +app_update 730 validate +quit
pause
```

双击运行，等它下完。结构是：

```text
D:\cs2server\cs2\
└── game\
    ├── bin\win64\cs2.exe      ← 服务端主程序
    └── csgo\
        ├── cfg\
        ├── addons\           ← 所有插件装这里
        └── maps\
```

> `730` 就是 CS2 本体的 app id，专服和客户端共用。网上的 `740` 是 CS:GO 时代的，别用。

以后更新专服重复这条命令，但**必须先关掉服务器**。

## 二、装 Metamod:Source

所有插件的底座。去 [metamodsource.net](https://www.metamodsource.net/) 下 **2.0 的 dev 版**（CS2 必须 2.0，1.x 是 CS:GO 的）。

把解压出的 `addons\metamod` 整个目录放到：

```text
game\csgo\addons\metamod\
```

然后改 `game\csgo\gameinfo.gi`，在 `SearchPaths` 里加一行：

```text
SearchPaths
{
    Game    csgo
    Game    csgo/addons/metamod     ← 加这行
    Game    csgo/bin/win64
    ...
}
```

位置在 `Game csgo` 下一行即可（一般第 22 行附近）。

> ⚠️ 每次 SteamCMD 校验或更新专服，`gameinfo.gi` 都可能被还原。症状是「插件全部消失」——先回来看看这行还在不在。

## 三、装 CS2Fixes

CS2Fixes 负责实体修补和地图参数，ZE 地图的 boss、传送、倒计时都依赖它。

从 [Source2ZE/CS2Fixes](https://github.com/Source2ZE/CS2Fixes) 下载发布包，解压到：

```text
game\csgo\addons\cs2fixes\
```

配置在 `addons\cs2fixes\configs\`，其中 `maplist.jsonc` 是地图列表，后面配工坊地图要用。

## 四、装 CounterStrikeSharp

ZePractice 跑在 CounterStrikeSharp（CSS）上。

1. 从 [roflmuffin/CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp) 下发布包
2. 解压到 `game\csgo\addons\counterstrikesharp\`
3. 装 **.NET 10 运行时**（不是只有 SDK）

装好后应该有：

```text
addons\counterstrikesharp\
├── api\             ← 编译插件时引用这里的 DLL
├── plugins\         ← 插件放这里
├── configs\plugins\ ← 插件配置
└── dotnet\          ← 运行时
```

## 五、装上 ZePractice

把 `ZePractice.dll` 放到：

```text
game\csgo\addons\counterstrikesharp\plugins\ZePractice\ZePractice.dll
```

自己编译：

```powershell
dotnet build ZePractice.csproj -c Release -p:CssApiDir="D:\cs2server\cs2\game\csgo\addons\counterstrikesharp\api"
```

**第一次启动后**配置才会生成：

```text
game\csgo\addons\counterstrikesharp\configs\plugins\ZePractice\ZePractice.json
```

## 六、改配置：先把这五项填对

配置项很多，跑起来先改这几个就够：

| 配置项 | 默认 | 说明 |
|---|---|---|
| `OwnerSteamIds` | `[]` | **必填**，服主 SteamID64 列表 |
| `PracticeMode` | `true` | 练习模式（跑图就要这个） |
| `AllowEveryonePracticeCommands` | `true` | 允许所有人用 `!ze_god` 这类练习指令 |
| `TrustLoopbackAdmin` | `true` | 本机玩家自动拿临时管理权限，单人调试省事 |
| `MenuUiMode` | `"chat"` | 菜单用聊天框渲染；装了工坊界面包可改 `panorama` |

```jsonc
{
  "OwnerSteamIds": ["7656119xxxxxxxxxx"],
  "PracticeMode": true,
  "AllowEveryonePracticeCommands": true,
  "TrustLoopbackAdmin": true
}
```

> 不知道自己 SteamID64？进服敲 `!ze_whoami`，它会回给你。

其余按需开，默认值一般够用：

| 分组 | 关键项 | 作用 |
|---|---|---|
| 自动复活 | `AutoRespawn` / `RespawnDelaySeconds` | 死了自动复活，默认 1 秒 |
| 弹药与碰撞 | `UnlimitedAmmo` / `NoBlock` | 无限弹药、玩家不互相挤 |
| 地图参数 | `ApplyFysMapParameters` / `FysRoot` | 读取 FYS 地图参数（boss、参数、翻译） |
| HUD | `BossHud` / `MapTranslations` / `TranslationCountdown` | boss 血条、地图翻译、倒计时 |
| 工坊 | `WorkshopUpdates.CheckIntervalSeconds` | 默认 60 秒查一次更新 |
| 换图 | `MapVote.MaximumCandidates` | 候选图上限 |
| 标记 | `MapMarkers.ButtonChickens` / `MapWeaponGlow` | 按钮绿鸡、地图枪发光 |
| 指挥 | `Commander.Enabled` | 默认关；要先发布并挂载对应工坊资源包才能开 |
| 神器 | `EnableItemWatch` | 神器绑定诊断，管理员用 `!itemwatch` |

## 七、准备 server.cfg

在 `game\csgo\cfg\ze-practice\` 建 `server.cfg`：

```text
hostname "ZE Practice"
sv_lan 1

// 练习服基本盘
sv_cheats 1              // 允许作弊指令（练习模式必须）
mp_buytime 99999         // 随时能买
mp_startmoney 16000      // 开局满钱
mp_freezetime 0          // 取消开局定身
mp_autokick 0            // 不自动踢人
mp_autoteambalance 0     // 不自动平衡
mp_limitteams 99         // 不限制人数差
mp_buy_anywhere 1        // 去掉购买区域限制
sv_infinite_ammo 1       // 无限弹药
sv_falldamage_scale 0    // 取消摔伤
bot_quota 1
bot_stop 1               // Bot 别乱跑
```

RCON 密码单独放一个文件，别写死在多处：

```text
game\csgo\cfg\ze-practice\rcon.generated.cfg
```

```text
rcon_password "自己生成一串"
```

## 八、启动

```bat
cs2.exe -dedicated -insecure -console -usercon ^
  -consolelog_append -con_logfile "D:\cs2server\logs\console.log" ^
  -ip 127.0.0.1 -port 27015 ^
  +servercfgfile ze-practice/server.cfg ^
  +game_alias casual ^
  +exec ze-practice/rcon.generated.cfg ^
  +exec ze-practice/server.cfg ^
  +map de_dust2
```

| 参数 | 作用 |
|---|---|
| `-dedicated` | 专服模式 |
| `-insecure` | 关 VAC，本地测试用；公网服别加 |
| `-console -usercon` | 开控制台并允许 RCON |
| `-consolelog_append` | 控制台输出写日志 |
| `-ip` / `-port` | 绑定地址与端口 |
| `+servercfgfile` | 每次换图都执行的 cfg |
| `+game_alias casual` | 游戏模式 |
| `+exec` | 执行 RCON 密码和服务器配置 |
| `+map de_dust2` | **先加载一张内置图**（原因见下节） |

**两个常见卡点：**

1. **第一次启动闪退** —— 大概率不是参数错，是这台机器没装 Steam 客户端。装上（不用登录）再启动就好。
2. **参数没生效** —— 启动命令里没写 `+exec` 的话，进服后在服务器控制台补一句 `exec ze-practice/server.cfg`，否则那些参数一条都没读。

看到控制台刷出 `ss_loading -> ss_active`，说明地图进 active 了。

## 九、进图与工坊两段启动

本机客户端按 `~` 打开控制台：

```text
connect 127.0.0.1:27015
```

进图后敲 `!zemenu`，能弹菜单就说明插件正常。

**换工坊地图是最大的坑。** 直接把 `+host_workshop_map` 写进启动参数，服务器会卡在 `Idle console`，地图永远不加载。正确做法是两段：

```text
第一段：+map de_dust2                  启动内置图
第二段：host_workshop_map 3817448617    （等 active 后，用 RCON 发）
```

日志里会出现：

```text
Loading custom game "3817448617" with map "ze_forhidden_slicoo_cn"
```

原因：**SteamGameServer、UGC 下载和 game frame 都要等第一张图跑起来才存在**，没有这些，工坊下载没有执行环境。

### 地图列表里的工坊 ID 要写对

CS2Fixes 的 `maplist.jsonc`：

```jsonc
{
  "Maps": [
    {
      "Name": "ze_forhidden_slicoo_cn",
      "workshop_id": 3817448617
    }
  ]
}
```

- ✅ `"workshop_id": 3817448617`（数字）
- ❌ `"publishedfileid"` —— 字段名不对
- ❌ `"workshop_id": "3817448617"` —— 字符串不认

配好后 `!ze_map <地图名>` 会保留工坊身份，走 `host_workshop_map`。

## 十、命令手册

### 菜单怎么开

| 按键 | 作用 |
|---|---|
| `F9` / `Z` | 主菜单 |
| `F10` | 聊天数字菜单 |
| `7` / `8` | 翻页 |
| `9` | 返回 |
| `0` | 关闭 |

也可以直接敲 `!zemenu`。所有聊天命令以 `!` 开头；控制台里对应写法是 `css_` 前缀。

### 练习跑图（练习模式）

| 命令 | 作用 |
|---|---|
| `!ze_god` | 无敌 |
| `!ze_noclip` | 穿墙 |
| `!ze_save` | 存一个点 |
| `!ze_tp` | 回到存点 |
| `!ze_reset` | 清掉存点 |
| `!ze_respawn` | 原地复活 |
| `!ze_goto <玩家>` | 传送到某人身边 |
| `!zerefill` | 补满弹药和道具 |

存档点**按地图隔离**，新回合/换图自动清理；多人 ZE 下这些会被撤销。

### 玩家通用

| 命令 | 作用 |
|---|---|
| `!zemenu` / `!zhelp` / `!ze_status` | 菜单、帮助、地图与配置状态 |
| `!ze_maps [筛选]` | 候选选图 |
| `rtv` | 换图投票，**严格超过 80%** 才生效 |
| `!items` | 当前地图神器持有者与冷却 |
| `!zeweapon` / `!zebuy <名称>` | 补给武器与手雷 |
| `!zeclass` / `!zskill` | 职业与技能 |
| `!ze_whoami` | 本人 SteamID64 与权限 |

### 管理员

用 `!zeadmin` 打开管理菜单，或者直接敲：

| 命令 | 作用 |
|---|---|
| `!ze_mode practice` / `!ze_mode ze` | 切换练习 / 多人 ZE |
| `!ze_restart` / `!ze_reload` | 重启回合 / 重载本图配置 |
| `!ze_map <完整地图名>` | 切换本机已装地图 |
| `!ze_respawn` / `!ze_bring` / `!ze_slay` / `!ze_kick` / `!ze_team` | 玩家管理，目标支持 `#userid`、SteamID64、唯一名称 |
| `!ze_ban <玩家> [分钟] [原因]` | 默认 60 分钟，`0` 为永久 |
| `!ze_mute` / `!ze_gag` | 默认 30 分钟 |
| `!ze_unban` / `!ze_unmute` / `!ze_ungag` / `!ze_punishments` | 解除与查看（只管本插件的处罚） |
| `!itemwatch` | 神器绑定诊断 |

处罚记录存在插件自己的 `data\punishments.json`，不会覆盖 CS2Fixes 的名单。

## 十一、排错

| 现象 | 先查什么 |
|---|---|
| 一直 `Idle console` | 是不是用了 `host_workshop_map` 冷启动，改成先 `+map de_dust2` |
| 插件全没加载 | `gameinfo.gi` 里 `addons/metamod` 那行还在不在 |
| CSS 报缺 .NET | 装 .NET 10 **运行时**，再重启服务器进程 |
| 进图没 HUD / 没菜单 | 看 `configs\plugins\ZePractice\` 配置有没有生成、有没有语法错误 |
| 地图进去了但模型缺失 | 资源没打进同一个工坊条目，别人下到的是空壳 |
| 朋友连不上 | `sv_lan 1` + `127.0.0.1` 只有本机能连；局域网要绑 `0.0.0.0` 并放行防火墙 |
| 改了配置没反应 | cfg 换图生效、插件 JSON 重开服生效、实体改重载地图生效 |

## 十二、检查清单

```
□ steamcmd +app_update 730 validate 跑完
□ Steam 客户端已安装（不用登录）
□ gameinfo.gi 里有 Game csgo/addons/metamod
□ addons/cs2fixes 存在，maplist.jsonc 的 workshop_id 是数字
□ addons/counterstrikesharp/dotnet 存在
□ plugins/ZePractice/ZePractice.dll 存在
□ ZePractice.json 里 OwnerSteamIds 是自己的 SteamID64
□ cfg/ze-practice/server.cfg + rcon.generated.cfg 存在
□ 启动参数里先 +map de_dust2
□ 控制台出现 ss_loading -> ss_active
□ 客户端 connect 127.0.0.1:27015，!zemenu 有反应
□ !ze_god 能开、!ze_save / !ze_tp 能用
```

十二项全过，就是一个能跑的跑图服。

## 参考

- UB 社区[《保姆级教程：CS2 多人跑图服务器 + 插件安装》](https://bbs.moeub.cn/forum.php?mod=viewthread&tid=12832) —— 本文 `server.cfg` 参数和「装 Steam 客户端」这一点来自这里
- [SteamCMD 文档](https://developer.valvesoftware.com/wiki/SteamCMD) · [Metamod:Source](https://www.metamodsource.net/) · [CS2Fixes](https://github.com/Source2ZE/CS2Fixes) · [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp)

## 源码

插件本体：<https://github.com/Hoshino486/ZePractice>

仓库里 `tools/` 是启动、预检、更新和回滚脚本，`服务器使用教程.md` 有更细的说明（地图参数、Boss、翻译、神器、朋友管理）。
