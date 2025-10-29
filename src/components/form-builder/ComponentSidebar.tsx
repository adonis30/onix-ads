// src/components/form-builder/ComponentSidebar.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { ComponentRegistry } from '@/lib/form-builder/component-registry';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, Mail, Hash, Phone, Link, Lock, TextQuote, List, Circle, 
  CheckSquare, Calendar, Clock, FileUp, PenTool, Star, Sliders,
  LayoutGrid, Rows, Square, Layers, FoldVertical, GitBranch, SplitSquareVertical,
  Search, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, any> = {
  Type, Mail, Hash, Phone, Link, Lock, TextQuote, List, Circle,
  CheckSquare, Calendar, Clock, FileUp, PenTool, Star, Sliders,
  LayoutGrid, Rows, Square, Layers, FoldVertical, GitBranch, SplitSquareVertical,
};

function DraggableComponent({ component }: { component: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${component.type}`,
    data: { component },
  });

  const Icon = iconMap[component.icon] || Type;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent
        cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{component.label}</p>
        <p className="text-xs text-muted-foreground truncate">{component.description}</p>
      </div>
    </div>
  );
}

export function ComponentSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);

  const allComponents = ComponentRegistry.getAll();
  
  const filteredComponents = allComponents.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputComponents = filteredComponents.filter(c => c.category === 'input');
  const choiceComponents = filteredComponents.filter(c => c.category === 'choice');
  const layoutComponents = filteredComponents.filter(c => c.category === 'layout');
  const advancedComponents = filteredComponents.filter(c => c.category === 'advanced');

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <h2 className="font-semibold text-lg">Components</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* AI Assistant Button */}
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => setShowAIPanel(!showAIPanel)}
        >
          <Sparkles className="h-4 w-4" />
          AI Form Generator
        </Button>
      </div>

      {/* Components List */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 m-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-4 space-y-4">
            {inputComponents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Input Fields</h3>
                <div className="space-y-2">
                  {inputComponents.map(component => (
                    <DraggableComponent key={component.type} component={component} />
                  ))}
                </div>
              </div>
            )}

            {choiceComponents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Choice Fields</h3>
                <div className="space-y-2">
                  {choiceComponents.map(component => (
                    <DraggableComponent key={component.type} component={component} />
                  ))}
                </div>
              </div>
            )}

            {advancedComponents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Advanced</h3>
                <div className="space-y-2">
                  {advancedComponents.map(component => (
                    <DraggableComponent key={component.type} component={component} />
                  ))}
                </div>
              </div>
            )}

            {layoutComponents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Layouts</h3>
                <div className="space-y-2">
                  {layoutComponents.map(component => (
                    <DraggableComponent key={component.type} component={component} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fields" className="p-4 space-y-2">
            {[...inputComponents, ...choiceComponents, ...advancedComponents].map(component => (
              <DraggableComponent key={component.type} component={component} />
            ))}
          </TabsContent>

          <TabsContent value="layouts" className="p-4 space-y-2">
            {layoutComponents.map(component => (
              <DraggableComponent key={component.type} component={component} />
            ))}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
