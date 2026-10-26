# 赛博刹那：启用评论

文章、说说和灵境的评论统一使用 giscus / GitHub Discussions。默认关闭，未配置时显示友好提示，不会向外部评论服务发请求。

1. 创建一个用于评论的公开 GitHub 仓库，在仓库 Settings → General → Features 开启 Discussions。
2. 安装官方 giscus GitHub App，并只授权上述评论仓库：<https://github.com/apps/giscus>。
3. 在 <https://giscus.app/zh-CN> 填写仓库名称和讨论分类，建议使用 Announcements 类型。复制生成代码中的 `data-repo`、`data-repo-id`、`data-category`、`data-category-id`。
4. 编辑 `data/comments.json`，分别填入 `repo`、`repoId`、`category`、`categoryId`，最后把 `enabled` 改为 `true`。这些是公开标识，不是密钥。
5. 重新构建并部署。访客通过 giscus 登录 GitHub 后即可评论，你可以直接在 GitHub Discussions 管理内容。

```json
{
  "enabled": true,
  "repo": "你的GitHub用户名/评论仓库名",
  "repoId": "从giscus配置器复制",
  "category": "Announcements",
  "categoryId": "从giscus配置器复制"
}
```

本站使用 specific 映射：文章按路径（例如 `/posts/welcome`），说说按 `moment:说说ID`，灵境按 `workshop:页面ID` 区分讨论。更换域名时路径保持一致即可继续使用原有评论。

本分支不再使用上游控制台里的 Gitalk OAuth 设置。不要填写或公开 `clientSecret`，不要将 GitHub Token 写入 `siteConfig.ts`。旧 `/api/github` 端点已停用，不会转发客户端提供的 OAuth 请求。已有 Gitalk 评论可参考 giscus 官方迁移说明，将对应 Issues 转为 Discussions 并匹配以上标题。

官方文档：<https://github.com/giscus/giscus>，高级设置：<https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md>。
