/// <reference types="@figma/plugin-typings" />

// 定义消息类型
interface StyleInfo {
  id: string;
  name: string;
}

interface UIMessage {
  type: 'init' | 'start-review' | 'get-text-styles' | 'fix-text' | 'go-to-node' | 'start-radius-review' | 'fix-radius';
  selectedStyles?: string[];
  nodesToReview?: string[];
  nodeId?: string;
  suggestion?: string;
}

interface TextCheckResult {
  nodeId: string;
  nodeName: string;
  text: string;
  issues: Array<{
    word: string;
    index: number;
    suggestion: string;
  }>;
}

interface RadiusCheckResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  cornerRadius: number | number[];
  hasDecimal: boolean;
  issues: Array<{
    type: 'inconsistent' | 'non-standard';
    current: number | number[];
    suggestion: number;
  }>;
}

type SelectionInfo = {
  id: string;
  name: string;
  type: string;
  textContent?: string;
  styleId?: string;
};

type SelectionStats = {
  totalNodes: number;
  textNodes: number;
  totalCharacters: number;
  totalWords: number;
  selectedTextNodes: number;
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
function isStandardRadius(radius: number): boolean {
  return STANDARD_RADIUS.includes(radius);
}

// 获取所有文本样式
async function getTextStyles(): Promise<StyleInfo[]> {
  const styles = await figma.getLocalTextStylesAsync();
  return styles.map(style => ({
    id: style.id,
    name: style.name
  }));
}

// 获取节点的文本统计信息
function getTextStats(nodes: readonly SceneNode[]): SelectionStats {
  let stats: SelectionStats = {
    totalNodes: 0,
    textNodes: 0,
    totalCharacters: 0,
    totalWords: 0,
    selectedTextNodes: 0
  };

  function processNode(node: SceneNode) {
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
function checkCapitalization(text: string): { word: string; index: number; suggestion: string }[] {
  const words = text.split(/\s+/);
  const issues: { word: string; index: number; suggestion: string }[] = [];
  
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
async function checkTextNodes(node: BaseNode, results: TextCheckResult[], selectedStyles: string[]) {
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
  } else if ('children' in node) {
    for (const child of node.children) {
      await checkTextNodes(child, results, selectedStyles);
    }
  }
}

// 修复文本中的首字母大写问题
async function fixTextCapitalization(nodeId: string, suggestion: string) {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (node && node.type === 'TEXT') {
    // 加载字体
    const fontName = node.fontName as FontName;
    await figma.loadFontAsync(fontName);
    
    const text = node.characters;
    const words = text.split(/\s+/);
    const newWords = words.map(word => 
      word === suggestion.toLowerCase() ? suggestion : word
    );
    node.characters = newWords.join(' ');
    
    // 重新检查当前选中的所有节点
    const selection = figma.currentPage.selection;
    const results: TextCheckResult[] = [];
    for (const selectedNode of selection) {
      await checkTextNodes(selectedNode, results, []);
    }
    
    // 发送更新后的结果到UI
    figma.ui.postMessage({
      type: 'review-complete',
      results: results
    });
    
    figma.notify('Text updated successfully');
  }
}

// 跳转到指定节点
async function goToNode(nodeId: string) {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      console.error('Node not found:', nodeId);
      figma.notify('找不到指定的图层');
      return;
    }

    if ('type' in node) {
      const sceneNode = node as SceneNode;
      
      // 确保节点所在的页面是当前页面
      let currentNode: BaseNode | null = sceneNode;
      while (currentNode && currentNode.type !== 'PAGE') {
        currentNode = currentNode.parent;
      }
      
      if (currentNode && currentNode.type === 'PAGE') {
        // 使用异步方法设置当前页面
        await figma.setCurrentPageAsync(currentNode as PageNode);
      }

      // 选中节点
      figma.currentPage.selection = [sceneNode];
      
      // 将视图居中到节点
      figma.viewport.scrollAndZoomIntoView([sceneNode]);
      
      // 闪烁提示
      figma.notify('已定位到图层: ' + sceneNode.name);
    } else {
      figma.notify('无法定位到该类型的图层');
    }
  } catch (error) {
    console.error('Error navigating to node:', error);
    figma.notify('定位图层时出错');
  }
}

// 检查节点是否需要被检查
function shouldCheckNode(node: TextNode, selectedStyles: string[]): boolean {
  // 如果没有选择任何样式，则检查所有文本
  if (selectedStyles.length === 0) return true;
  
  // 如果节点没有样式，始终检查
  if (!node.textStyleId) return true;
  
  // 检查节点的样式是否在选中的样式列表中
  const styleId = node.textStyleId.toString();
  return selectedStyles.includes(styleId);
}

// 检查节点的圆角
async function checkNodeRadius(node: SceneNode): Promise<RadiusCheckResult | null> {
  // 只检查矩形、自动布局和框架
  if (!('cornerRadius' in node)) return null;

  const radius = (node as any).cornerRadius;
  
  if (radius === undefined) return null;

  // 确保返回的数据是可序列化的，并忽略0值
  const cornerRadius = Array.isArray(radius) 
    ? radius.map(r => typeof r === 'number' ? r : 0).filter(r => r !== 0)
    : typeof radius === 'number' ? radius : 0;

  // 如果所有圆角都是0，则返回null
  if (Array.isArray(cornerRadius) && cornerRadius.length === 0) return null;
  if (!Array.isArray(cornerRadius) && cornerRadius === 0) return null;

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
}

// 递归检查节点的圆角
async function checkRadiusRecursively(node: BaseNode, results: RadiusCheckResult[]) {
  if ('cornerRadius' in node) {
    const result = await checkNodeRadius(node as SceneNode);
    if (result) {
      results.push(result);
    }
  }

  if ('children' in node) {
    for (const child of node.children) {
      await checkRadiusRecursively(child, results);
    }
  }
}

// 修复圆角问题
async function fixNodeRadius(nodeId: string, suggestion: number) {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (node && 'cornerRadius' in node) {
    const targetNode = node as any;
    if (Array.isArray(targetNode.cornerRadius)) {
      // 如果是混合圆角，统一设置为建议值
      targetNode.cornerRadius = [suggestion, suggestion, suggestion, suggestion];
    } else {
      targetNode.cornerRadius = suggestion;
    }
    figma.notify('Corner radius updated successfully');
  }
}

// 修改消息处理器
figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case 'init':
      await handleInit();
      break;
    case 'start-review':
      await handleStartReview(msg.selectedStyles, msg.nodesToReview);
      break;
    case 'get-text-styles':
      const styles = await getTextStyles();
      figma.ui.postMessage({
        type: 'text-styles-update',
        styles
      });
      break;
    case 'fix-text':
      if (msg.nodeId && msg.suggestion) {
        await fixTextCapitalization(msg.nodeId, msg.suggestion);
      }
      break;
    case 'go-to-node':
      if (msg.nodeId) {
        await goToNode(msg.nodeId);
      }
      break;
    case 'start-radius-review':
      const radiusResults: RadiusCheckResult[] = [];
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.notify('Please select at least one element to review');
        return;
      }

      try {
        for (const node of selection) {
          await checkRadiusRecursively(node, radiusResults);
        }

        // 过滤掉所有圆角为0的结果
        const filteredResults = radiusResults.filter(result => {
          if (Array.isArray(result.cornerRadius)) {
            return result.cornerRadius.length > 0;
          }
          return result.cornerRadius !== 0;
        });

        // 确保所有数据都是可序列化的
        const serializedResults = filteredResults.map(result => ({
          ...result,
          cornerRadius: Array.isArray(result.cornerRadius)
            ? result.cornerRadius.map(r => Number(r))
            : Number(result.cornerRadius),
          hasDecimal: result.hasDecimal
        }));

        if (serializedResults.length > 0) {
          figma.ui.postMessage({
            type: 'radius-review-complete',
            results: serializedResults
          });
          figma.notify(`Found ${serializedResults.length} elements with non-zero radius`);
        } else {
          figma.notify('No elements with non-zero radius found');
          figma.ui.postMessage({
            type: 'radius-review-complete',
            results: []
          });
        }
      } catch (error) {
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
        await fixNodeRadius(msg.nodeId, msg.suggestion);
        
        // 重新检查并更新UI
        const radiusResults: RadiusCheckResult[] = [];
        const selection = figma.currentPage.selection;
        for (const node of selection) {
          await checkRadiusRecursively(node, radiusResults);
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
};

// 初始化处理
async function handleInit() {
  // 发送当前选择到UI
  const selection = figma.currentPage.selection;
  const stats = getTextStats(selection);
  
  // 获取所有文本节点
  const textNodes = selection.reduce((acc: SelectionInfo[], node) => {
    function collectTextNodes(n: SceneNode) {
      if (n.type === 'TEXT') {
        acc.push({
          id: n.id,
          name: n.name,
          type: n.type,
          textContent: n.characters,
          styleId: n.textStyleId as string || undefined
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
  const styles = await getTextStyles();
  
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
}

// 选择变化处理
function handleSelectionCheck() {
  const selection = figma.currentPage.selection;
  const stats = getTextStats(selection);
  
  // 获取所有文本节点
  const textNodes = selection.reduce((acc: SelectionInfo[], node) => {
    function collectTextNodes(n: SceneNode) {
      if (n.type === 'TEXT') {
        acc.push({
          id: n.id,
          name: n.name,
          type: n.type,
          textContent: n.characters,
          styleId: n.textStyleId as string || undefined
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
async function handleStartReview(selectedStyles: string[] = [], nodesToReview: string[] = []) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('Please select at least one element to review');
    return;
  }

  // 检查所有选中元素中的文本
  const results: TextCheckResult[] = [];
  
  // 如果提供了要检查的节点ID列表，则只检查这些节点
  if (nodesToReview.length > 0) {
    const nodes = await Promise.all(
      nodesToReview.map(id => figma.getNodeByIdAsync(id))
    );
    const validNodes = nodes.filter(node => node) as SceneNode[];
    for (const node of validNodes) {
      await checkTextNodes(node, results, selectedStyles);
    }
  } else {
    for (const node of selection) {
      await checkTextNodes(node, results, selectedStyles);
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
  } else {
    figma.notify('No capitalization issues found');
  }
} 