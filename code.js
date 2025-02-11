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
// 插件主控制器
figma.showUI(__html__, {
    width: 450,
    height: 600,
});
// 监听选择变化
figma.on('selectionchange', () => {
    handleSelectionCheck();
});
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
        totalWords: 0
    };
    function processNode(node) {
        stats.totalNodes++;
        if (node.type === 'TEXT') {
            stats.textNodes++;
            stats.totalCharacters += node.characters.length;
            stats.totalWords += node.characters.trim().split(/\s+/).length;
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
            if (word.length > 0 && /^[a-z]/.test(word)) {
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
        const node = figma.getNodeById(nodeId);
        if (node && node.type === 'TEXT') {
            const text = node.characters;
            const words = text.split(/\s+/);
            const newWords = words.map(word => word === suggestion.toLowerCase() ? suggestion : word);
            node.characters = newWords.join(' ');
            // 重新检查并更新UI
            const results = yield checkTextNodes(node, [], []);
            figma.ui.postMessage({
                type: 'review-complete',
                results
            });
            figma.notify('Text updated successfully');
        }
    });
}
// 监听来自UI的消息
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    switch (msg.type) {
        case 'init':
            yield handleInit();
            break;
        case 'start-review':
            yield handleStartReview(msg.selectedStyles || []);
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
        // 获取文本样式
        const styles = yield getTextStyles();
        // 发送选择信息到UI
        figma.ui.postMessage({
            type: 'selection-update',
            selection: selection.map(node => ({
                id: node.id,
                name: node.name,
                type: node.type,
                textContent: node.type === 'TEXT' ? node.characters : undefined,
                styleId: node.type === 'TEXT' ? node.textStyleId : undefined
            })),
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
    figma.ui.postMessage({
        type: 'selection-update',
        selection: selection.map(node => ({
            id: node.id,
            name: node.name,
            type: node.type,
            textContent: node.type === 'TEXT' ? node.characters : undefined,
            styleId: node.type === 'TEXT' ? node.textStyleId : undefined
        })),
        stats
    });
}
// 开始审查处理
function handleStartReview() {
    return __awaiter(this, arguments, void 0, function* (selectedStyles = []) {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Please select at least one element to review');
            return;
        }
        // 检查所有选中元素中的文本
        const results = [];
        for (const node of selection) {
            yield checkTextNodes(node, results, selectedStyles);
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
