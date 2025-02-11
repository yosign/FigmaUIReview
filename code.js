"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 定义常见介词集合
const PREPOSITIONS = new Set([
    // 基础介词
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of',
    // 复合介词
    'into', 'onto', 'within', 'without', 'through', 'throughout',
    // 方向介词
    'over', 'under', 'above', 'below',
    // 时间介词
    'before', 'after', 'during', 'since', 'until',
    // 其他常见介词
    'about', 'between', 'among', 'against', 'along',
    // 介词短语（作为单独单词）
    'across', 'around', 'behind', 'beside', 'beyond',
    'inside', 'outside', 'near', 'off', 'toward', 'towards'
]);
// 标准圆角值
const STANDARD_RADIUS = [0, 2, 4, 8, 12, 16, 24, 32];
// 插件主控制器
figma.showUI(__html__, {
    width: 450,
    height: 600,
});
// 监听选择变化
figma.on('selectionchange', () => {
    handleSelectionCheck();
});
// 检查圆角值是否标准
function isStandardRadius(radius) {
    return STANDARD_RADIUS.includes(radius);
}
// 获取所有文本样式
function getTextStyles() {
    return __awaiter(this, void 0, void 0, function* () {
        const styles = yield figma.getLocalTextStylesAsync();
        return styles.map(style => ({
            id: style.id,
            name: style.name
        }));
    });
}
// 获取节点的文本统计信息
function getTextStats(nodes) {
    let stats = {
        totalNodes: 0,
        textNodes: 0,
        totalCharacters: 0,
        totalWords: 0,
        selectedTextNodes: 0
    };
    function processNode(node) {
        stats.totalNodes++;
        if (node.type === 'TEXT') {
            stats.textNodes++;
            stats.totalCharacters += node.characters.length;
            stats.totalWords += node.characters.trim().split(/\s+/).length;
            stats.selectedTextNodes++;
        }
        if ('children' in node) {
            for (const child of node.children) {
                processNode(child);
            }
        }
    }
    nodes.forEach(processNode);
    return stats;
}
// 检查文本首字母是否大写
function checkCapitalization(text) {
    const words = text.split(/\s+/);
    const issues = [];
    if (words.length <= 10) {
        words.forEach((word, index) => {
            // 如果是第一个单词，或者是短语中的重要单词，就应该大写
            const shouldCapitalize = index === 0 ||
                (!PREPOSITIONS.has(word.toLowerCase()) && word.length > 1);
            if (word.length > 0 && shouldCapitalize && /^[a-z]/.test(word)) {
                issues.push({
                    word,
                    index,
                    suggestion: word.charAt(0).toUpperCase() + word.slice(1)
                });
            }
        });
    }
    return issues;
}
// 递归检查节点中的文本
function checkTextNodes(node, results, selectedStyles) {
    return __awaiter(this, void 0, void 0, function* () {
        if (node.type === 'TEXT') {
            // 检查节点是否需要被检查
            if (shouldCheckNode(node, selectedStyles)) {
                const words = node.characters.split(/\s+/);
                if (words.length < 10) {
                    const issues = checkCapitalization(node.characters);
                    if (issues.length > 0) {
                        results.push({
                            nodeId: node.id,
                            nodeName: node.name || '',
                            text: node.characters,
                            issues
                        });
                    }
                }
            }
        }
        else if ('children' in node) {
            for (const child of node.children) {
                yield checkTextNodes(child, results, selectedStyles);
            }
        }
    });
}
// 修复文本中的首字母大写问题
function fixTextCapitalization(nodeId, suggestion) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(nodeId);
        if (node && node.type === 'TEXT') {
            // 加载字体
            const fontName = node.fontName;
            yield figma.loadFontAsync(fontName);
            const text = node.characters;
            const words = text.split(/\s+/);
            const newWords = words.map(word => word === suggestion.toLowerCase() ? suggestion : word);
            node.characters = newWords.join(' ');
            // 重新检查当前选中的所有节点
            const selection = figma.currentPage.selection;
            const results = [];
            for (const selectedNode of selection) {
                yield checkTextNodes(selectedNode, results, []);
            }
            // 发送更新后的结果到UI
            figma.ui.postMessage({
                type: 'review-complete',
                results: results
            });
            figma.notify('Text updated successfully');
        }
    });
}
// 跳转到指定节点
function goToNode(nodeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const node = yield figma.getNodeByIdAsync(nodeId);
            if (!node) {
                console.error('Node not found:', nodeId);
                return;
            }
            if ('type' in node) {
                const sceneNode = node;
                // 确保节点所在的页面是当前页面
                let currentNode = sceneNode;
                while (currentNode && currentNode.type !== 'PAGE') {
                    currentNode = currentNode.parent;
                }
                if (currentNode && currentNode.type === 'PAGE') {
                    // 使用异步方法设置当前页面
                    yield figma.setCurrentPageAsync(currentNode);
                }
                // 选中节点
                figma.currentPage.selection = [sceneNode];
                // 将视图居中到节点
                figma.viewport.scrollAndZoomIntoView([sceneNode]);
            }
        }
        catch (error) {
            console.error('Error navigating to node:', error);
        }
    });
}
// 检查节点是否需要被检查
function shouldCheckNode(node, selectedStyles) {
    // 如果没有选择任何样式，则检查所有文本
    if (selectedStyles.length === 0)
        return true;
    // 如果节点没有样式，始终检查
    if (!node.textStyleId)
        return true;
    // 检查节点的样式是否在选中的样式列表中
    const styleId = node.textStyleId.toString();
    return selectedStyles.includes(styleId);
}
// 检查节点的圆角
function checkNodeRadius(node) {
    return __awaiter(this, void 0, void 0, function* () {
        // 只检查矩形、自动布局和框架
        if (!('cornerRadius' in node))
            return null;
        const radius = node.cornerRadius;
        if (radius === undefined)
            return null;
        // 确保返回的数据是可序列化的，并忽略0值
        const cornerRadius = Array.isArray(radius)
            ? radius.map(r => typeof r === 'number' ? r : 0).filter(r => r !== 0)
            : typeof radius === 'number' ? radius : 0;
        // 如果所有圆角都是0，则返回null
        if (Array.isArray(cornerRadius) && cornerRadius.length === 0)
            return null;
        if (!Array.isArray(cornerRadius) && cornerRadius === 0)
            return null;
        // 检查是否有小数点值
        const hasDecimal = Array.isArray(cornerRadius)
            ? cornerRadius.some(r => !Number.isInteger(r))
            : !Number.isInteger(cornerRadius);
        return {
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            cornerRadius,
            hasDecimal,
            issues: []
        };
    });
}
// 递归检查节点的圆角
function checkRadiusRecursively(node, results) {
    return __awaiter(this, void 0, void 0, function* () {
        if ('cornerRadius' in node) {
            const result = yield checkNodeRadius(node);
            if (result) {
                results.push(result);
            }
        }
        if ('children' in node) {
            for (const child of node.children) {
                yield checkRadiusRecursively(child, results);
            }
        }
    });
}
// 修复圆角问题
function fixNodeRadius(nodeId, suggestion) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(nodeId);
        if (node && 'cornerRadius' in node) {
            const targetNode = node;
            if (Array.isArray(targetNode.cornerRadius)) {
                // 如果是混合圆角，统一设置为建议值
                targetNode.cornerRadius = [suggestion, suggestion, suggestion, suggestion];
            }
            else {
                targetNode.cornerRadius = suggestion;
            }
            figma.notify('Corner radius updated successfully');
        }
    });
}
// 修改消息处理器
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    switch (msg.type) {
        case 'init':
            yield handleInit();
            break;
        case 'start-review':
            yield handleStartReview(msg.selectedStyles, msg.nodesToReview);
            break;
        case 'get-text-styles':
            const styles = yield getTextStyles();
            figma.ui.postMessage({
                type: 'text-styles-update',
                styles
            });
            break;
        case 'fix-text':
            if (msg.nodeId && msg.suggestion) {
                yield fixTextCapitalization(msg.nodeId, msg.suggestion);
            }
            break;
        case 'go-to-node':
            if (msg.nodeId) {
                yield goToNode(msg.nodeId);
            }
            break;
        case 'start-radius-review':
            const radiusResults = [];
            const selection = figma.currentPage.selection;
            if (selection.length === 0) {
                figma.notify('Please select at least one element to review');
                return;
            }
            try {
                for (const node of selection) {
                    yield checkRadiusRecursively(node, radiusResults);
                }
                // 过滤掉所有圆角为0的结果
                const filteredResults = radiusResults.filter(result => {
                    if (Array.isArray(result.cornerRadius)) {
                        return result.cornerRadius.length > 0;
                    }
                    return result.cornerRadius !== 0;
                });
                // 确保所有数据都是可序列化的
                const serializedResults = filteredResults.map(result => (Object.assign(Object.assign({}, result), { cornerRadius: Array.isArray(result.cornerRadius)
                        ? result.cornerRadius.map(r => Number(r))
                        : Number(result.cornerRadius), hasDecimal: result.hasDecimal })));
                if (serializedResults.length > 0) {
                    figma.ui.postMessage({
                        type: 'radius-review-complete',
                        results: serializedResults
                    });
                    figma.notify(`Found ${serializedResults.length} elements with non-zero radius`);
                    // 统计每个圆角值的出现次数
                    const distribution = serializedResults.reduce((acc, item) => {
                        const radius = Array.isArray(item.cornerRadius)
                            ? Math.max(...item.cornerRadius) // 使用最大值作为参考
                            : item.cornerRadius;
                        if (!acc[radius]) {
                            acc[radius] = {
                                count: 0,
                                nodes: []
                            };
                        }
                        acc[radius].count++;
                        acc[radius].nodes.push(item);
                        return acc;
                    }, {});
                    // 找出最常用的圆角值（出现次数最多的）
                    const mostCommonRadius = Object.entries(distribution)
                        .sort((a, b) => b[1].count - a[1].count)[0][0];
                    // 计算统计信息
                    const stats = {
                        distribution,
                        mostCommonRadius: Number(mostCommonRadius),
                        total: serializedResults.length,
                        uniqueValues: Object.keys(distribution).length
                    };
                    figma.ui.postMessage({
                        type: 'radius-stats-update',
                        stats
                    });
                }
                else {
                    figma.notify('No elements with non-zero radius found');
                    figma.ui.postMessage({
                        type: 'radius-review-complete',
                        results: []
                    });
                }
            }
            catch (error) {
                console.error('Error during radius review:', error);
                figma.notify('Error during radius review');
                figma.ui.postMessage({
                    type: 'radius-review-complete',
                    results: []
                });
            }
            break;
        case 'fix-radius':
            if (msg.nodeId && typeof msg.suggestion === 'number') {
                yield fixNodeRadius(msg.nodeId, msg.suggestion);
                // 重新检查并更新UI
                const radiusResults = [];
                const selection = figma.currentPage.selection;
                for (const node of selection) {
                    yield checkRadiusRecursively(node, radiusResults);
                }
                figma.ui.postMessage({
                    type: 'radius-review-complete',
                    results: radiusResults
                });
            }
            break;
        default:
            console.log('Unknown message type:', msg.type);
    }
});
// 初始化处理
function handleInit() {
    return __awaiter(this, void 0, void 0, function* () {
        // 发送当前选择到UI
        const selection = figma.currentPage.selection;
        const stats = getTextStats(selection);
        // 获取所有文本节点
        const textNodes = selection.reduce((acc, node) => {
            function collectTextNodes(n) {
                if (n.type === 'TEXT') {
                    acc.push({
                        id: n.id,
                        name: n.name,
                        type: n.type,
                        textContent: n.characters,
                        styleId: n.textStyleId || undefined
                    });
                }
                if ('children' in n) {
                    n.children.forEach(collectTextNodes);
                }
            }
            collectTextNodes(node);
            return acc;
        }, []);
        // 获取文本样式
        const styles = yield getTextStyles();
        // 发送选择信息到UI
        figma.ui.postMessage({
            type: 'selection-update',
            selection: textNodes,
            stats
        });
        // 发送文本样式列表到UI
        figma.ui.postMessage({
            type: 'text-styles-update',
            styles
        });
    });
}
// 选择变化处理
function handleSelectionCheck() {
    const selection = figma.currentPage.selection;
    const stats = getTextStats(selection);
    // 获取所有文本节点
    const textNodes = selection.reduce((acc, node) => {
        function collectTextNodes(n) {
            if (n.type === 'TEXT') {
                acc.push({
                    id: n.id,
                    name: n.name,
                    type: n.type,
                    textContent: n.characters,
                    styleId: n.textStyleId || undefined
                });
            }
            if ('children' in n) {
                n.children.forEach(collectTextNodes);
            }
        }
        collectTextNodes(node);
        return acc;
    }, []);
    figma.ui.postMessage({
        type: 'selection-update',
        selection: textNodes,
        stats
    });
}
// 开始审查处理
function handleStartReview() {
    return __awaiter(this, arguments, void 0, function* (selectedStyles = [], nodesToReview = []) {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Please select at least one element to review');
            return;
        }
        // 检查所有选中元素中的文本
        const results = [];
        // 如果提供了要检查的节点ID列表，则只检查这些节点
        if (nodesToReview.length > 0) {
            const nodes = yield Promise.all(nodesToReview.map(id => figma.getNodeByIdAsync(id)));
            const validNodes = nodes.filter(node => node);
            for (const node of validNodes) {
                yield checkTextNodes(node, results, selectedStyles);
            }
        }
        else {
            for (const node of selection) {
                yield checkTextNodes(node, results, selectedStyles);
            }
        }
        // 发送结果到UI
        figma.ui.postMessage({
            type: 'review-complete',
            results
        });
        // 如果有问题，显示通知
        if (results.length > 0) {
            figma.notify(`Found ${results.length} text issues`);
        }
        else {
            figma.notify('No capitalization issues found');
        }
    });
}
