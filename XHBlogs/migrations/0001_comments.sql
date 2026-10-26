-- 评论表：访客无需登录，前端会为每个浏览器分配一个虚拟身份
-- （名字以「喵」结尾，头像由 seed 决定的猫娘，二者都保存到 localStorage）
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  name TEXT NOT NULL,
  seed INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash TEXT,
  approved INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_comments_page ON comments (page, approved, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments (ip_hash, created_at);
