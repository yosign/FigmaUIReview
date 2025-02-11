// 定义消息类型
export interface StyleInfo {
  id: string;
  name: string;
}

export interface UIMessage {
  type: 'init' | 'start-review' | 'get-text-styles' | 'fix-text' | 'go-to-node' | 'start-radius-review' | 'fix-radius';
  selectedStyles?: string[];
  nodesToReview?: string[];
  nodeId?: string;
  suggestion?: string;
}

export interface TextCheckResult {
  nodeId: string;
  nodeName: string;
  text: string;
  issues: Array<{
    word: string;
    index: number;
    suggestion: string;
  }>;
}

export interface RadiusCheckResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  cornerRadius: number | number[];
  issues: Array<{
    type: 'inconsistent' | 'non-standard';
    current: number | number[];
    suggestion: number;
  }>;
}

export type SelectionInfo = {
  id: string;
  name: string;
  type: string;
  textContent?: string;
  styleId?: string;
};

export type SelectionStats = {
  totalNodes: number;
  textNodes: number;
  totalCharacters: number;
  totalWords: number;
  selectedTextNodes: number;
};

// 定义常见介词集合
export const PREPOSITIONS = new Set([
  // 基础介词
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of',
  // 复合介词
  'into', 'onto', 'within', 'without', 'through', 'throughout',
  // 方向介词
  'up', 'down', 'over', 'under', 'above', 'below',
  // 时间介词
  'before', 'after', 'during', 'since', 'until',
  // 其他常见介词
  'about', 'between', 'among', 'against', 'along',
  // 介词短语（作为单独单词）
  'across', 'around', 'behind', 'beside', 'beyond',
  'inside', 'outside', 'near', 'off', 'toward', 'towards'
]);

// 标准圆角值
export const STANDARD_RADIUS = [0, 2, 4, 8, 12, 16, 24, 32]; 