import { useState } from 'react';
import { cn } from '@/lib/utils';

type Tab = {
  id: string;
  label: string;
};

const tabs: Tab[] = [
  { id: 'text', label: '文案' },
  { id: 'radius', label: '圆角' },
];

interface TabsProps {
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="flex items-center space-x-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium transition-all rounded-md',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
} 