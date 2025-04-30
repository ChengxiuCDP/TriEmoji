import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

const ScrollamaNarrative = ({ onExitTour }) => {
  return (
    <Container maxWidth="md" sx={{ my: 4, py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          欢迎使用表情符号聚类可视化工具
        </Typography>
        <Typography variant="body1" paragraph>
          这个工具允许您探索表情符号在不同方面的分类和聚类方式。
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          主要视图：
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>视觉视图（Visual）</strong>：基于表情符号的视觉特征进行聚类
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>语义视图（Semantic）</strong>：基于表情符号的意义进行聚类
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>标记视图（Token）</strong>：基于表情符号的文本表示进行聚类
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          功能：
        </Typography>
        <Typography variant="body1" paragraph>
          • 点击表情符号查看详细信息
        </Typography>
        <Typography variant="body1" paragraph>
          • 使用左侧控制面板过滤和突出显示特定聚类
        </Typography>
        <Typography variant="body1" paragraph>
          • 搜索特定表情符号
        </Typography>
      </Box>
      
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={onExitTour}
        >
          开始探索
        </Button>
      </Box>
    </Container>
  );
};

export default ScrollamaNarrative; 