// 在这里收录自己的作品；也可使用本地控制台维护。
export type Project = { id: string; name: string; description: string; icon: string; githubUrl: string; tags: string[]; };

export const projectsData: Project[] = [
  {
    id: "cybermot-site",
    name: "CyberMot 个人站",
    description: "本站源码。Next.js 16 + React 19 的赛博风个人站点，通过 OpenNext 构建后部署在 Cloudflare Workers，配套 GitHub Actions 流水线与本地可视化后台。",
    icon: "🌐",
    githubUrl: "https://github.com/Hoshino486/cybermot-site",
    tags: ["Next.js", "TypeScript", "Cloudflare"],
  },
  {
    id: "BomberStudio",
    name: "BomberStudio",
    description: "面向 Windows 的图形界面与命令行工具，用来打开 Unity 游戏数据：查找资源、预览常见内容、建立索引，并导出模型、动画、贴图、音频、视频和原始文件，支持多种游戏专用容器与 UnityCN 配置。",
    icon: "🧰",
    githubUrl: "https://github.com/Hoshino486/BomberStudio",
    tags: ["Unity", "资源提取", "Windows"],
  },
  {
    id: "BomberStudio_Blender",
    name: "BomberStudio Blender Bridge",
    description: "把 BomberStudio 导出的模型、材质和物理缓存接入 Blender。中文面板，支持 ASCII / 二进制 FBX、模型整理、角色工具与 PBR 图集。",
    icon: "🎨",
    githubUrl: "https://github.com/Hoshino486/BomberStudio_Blender",
    tags: ["Blender", "Python", "FBX"],
  },
  {
    id: "Unpackaging-tools",
    name: "Unpackaging Tools",
    description: "解包流程所需重要文件的备份仓，避免误删后整条解包链路失效。",
    icon: "🗂️",
    githubUrl: "https://github.com/Hoshino486/Unpackaging-tools",
    tags: ["工具集", "备份"],
  },
  {
    id: "CS2-Character-skin-file",
    name: "CS2 Character Skin File",
    description: "CS2 角色皮肤文件，用于制作地图皮肤。以 AGPL-3.0 协议开源。",
    icon: "🎯",
    githubUrl: "https://github.com/Hoshino486/CS2-Character-skin-file",
    tags: ["CS2", "Source 2", "皮肤"],
  },
  {
    id: "servers-config",
    name: "Servers Config",
    description: "服务器配置仓库，集中保存各服务的配置与部署记录。",
    icon: "⚙️",
    githubUrl: "https://github.com/Hoshino486/servers-config",
    tags: ["配置", "运维"],
  },
];
