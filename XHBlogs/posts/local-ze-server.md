---
title: "从零搭一个本地 CS2 ZE 跑图服"
date: "2026-10-27T15:00:00+08:00"
description: "SteamCMD 下载专服、装 Metamod 与 CS2Fixes、配 CounterStrikeSharp、部署 ZePractice，再到本机进图和工坊换图的两段启动。"
cover: "/images/local-server-cover.webp"
tags: ["工具", "CS2", "教程"]
---

上一篇讲的是插件做了什么，这篇讲**怎么把服务器开起来**。

从一台什么都没装的 Windows 电脑开始，到最后能 `connect 127.0.0.1:27015` 进图跑图。中间有几个坑，我会写清楚。

## 一、要准备什么

| 项目 | 说明 |
|---|---|
| 系统 | Windows x64（CS2 专服只有 Windows 和 Linux 版，这里只讲 Windows） |
| 磁盘 | 预留 **60 GB** 以上 |
| SteamCMD | 下载专服本体用，不需要买游戏 |
| .NET 10 运行时 | CounterStrikeSharp 要求 |
| 时间 | 第一次下载大约 20～40 分钟，看网速 |

不需要正版 CS2 账号就能开服（专服是 anonymous 下载），但**你自己要进服，本机得装 CS2 客户端**。

## 二、下载专服本体

先建一个根目录，比如 `D:\cs2server`，把 SteamCMD 解压进去：

```text
D:\cs2server\
└── steamcmd\
    └── steamcmd.exe
```

然后在这个目录里执行（**用 cmd 或 PowerShell，路径别带中文**）：

```bat
steamcmd.exe +force_install_dir D:\cs2server\cs2 +login anonymous +app_update 730 validate +quit
```

装完的结构是：

```text
D:\cs2server\cs2\
└── game\
    ├── bin\win64\cs2.exe        ← 服务端主程序
    └── csgo\
        ├── cfg\
        ├── addons\             ← 插件都装这里
        └── maps\
```

> `+app_update 730` 就是 CS2 本体，专服和客户端是同一个 app id。别去找什么 740。

以后更新专服，重复同一条命令即可 —— 但**必须先关掉服**。

## 三、装 Metamod:Source

所有插件的地基。去 Metamod 官网下载 **2.0 的 dev 版**（CS2 必须用 2.0，1.x 是 CS:GO 的）。

解压后把 `addons\metamod` 整个目录放到：

```text
game\csgo\addons\metamod\
```

然后**改 `game\csgo\gameinfo.gi`**：找到 `SearchPaths` 段，在 `Game csgo` 那行下面加一行：

```text
Game    csgo/addons/metamod
```

改完大概是这样：

```text
SearchPaths
{
    Game    csgo
    Game    csgo/addons/metamod
    Game    csgo/bin/win64
    ...
}
```

> ⚠️ 每次 Steam 校验或更新专服，`gameinfo.gi` 都可能被还原 —— 插件突然全没了，先看这一行还在不在。

## 四、装 CS2Fixes

CS2Fixes 是 CS2 的实体修补和地图参数层，ZE 地图的 boss、传送、计时都依赖它。

把发布包解压到：

```text
game\csgo\addons\cs2fixes\
```

