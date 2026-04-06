"use client";

import { useEffect, useState, useRef } from 'react';
import treeData from '../../data/tree-data.json';
import RadialTree, { RadialTreeHandle, TreeNode } from '../components/RadialTree';
import './globals.css';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const treeRef = useRef<RadialTreeHandle>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create a single root node with all family trees as its children
  // The structure assumes treeData is an array of root elements (like families)
  const rootNode: TreeNode = {
    name: "Our Network",
    children: treeData as TreeNode[]
  };

  if (!isClient) {
    return null;
  }

  const handleDownload = () => {
    if (treeRef.current) {
        treeRef.current.exportToPng();
    }
  };

  return (
    <div className="App">
      <RadialTree ref={treeRef} data={rootNode} />
      <button 
        className="download-button" 
        onClick={handleDownload}
        title="Download high resolution PNG"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export PNG
      </button>
    </div>
  );
}
