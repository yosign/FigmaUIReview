"use client"

import { useEffect, useState } from 'react'
import { Tabs } from '@/components/navigation/Tabs'

type SelectionInfo = {
  id: string
  name: string
  type: string
}

export default function Home() {
  const [selection, setSelection] = useState<SelectionInfo[]>([])
  const [results, setResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('text')

  useEffect(() => {
    // 监听来自插件的消息
    window.onmessage = (event) => {
      const message = event.data.pluginMessage
      if (!message) return

      switch (message.type) {
        case 'selection-update':
          setSelection(message.selection)
          break
        case 'review-complete':
          setResults(message.results)
          break
      }
    }

    // 发送初始化消息
    parent.postMessage({ pluginMessage: { type: 'init' } }, '*')
  }, [])

  const handleStartReview = () => {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'start-review',
        reviewType: activeTab 
      } 
    }, '*')
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setResults([]); // 切换 tab 时清空结果
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4">
        {/* 顶部导航 */}
        <header className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">UI Review</h1>
            <Tabs onTabChange={handleTabChange} />
          </div>
        </header>

        {/* 配置区域 */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Configuration</h2>
          <button
            onClick={handleStartReview}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Start {activeTab === 'text' ? 'Text' : 'Radius'} Review
          </button>
        </section>

        {/* 选择区域 */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Selected Elements</h2>
          <div className="space-y-2">
            {selection.map((item) => (
              <div
                key={item.id}
                className="p-2 bg-gray-50 rounded flex justify-between items-center"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-gray-500">{item.type}</span>
              </div>
            ))}
            {selection.length === 0 && (
              <p className="text-gray-500">No elements selected</p>
            )}
          </div>
        </section>

        {/* 结果区域 */}
        <section className="bg-white rounded-lg shadow p-4 flex-1">
          <h2 className="text-lg font-semibold mb-2">Review Results</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-2 bg-gray-50 rounded"
              >
                {/* TODO: 显示检查结果 */}
                <p>Result placeholder</p>
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-gray-500">No results yet</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
} 