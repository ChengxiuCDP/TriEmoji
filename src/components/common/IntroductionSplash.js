import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

const IntroductionSplash = ({ onStartExploring }) => {
  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', // Center vertically
        textAlign: 'center',
        py: 4 
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the Emoji Clustering Visualization Tool
        </Typography>
        <Typography variant="body1" paragraph>
          This tool allows you to explore how emojis are classified and clustered based on different aspects of their meaning and appearance.
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Main Views:
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>Visual View</strong>: Clustering based on the visual features of emoji images.
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>Semantic View</strong>: Clustering based on the textual definitions and meanings of emojis.
        </Typography>
        <Typography variant="body1" paragraph>
          • <strong>Token View</strong>: Clustering based on how emojis are represented as tokens in language models.
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Features:
        </Typography>
        <Typography variant="body1" paragraph>
          • Click on an emoji to view detailed information.
        </Typography>
        <Typography variant="body1" paragraph>
          • Use the controls to filter and highlight specific clusters.
        </Typography>
        <Typography variant="body1" paragraph>
          • Search for specific emojis.
        </Typography>
         <Typography variant="body1" paragraph>
          • Take a guided tour to understand the research background (via the "Start Guided Tour" button after exploring).
        </Typography>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={onStartExploring} // Use the passed-in handler
        >
          Start Exploring
        </Button>
      </Box>
    </Container>
  );
};

export default IntroductionSplash; 