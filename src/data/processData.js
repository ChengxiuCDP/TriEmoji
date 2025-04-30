// src/data/processData.js
// import csvData from './emoji_clustering_results.csv'; // REMOVE THIS LINE
import * as d3 from 'd3'; // 确保 d3 已导入

// 新的 JSON 处理函数
export const processJsonData = async () => {
  try {
    // 使用 fetch API 从 public 目录或直接从 src/data 加载 JSON
    // 如果 JSON 在 public/data/ 目录下:
    // const response = await fetch('/data/EmojiNet_clusters.json');
    // 如果 JSON 在 src/data/ 目录下 (需要确保构建工具能处理):
     const response = await fetch('/EmojiNet_clusters.json'); // CRA/Vite 通常会将 public 文件映射到根路径
    // 或者直接 import (如果你的环境支持 top-level await 或在 async 函数中使用 import):
    // import jsonData from './EmojiNet_clusters.json';
    // const data = jsonData;

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // 1. 提取和转换 emoji 位置数据
    const emojiPositions = data.map(item => ({
      id: item.unicode,       // 使用 unicode 作为唯一 ID
      x: parseFloat(item.img_pc1), // X 坐标
      y: parseFloat(item.img_pc2), // Y 坐标
      cluster: item.cluster_label, // 使用聚类标签
      char: item.emoji_char,   // Emoji 字符
      // 可以根据需要保留其他字段
      name: item.name,
      definition: item.definition,
      // 确保 x 和 y 是有效的数字，否则提供默认值或过滤掉该项
      // (此处假设它们总是有效的)
    }));

    // 2. 计算每个聚类的数据
    const clusterData = {};
    const clusterLabels = new Set(); // 用于获取所有唯一的聚类标签

    emojiPositions.forEach(item => {
      clusterLabels.add(item.cluster); // 添加标签到 Set
      if (!clusterData[item.cluster]) {
        clusterData[item.cluster] = {
          count: 0,
          // 可以添加其他聚类信息，例如中心点等
        };
      }
      clusterData[item.cluster].count++;
    });

    // 3. (可选) 准备 3D 数据 (如果 3D 视图也需要更新)
    // 注意：JSON 中没有直接的 z 坐标，需要设定默认值或从其他来源获取
    const emojiData3D = emojiPositions.map(item => ({
      id: item.id,
      x: item.x,
      y: item.y,
      z: 0, // 或者其他计算/默认值
      cluster: item.cluster,
      char: item.char,
    }));

    return {
      clusterData,       // { "label1": { count: N }, "label2": { count: M }, ... }
      emojiPositions,    // [{ id, x, y, cluster, char, ... }, ...]
      emojiData3D,       // (如果需要)
      clusterLabels: Array.from(clusterLabels) // 返回唯一的聚类标签数组
     };

  } catch (error) {
    console.error("Error processing JSON data:", error);
    // 返回空或默认值，防止应用崩溃
    return { clusterData: {}, emojiPositions: [], emojiData3D: [], clusterLabels: [] };
  }
};

