const fs = require('fs');
const path = require('path');

// 读取原始的ui.html
const uiTemplate = fs.readFileSync(path.join(__dirname, '../ui.html'), 'utf8');

// 读取Next.js客户端构建输出
const nextJsBundle = fs.readFileSync(path.join(__dirname, '../.next/static/chunks/app/page.js'), 'utf8');
const nextJsRuntimeBundle = fs.readFileSync(path.join(__dirname, '../.next/static/chunks/webpack.js'), 'utf8');
const nextJsReactBundle = fs.readFileSync(path.join(__dirname, '../.next/static/chunks/main-app.js'), 'utf8');

// 创建新的HTML内容
const newHtml = uiTemplate.replace(
  '<div id="root"></div>',
  `<div id="root"></div>
   <script>${nextJsRuntimeBundle}</script>
   <script>${nextJsReactBundle}</script>
   <script>${nextJsBundle}</script>`
);

// 写入新文件
fs.writeFileSync(path.join(__dirname, '../ui.html'), newHtml, 'utf8'); 