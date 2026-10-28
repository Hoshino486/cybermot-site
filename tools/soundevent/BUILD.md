# CS2 SoundEvent Generator — CyberMot build

这是 `/tools/soundevent` 页面使用的源码。页面本身是静态构建产物，已提交到
`XHBlogs/public/tools/soundevent/`，所以博客构建不依赖这个目录。

重新构建：

```bash
npm ci
npm run build
```

然后把 `dist/` 里的文件复制到 `XHBlogs/public/tools/soundevent/`，并保留同目录的
`LICENSE.txt`。

本目录代码按 Apache License 2.0 使用，许可证全文见 `LICENSE`。