它的配置文件在 `addons\cs2fixes\configs\`，其中 `maplist.jsonc` 是地图列表。**这个文件后面配工坊地图要用到**，先记住位置。

## 五、装 CounterStrikeSharp

ZePractice 是跑在 CounterStrikeSharp 上的，所以这是必需品。

1. 下载 CSS 的发布包，解压到 `game\csgo\addons\counterstrikesharp\`
2. 装 **.NET 10 运行时**（桌面运行时和 ASP.NET Core 运行时都要，或者直接装 SDK）
3. 首次启动时 CSS 会自己初始化目录结构

装好后应该有：

```text
addons\counterstrikesharp\
├── api\                 ← 插件编译时引用这里的 DLL
├── plugins\             ← 插件放这里
├── configs\plugins\     ← 插件配置放这里
└── dotnet\              ← 运行时
```

## 六、部署 ZePractice

两种方式，二选一。

**用编译好的 DLL**：把 `ZePractice.dll` 放到

```text
game\csgo\addons\counterstrikesharp\plugins\ZePractice\ZePractice.dll
```

**自己编译**（装了 .NET SDK 10）：

```powershell
dotnet build ZePractice.csproj -c Release -p:CssApiDir="D:\cs2server\cs2\game\csgo\addons\counterstrikesharp\api"
```

第一次启动后，配置会生成在：

```text
game\csgo\addons\counterstrikesharp\configs\plugins\ZePractice\ZePractice.json
```

把**自己的 SteamID64** 填进 `OwnerSteamIds`：

```jsonc
"OwnerSteamIds": ["7656119xxxxxxxxxx"]
```

不知道自己的 SteamID64？进服后聊天框敲 `!ze_whoami`，它会回给你。

## 七、准备 server.cfg

在 `game\csgo\cfg\ze-practice\` 建一个 `server.cfg`。跑图服默认要关掉一大堆「正常对局」的规则，一份能用的最小配置：

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
mp_buy_anywhere 1        // 去除购买区域限制
sv_infinite_ammo 1       // 无限弹药
sv_falldamage_scale 0    // 取消摔伤
bot_quota 1
bot_stop 1               // Bot 不要乱跑
```

`sv_lan 1` 表示只在本机/局域网用，不会被公网扫到。

RCON 密码建议单独放一个文件，别写死在多个地方：

```text
game\csgo\cfg\ze-practice\rcon.generated.cfg
```

内容就一行：

```text
rcon_password "自己生成一串"
```

## 八、启动

真正跑起来的命令长这样：

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

逐段解释：

| 参数 | 作用 |
|---|---|
| `-dedicated` | 专服模式 |
| `-insecure` | 关 VAC，本地测试用；公网服不要加 |
| `-console -usercon` | 开控制台，并允许 RCON |
| `-consolelog_append` | 控制台输出追加到日志文件 |
| `-ip / -port` | 绑定地址和端口 |
| `+servercfgfile` | 指定每次换图都执行的 cfg |
| `+game_alias casual` | 游戏模式别名 |
| `+exec ...` | 执行 RCON 密码和服务器 cfg |
| `+map de_dust2` | **先加载一张内置图** |

看到控制台刷出 `ss_loading -> ss_active`，就说明地图进 active 了。

> 如果你的启动命令里没写 `+exec`，进服后**要在服务器控制台补一条 `exec ze-practice/server.cfg`**，否则上面的参数一条都没生效 —— 这是很多人「怎么无敌用不了」的原因。

### 一个容易卡住的点：Steam 客户端

第一次启动如果**闪退**，大概率不是参数写错，而是这台机器上**没装 Steam 客户端**。

CS2 专服本身用 SteamCMD 就能跑，但工坊地图的下载、`SteamGameServer` 的初始化走的是本机 Steam 客户端那套组件。装上 Steam 就行 —— **不需要登录、也不需要买游戏**，默认路径装完就行。

装完再启动一次，就不会闪退了。

## 九、本机进图

打开你本机的 CS2 客户端，按 `~` 打开控制台：

```text
connect 127.0.0.1:27015
```

进图后敲 `!zemenu`，能弹出中文菜单就说明 ZePractice 正常加载了。

## 十、换工坊地图：为什么要两段启动

这是最容易踩的坑。

很多人以为启动参数里写 `+host_workshop_map 3817448617` 就能直接开工坊图。实测**不行** —— 服务器会停在 `Idle console`，地图永远不加载。

正确做法是**两段**：

1. 先用 `+map de_dust2` 启动，等内置图进入 active、RCON 就绪
2. 再通过 RCON 发一条命令：

```text
host_workshop_map 3817448617
```

然后服务器才会去下载、挂载工坊地图，最终切过去。日志里会出现：

```text
Loading custom game "3817448617" with map "ze_forhidden_slicoo_cn"
```

