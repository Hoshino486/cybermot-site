-- 作者本人可选以真实身份留言（默认仍是匿名猫娘）
-- 由 Worker 在首次请求时自动补列，这里保留同样的语句便于手动建库
ALTER TABLE comments ADD COLUMN author INTEGER NOT NULL DEFAULT 0;
