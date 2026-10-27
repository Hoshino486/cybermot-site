---
title: "ZePractice：给 CS2 跑图服写的插件"
date: "2026-10-27T16:20:00+08:00"
description: "练习模式、人类指挥、换图投票、工坊更新、Bot 陪练、神器监听与诊断 HUD —— 这个插件的功能、配置项和全部命令。"
cover: "/images/ze-practice-cover.webp"
tags: ["工具", "CS2", "开源"]
---

跑图这件事，服务器原生给的东西永远不够用。

想练一段跳，得等回合结束；想看看后面几关长什么样，只能求人带你过；想标记「这里要踩点」，只能站那儿按语音喊。

**ZePractice** 就是把这些做成命令的一个插件 —— 跑在 CounterStrikeSharp 上的 CS2 服务端插件。

> 这篇讲插件本身：它有什么、怎么配、命令怎么用。
> 服务器还没装？看另一篇：**[从零搭一个 CS2 跑图服，并装上 ZePractice](/posts/local-ze-server)**。

## 一、它补了什么

| 模块 | 内容 |
|---|---|
| 练习跑图 | 无敌、穿墙、存档、传送、重置、补给 |
| 人类指挥 | 五色标点、按住 R 画线、倒计时、指挥官高亮 |
| 换图投票 | 候选列表、严格 80% 的 RTV、服主直换 |
| 工坊资源 | 已装内容每 60 秒查更新，不打断当前回合 |
| 练习 Bot | 个人 Bot 陪练、传送编号、队伍选择 |
| 神器监听 | 取代原生 EntWatch，读真实规则显示持有者与冷却 |
| 地图标记 | 实体按钮绿鸡、落地枪青绿轮廓、发光字段网络同步 |
| 诊断 HUD | 彩色实体数、模拟均值、TPS、内存、人数 |
| 默认玩法 | 全员闪光烟雾免疫、个人无扩散、T 只可持刀、无限换队 |

设计上只有一条原则：**一个人也能把图跑完，带图的人不用靠喊。**

## 二、配置

第一次启动后，配置生成在：

```text
game\csgo\addons\counterstrikesharp\configs\plugins\ZePractice\ZePractice.json
```

### 必改的五个

| 配置项 | 默认 | 说明 |
|---|---|---|
| `OwnerSteamIds` | `[]` | 服主 SteamID64 列表，**必填** |
| `PracticeMode` | `true` | 练习模式；关掉才是多人 ZE |
| `AllowEveryonePracticeCommands` | `true` | 允许所有人用 `!ze_god` 这类指令 |
| `TrustLoopbackAdmin` | `true` | 本机玩家自动拿临时管理权，单人调试省事 |
| `MenuUiMode` | `"chat"` | `chat` 聊天框菜单 / `panorama` 界面包 |

```jsonc
{
  "OwnerSteamIds": ["7656119xxxxxxxxxx"],
  "PracticeMode": true,
  "AllowEveryonePracticeCommands": true,
  "TrustLoopbackAdmin": true,
  "MenuUiMode": "chat"
}
```

SteamID64 不知道就进服敲 `!ze_whoami`。

### 其余分组

| 分组 | 关键项 | 作用 |
|---|---|---|
| 复活 | `AutoRespawn` / `RespawnDelaySeconds` | 自动满血复活，默认 1 秒 |
| 弹药与碰撞 | `UnlimitedAmmo` / `NoBlock` | 无限弹药、玩家不互相挤 |
| 出生状态 | `DefaultHealth` / `DefaultPrimaryWeapon` | 默认 100 血 / `weapon_bizon` |
| 地图参数 | `ApplyFysMapParameters` / `FysRoot` | 读 FYS 的 boss、参数与翻译 |
| HUD | `BossHud` / `MapTranslations` / `TranslationCountdown` / `HudIntervalSeconds` | boss 血条、翻译、倒计时、刷新间隔 |
| 工坊 | `WorkshopUpdates.CheckIntervalSeconds` | 默认 60 秒检查一次 |
| 换图 | `MapVote.MaximumCandidates` / `ChangeDelaySeconds` | 候选上限、换图延迟 |
| 标记 | `MapMarkers.ButtonChickens` / `MapWeaponGlow` / `GlowRange` | 按钮绿鸡、枪发光、发光距离 |
| 指挥 | `Commander.Enabled` | **默认关**，要先挂载对应工坊资源包 |
| 练习 Bot | `PracticeBots.MaximumHealth` | Bot 血量上限 |
| 神器 | `EnableItemWatch` | 神器绑定诊断 |
| 多人玩法 | `PublicGameplay.*` | 僵尸血量护甲、回血速度、金钱、回合时长 |

