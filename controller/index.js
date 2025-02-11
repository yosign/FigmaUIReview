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
// 监听来自UI的消息
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    switch (msg.type) {
        case 'init':
            // 初始化插件
            handleInit();
            break;
        case 'check-selection':
            // 检查选中的元素
            handleSelectionCheck();
            break;
        case 'start-review':
            // 开始UI审查
            handleStartReview();
            break;
        default:
            console.log('Unknown message type:', msg.type);
    }
});
// 初始化处理
function handleInit() {
    // 发送当前选择到UI
    const selection = figma.currentPage.selection;
    figma.ui.postMessage({
        type: 'selection-update',
        selection: selection.map(node => ({
            id: node.id,
            name: node.name,
            type: node.type
        }))
    });
}
// 选择变化处理
function handleSelectionCheck() {
    const selection = figma.currentPage.selection;
    figma.ui.postMessage({
        type: 'selection-update',
        selection: selection.map(node => ({
            id: node.id,
            name: node.name,
            type: node.type
        }))
    });
}
// 开始审查处理
function handleStartReview() {
    return __awaiter(this, void 0, void 0, function* () {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Please select at least one element to review');
            return;
        }
        // TODO: 实现具体的审查逻辑
        // 1. 检查布局
        // 2. 检查样式
        // 3. 检查命名规范
        // 4. 其他检查项...
        figma.ui.postMessage({
            type: 'review-complete',
            results: [] // TODO: 添加实际的审查结果
        });
    });
}