**为什么要先加载 de_dust2？** 因为 SteamGameServer、UGC 下载和 game frame 都要等第一张图跑起来才存在。没有这些，工坊下载根本没有执行环境。

等地图 active 通常要 10～30 秒，启动器给的是 90 秒上限 —— 这是**引导就绪期限**，不是地图下载期限。

## 十一、让地图列表认识工坊 ID

CS2Fixes 的 `maplist.jsonc` 里，每个地图条目可以带一个数字的 `workshop_id`：

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

注意是 **`workshop_id`**、数字、不是字符串：

- ❌ `"publishedfileid"` —— 不是这个字段名
- ❌ `"workshop_id": "3817448617"` —— 字符串不认
- ✅ `"workshop_id": 3817448617`

配好之后，`!ze_map ze_forhidden_slicoo_cn` 会保留工坊身份，走 `host_workshop_map`；没配 ID 的地图还是走本地文件。

## 十二、常见问题

**服务器窗口一直 `Idle console`**
直接用了 `host_workshop_map` 冷启动。改成先 `+map de_dust2`，再 RCON 发命令。

**插件一个都没加载**
按顺序查：`gameinfo.gi` 里 `addons/metamod` 还在不在 → Metamod 日志有没有加载 → CSS 的 `dotnet` 目录在不在 → `plugins` 目录结构对不对。

**CSS 报找不到 .NET 运行时**
装 .NET 10 的**运行时**（不是只有 SDK），或者重启服务器进程。

**地图进去了但模型/贴图缺失**
资源没有打进同一个工坊条目。主地图、skybox、模型、材质、声音、脚本要在**同一个 Workshop 项**里，否则别人下载到的只有空地图。

**朋友连不上**
先确认你是 `sv_lan 1` + `127.0.0.1` —— 这个配置只有本机能连。局域网要绑 `0.0.0.0` 并放行防火墙；公网还要端口映射，不是改个 IP 就完事。

**改了配置没生效**
分清楚哪些要重载、哪些要重开服：

| 改了什么 | 怎么生效 |
|---|---|
| `server.cfg` | 换图 |
| 插件 JSON 配置 | 重开服 |
| 地图实体（Stripper） | 重载地图 |
| 插件 DLL | 重开服 |

## 十三、开服检查清单

```
□ steamcmd +app_update 730 validate 跑完
□ gameinfo.gi 里有 Game csgo/addons/metamod
□ addons/cs2fixes 存在，maplist.jsonc 配好 workshop_id
□ addons/counterstrikesharp/dotnet 存在
□ plugins/ZePractice/ZePractice.dll 存在
□ ZePractice.json 里 OwnerSteamIds 是自己的 SteamID64
□ cfg/ze-practice/server.cfg 和 rcon.generated.cfg 存在
□ 启动参数里先 +map de_dust2
□ 控制台出现 ss_loading -> ss_active
□ 客户端 connect 127.0.0.1:27015 进图，!zemenu 有反应
```

十项全过，服就是通的。

## 源码

插件本体：<https://github.com/Hoshino486/ZePractice>

仓库的 `tools/` 目录里有启动、预检、更新和回滚脚本，`服务器使用教程.md` 是更详细的命令与配置说明。

## 参考

- UB 社区的[《保姆级教程：CS2 多人跑图服务器 + 插件安装》](https://bbs.moeub.cn/forum.php?mod=viewthread&tid=12832) —— 本文的 server.cfg 参数和「先装 Steam 客户端」这一点来自这里，适合完全没接触过专服的人对照看
- [SteamCMD 官方文档](https://developer.valvesoftware.com/wiki/SteamCMD)
- [Metamod:Source](https://www.metamodsource.net/) · [CS2Fixes](https://github.com/Source2ZE/CS2Fixes) · [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp)

和那篇教程有一处不同：它是在服务器跑起来后**手动在控制台敲** host_workshop_map，本文把它写成了启动器的自动流程 —— 原理一样，自动化之后你双击一次就够了。