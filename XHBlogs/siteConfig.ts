// CyberMot 的全站资料：简介、社交账号、歌单和新域名均在这里修改。
// 结构兼容 XHBlogs 本地控制台。API 密钥只存部署环境，切勿写入本文件。
// 网易云音乐全站常驻；进入自动尝试播放，用户主动暂停优先。
export const siteConfig = {
  title: "CyberMot · 赛博刹那",
  authorName: "赛博刹那",
  englishName: "CyberMot",
  siteUrl: "https://bomber.asia",
  bio: "一位酷爱逆向解包游戏资源的动画人，也是 CS2zeMapper，擅长制作皮肤模型，爱好二次元。",
  navTitle: "CyberMot",
  navSuffix: "/",
  navAfter: "赛博刹那",
  avatarUrl: "/images/avatar.jpg",
  faviconUrl: "/images/avatar.jpg",
  // 默认固定动漫插画与独立特效；配置真正动画视频后可开启视频选项。
  enableBackgroundVideo: false,
  backgroundVideoUrl: "",
  videoPosterUrl: "/images/setsuna.webp",
  alternateBackgroundImage: "/images/setsuna.webp",
  useGradient: false,
  themeColors: [
    "#9ab6d0",
    "#d9e6ec",
    "#9babbf",
    "#d8dfd1"
  ],
  bgImages: [
    "/images/dream.webp"
  ],
  bgGroups: [
    {
      "id": "default",
      "name": "远方",
      "images": [
        "/images/dream.webp"
      ]
    }
  ],
  activeBgGroup: "default",
  defaultPostCover: "/images/dream.webp",
  photoWallImage: "/images/dream.webp",
  musicPlaylistId: "18527954469",
  musicPlaylistTitle: "刹那的音乐宇宙",
  localMusic: {
    "2068215868": "/music/2068215868.mp3"
  },
  cloudMusicIds: [],
  // B 站空间 UID（space.bilibili.com/<uid>），首页的 B 站卡片靠它取头像与粉丝数
  bilibiliUid: "1818296505",
  // 留空 = 同步空间里的全部投稿；填 BV 号则只展示这几个
  bilibiliVideos: [],
  // Steam 创意工坊里由自己上传/参与但页面作者不是本账号的条目，填工坊 ID 强制标为「作者」
  steamWorkshopAuthors: ["3521710695"],
  social: {
    github: "https://github.com/Hoshino486",
    gitee: "https://gitee.com/CyberMot",
    google: "",
    email: "",
    qq: "2430589032",
    wechat: ""
  },
  counts: {
    photos: 0
  },
  chatterTitle: "片刻碎语",
  chatterDescription: "给偶然闪过的念头，留一个落脚的地方。",
  danmakuList: [],
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [
      ""
    ]
  },
  buildDate: "2026-10-26T00:00:00+08:00",
  footerBadges: [
    {
      "name": "Next.js 16",
      "color": "text-sky-500",
      "svg": "<path d=\"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8 7h2l6 9h-2l-4-6v7H8V7Z\"/>"
    },
    {
      "name": "React 19",
      "color": "text-cyan-400",
      "svg": "<path d=\"M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3L19 8v8l-7 3.7L5 16V8l7-3.7Z\"/>"
    }
  ],
  icpConfig: {
    name: "",
    link: ""
  },
  enableAIAssistant: false,
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你是 CyberMot 个人网站的 AI 猫猫助手。用简短友好的中文介绍本站；不知道的个人信息请说明尚未填写，不要编造主人的经历、联系方式或观点。",
    maxOutputTokens: 150,
    temperature: 0.85
  },
  friendLinkApplyFormat: "名称：赛博刹那 / CyberMot\n简介：一位酷爱逆向解包游戏资源的动画人，也是 CS2zeMapper，擅长制作皮肤模型，爱好二次元。\n链接：https://bomber.asia\n头像：https://bomber.asia/images/avatar.jpg",
  enableLevelSystem: false
};

