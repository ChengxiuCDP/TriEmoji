import React, { useState } from 'react';
import * as d3 from 'd3'; // 需要引入d3来使用颜色比例尺
// CSS 文件现在在同一目录
import './SidebarControls.css';
// Import MUI components if using Material UI for buttons
import { Box, Typography, Button, Paper, Switch, Slider, Select, MenuItem, FormControlLabel, TextField, Collapse } from '@mui/material';
import BottomInfoPanel from '../panel/BottomInfoPanel'; // Import BottomInfoPanel
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // For expansion indicator
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // For expansion indicator

// Props 现在包含 visualClusterData 和 visualClusterLabels (或者由父组件决定传入哪个)
const SidebarControls = ({
    clusterData,          // 当前视图的聚类数据 { label: { count: N } }
    clusterLabels,        // 当前视图的聚类标签数组 [label1, label2, ...]
    selectedCluster,      // 当前选中的聚类标签 (来自父组件 state)
    onClusterChange,      // 更新父组件选中标签的回调
    colorScale,           // 当前视图的颜色比例尺
    emojiPositions,       // 原始数据，用于计算总数
    selectedEmoji,        // *** 新增 Prop: 当前选中的 Emoji ***
    onEmojiClose,         // *** 新增 Prop: 关闭当前选中 Emoji 的回调 ***
    currentView,          // *** 新增 Prop: 当前视图名称 ***
    // Difference controls state and callbacks
    showDifferences,
    onShowDifferencesChange,
    differenceThreshold,
    onDifferenceThresholdChange,
    differenceStyle,
    onDifferenceStyleChange,
    differenceExtent,
    differenceColorScale,
    enableDifferenceControls, // Boolean to determine if diff controls are active for current view
    // Reset Pairs
    onResetPairs,
    isResetPairsDisabled
}) => {

  console.log('[SidebarControls] Received selectedEmoji prop:', selectedEmoji);
  console.log('[SidebarControls] Received currentView prop:', currentView);

  const [isClassificationExpanded, setIsClassificationExpanded] = useState(true); // State for expansion

  // --- 添加保护：如果 labels 或 positions 未定义，显示 Loading 或空状态 ---
  if (!clusterLabels || !emojiPositions) {
      // 或者返回 null, 或者返回一个 Loading 指示器
      return <div className="left-panel">Loading clusters...</div>;
  }
  // --- 保护结束 ---

  // Sort labels (assuming labels from props are already sorted)
  const sortedLabels = clusterLabels; // Directly use sorted labels from props

  const cardStyle = {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px' // Space between cards
  };

  // Define a common bold style for titles/labels
  const boldLabelStyle = {
    fontFamily: '"SF-Pro", -apple-system, BlinkMacSystemFont, sans-serif', // Ensure SF-Pro is used
    fontWeight: 'bold',
    fontSize: '1.1rem', // Consistent font size (adjust as needed)
    color: '#eee'
  };

  const titleStyle = {
    ...boldLabelStyle, // Use common style
    marginBottom: '12px',
    // fontSize: '1.1rem' // Moved to common style
  };

  const controlStyle = (disabled) => ({
    borderRadius: '6px', // Round corners for controls
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)', // Shadow for controls
    color: disabled ? '#777' : '#eee', // Text color (gray if disabled)
    backgroundColor: disabled ? 'rgba(50,50,50,0.7)' : 'rgba(30,30,30,0.7)', // Dark backgrounds for controls
    borderColor: '#555', // Border for Select
    marginTop: '8px',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#555 !important',
    },
    '& .MuiSvgIcon-root': { // Select dropdown arrow
        color: disabled ? '#777' : '#eee',
    },
    '&.Mui-disabled': { // Ensure disabled styles are applied
        backgroundColor: 'rgba(50,50,50,0.7)',
        color: '#777',
        boxShadow: 'none',
        opacity: 0.6,
        borderColor: '#444',
    },
    // Style for Slider thumb and track
    '& .MuiSlider-thumb': {
        backgroundColor: '#0d6efd',
        '&:hover': {
            boxShadow: '0 0 0 8px rgba(13, 110, 253, 0.16)',
        },
        '&.Mui-active': {
             boxShadow: '0 0 0 14px rgba(13, 110, 253, 0.16)',
        }
    },
    '& .MuiSlider-track': {
        backgroundColor: '#0d6efd',
    },
    '& .MuiSlider-rail': {
        backgroundColor: '#555',
    },
    // Style for Switch
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#0d6efd',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: '#0a58ca',
    },
  });

  const buttonStyle = (disabled) => ({
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    backgroundColor: disabled ? '#555' : '#0d6efd',
    color: disabled ? '#999' : '#fff',
    marginTop: '8px',
    '&:hover': {
      backgroundColor: disabled ? '#555' : '#0a58ca',
    }
  });

  // Generate buttons using sorted labels
  const clusterButtons = sortedLabels.map(label => {
    // 使用传入的 clusterData 查找 count
    const cluster = clusterData ? clusterData[label] : null;
    const count = cluster ? cluster.count : 0;
    const isActive = selectedCluster === label;
    const bgColor = isActive ? (colorScale ? colorScale(label) : '#FFC107') : 'rgba(50,50,50,0.7)';
    const textColor = isActive ? (colorScale && d3.hsl(colorScale(label)).l < 0.5 ? 'white' : 'black') : '#eee';

    return (
      // Use MUI Button or standard button
      <Button
        key={label}
        variant="contained"
        size="small"
        onClick={() => onClusterChange(isActive ? null : label)}
        sx={{
          width: '100%', // Make buttons full width
          justifyContent: 'flex-start', // Align text left
          marginBottom: '4px',
          backgroundColor: bgColor,
          color: textColor,
          borderLeft: isActive ? `5px solid ${colorScale ? colorScale(label) : '#FFC107'}` : '5px solid transparent',
          '&:hover': { backgroundColor: isActive ? colorScale(label) : 'rgba(70,70,70,0.7)' }, // Adjust hover
          boxShadow: 'none', // Remove default button shadow, use card shadow
          borderRadius: '4px',
        }}
      >
        {/* Display cluster label and count */}
        Cluster {label} ({count})
      </Button>
    );
  });

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 0 }}>

      {/* --- Mode Switching Section --- */}
      <Paper sx={{ ...cardStyle, opacity: 1 /* Always enabled */ }}>
        {/* <Typography variant="h6" sx={titleStyle}>Mode</Typography> */}
        <FormControlLabel
          control={<Switch checked={showDifferences} onChange={e => onShowDifferencesChange(e.target.checked)} sx={controlStyle(!enableDifferenceControls)} disabled={!enableDifferenceControls} />}
          label="Highlight Mode" /* 恢复标签 */
          sx={{ 
             color: !enableDifferenceControls ? '#777' : '#eee',
             '& .MuiFormControlLabel-label': { // Target the label specifically
               ...boldLabelStyle // Apply bold style to the switch label
             }
          }}
        />
        {/* Add 2D/Semantic/Token Buttons here if moved from App/Header */}
        {/* Example: <Button>2D</Button> <Button>Semantic</Button> ... */}
      </Paper>

      {/* --- Difference Analysis Section --- */}
      <Paper sx={{ ...cardStyle, opacity: enableDifferenceControls ? 1 : 0.5 }}>
        <Typography variant="h6" sx={titleStyle}>Difference Filter</Typography>
        <Box sx={{ pl: 1, pr: 1, opacity: showDifferences ? 1 : 0.5 }} > {/* Dim content if highlight is off */}
          <Typography variant="body2" gutterBottom sx={{ color: !enableDifferenceControls || !showDifferences ? '#777' : '#eee' }}>
            Difference Threshold: {differenceThreshold.toFixed(2)}
          </Typography>
          <Slider
            min={differenceExtent?.[0] ?? 0}
            max={differenceExtent?.[1] ?? 1}
            step={0.01}
            value={differenceThreshold}
            onChange={(_, v) => onDifferenceThresholdChange(v)}
            valueLabelDisplay="auto"
            disabled={!enableDifferenceControls || !showDifferences}
            sx={controlStyle(!enableDifferenceControls || !showDifferences)}
          />
          <Typography variant="body2" gutterBottom sx={{ mt: 2, color: !enableDifferenceControls || !showDifferences ? '#777' : '#eee' }}>
            Visualization Style
          </Typography>
          <Select
            size="small"
            value={differenceStyle}
            onChange={e => onDifferenceStyleChange(e.target.value)}
            fullWidth
            disabled={!enableDifferenceControls || !showDifferences}
            sx={controlStyle(!enableDifferenceControls || !showDifferences)}
          >
             <MenuItem value="size" sx={{backgroundColor: '#333', color: '#eee'}}>Size Highlight</MenuItem>
             <MenuItem value="line" sx={{backgroundColor: '#333', color: '#eee'}}>Connection Lines</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* --- Classification Section (Collapsible) --- */}
      <Paper sx={cardStyle}>
        {/* Clickable Header to Toggle Expansion */}
        <Box 
          sx={{ 
            display: 'flex', 
            position: 'relative',
            justifyContent: 'center', // Center the title
            alignItems: 'center', 
            cursor: 'pointer' 
          }} 
          onClick={() => setIsClassificationExpanded(!isClassificationExpanded)}
        >
          <Typography variant="h6" sx={{...titleStyle, marginBottom: 0 /* Remove margin */ }}>Classification</Typography>
          {/* Position icon to the right */}
          <Box sx={{ position: 'absolute', right: 0 }}>
            {isClassificationExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={isClassificationExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ paddingTop: '12px' }}> {/* Add padding when expanded */}
            {/* Cluster Buttons */}
            <Button
              variant="contained"
              size="small"
              onClick={() => onClusterChange(null)}
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                marginBottom: '4px',
                backgroundColor: selectedCluster === null ? '#777' : 'rgba(50,50,50,0.7)',
                color: selectedCluster === null ? '#eee' : '#ccc',
                borderLeft: selectedCluster === null ? `5px solid #ccc` : '5px solid transparent',
                '&:hover': { backgroundColor: 'rgba(70,70,70,0.7)' },
                 boxShadow: 'none',
                 borderRadius: '4px',
              }}
            >
              All Clusters ({emojiPositions ? emojiPositions.length : 0})
            </Button>
            {clusterButtons}
            {/* Reset Pairs Button */}
            <Button
                variant="contained"
                onClick={onResetPairs}
                disabled={isResetPairsDisabled}
                sx={{ ...buttonStyle(isResetPairsDisabled), width: '100%', mt: 2 }}
              >
                Reset Selected Pairs
            </Button>
          </Box>
        </Collapse>
      </Paper>

    </Box>
  );
};

// Need emojiPositions prop if showing total count for "All" button
// Add it to propTypes if using them
// SidebarControls.propTypes = { ... emojiPositions: PropTypes.array.isRequired ... }

export default SidebarControls;

// REMOVE unused helper function
// const getTotalEmojiCount = (positions) => positions ? positions.length : 0;

// Update the call in CrossLayerComparisonView to pass emojiPositions
/*
<SidebarControls
  // ... other props
  emojiPositions={emojiPositions} // Pass emojiPositions
/>
*/ 