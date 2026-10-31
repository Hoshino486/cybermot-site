// 独立于「项目」的工具入口。以后新增工具，往 toolsData 里追加即可。
export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  tags: string[];
  status: string;
};

export const toolsData: Tool[] = [
  {
    id: "cs2-soundevent",
    name: "CS2 SoundEvent Generator",
    description:
      "可视化编辑 CS2 的 SoundEvent（KV3）：预设、属性、曲线与批量生成，改完直接复制或导出 .vsndevts。纯前端运行，配置只留在本地。",
    icon: "🔊",
    href: "/tools/soundevent",
    tags: ["CS2", "Source 2", "KV3", "批量生成"],
    status: "在线",
  },
  {
    id: "fastdl-ozlin",
    name: "Ozlin Info FastDL",
    description:
      "CS1.6 / CS:GO / CS2 的公共 FastDL 站，自定义地图、模型和材质按游戏目录归档。碰到 missing map、bsp differ 或者模型材质紫黑时，先来这儿找对应文件。",
    icon: "🗂️",
    href: "https://fastdl.ozlin.info/",
    tags: ["CS2", "CS:GO", "FastDL", "资源下载"],
    status: "外链",
  },
];
