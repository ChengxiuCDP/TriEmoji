import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as d3 from 'd3';
// Remove data processing import, data comes from props now
// import { processCSVData, processJsonData, processEmojiNetCsvData } from '../../../data/processData';
import SidebarControls from '../Controls/SidebarControls';
// import BottomInfoPanel from './BottomInfoPanel'; // Unused import
import './CrossLayerComparisonView.css';
// import EmojiScatterPlot from '../ScatterPlotCanvas.jsx'; // Unused import, using ScatterPlotCanvas directly
import ExplanationModal from './ExplanationModal';
import { Box, Button, Typography, IconButton, Paper, Stack, Card, CardMedia, Switch, Slider, FormControlLabel, Select, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScatterPlotCanvas from '../ScatterPlotCanvas.jsx';
import BottomInfoPanel from './BottomInfoPanel'; // 添加BottomInfoPanel导入

// Receive currentView, emojiData, and loading as props
const CrossLayerComparisonView = ({ currentView = 'Visual', emojiData, loading }) => {
  // --- State Management ---
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  // Remove internal loading state, use prop
  // const [loading, setLoading] = useState(true);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [showSimilarityExplanation, setShowSimilarityExplanation] = useState(false);
  // 差异高亮相关 state
  const [showDifferences, setShowDifferences] = useState(false);
  const [differenceThreshold, setDifferenceThreshold] = useState(0);
  const [differenceStyle, setDifferenceStyle] = useState('size'); // Default to 'size'
  // Restore lastPositions and lastView states
  const [lastPositions, setLastPositions] = useState(null);
  const lastViewRef = useRef(currentView); // Initialize with the initial view
  const previousPlotDataRef = useRef(); // Ref to store previous plotData
  const previousUnfilteredPlotDataRef = useRef(); // Store previous *unfiltered* data

  // Derive cluster data from emojiData prop using useMemo
  const {
    visualClusterData,
    visualClusterLabels,
    semanticClusterData,
    semanticClusterLabels,
    tokenClusterData,
    tokenClusterLabels
  } = useMemo(() => {
    const visual = {};
    const semantic = {};
    const token = {};
    const visualLabels = new Set();
    const semanticLabels = new Set();
    const tokenLabels = new Set();

    (emojiData || []).forEach(d => {
      // Visual Cluster
      const visualCluster = d.visual_cluster;
      if (visualCluster != null) {
        visualLabels.add(visualCluster);
        if (!visual[visualCluster]) visual[visualCluster] = { count: 0, representative: d.emoji_char };
        visual[visualCluster].count++;
      }

      // Semantic Cluster
      const semanticCluster = d.semantic_cluster;
      if (semanticCluster != null) {
        semanticLabels.add(semanticCluster);
        if (!semantic[semanticCluster]) semantic[semanticCluster] = { count: 0, representative: d.emoji_char };
        semantic[semanticCluster].count++;
      }

      // Token Cluster
      const tokenCluster = d.token_cluster;
      if (tokenCluster != null) {
        tokenLabels.add(tokenCluster);
        if (!token[tokenCluster]) token[tokenCluster] = { count: 0, representative: d.emoji_char };
        token[tokenCluster].count++;
      }
    });

    // Sort labels numerically
    const sortLabels = (labels) => Array.from(labels).sort((a, b) => a - b);

    return {
      visualClusterData: visual,
      visualClusterLabels: sortLabels(visualLabels),
      semanticClusterData: semantic,
      semanticClusterLabels: sortLabels(semanticLabels),
      tokenClusterData: token,
      tokenClusterLabels: sortLabels(tokenLabels),
    };
  }, [emojiData]);

  // 计算差异区间
  const differenceExtent = useMemo(() => {
    if (!emojiData || emojiData.length === 0) return [0, 1];
    const min = Math.min(...emojiData.map(e => e.difference ?? 0));
    const max = Math.max(...emojiData.map(e => e.difference ?? 1));
    return [min, max];
  }, [emojiData]);

  // 差异色带 scale
  const differenceColorScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([differenceExtent[0], (differenceExtent[0]+differenceExtent[1])/2, differenceExtent[1]])
      .range(['#568C1C', '#FFA600', '#B54369']);
  }, [differenceExtent]);

  // --- Cluster Descriptions (Keep as is) ---
  const clusterDescriptions = {
    '0': 'This cluster contains emoji that are primarily "neutral" or "basic expressions", such as various smiles, frowns, and thinking expressions. From a visual perspective, most of these emoji are standard yellow round faces with relatively restrained expressions. Interestingly, from a semantic point of view, these emoji express a wide range of emotions',
    '1': 'They are visually very similar, with an element of tears and a laughing expression. This is one of the purest clusters, showing that the algorithm is able to recognize this particular visual combination.',
    '2': 'Interestingly, although the skull is semantically different from the other smileys, the algorithm grouped them together, probably because they share the visual feature of "showing teeth". This suggests that CV is more concerned with structural features than semantic content.',
    '3': 'This large cluster contains emoji with a variety of "negative" or "strong" emojis, such as angry, disgusted, and sad, and it is observed that many of the emojis are characterized by squeezed or closed eyes. ',
    '4': 'There is only one blue frozen emoji (1f976). This shows the importance of color in the clustering - its blue hue makes it distinct from the other yellow emoji.',
    '5': 'There is only one cowboy emoji (1f920). This emoji is visually unique because it has a hat, and the algorithm categorizes it separately.',
    '6': 'Two purple demon emoji (1f608 and 1f47f). This again shows that color is one of the main bases for the algorithm',
    '7': 'This clustering contains emoji with special visual elements: big eyes, glasses, special headgear (e.g., halos), or facial structure variations (e.g., clown emoji). Although they express different emotions, they all have some kind of visual "add-on"?',
    '8': 'This cluster contains the "special effects" emoji: the party emoji (1f973), the "boo" emoji (1f92b) and the exploding head emoji (1f92f). They are characterized by complex visual elements that go beyond basic facial expressions.',
    '9': 'This cluster seems to contain emoji with additional visual elements: tears, love eyes, fake beards, etc. They are similar to cluster 7, but with different details.',
  };

  // Remove data loading useEffect
  // useEffect(() => {
  //   const loadData = async () => {
  //     setLoading(true);
  //     try {
  //       // ... removed data loading logic ...
  //     } catch (error) {
  //       console.error("Error loading data in component:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadData();
  // }, []);

  // --- Effect to control Similarity Explanation Popup (Keep as is) ---
  useEffect(() => {
    const lastPair = selectedPairs[selectedPairs.length - 1];
    if (lastPair && lastPair.length === 2) {
      setShowSimilarityExplanation(true);
    } else {
      setShowSimilarityExplanation(false);
    }
  }, [selectedPairs]);

  // --- Event Handlers (Keep as is) ---
  const handleClusterChange = useCallback((clusterLabel) => {
    setSelectedCluster(clusterLabel);
    setSelectedPairs([]);
    setSelectedEmoji(null);
    setShowSimilarityExplanation(false);
  }, []);

  const handleResetPairs = useCallback(() => {
    setSelectedPairs([]);
    setShowSimilarityExplanation(false);
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    console.log('[CrossLayerComparisonView] handleEmojiSelect called with:', emoji);
    setSelectedEmoji(emoji);
  }, []);

  const handlePairUpdate = useCallback((clickedEmoji) => {
    setSelectedPairs(prev => {
      const lastPair = prev[prev.length - 1] || [];
      if (lastPair.length === 1 && lastPair[0].id === clickedEmoji.id) {
        return prev;
      }
      if (lastPair.length < 2) {
        return [...prev.slice(0, -1), [...lastPair, clickedEmoji]];
      } else {
        return [...prev, [clickedEmoji]];
      }
    });
  }, []);

  // 添加关闭Emoji详情的处理函数
  const handleEmojiClose = useCallback(() => {
    setSelectedEmoji(null);
  }, []);

  // --- Utility Functions (Keep as is) ---
  const calculateCosineSimilarity = useCallback((point1, point2) => {
    if (!point1 || !point2) return 0;
    const dotProduct = point1.x * point2.x + point1.y * point2.y;
    const magnitude1 = Math.sqrt(point1.x * point1.x + point1.y * point1.y);
    const magnitude2 = Math.sqrt(point2.x * point2.x + point2.y * point2.y);
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }, []);

  // --- Dynamic Color Scale & Axis Labels based on View (Keep as is, uses derived state now) ---
  let sidebarClusterData = visualClusterData;
  let sidebarClusterLabels = visualClusterLabels;
  let plotClusterKey = 'visual_cluster';
  let xAxisLabel = "Image PC1";
  let yAxisLabel = "Image PC2";
  let coordinateKeyX = 'img_x';
  let coordinateKeyY = 'img_y';

  if (currentView === 'semantic') {
      sidebarClusterData = semanticClusterData;
      sidebarClusterLabels = semanticClusterLabels;
      plotClusterKey = 'semantic_cluster';
      xAxisLabel = "Word PC1";
      yAxisLabel = "Word PC2";
      coordinateKeyX = 'word_x';
      coordinateKeyY = 'word_y';
  } else if (currentView === 'token') {
      sidebarClusterData = tokenClusterData;
      sidebarClusterLabels = tokenClusterLabels;
      plotClusterKey = 'token_cluster';
      xAxisLabel = "Token PC1";
      yAxisLabel = "Token PC2";
      coordinateKeyX = 'token_x';
      coordinateKeyY = 'token_y';
  }

  // Memoize colorScale
  const colorScale = useMemo(() => {
    return d3.scaleOrdinal()
      .domain(sidebarClusterLabels)
      .range(d3.schemeCategory10);
  }, [sidebarClusterLabels]);

  // --- Prepare data for the current plot view ---
  const plotData = useMemo(() => {
      const initialData = emojiData || [];
      console.log(`[plotData useMemo] Start - Initial data length: ${initialData.length}, currentView: ${currentView}, selectedCluster: ${selectedCluster}`);

      let filteredByCluster = selectedCluster === null
        ? initialData
        : initialData.filter(item => item[plotClusterKey] === selectedCluster);
      console.log(`[plotData useMemo] After cluster filter (${selectedCluster}): ${filteredByCluster.length} items`);

      // Map the data *after* cluster filtering but *before* threshold filtering
      const mapped = filteredByCluster.map(item => ({
        ...item, // Keep all original data, including difference
        x: item[coordinateKeyX],
        y: item[coordinateKeyY],
        cluster: item[plotClusterKey]
      })).filter(item => item.x !== undefined && item.y !== undefined && !isNaN(item.x) && !isNaN(item.y));
      console.log(`[plotData useMemo] Final mapped length (pre-threshold): ${mapped.length}`);
      return mapped;

  }, [emojiData, selectedCluster, plotClusterKey, coordinateKeyX, coordinateKeyY]);

  // Effect to store the latest plotData AFTER render
  useEffect(() => {
    previousPlotDataRef.current = plotData;
  }); // No dependency array, runs after every render

  // Store unfiltered plot data after every render
  useEffect(() => {
     // Calculate unfiltered plot data for the *current* view
     const unfiltered = (selectedCluster === null
        ? (emojiData || [])
        : (emojiData || []).filter(item => item[plotClusterKey] === selectedCluster)
     ).map(item => ({
        ...item,
        x: item[coordinateKeyX],
        y: item[coordinateKeyY],
        cluster: item[plotClusterKey]
      })).filter(item => item.x !== undefined && item.y !== undefined && !isNaN(item.x) && !isNaN(item.y));
      previousUnfilteredPlotDataRef.current = unfiltered;
      console.log(`[CLC Post-Render] Stored current (${currentView}) unfiltered data (len: ${unfiltered.length}) to ref.`);
  });

  // --- Effect to calculate lastPositions on view change (Runs BEFORE post-render effect) ---
  const isDiffView = (v) => v === 'Visual' || v === 'semantic';
  useEffect(() => {
    const previousView = lastViewRef.current; // Get the view from the *previous* render cycle
    console.log(`[CLC View Change Effect] Current: ${currentView}, Previous: ${previousView}`);

    // Check if a valid switch occurred
    if (isDiffView(currentView) && isDiffView(previousView) && currentView !== previousView) {
        // Use the data stored in the ref (which corresponds to the previousView)
        const dataForLastPos = previousUnfilteredPlotDataRef.current;
        if (dataForLastPos && dataForLastPos.length > 0) {
            console.log(`[CLC View Change Effect] Using ref data (len: ${dataForLastPos.length}) from previous render to set lastPositions.`);
            setLastPositions(dataForLastPos.map(d => ({ id: d.id, x: d.x, y: d.y, difference: d.difference })));
        } else {
            console.warn(`[CLC View Change Effect] Ref data was empty when trying to set lastPositions for switch from ${previousView} to ${currentView}.`);
            setLastPositions(null);
        }
    } else if (!isDiffView(currentView)) { // Reset if the *new* view is not comparable
        console.log(`[CLC View Change Effect] Current view ${currentView} is not comparable, resetting lastPositions.`);
        setLastPositions(null);
    }
    // Update the ref for the *next* render cycle's comparison AFTER processing this one
    lastViewRef.current = currentView;

    // Dependencies: Only run when currentView changes.
    // We rely on the post-render effect having stored the correct data for the previous view.
  }, [currentView]);

  // Remove old console logs for allEmojiData
  // console.log('CrossLayerComparisonView: allEmojiData length:', allEmojiData?.length);
  console.log('CrossLayerComparisonView: emojiData (prop) length:', emojiData?.length); // Log prop length
  console.log('CrossLayerComparisonView: plotData length:', plotData?.length);
  console.log('CrossLayerComparisonView: currentView:', currentView);
  console.log('CrossLayerComparisonView: selectedCluster:', selectedCluster);

  // Check if controls should be enabled (based on current view supporting differences)
  const enableDifferenceControls = isDiffView(currentView);

  // Use loading prop passed from App.js
  if (loading) {
    return <Typography sx={{ p: 5 }}>Loading data...</Typography>;
  }

  // --- Log lastPositions state before render --- >
  console.log(`[CrossLayerComparisonView Render] lastPositions state length: ${lastPositions?.length ?? 'null'}`);
  // --- < Log --- 

  // --- Render logic remains largely the same, but uses derived state/props ---
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* --- Left Panel: Cluster Controls & Legend --- */}
      <Box
        sx={{
          width: '250px',
          borderRight: 1,
          borderColor: '#333', // Darker border
          p: 1, // Reduce padding slightly to give cards more space
          overflowY: 'auto',
          height: '100%',
          backgroundColor: '#222' // Slightly lighter dark background for contrast
        }}
      >
        <SidebarControls
          clusterData={sidebarClusterData}
          clusterLabels={sidebarClusterLabels}
          selectedCluster={selectedCluster}
          onClusterChange={handleClusterChange}
          colorScale={colorScale}
          emojiPositions={emojiData || []}
          selectedEmoji={selectedEmoji}
          currentView={currentView}
          showDifferences={showDifferences}
          onShowDifferencesChange={setShowDifferences}
          differenceThreshold={differenceThreshold}
          onDifferenceThresholdChange={setDifferenceThreshold}
          differenceStyle={differenceStyle}
          onDifferenceStyleChange={setDifferenceStyle}
          differenceExtent={differenceExtent}
          differenceColorScale={differenceColorScale}
          enableDifferenceControls={enableDifferenceControls}
          onResetPairs={handleResetPairs}
          isResetPairsDisabled={selectedPairs.length === 0}
          onEmojiClose={handleEmojiClose}
        />
      </Box>

      {/* --- Center: Visualization Area & Popup --- */}
      <Stack sx={{ flex: 1, height: '100%', overflow: 'hidden', backgroundColor: '#111' /* 设置主区域背景色 */ }}>
        <Box sx={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100% - 50px)', overflow: 'hidden' }}>
          {currentView === 'Visual' || currentView === 'semantic' || currentView === 'token' ? (
            <ScatterPlotCanvas
              emojiPositions={plotData}
              selectedPairs={selectedPairs}
              selectedEmoji={selectedEmoji}
              onEmojiSelect={handleEmojiSelect}
              onPairUpdate={handlePairUpdate}
              colorScale={colorScale}
              calculateSimilarity={calculateCosineSimilarity}
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
              // 差异高亮相关参数
              showDifferences={showDifferences}
              differenceThreshold={differenceThreshold}
              differenceColorScale={differenceColorScale}
              differenceStyle={differenceStyle}
              currentView={currentView}
              // Pass lastPositions again, ScatterPlot will use it based on differenceStyle
              lastPositions={lastPositions}
            />
          ) : null }

          {/* Explanation Button */}
           <Button
             variant="outlined"
             onClick={() => setIsExplanationOpen(true)}
             title="Show Explanation"
             sx={{ position: 'absolute', bottom: 16, right: 16, borderRadius: '50%', minWidth: '56px', height: '56px', fontSize: '1.5rem', borderColor: 'primary.main', zIndex: 'tooltip' }}
           >
             ?
           </Button>

           {/* --- Similarity Explanation Popup --- */}
           {(currentView === 'Visual' || currentView === 'semantic' || currentView === 'token') && showSimilarityExplanation && (
             <Paper
               elevation={3}
               sx={{ position: 'absolute', top: 16, right: 16, p: 2, maxWidth: 350, zIndex: 'modal' }}
             >
               <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Cosine Similarity</Typography>
                 <IconButton size="small" onClick={() => setShowSimilarityExplanation(false)}><CloseIcon fontSize="inherit" /></IconButton>
               </Stack>
               <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>Measures the cosine of the angle between two vectors (emoji positions in the projected space).</Typography>
               <Typography variant="body2" sx={{ mb: 1 }}>Value ranges from -1 (opposite) to 1 (identical), with 0 indicating orthogonality.</Typography>
               <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 2, p:1, bgcolor: 'grey.100', borderRadius: 1 }}>Sim = cos(θ) = (A · B) / (||A|| ||B||)</Typography>
             </Paper>
           )}
        </Box>

        {/* --- Bottom Info Panel --- */}
        <Box sx={{ height: '50px', width: '100%', borderTop: 1, borderColor: 'divider'}}>
            {selectedCluster !== null && (
              <Paper
                elevation={1}
                sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', mx: 'auto'}}
              >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1, overflow: 'hidden', mr: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Cluster {selectedCluster} Explanation:</Typography>
                    <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clusterDescriptions[selectedCluster.toString()] || 'No description available.'}</Typography>
                  </Stack>
                  <IconButton aria-label="Close cluster explanation" size="small" onClick={() => handleClusterChange(null)}><CloseIcon fontSize="inherit" /></IconButton>
              </Paper>
            )}
        </Box>
      </Stack>

      {/* --- Explanation Modal --- */}
      {isExplanationOpen && (
        <ExplanationModal onClose={() => setIsExplanationOpen(false)} />
      )}

      {/* --- 固定在屏幕左下角的Emoji详情面板 --- */}
      {selectedEmoji && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            width: '400px', 
            zIndex: 1300, // 确保在其他内容之上
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          <BottomInfoPanel selectedEmoji={selectedEmoji} view={currentView} onClose={handleEmojiClose} />
        </Box>
      )}
    </Box>
  );
};

export default CrossLayerComparisonView; 