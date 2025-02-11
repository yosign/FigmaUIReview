"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_RADIUS = exports.PREPOSITIONS = void 0;
// 定义常见介词集合
exports.PREPOSITIONS = new Set([
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
exports.STANDARD_RADIUS = [0, 2, 4, 8, 12, 16, 24, 32];
