import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import gsap from "gsap"; // Import gsap
import { useGSAP } from "@gsap/react"; // Import useGSAP hook
// 导入新的 CSS 文件名
import './ScatterPlotCanvas.css';

// GSAP Plugin Registration (optional, but good practice if using certain plugins later)
// gsap.registerPlugin(ScrollTrigger, Draggable, MotionPathPlugin); // Example

// Helper function to run the animation loop independently
const runTransitionAnimation = (
    context, width, height, targetXScale, targetYScale,
    animList, duration, drawFrameCallback, onFinishCallback
) => {
    let animationFrameId = null;
    const animationStart = performance.now();

    const animate = (now) => {
        const tRaw = (now - animationStart) / duration;
        const t = 1 - Math.pow(1 - Math.min(1, tRaw), 3); // easeOutCubic

        const interpolatedRaw = animList.map(d => ({
            ...d,
            x: d.from.x * (1 - t) + d.to.x * t,
            y: d.from.y * (1 - t) + d.to.y * t
        }));

        // Call the drawing function for this frame
        drawFrameCallback(context, width, height, targetXScale, targetYScale, interpolatedRaw);

        if (tRaw < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Animation finished
            animationFrameId = null;
            if (onFinishCallback) {
                onFinishCallback();
            }
        }
    };

    // Start the animation
    animationFrameId = requestAnimationFrame(animate);

    // Return a function to cancel the animation
    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    };
};