> `Commander.Enabled` 默认 `false` 不是偷懒 —— 指挥要用自定义模型和界面资源，那些没挂到服务器上之前打开只会刷错误。

## 三、命令手册

所有聊天命令以 `!` 开头；控制台里对应写法是 `css_` 前缀。

### 菜单

| 按键 | 作用 |
|---|---|
| `F9` / `Z` | 主菜单 |
| `F10` | 聊天数字菜单 |
| `7` / `8` | 翻页 |
| `9` | 返回 |
| `0` | 关闭 |

也可以直接敲 `!zemenu`。

### 练习跑图

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

存档点**按地图隔离**，新回合/换图自动清理；多人 ZE 下这些辅助会被撤销。

### 玩家通用

| 命令 | 作用 |
|---|---|
| `!zemenu` / `!zhelp` / `!ze_status` | 菜单、帮助、地图与配置状态 |
| `!ze_maps [筛选]` | 候选选图 |
| `rtv` | 换图投票，**严格超过 80%** 才生效 |
| `!items` | 神器持有者与冷却 |
| `!zeweapon` / `!zebuy <名称>` | 补给武器与手雷 |
| `!zeclass` / `!zskill` | 职业与技能 |
| `!ze_whoami` | 本人 SteamID64 与权限 |

### 管理员

`!zeadmin` 打开管理菜单，或者直接敲：

| 命令 | 作用 |
|---|---|
| `!ze_mode practice` / `!ze_mode ze` | 切换练习 / 多人 ZE，清理练习辅助并重启回合 |
| `!ze_restart` / `!ze_reload` | 重启回合 / 重载本图配置（实体修补要重载地图） |
| `!ze_map <完整地图名>` | 切换本机已装地图 |
| `!ze_respawn` / `!ze_bring` / `!ze_slay` / `!ze_kick` / `!ze_team` | 玩家管理，目标支持 `#userid`、SteamID64、唯一名称 |
| `!ze_ban <玩家> [分钟] [原因]` | 默认 60 分钟，`0` 为永久 |
| `!ze_mute` / `!ze_gag` | 默认 30 分钟 |
| `!ze_unban` / `!ze_unmute` / `!ze_ungag` / `!ze_punishments` | 解除与查看，只管本插件的处罚 |
| `!itemwatch` | 神器绑定诊断 |

处罚存在插件自己的 `data\punishments.json`，**不覆盖 CS2Fixes 的名单**。

## 四、几个设计决定

**练习指令默认对所有人开放。** 跑图服没那么多规矩，谁想练就练。真要限制，关掉 `AllowEveryonePracticeCommands`。

**RTV 门槛是 80%，不是简单多数。** 换图会打断所有人正在做的事，简单多数很容易被一小波人带走。

**工坊更新不强制换图。** 后台每 60 秒查一次，新内容等下次加载才生效 —— 不能因为资源更新了就把正在跑的一车人踢回主菜单。

**处罚独立存储。** 和 CS2Fixes 各管各的，避免两套名单互相覆盖，排查时也清楚是哪边下的手。

## 五、踩过的坑

**工坊地图不能冷启动。** 直接 `+host_workshop_map` 会停在 `Idle console`，必须先加载内置图、等 game frame 和 SteamGameServer 起来，再用 RCON 发命令。

**地图列表里的工坊 ID 是数字字段。** `"workshop_id": 3817448617`，不是 `publishedfileid`，也不能写成字符串。

**RCON 密码只留一个源。** 启动器生成 `rcon.generated.cfg`，服务端和工具读同一个值，避免改一处漏一处。

**「编译通过」和「功能可用」是两件事。** 空服跑通只能证明服务端字段对；客户端能不能看到 —— 发光、HUD、菜单渲染 —— 得真人进服验收。

## 六、源码

仓库：<https://github.com/Hoshino486/ZePractice>

`src/` 分服务层和逻辑层，`tools/` 是启动、预检、更新与回滚脚本，`docs/` 是按版本归档的改动记录，`服务器使用教程.md` 有更细的配置说明。

仓库**不含**游戏资源、地图 VPK 或工坊模型 —— 那些单独发在 Steam 创意工坊。地图数据来自 `Hoshino486/cs2` 的公开配置，版权仍归原作者。
