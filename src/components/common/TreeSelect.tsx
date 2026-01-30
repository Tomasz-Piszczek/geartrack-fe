import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { ProductGroupDto } from '../../api/bi-service';
import Label from './Label';

interface TreeNode {
  group: ProductGroupDto;
  children: TreeNode[];
}

interface TreeSelectProps {
  groups: ProductGroupDto[];
  value?: number;
  onChange: (groupId: number | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TreeSelect: React.FC<TreeSelectProps> = ({
  groups,
  value,
  onChange,
  label,
  placeholder = 'Wszystkie grupy',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => {
    const nodeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    groups.forEach(group => {
      nodeMap.set(group.id, { group, children: [] });
    });

    groups.forEach(group => {
      const node = nodeMap.get(group.id);
      if (!node) return;

      if (group.parentId === 0 || !group.parentId) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(group.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }, [groups]);

  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tree;

    const search = searchTerm.toLowerCase();
    const matchingNodes = new Set<number>();

    const findMatches = (node: TreeNode) => {
      const matches =
        node.group.name.toLowerCase().includes(search) ||
        node.group.code.toLowerCase().includes(search) ||
        node.group.path.toLowerCase().includes(search);

      if (matches) {
        matchingNodes.add(node.group.id);
        let current = node.group;
        while (current.parentId && current.parentId !== 0) {
          matchingNodes.add(current.parentId);
          const parent = groups.find(g => g.id === current.parentId);
          if (!parent) break;
          current = parent;
        }
      }

      node.children.forEach(findMatches);
    };

    tree.forEach(findMatches);

    const filterNodes = (node: TreeNode): TreeNode | null => {
      if (!matchingNodes.has(node.group.id)) return null;

      const filteredChildren = node.children
        .map(filterNodes)
        .filter((n): n is TreeNode => n !== null);

      return { group: node.group, children: filteredChildren };
    };

    return tree
      .map(filterNodes)
      .filter((n): n is TreeNode => n !== null);
  }, [tree, searchTerm, groups]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const allIds = new Set<number>();
      const collectIds = (node: TreeNode) => {
        allIds.add(node.group.id);
        node.children.forEach(collectIds);
      };
      filteredTree.forEach(collectIds);
      setExpandedNodes(allIds);
    }
  }, [searchTerm, filteredTree]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSelect = (groupId: number) => {
    onChange(groupId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedGroup = groups.find(g => g.id === value);
  const displayText = selectedGroup ? `${selectedGroup.name} (${selectedGroup.code})` : placeholder;

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.group.id);
    const hasChildren = node.children.length > 0;
    const isSelected = value === node.group.id;

    return (
      <div key={node.group.id}>
        <div
          className={`flex items-center py-2 cursor-pointer ${
            isSelected ? 'bg-[rgb(124,147,87)] text-white' : 'hover:bg-background-light text-white'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px`, paddingRight: '12px' }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.group.id);
              }}
              className="mr-1 focus:outline-none text-gray-400 hover:text-white flex-shrink-0"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="mr-1 w-4 flex-shrink-0"></span>
          )}
          <span
            onClick={() => handleSelect(node.group.id)}
            className="flex-1 text-sm"
          >
            {node.group.name} ({node.group.code})
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <Label>{label}</Label>}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-md bg-background-dark text-white border-gray-600 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{displayText}</span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[rgb(33,37,41)] border border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
              <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-background-dark text-white border border-gray-600 rounded-md focus:outline-none focus:ring-0 focus:border-gray-600"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <div
              className={`px-3 py-2 cursor-pointer text-white ${
                !value ? 'bg-[rgb(124,147,87)]' : 'hover:bg-background-light'
              }`}
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              <span className="text-sm">{placeholder}</span>
            </div>
            {filteredTree.length > 0 ? (
              filteredTree.map(node => renderNode(node))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">Brak wyników</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeSelect;