// 增加轴标签 props
const ScatterPlotCanvas = ({
  currentView,
  emojiPositions,
  selectedCluster,
  selectedPairs,
  selectedEmoji,
  onEmojiSelect,
  onPairUpdate,
  colorScale,
  calculateSimilarity,
  xAxisLabel = "X Axis", // X轴标签默认值
  yAxisLabel = "Y Axis",  // Y轴标签默认值
  // 差异高亮相关参数
  showDifferences = false,
  differenceThreshold = 0,
  differenceColorScale = null,
  differenceStyle = 'size',
  lastPositions = null,
}) => {
  // --- Log received lastPositions prop --- >
  console.log(`[ScatterPlotCanvas Func] Received lastPositions prop length: ${lastPositions?.length ?? 'null'}`);
  // --- < Log --- 

  const containerRef = useRef();  // *** 新增 Ref: 引用容器 div ***
  const svgRef = useRef();        // Ref for SVG overlay (axes, potentially interactions)
  const canvasRef = useRef();     // Ref for Canvas (points)
  const zoomState = useRef({ k: 1, x: 0, y: 0 }); // 保存缩放状态
  const mainGroupRef = useRef();  // Ref for SVG group containing lines/labels if drawn on SVG
  const quadtreeRef = useRef();   // Ref for d3-quadtree
  // *** 新增 State: 存储动态尺寸 ***
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const pointsRef = useRef([]); // Ref to hold the array of points for GSAP animation
  const previousViewRef = useRef(null);
  const previousEmojiPositionsRef = useRef(null);
  const isInitialRenderRef = useRef(true);
  // Refs to store the currently active scales used by the quadtree
  const currentXScaleRef = useRef(null);
  const currentYScaleRef = useRef(null);

  // Effect for setting up ResizeObserver
  useEffect(() => {
    const plotContainer = containerRef.current;
    if (!plotContainer) return;

    let currentWidth = 0;
    let currentHeight = 0;

    const resizeObserver = new ResizeObserver(entries => {
        if (!entries || entries.length === 0) return;
        const { width, height } = entries[0].contentRect;

        // *** Only update state if dimensions actually change ***
        if (width > 0 && height > 0 && (width !== currentWidth || height !== currentHeight)) {
            currentWidth = width;
            currentHeight = height;
            console.log('[ResizeObserver] Initial Dimensions:', width, height);
            setDimensions({ width, height });
        }
    });

    resizeObserver.observe(plotContainer);

    // Initial size set
    const initialRect = plotContainer.getBoundingClientRect();
    if (initialRect.width > 0 && initialRect.height > 0) {
        currentWidth = initialRect.width;
        currentHeight = initialRect.height;
        console.log('[ResizeObserver] Initial Dimensions:', initialRect.width, initialRect.height);
        setDimensions({ width: initialRect.width, height: initialRect.height });
    }

    return () => {
      resizeObserver.unobserve(plotContainer);
    };
  }, []); // Run once

  // The core drawing function - now accepts scales
  const drawCanvas = useCallback((drawXScale, drawYScale) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const { width, height } = dimensions;
    if (!context || !pointsRef.current || width === 0 || height === 0) return;

    // Use passed scales, or calculate default if not provided
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const currentEmojiDataForExtent = emojiPositions || [];
    const xExtent = d3.extent(currentEmojiDataForExtent, d => d.x);
    const yExtent = d3.extent(currentEmojiDataForExtent, d => d.y);
    const xPadding = xExtent[1] === xExtent[0] ? 1 : (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = yExtent[1] === yExtent[0] ? 1 : (yExtent[1] - yExtent[0]) * 0.1;
    const xScale = drawXScale || d3.scaleLinear().domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([margin.left, width - margin.right]);
    const yScale = drawYScale || d3.scaleLinear().domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([height - margin.bottom, margin.top]);

    // Log scale info for the first draw call triggered by GSAP/useEffect
    if (pointsRef.current.length > 0) { 
      console.log('[drawCanvas] xScale Domain:', xScale.domain(), 'Range:', xScale.range());
      console.log('[drawCanvas] yScale Domain:', yScale.domain(), 'Range:', yScale.range());
      console.log('[drawCanvas] Sample Point 0 Scaled:', xScale(pointsRef.current[0].x), yScale(pointsRef.current[0].y));
    }

    context.save();
    context.clearRect(0, 0, width, height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw points - Apply threshold check here
    pointsRef.current.forEach(d => {
      // Check if point should be visible based on threshold
      const isVisible = !showDifferences || d.difference === undefined || d.difference >= differenceThreshold;

      if (isVisible) {
        const currentX = xScale(d.x);
        const currentY = yScale(d.y);

        // --- REMOVED Background Halo --- 

        // --- Restore Original Emoji Drawing --- 
        // Determine style (only if visible)
        let isHighlighted = showDifferences && differenceStyle === 'size'; // Check for size highlight style
        let fillColor = colorScale(d.cluster); // Default color based on cluster
        let fontWeight = 'normal';
        let fontSize = 20;
        
        // Apply difference styling if highlighted
        if (isHighlighted && d.difference !== undefined && differenceColorScale) {
          fillColor = differenceColorScale(d.difference); // Use difference color
          fontWeight = 'bold'; // Make bold
          fontSize = 32; // Increase size
        }

        context.fillStyle = fillColor;
        context.font = `${fontWeight} ${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        context.fillText(d.char, currentX, currentY);
        // --- End Restore Original Emoji Drawing ---

        // Selection borders (only for visible points)
        const isSelectedForPair = selectedPairs?.flat().find(p => p?.id === d.id);
        const isSingleSelected = selectedEmoji?.id === d.id;
        if (isSelectedForPair || isSingleSelected) {
            context.strokeStyle = isSelectedForPair ? "red" : "blue";
            context.lineWidth = 1;
            const bboxWidth = fontSize - 2;
            const bboxHeight = fontSize - 2;
            context.strokeRect(currentX - bboxWidth / 2, currentY - bboxHeight / 2, bboxWidth, bboxHeight);
        }
      }
    });

    // --- Draw Dashed Lines --- 
    if (lastPositions) {
      console.log(`[drawCanvas] Drawing lines block. showDifferences=${showDifferences}, style=${differenceStyle}`);
      const lastMap = new Map(lastPositions.map(lp => [lp.id, lp]));
      let linesAttempted = 0;

      // Determine base opacity based on controls
      const targetLineOpacity = (showDifferences && differenceStyle === 'line') ? 0.6 : 0;
      console.log(`[drawCanvas] Target Line Opacity: ${targetLineOpacity}`);

      // Set general line style for this block
      context.setLineDash([4, 4]);
      context.lineWidth = 1.5;

      pointsRef.current.forEach(d => {
        const prev = lastMap.get(d.id);
        const isPointCurrentlyVisible = !showDifferences || d.difference === undefined || d.difference >= differenceThreshold;

        // --- Detailed Log for Visible Points --- >
        if (isPointCurrentlyVisible) {
          console.log(`[Line Draw Check] Point ID: ${d.id}, Should be visible: ${isPointCurrentlyVisible}, Has prev position: ${!!prev}, Style Active: ${showDifferences && differenceStyle === 'line'}`);
        }
        // --- < Detailed Log --- 

        // Only execute block if previous position exists AND the point is currently visible
        if (prev && isPointCurrentlyVisible) {
          linesAttempted++;

          // --- Restore original line drawing code with logging --- >
          const color = differenceColorScale ? differenceColorScale(d.difference) : '#B54369';
          const moveToX = xScale(prev.x);
          const moveToY = yScale(prev.y);
          const lineToX = xScale(d.x);
          const lineToY = yScale(d.y);

          console.log(`[Line Draw] ID: ${d.id}, Prev: (${prev.x.toFixed(2)}, ${prev.y.toFixed(2)}), Curr: (${d.x.toFixed(2)}, ${d.y.toFixed(2)}), MoveTo: (${moveToX.toFixed(1)}, ${moveToY.toFixed(1)}), LineTo: (${lineToX.toFixed(1)}, ${lineToY.toFixed(1)}), Color: ${color}`);

          // Only draw if style active (opacity handled by globalAlpha)
          if (showDifferences && differenceStyle === 'line') {
              context.strokeStyle = color;
              context.globalAlpha = targetLineOpacity; // Opacity based on style selection
              context.beginPath();
              context.moveTo(moveToX, moveToY);
              context.lineTo(lineToX, lineToY);
              context.stroke();
          }
          // --- < End Restore --- 
        }
      });

      // Restore defaults AFTER drawing all lines
      context.setLineDash([]);
      context.globalAlpha = 1; // IMPORTANT: Reset alpha for subsequent drawing
      console.log(`[drawCanvas] Attempted to draw ${linesAttempted} lines.`);
    }
    // --- End Dashed Lines --- 

    // Draw similarity lines
    if (selectedPairs) {
      selectedPairs.forEach((pair, index) => {
        if (pair.length === 2) {
          const point1 = pointsRef.current.find(p => p.id === pair[0].id);
          const point2 = pointsRef.current.find(p => p.id === pair[1].id);
          // --- Log Similarity Check --- >
          console.log(`[Similarity Check] Pair ${index}: p1 found=${!!point1}, p2 found=${!!point2}`);
          if (point1 && point2) {
            const similarity = calculateSimilarity(point1, point2)?.toFixed(3);
            const pairColor = d3.schemeSet2[index % 8];
            const x1 = xScale(point1.x), y1 = yScale(point1.y);
            const x2 = xScale(point2.x), y2 = yScale(point2.y);
            console.log(`[Similarity Draw] Pair ${index}: (${x1.toFixed(1)}, ${y1.toFixed(1)}) to (${x2.toFixed(1)}, ${y2.toFixed(1)})`);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.strokeStyle = pairColor;
            context.lineWidth = 1.5;
            context.setLineDash([4, 4]);
            context.stroke();
            context.setLineDash([]);
            context.fillStyle = 'white';
            context.strokeStyle = pairColor;
            context.lineWidth = 1;
            const labelWidth = 100;
            const labelHeight = 20;
            context.fillRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight);
            context.strokeRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight);
            context.fillStyle = '#333';
            context.font = '11px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(similarity !== undefined ? `similarity = ${similarity}` : '...', midX, midY);
          }
          // --- < End Log --- 
        }
      });
    }

    context.restore();

  }, [dimensions, colorScale, selectedPairs, selectedEmoji, calculateSimilarity, showDifferences, differenceStyle, differenceThreshold, differenceColorScale, emojiPositions, lastPositions]);

  useGSAP(() => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0 || !emojiPositions) return;

    // --- Initialization --- //
    if (isInitialRenderRef.current) {
      console.log("[useGSAP] Initializing.");
      pointsRef.current = emojiPositions.map(d => ({ ...d }));
      drawCanvas();
      isInitialRenderRef.current = false;
      previousViewRef.current = currentView;
      previousEmojiPositionsRef.current = emojiPositions;
      return;
    }

    // --- Updates --- //
    // Check changes based on refs holding values from the *previous* run
    const didViewSwitch = currentView !== previousViewRef.current;
    const didDataChange = emojiPositions !== previousEmojiPositionsRef.current;

    console.log(`[useGSAP] Update. View: ${currentView}, PrevView: ${previousViewRef.current}, ViewSwitch: ${didViewSwitch}, DataRefChanged: ${didDataChange}`);

    // Guard against no relevant change if needed (e.g., only drawCanvas ref changed but content is same)
    // if (!didViewSwitch && !didDataChange) {
    //   console.log("[useGSAP] No view or data reference change detected.");
       // Potentially still need to redraw if only style/threshold caused drawCanvas ref change
       // drawCanvas();
    //   return;
    // }

    // --- Sync pointsRef structure and data --- //
    const targets = {};
    const currentPointsMap = new Map(pointsRef.current.map(p => [p.id, p]));
    const newPointsData = (emojiPositions || []).map((d, i) => {
        const existingPoint = currentPointsMap.get(d.id);
        targets[i] = { x: d.x, y: d.y }; // Always store target coords
        // Start new points at their target location if view didn't switch
        const startX = didViewSwitch && existingPoint ? existingPoint.x : targets[i].x;
        const startY = didViewSwitch && existingPoint ? existingPoint.y : targets[i].y;
        return {
            ...(existingPoint || { id: d.id }), // Keep existing GSAP object if possible
            ...d, // Update non-coordinate data
            x: startX, // Set initial X for ref
            y: startY  // Set initial Y for ref
        };
    });
    pointsRef.current = newPointsData;

    // --- Decide Action: Animate or Redraw --- //
    if (didViewSwitch) {
        // --- Animate Positions --- //
        console.log("[useGSAP] Starting position animation...");
        // Calculate target scales for animation drawing
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const xExtent = d3.extent(emojiPositions, d => d.x);
        const yExtent = d3.extent(emojiPositions, d => d.y);
        const xPadding = xExtent && xExtent[1] === xExtent[0] ? 1 : (xExtent[1] - xExtent[0]) * 0.1;
        const yPadding = yExtent && yExtent[1] === yExtent[0] ? 1 : (yExtent[1] - yExtent[0]) * 0.1;
        const targetXScale = d3.scaleLinear().domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([margin.left, width - margin.right]);
        const targetYScale = d3.scaleLinear().domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([height - margin.bottom, margin.top]);

        gsap.killTweensOf(pointsRef.current, "x,y");
        gsap.to(pointsRef.current, {
            duration: 0.8,
            x: (index) => targets[index]?.x ?? pointsRef.current[index]?.x,
            y: (index) => targets[index]?.y ?? pointsRef.current[index]?.y,
            ease: "power2.out",
            stagger: 0.005,
            onUpdate: () => drawCanvas(targetXScale, targetYScale),
            onComplete: () => {
                console.log("GSAP position animation complete");
                pointsRef.current = (emojiPositions || []).map((d, i) => ({...(pointsRef.current[i] || {}), ...d, x: targets[i]?.x ?? d.x, y: targets[i]?.y ?? d.y }));
            },
            overwrite: "auto"
        });
    } else {
        // --- Filter or Style Change: Redraw Instantly --- //
        console.log("[useGSAP] Data/Style changed (no view switch), redrawing instantly...");
        gsap.killTweensOf(pointsRef.current, "x,y"); // Ensure no residual animation
        // Call drawCanvas directly to reflect style changes (e.g., threshold)
        drawCanvas(); // Uses default scales
    }

    // --- Update Refs AFTER processing --- //
    if (didViewSwitch) {
        previousViewRef.current = currentView;
    }
    previousEmojiPositionsRef.current = emojiPositions;

  }, { scope: containerRef, dependencies: [
      emojiPositions, dimensions, currentView,
      showDifferences, differenceStyle, differenceThreshold
     ] });

  // Main Effect for D3 Setup and Drawing Final State
  useEffect(() => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0 || !emojiPositions) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const svg = d3.select(svgRef.current);
    const plotContainer = containerRef.current; // Needed?

    if (!canvas || !context || !svg || !plotContainer) return;

    console.log('[Main useEffect] Setting up D3/Canvas with dimensions:', width, height);

    // --- Strict Canvas Size and Scaling --- //
    const dpr = window.devicePixelRatio || 1;
    console.log('[Main useEffect] Device Pixel Ratio:', dpr);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    console.log(`[Main useEffect] Canvas set - Attr: ${canvas.width}x${canvas.height}, Style: ${canvas.style.width}x${canvas.style.height}`);

    context.scale(dpr, dpr); // Scale context AFTER setting canvas size
    // ------------------------------------- //

    // --- Scales, Axes, Grid --- (Setup based on dimensions state)
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const mainGroup = svg.append("g").attr("class", "main-plot-area");
    mainGroupRef.current = mainGroup;

    // Calculate initial scales
    const xExtent = d3.extent(emojiPositions, d => d.x);
    const yExtent = d3.extent(emojiPositions, d => d.y);
    const xPadding = xExtent[1] === xExtent[0] ? 1 : (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = yExtent[1] === yExtent[0] ? 1 : (yExtent[1] - yExtent[0]) * 0.1;
    const xScale = d3.scaleLinear().domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([height - margin.bottom, margin.top]);
    console.log('[Main useEffect] Initial Scales Set - xDomain:', xScale.domain(), 'yDomain:', yScale.domain());

    // Store initial scales in refs
    currentXScaleRef.current = xScale;
    currentYScaleRef.current = yScale;

    // Draw Gridlines
    const makeGridlines = (scale, axisGenerator, size) => axisGenerator(scale).tickSize(-size).tickFormat("");
    mainGroup.append("g").attr("class", "grid grid-x").attr("transform", `translate(0,${height - margin.bottom})`).call(makeGridlines(xScale, d3.axisBottom, height - margin.top - margin.bottom))
      .selectAll("line")
      .attr("stroke", "rgba(255, 255, 255, 0.15)") // 更暗的网格线
      .attr("stroke-opacity", 1) // 不再需要单独的透明度
      .attr("stroke-dasharray", null); // 移除虚线
    mainGroup.append("g").attr("class", "grid grid-y").attr("transform", `translate(${margin.left},0)`).call(makeGridlines(yScale, d3.axisLeft, width - margin.left - margin.right))
      .selectAll("line")
      .attr("stroke", "rgba(255, 255, 255, 0.15)") // 更暗的网格线
      .attr("stroke-opacity", 1)
      .attr("stroke-dasharray", null); // 移除虚线

    // Draw Axes
    const xAxisGenerator = d3.axisBottom(xScale);
    const yAxisGenerator = d3.axisLeft(yScale);
    const axisStyle = (selection) => {
        selection.selectAll("path") // Axis line
            .attr("stroke", "#555"); // 坐标轴线颜色
        selection.selectAll("line") // Tick lines
            .attr("stroke", "#555"); // 刻度线颜色
        selection.selectAll("text") // Tick labels
            .attr("fill", "#ccc") // 刻度标签颜色
            .style("text-shadow", "1px 1px 1px rgba(0,0,0,0.7)"); // 添加文本阴影
    };
    const xAxisGroup = mainGroup.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height - margin.bottom})`).call(xAxisGenerator).call(axisStyle);
    const yAxisGroup = mainGroup.append("g").attr("class", "y-axis").attr("transform", `translate(${margin.left},0)`).call(yAxisGenerator).call(axisStyle);

    // Draw Axis Labels
    const axisLabelStyle = (selection) => {
        selection.attr("fill", "#ccc") // 轴标签颜色
            .style("text-shadow", "1px 1px 1px rgba(0,0,0,0.7)"); // 添加文本阴影
    };
    mainGroup.append("text").attr("class", "axis-label").attr("text-anchor", "end").attr("x", width - margin.right).attr("y", height - margin.bottom - 6).text(xAxisLabel).call(axisLabelStyle);
    mainGroup.append("text").attr("class", "axis-label").attr("text-anchor", "end").attr("transform", "rotate(-90)").attr("y", margin.left - 6).attr("x", -margin.top).attr("dy", "-0.8em").text(yAxisLabel).call(axisLabelStyle);

    // Initial Canvas draw if not animating
    if (!gsap.isTweening(pointsRef.current)) {
      console.log('[Main useEffect] Calling initial drawCanvas');
      drawCanvas();
    }

    // Build Quadtree using initial scales
    const finalPositionsForQuadtree = emojiPositions || [];
    console.log(`[Main useEffect] Building Quadtree with initial scales`);
     quadtreeRef.current = d3.quadtree()
         .x(d => xScale(d.x)) // Use initial xScale
         .y(d => yScale(d.y)) // Use initial yScale
         .addAll(finalPositionsForQuadtree);

    // Setup Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .on("zoom", (event) => {
        if (gsap.isTweening(pointsRef.current)) return;
        const transform = event.transform;
        zoomState.current = transform; // Store transform state
        // ... check context/dims ...

        // Recreate base scales (could also store base in refs if needed, but recalculating is fine)
        const baseScaleX = d3.scaleLinear().domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).range([margin.left, width - margin.right]);
        const baseScaleY = d3.scaleLinear().domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).range([height - margin.bottom, margin.top]);

        // Apply transform to base scales
        const newXScale = transform.rescaleX(baseScaleX);
        const newYScale = transform.rescaleY(baseScaleY);

        // Store new scales
        currentXScaleRef.current = newXScale;
        currentYScaleRef.current = newYScale;

        // Update SVG Axes and Grid using new scales
        xAxisGroup.call(xAxisGenerator.scale(newXScale)).call(axisStyle); // Re-apply style
        yAxisGroup.call(yAxisGenerator.scale(newYScale)).call(axisStyle); // Re-apply style
        mainGroup.select(".grid-x")
          .call(makeGridlines(newXScale, d3.axisBottom, height - margin.top - margin.bottom))
          .selectAll("line")
          .attr("stroke", "rgba(255, 255, 255, 0.15)")
          .attr("stroke-opacity", 1)
          .attr("stroke-dasharray", null);
        mainGroup.select(".grid-y")
          .call(makeGridlines(newYScale, d3.axisLeft, width - margin.left - margin.right))
          .selectAll("line")
          .attr("stroke", "rgba(255, 255, 255, 0.15)")
          .attr("stroke-opacity", 1)
          .attr("stroke-dasharray", null);

        // Call drawCanvas with the NEW zoomed scales
        drawCanvas(newXScale, newYScale);

        // Rebuild Quadtree with new scales
        console.log(`[Zoom] Rebuilding Quadtree with new scales`);
         quadtreeRef.current = d3.quadtree()
           .x(d => newXScale(d.x)) // Use NEW scales
           .y(d => newYScale(d.y))
           .addAll(emojiPositions || []);
      });

    svg.call(zoom) // Apply zoom behavior
       // Restore previous zoom state IF NEEDED, otherwise start fresh
       // .call(zoom.transform, d3.zoomIdentity.translate(zoomState.current.x, zoomState.current.y).scale(zoomState.current.k))
       .on("dblclick.zoom", null);

    // Setup Click Handler
    svg.on("click", (event) => {
      // if (gsap.isTweening(pointsRef.current)) return; // Keep or remove depending on desired behavior during transition
      const [mouseX, mouseY] = d3.pointer(event); // Get Mouse X, Y in SVG coordinate space

      // Use a fixed pixel radius for simplicity first
      // Adjust this value if clicks are still not registering
      const searchRadius = 30; // Increased from 15, and temporarily removed zoom scaling

      console.log(`[Click Handler] Mouse (${mouseX.toFixed(1)}, ${mouseY.toFixed(1)}), SearchRadius: ${searchRadius}`);

      // Find using SCREEN coordinates (mouseX, mouseY)
      const nearest = quadtreeRef.current?.find(mouseX, mouseY, searchRadius);

      console.log(`[Click Handler] Quadtree Find Result:`, nearest?.id ?? 'None');
      if (nearest) {
        // Pass the original data object found by the quadtree
        onEmojiSelect(nearest);
        onPairUpdate(nearest);
      } else {
        // Optional: Add logic for clicking empty space if needed
        // onEmojiSelect(null); 
      }
    });

    return () => {
      svg.on(".zoom", null).on("click", null);
    };

  }, [
      // Dependencies for D3 setup and non-animated drawing/interactions
      dimensions, emojiPositions, selectedCluster, selectedPairs, selectedEmoji, colorScale,
      onEmojiSelect, onPairUpdate, calculateSimilarity, xAxisLabel, yAxisLabel,
      showDifferences, differenceStyle, differenceThreshold, differenceColorScale // Include difference props for styling
  ]);

  return (
    <div ref={containerRef} className="scatter-plot-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="scatter-plot-canvas" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />
        <svg ref={svgRef} className="scatter-plot-svg-overlay" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'all' }} />
    </div>
  );
};

export default ScatterPlotCanvas;