// 更新函数：处理包含多套坐标和聚类的 EmojiNet_clusters.csv
export const processEmojiNetCsvData = async () => {
  try {
    // 确保 CSV 文件位于 public/data/ 目录下
    const data = await d3.csv('/data/EmojiNet_clusters.csv');

    if (!data) {
      throw new Error("CSV data could not be loaded or parsed.");
    }

    // *** 移除列名打印 ***
    // console.log('[processEmojiNetCsvData] Parsed CSV columns:', data.columns);

    // 1. 提取和转换数据，包含所有坐标和聚类
    const emojiData = data.map(item => {
      const img_x = parseFloat(item.img_pc1);
      const img_y = parseFloat(item.img_pc2);
      const word_x = parseFloat(item.word_pc1);
      const word_y = parseFloat(item.word_pc2);
      const token_x = parseFloat(item.token_pc1); // 新增 token 坐标
      const token_y = parseFloat(item.token_pc2); // 新增 token 坐标

      const visual_cluster = item.visual_cluster;     // 视觉聚类
      const semantic_cluster = item.semantic_cluster; // 语义聚类
      const token_cluster = item.token_cluster;       // Token 聚类

      // 进行更全面的数据有效性检查
      if (
        isNaN(img_x) || isNaN(img_y) ||
        isNaN(word_x) || isNaN(word_y) ||
        isNaN(token_x) || isNaN(token_y) || // 检查 token 坐标
        visual_cluster === undefined || visual_cluster === null || visual_cluster === '' ||
        semantic_cluster === undefined || semantic_cluster === null || semantic_cluster === '' ||
        token_cluster === undefined || token_cluster === null || token_cluster === '' ||
        !item.emoji_id || !item.emoji_char
      ) {
        console.warn(`Invalid or incomplete data for emoji: ${item.emoji_id || 'unknown'}. Skipping.`);
        return null; // 标记为无效
      }

      return {
        id: item.emoji_id,
        char: item.emoji_char,
        name: item.emoji_name,
        // 坐标
        img_x, img_y,
        word_x, word_y,
        token_x, token_y,
        // 聚类
        visual_cluster,
        semantic_cluster,
        token_cluster,
        // 其他需要传递给 BottomInfoPanel 的字段
        emjpd_shortcodes: item.emjpd_shortcodes,
        emjpd_description_side: item.emjpd_description_side,
        emjpd_description_main: item.emjpd_description_main,
        hemj_emoji_description: item.hemj_emoji_description,
        emjpd_usage_info: item.emjpd_usage_info,
        emoji_char_ascii_beg: item.emoji_char_ascii_beg,
        emjpd_description_ref_emj: item.emjpd_description_ref_emj
        // 可以移除或保留这个组合的 definition 字段，取决于是否在其他地方使用
        // definition: item.emjpd_full_description || item.emjpd_description_main || item.hemj_emoji_description,
      };
    }).filter(item => item !== null); // 过滤掉无效项

    // 2. 计算 **每种** 聚类的数据统计 (用于侧边栏显示或筛选)
    //    我们可能需要决定侧边栏主要控制哪个聚类，这里先计算所有
    const calculateClusterStats = (clusterKey) => {
        const clusterData = {};
        const clusterLabels = new Set();
        emojiData.forEach(item => {
            const clusterValue = item[clusterKey];
            clusterLabels.add(clusterValue);
            if (!clusterData[clusterValue]) {
                clusterData[clusterValue] = { count: 0 };
            }
            clusterData[clusterValue].count++;
        });
        // 排序标签
        const sortedLabels = Array.from(clusterLabels).sort((a, b) => {
             const numA = Number(a); const numB = Number(b);
             if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
             return String(a).localeCompare(String(b));
         });
        return { data: clusterData, labels: sortedLabels };
    }

    const visualClusterStats = calculateClusterStats('visual_cluster');
    const semanticClusterStats = calculateClusterStats('semantic_cluster');
    const tokenClusterStats = calculateClusterStats('token_cluster');

    // 返回包含所有信息的结构
    return {
      emojiData, // 原始处理后的数据，包含所有坐标和聚类
      visualClusterData: visualClusterStats.data,
      visualClusterLabels: visualClusterStats.labels,
      semanticClusterData: semanticClusterStats.data,
      semanticClusterLabels: semanticClusterStats.labels,
      tokenClusterData: tokenClusterStats.data,
      tokenClusterLabels: tokenClusterStats.labels,
     };

  } catch (error) {
    console.error("Error processing EmojiNet CSV data:", error);
    // 返回空结构以避免下游错误
    return {
        emojiData: [], visualClusterData: {}, visualClusterLabels: [],
        semanticClusterData: {}, semanticClusterLabels: [],
        tokenClusterData: {}, tokenClusterLabels: []
    };
  }
};