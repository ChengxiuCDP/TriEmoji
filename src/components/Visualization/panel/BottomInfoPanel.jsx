import React from 'react';
// CSS 文件现在在同一目录
import './BottomInfoPanel.css';
// Import MUI components
import { Box, Typography, IconButton, Grid, Divider, Chip, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const BottomInfoPanel = ({ selectedEmoji, view, onClose }) => {
  // 如果没有选中 emoji，则不渲染任何内容
  if (!selectedEmoji) {
    return null;
  }

  // *** 简化日志 ***
  console.log('[BottomInfoPanel] Rendering with selectedEmoji:', selectedEmoji ? selectedEmoji.id : 'null');

  // --- Standard Info ---
  const character = selectedEmoji.char || '?';
  const name = selectedEmoji.name || 'Unknown Name';

  // --- Cluster Labels ---
  const visualCluster = selectedEmoji.visual_cluster !== undefined ? selectedEmoji.visual_cluster : 'N/A';
  const semanticCluster = selectedEmoji.semantic_cluster !== undefined ? selectedEmoji.semantic_cluster : 'N/A';
  const tokenCluster = selectedEmoji.token_cluster !== undefined ? selectedEmoji.token_cluster : 'N/A';

  // --- View-Specific Fields ---
  const emjpdShortcodes = selectedEmoji.emjpd_shortcodes || 'N/A';
  const emjpdDescSide = selectedEmoji.emjpd_description_side || 'N/A';   
  const emjpdDescMain = selectedEmoji.emjpd_description_main || 'N/A';   
  const hemjDesc = selectedEmoji.hemj_emoji_description || 'N/A';       
  const emjpdUsage = selectedEmoji.emjpd_usage_info || 'N/A';
  const asciiBeg = selectedEmoji.emoji_char_ascii_beg || 'N/A';
  const unicodeHex = selectedEmoji.unicode_hex || 'N/A';
  const sinceVersion = selectedEmoji.since_version || 'N/A';

  // --- Coordinates ---
  let xPos = 'N/A', yPos = 'N/A', zPos = '';
  if (view === 'Visual' && selectedEmoji.img_x !== undefined && selectedEmoji.img_y !== undefined) {
      xPos = selectedEmoji.img_x.toFixed(2);
      yPos = selectedEmoji.img_y.toFixed(2);
  } else if (view === 'semantic' && selectedEmoji.word_x !== undefined && selectedEmoji.word_y !== undefined) {
      xPos = selectedEmoji.word_x.toFixed(2);
      yPos = selectedEmoji.word_y.toFixed(2);
  } else if (view === 'token' && selectedEmoji.token_x !== undefined && selectedEmoji.token_y !== undefined) {
      xPos = selectedEmoji.token_x.toFixed(2);
      yPos = selectedEmoji.token_y.toFixed(2);
  } else if (view === '3d' && selectedEmoji.x !== undefined && selectedEmoji.y !== undefined) {
       xPos = selectedEmoji.x.toFixed(2);
       yPos = selectedEmoji.y.toFixed(2);
       if (selectedEmoji.z !== undefined && selectedEmoji.z !== 0) {
           zPos = `, ${selectedEmoji.z.toFixed(2)}`;
       }
  }

  // 获取当前视图对应的集群
  const getCurrentCluster = () => {
    if (view === 'Visual') return visualCluster;
    if (view === 'semantic') return semanticCluster;
    if (view === 'token') return tokenCluster;
    return 'N/A';
  };

  // 处理shortcodes格式化显示
  let shortcodesDisplay = [];
  if (emjpdShortcodes && emjpdShortcodes !== 'N/A') {
    try {
      // 尝试转换字符串为数组
      const shortcodesArray = typeof emjpdShortcodes === 'string' 
        ? JSON.parse(emjpdShortcodes.replace(/'/g, '"')) 
        : emjpdShortcodes;
      
      if (Array.isArray(shortcodesArray)) {
        shortcodesDisplay = shortcodesArray;
      } else {
        shortcodesDisplay = [emjpdShortcodes];
      }
    } catch (e) {
      // 如果解析失败，则作为单个字符串处理
      shortcodesDisplay = [emjpdShortcodes];
    }
  }

  // 处理复制功能
  const handleCopy = () => {
    navigator.clipboard.writeText(character)
      .then(() => {
        console.log('Emoji copied to clipboard');
        // 可以添加一个提示弹窗
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  // 获取当前视图的集群类型名称
  const getClusterTypeName = () => {
    if (view === 'Visual') return "Visual Cluster";
    if (view === 'semantic') return "Semantic Cluster";
    if (view === 'token') return "Token Cluster";
    return "Cluster";
  };

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      backgroundColor: '#252525',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* 关闭按钮 */}
      <IconButton 
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: '#fff',
          zIndex: 2
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* 顶部区域：Emoji名称和图像 */}
      <Box sx={{ 
        p: 2, 
        pt: 3,
        pb: 2,
        display: 'flex', 
        alignItems: 'flex-start', 
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ 
          fontSize: '48px', 
          mr: 3,
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          p: 1.5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '70px',
          height: '70px',
          flexShrink: 0 
        }}>
          {character}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            color: '#fff',
            mb: 0.5,
            textAlign: 'left'
          }}>
            {name}
          </Typography>
          
          {/* 集群信息 */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#999', whiteSpace: 'nowrap' }}>
              {getClusterTypeName()}:
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff' }}>
              {getCurrentCluster()}
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ p: 2 }}>
        {/* 根据视图显示不同信息 */}
        {view === 'Visual' && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
              Shortcodes:
            </Typography>
            <Box sx={{ mb: 2 }}>
              {shortcodesDisplay.map((code, index) => (
                <Chip 
                  key={index}
                  label={code}
                  sx={{ 
                    m: 0.5, 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    color: '#eee',
                    fontFamily: 'monospace'
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1, mt: 2 }}>
              Description:
            </Typography>
            <Typography variant="body2" sx={{ color: '#eee', mb: 2 }}>
              {emjpdDescMain}
            </Typography>
          </>
        )}

        {view === 'semantic' && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
              Meaning:
            </Typography>
            <Typography variant="body2" sx={{ color: '#eee', mb: 2 }}>
              {hemjDesc}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1, mt: 2 }}>
              Usage Info:
            </Typography>
            <Typography variant="body2" sx={{ color: '#eee', mb: 2 }}>
              {emjpdUsage}
            </Typography>
          </>
        )}

        {view === 'token' && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
              ASCII Begin:
            </Typography>
            <Typography variant="body2" sx={{ color: '#eee', mb: 2 }}>
              {asciiBeg}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', mb: 1, mt: 2 }}>
              Info:
            </Typography>
            <Typography variant="body2" sx={{ color: '#eee', mb: 2 }}>
              {emjpdDescSide}
            </Typography>
          </>
        )}

        {/* 保留位置信息的单行显示 */}
        <Box sx={{ 
          mt: 3, 
          py: 2,
          px: 2, 
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff', mr: 1, whiteSpace: 'nowrap' }}>
            Position:
          </Typography>
          <Typography variant="body2" sx={{ color: '#eee' }}>
            ({xPos}, {yPos}{zPos})
          </Typography>
        </Box>
      </Box>

      {/* 底部操作按钮 */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <Box 
          sx={{ 
            flex: 1, 
            textAlign: 'center', 
            p: 0.5, 
            borderRadius: '4px',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
          }}
          onClick={handleCopy}
        >
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <ContentCopyIcon fontSize="small" />
            <Typography variant="button">Copy</Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default BottomInfoPanel; 