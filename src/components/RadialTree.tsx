"use client";

import * as d3 from 'd3';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

export interface TreeNode {
  name: string;
  imageUrl?: string;
  link?: string;
  children?: TreeNode[];
}

interface RadialTreeProps {
  data: TreeNode;
}

export interface RadialTreeHandle {
  exportToPng: () => void;
}

const RadialTree = forwardRef<RadialTreeHandle, RadialTreeProps>(({ data }, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    exportToPng: async () => {
      if (!svgRef.current) return;
      try {
        const svgElement = svgRef.current;
        const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
        
        // Ensure standard namespace so XML parsing works correctly when drawing to canvas
        if (!svgClone.getAttribute('xmlns')) {
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // --- NEW LOGIC: Pre-fetch images and convert to Base64 to bypass Canvas/SVG loading limitations ---
        const images = Array.from(svgClone.querySelectorAll('image'));
        for (const img of images) {
          const url = img.getAttribute('href') || img.getAttribute('xlink:href');
          if (url && !url.startsWith('data:')) {
            try {
              const response = await fetch(url, { mode: 'cors' });
              const blob = await response.blob();
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              img.setAttribute('href', base64);
              if (img.hasAttribute('xlink:href')) {
                  img.setAttribute('xlink:href', base64);
              }
            } catch(e) {
              console.warn("Could not fetch image to embed in PNG", url, e);
            }
          }
        }

        const width = Number(svgElement.getAttribute('width')) || dimensions.width || 1920;
        const height = Number(svgElement.getAttribute('height')) || dimensions.height || 1080;
        
        const xmlSerializer = new XMLSerializer();
        const svgString = xmlSerializer.serializeToString(svgClone);
        
        const canvas = document.createElement("canvas");
        const scale = 3; // For high-res
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");

        if(!ctx) return;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            // Draw background explicitly just in case transparent
            ctx.fillStyle = "#222"; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            
            try {
                const imgURI = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                const evt = new MouseEvent("click", {
                    view: window,
                    bubbles: false,
                    cancelable: true
                });
                
                const a = document.createElement("a");
                a.setAttribute("download", "family-tree.png");
                a.setAttribute("href", imgURI);
                a.setAttribute("target", '_blank');
                a.dispatchEvent(evt);
            } catch (err) {
                alert("Could not export PNG. This is usually caused by loading external images (CORS) that taint the canvas.");
                console.error("Canvas export error:", err);
            }
        };
        img.src = url;

      } catch (error) {
        console.error("Error exporting to PNG", error);
      }
    }
  }));

  useEffect(() => {
    const updateDimensions = () => {
      const parent = svgRef.current?.parentElement;
      if (parent) {
        setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append("defs");
    defs.append("clipPath")
        .attr("id", "avatar-clip")
        .append("circle")
        .attr("r", 15);

    // Define a linear gradient for the background
    const linearGradient = defs.append("linearGradient")
        .attr("id", "background-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#0a1828"); // Darker blue

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#000d1a"); // Even darker blue

    // Append a rectangle to fill the background with the gradient
    svg.append("rect")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .attr("fill", "url(#background-gradient)");

    const width = dimensions.width;
    const height = dimensions.height;
    const radius = Math.min(width, height) / 2 * 3.2;

    const g = svg.append("g");
    const rotatedG = g.append("g").attr("transform", "rotate(90)");

    const topGap = 45 * Math.PI / 180;
    const bottomGap = 45 * Math.PI / 180;
    const usableAngle = (360 * Math.PI / 180) - topGap - bottomGap;
    const sectionAngle = usableAngle / 2; // 135 degrees

    const treeLayout = d3.tree<TreeNode>()
        .size([sectionAngle, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / (a.depth || 1));

    const originalChildren = data.children || [];
    const midIndex = Math.floor(originalChildren.length / 2);

    const rightData: TreeNode = { ...data, children: originalChildren.slice(0, midIndex) };
    const leftData: TreeNode = { ...data, children: originalChildren.slice(midIndex) };

    const rightRoot = d3.hierarchy(rightData, d => d.children);
    const leftRoot = d3.hierarchy(leftData, d => d.children);

    treeLayout(rightRoot);
    treeLayout(leftRoot);
    
    // Position right side from -67.5 to +67.5 degrees
    const rightAngleOffsetRad = -sectionAngle / 2; 
    // Position left side from 112.5 to 247.5 degrees
    const leftAngleOffsetRad = topGap + sectionAngle / 2; 
    
    const linkGroup = rotatedG.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);
    
    const nodeGroup = rotatedG.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3);

    const drawTree = (rootNode: d3.HierarchyNode<TreeNode>, angleOffsetRad: number, id_suffix: string) => {
        if (rootNode.depth === 0 && (!rootNode.children || rootNode.children.length === 0)) {
            return; 
        }
        
        linkGroup.selectAll(`path.link-${id_suffix}`)
            .data(rootNode.links())
            .join("path")
            .attr('class', `link-${id_suffix}`)
            .attr("d", d3.linkRadial<any, d3.HierarchyPointNode<TreeNode>>()
                .angle(d => d.x! + angleOffsetRad)
                .radius(d => d.y!)
            );

        const nodes = nodeGroup.selectAll(`g.node-${id_suffix}`)
            .data(rootNode.descendants())
            .join("g")
            .attr('class', `node-${id_suffix}`)
            .filter(d => d.depth > 0)
            .attr("transform", d => {
                const finalAngleRad = d.x! + angleOffsetRad;
                const finalAngleDeg = finalAngleRad * 180 / Math.PI;
                return `rotate(${finalAngleDeg - 90}) translate(${d.y!},0)`;
            })
            .on("click", (event, d) => {
                if (d.data.link) {
                    window.open(d.data.link, "_blank");
                }
            })
            // Added pointer cursor if it's clickable
            .style("cursor", d => d.data.link ? "pointer" : "default");

        // Create a group for the image and counter-rotate it to be horizontal
        const imageGroup = nodes.append("g")
            .attr("transform", d => {
                const finalAngleRad = d.x! + angleOffsetRad;
                const finalAngleDeg = finalAngleRad * 180 / Math.PI;
                // Counteract the node's rotation (`finalAngleDeg - 90`) and the root 90-degree rotation.
                return `rotate(${-(finalAngleDeg)})`;
            });

        imageGroup.append("image")
            .attr("xlink:href", d => d.data.imageUrl || "")
            .attr("clip-path", "url(#avatar-clip)")
            .attr("x", -15)
            .attr("y", -15)
            .attr("width", 30)
            .attr("height", 30)
            .style("filter", "url(#glow)");

        nodes.append("title").text(d => d.data.name);

        nodes.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => {
                const finalAngleRad = d.x! + angleOffsetRad;
                const overallAngle = (finalAngleRad * 180 / Math.PI + 90 + 360) % 360;
                return (overallAngle > 180) ? -20 : 20;
            })
            .attr("text-anchor", d => {
                const finalAngleRad = d.x! + angleOffsetRad;
                const overallAngle = (finalAngleRad * 180 / Math.PI + 90 + 360) % 360;
                return (overallAngle > 180) ? "end" : "start";
            })
            .attr("transform", d => {
                const finalAngleRad = d.x! + angleOffsetRad;
                const overallAngle = (finalAngleRad * 180 / Math.PI + 90 + 360) % 360;
                return overallAngle > 180 ? "rotate(180)" : null;
            })
            .text(d => d.data.name)
            .attr("fill", "white");
    };

    drawTree(rightRoot, rightAngleOffsetRad, 'right');
    drawTree(leftRoot, leftAngleOffsetRad, 'left');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.4);
    svg.call(zoom.transform, initialTransform);

  }, [data, dimensions]);

  return (
    <svg 
      ref={svgRef} 
      width={dimensions.width} 
      height={dimensions.height} 
      style={{ background: '#222' }}
      xmlns="http://www.w3.org/2000/svg"
    />
  );
});

RadialTree.displayName = "RadialTree";

export default RadialTree;
