import React from 'react';
// import './ExplanationModal.css'; // Remove import for old CSS
import {
  Dialog, // Use Dialog for standard modal structure
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Stack,
  Paper,
  Divider // Added Divider for visual separation
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Simplified styles, relying more on MUI defaults
// Removed modalStyle, treeDiagramStyle, treeRootStyle, treeBranchesStyle, etc.
// Kept styles that are essential for the custom layout

const treeRootStyle = {
  p: '8px 15px',
  bgcolor: 'grey.300', // Use theme grey color
  border: '1px solid',
  borderColor: 'grey.400',
  borderRadius: 1, // theme.shape.borderRadius
  fontWeight: 'bold',
  fontSize: '0.9rem',
  display: 'inline-block', // Needed for centering
};

const lineStyle = {
  bgcolor: 'grey.500', // Use theme grey color
};

const rootLineStyle = {
  ...lineStyle,
  width: '2px',
  height: '15px',
  mx: 'auto', // Center horizontally
};

const horizontalLineStyle = {
  ...lineStyle,
  height: '2px',
  width: '70%',
  mx: 'auto', // Center horizontally
};

const branchLineStyle = {
  ...lineStyle,
  width: '2px',
  height: '30px',
  position: 'absolute', // Positioning still needed for branches
  bottom: 0,
  transform: 'translateX(-50%)',
};

const layerDetailBoxStyle = {
  flex: 1,
  p: 2,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  // Rely on Paper's default elevation/border
};

const leafPlaceholderStyle = {
  fontStyle: 'italic',
  color: 'text.secondary',
  mb: 2,
  fontSize: '0.9em',
};

const detailsConnectorStyle = {
  width: '2px',
  height: '20px',
  bgcolor: 'grey.400',
  mx: 'auto',
  mb: 2,
};

const layerDetailsExtendedStyle = {
  p: 2,
  textAlign: 'left',
  mt: 'auto',
  flexGrow: 1,
  border: '1px dashed', // Use theme border color
  borderColor: 'divider', // Use theme divider color
  borderRadius: 1,
};

const ExplanationModal = ({ onClose }) => {
  // MUI Modal handles backdrop click automatically, no need for handleContentClick usually

  return (
    // Use Dialog for better Material Design structure
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg" // Use MUI standard widths
      fullWidth // Makes the dialog use the fullWidth of the maxWidth
      scroll="paper" // Allows content scrolling
      aria-labelledby="explanation-dialog-title"
    >
      <DialogTitle id="explanation-dialog-title" sx={{ textAlign: 'center', fontWeight: 600 }}>
         Multi-dimensional Analysis of Emoji Representations
         {/* Close button standard placement */}
         <IconButton
           aria-label="close"
           onClick={onClose}
           sx={{
             position: 'absolute',
             right: 8,
             top: 8,
             color: (theme) => theme.palette.grey[500],
           }}
         >
           <CloseIcon />
         </IconButton>
       </DialogTitle>
      <DialogContent dividers> {/* dividers add top/bottom border */}
        {/* Intro Paragraph */}
        <Typography variant="body1" align="center" paragraph sx={{ color: 'text.secondary', fontSize: '1.1em', mb: 3 }}>
          This research examines how computational systems interpret emojis through three distinct analytical frameworks, revealing the complex relationships between emoji appearance, meaning, and usage patterns.
        </Typography>

        {/* Tree Diagram Section - Simplified styling */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
           {/* Tree diagram - Use Box and simplified sx */}
           <Box sx={{ width: '100%', maxWidth: '600px', height: '80px', position: 'relative', mb: 2.5, mx: 'auto' }}>
             {/* Root Node */}
             <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
                <Box sx={treeRootStyle}>LLM</Box>
             </Box>
             {/* Lines Container */}
             <Box sx={{ position: 'absolute', top: '35px', left: 0, width: '100%', height: '45px' }}>
                <Box sx={rootLineStyle}></Box>
                <Box sx={horizontalLineStyle}></Box>
                {/* Branch Lines - Still need absolute positioning */}
                <Box sx={{ ...branchLineStyle, left: '15%' }}></Box>
                <Box sx={{ ...branchLineStyle, left: '50%' }}></Box>
                <Box sx={{ ...branchLineStyle, left: '85%' }}></Box>
             </Box>
           </Box>

           {/* Layer Details Container - Use Paper for elevation */}
           <Stack direction="row" spacing={2.5} sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'stretch' }}>
              {/* Layer 1 */}
              <Paper variant="outlined" sx={layerDetailBoxStyle}> {/* Use outlined Paper */}
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontSize: '1.2em' }}>
                  Layer 1: Semantic Embedding Analysis
                </Typography>
                <Typography sx={leafPlaceholderStyle}>Text Definitions</Typography>
                <Typography variant="body2" paragraph sx={{ textAlign: 'left', minHeight: '100px', mb: 2, fontSize: '0.95em' }}>
                  We transform emoji definitions from EmojiNet into mathematical representations using OpenAI's text-embedding-3-small model. After applying PCA dimensionality reduction and K-Means clustering (k=8), we discover natural semantic groupings including facial expressions, animals, food, and flags, demonstrating how textual definitions effectively organize emoji meanings into intuitive conceptual spaces.
                </Typography>
                <Box sx={detailsConnectorStyle}></Box>
                <Box sx={layerDetailsExtendedStyle}>
                  <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Methodological Approach:</Typography>
                  <Typography variant="body2" paragraph sx={{ fontSize: '0.9em' }}>We employ computational linguistics techniques to transform explicit emoji definitions into quantifiable vector representations.</Typography>
                  <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Data Source:</Typography>
                  <Typography variant="body2" paragraph sx={{ fontSize: '0.9em' }}>EmojiNet knowledge base containing 2,389 emoji entries with 12,904 sense definitions, capturing the polysemous nature of emoji meanings.</Typography>
                  <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Processing Pipeline:</Typography>
                  <Box component="ol" sx={{ pl: 2.5, fontSize: '0.9em', mb: 1 }}>
                    <li>For each emoji, we aggregate all available definitions into a consolidated textual representation.</li>
                    <li>These texts are encoded into 1,536-dimensional vectors using OpenAI's text-embedding-3-small model.</li>
                    <li>Principal Component Analysis (PCA) is applied to reduce dimensionality while preserving semantic relationships.</li>
                    <li>K-Means clustering (k=8) identifies inherent semantic groupings.</li>
                  </Box>
                  <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Results and Interpretation:</Typography>
                  <Typography variant="body2" paragraph sx={{ fontSize: '0.9em', mb: 0 }}>The resulting clusters reveal semantically coherent groupings that align with intuitive categories: emotional expressions, hand gestures, food objects, animals, transportation, and national flags. These clusters demonstrate that definition-based embeddings effectively capture conventional emoji semantics as defined by linguistic descriptions.</Typography>
                </Box>
              </Paper>

              {/* Layer 2 */}
              <Paper variant="outlined" sx={layerDetailBoxStyle}>
                 <Typography variant="h6" component="h3" gutterBottom sx={{ fontSize: '1.2em' }}>
                   Layer 2: Visual Feature Analysis
                 </Typography>
                 <Typography sx={leafPlaceholderStyle}>Image Characteristics</Typography>
                 <Typography variant="body2" paragraph sx={{ textAlign: 'left', minHeight: '100px', mb: 2, fontSize: '0.95em' }}>
                   Using ResNet50, we extract visual features from emoji images and create an interactive visualization system. This reveals design patterns and potential visual confusions between different emoji. Users can select emoji pairs to see their visual similarity measurements, with connecting lines and popups displaying precise cosine similarity values.
                 </Typography>
                 <Box sx={detailsConnectorStyle}></Box>
                 <Box sx={layerDetailsExtendedStyle}>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Methodological Approach:</Typography>
                   <Typography variant="body2" paragraph sx={{ fontSize: '0.9em' }}>We apply computer vision techniques to analyze the visual attributes of emoji images independent of their linguistic descriptions.</Typography>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Data Source:</Typography>
                   <Typography variant="body2" paragraph sx={{ fontSize: '0.9em' }}>Standard emoji image renderings extracted from Unicode-compliant emoji sets.</Typography>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Processing Pipeline:</Typography>
                   <Box component="ol" sx={{ pl: 2.5, fontSize: '0.9em', mb: 1 }}>
                     <li>ResNet50 (pre-trained on ImageNet) extracts 2,048-dimensional feature vectors from each emoji image.</li>
                     <li>Dimensionality reduction through PCA or t-SNE preserves visual similarity relationships.</li>
                     <li>Calculation of pairwise cosine similarities identifies visual proximity between emoji pairs.</li>
                     <li>Interactive visualization enables exploration of these visual relationships.</li>
                   </Box>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Results and Interpretation:</Typography>
                   <Typography variant="body2" paragraph sx={{ fontSize: '0.9em', mb: 0 }}>Visual clustering reveals patterns based on shape, color, and compositional elements rather than semantic functions. These clusters often diverge from semantic groupings, highlighting potential dissonance between visual design and intended meaning. For example, visually similar emojis (like differently colored hearts) may represent distinct emotional concepts, while visually distinct emojis (various food items) may belong to the same semantic category.</Typography>
                 </Box>
               </Paper>

               {/* Layer 3 */}
               <Paper variant="outlined" sx={layerDetailBoxStyle}>
                 <Typography variant="h6" component="h3" gutterBottom sx={{ fontSize: '1.2em' }}>
                   Layer 3: LLM Token Embedding Analysis
                 </Typography>
                 <Typography sx={leafPlaceholderStyle}>Models Internally</Typography>
                 <Typography variant="body2" paragraph sx={{ textAlign: 'left', minHeight: '100px', mb: 2, fontSize: '0.95em' }}>
                   We investigate how large language models represent emojis internally as tokens. By analyzing the embedding space of models like LLaMA, we observe how AI systems capture emoji meanings through context and usage patterns rather than explicit definitions, providing insights into how these primarily text-focused models process non-textual elements.
                 </Typography>
                 <Box sx={detailsConnectorStyle}></Box>
                 <Box sx={layerDetailsExtendedStyle}>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Methodological Approach:</Typography>
                   <Typography variant="body2" paragraph sx={{ fontSize: '0.9em' }}>We examine the internal representations of emojis within large language models to understand how these systems encode emoji meanings through contextual learning.</Typography>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Data Source:</Typography>
                   <Typography variant="body2" paragraph sx={{ fontSize: '0.9em' }}>Token embedding matrices from pre-trained language models such as LLaMA.</Typography>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Processing Pipeline:</Typography>
                   <Box component="ol" sx={{ pl: 2.5, fontSize: '0.9em', mb: 1 }}>
                     <li>Extraction of embedding vectors corresponding to emoji tokens from the model's embedding matrix.</li>
                     <li>Application of similarity metrics to identify relationships between emoji representations.</li>
                     <li>Clustering analysis to reveal structure in the embedding space.</li>
                     <li>Comparative analysis with external semantic frameworks.</li>
                   </Box>
                   <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 'bold' }}>Results and Interpretation:</Typography>
                   <Typography variant="body2" paragraph sx={{ fontSize: '0.9em', mb: 0 }}>LLM embeddings capture usage-based semantics derived from training corpora rather than explicit definitions. These representations reveal how models understand emojis through statistical co-occurrence patterns and contextual usage. This layer provides insights into potential misalignments between intended emoji meanings and their computational interpretation in AI systems that power many modern interfaces.</Typography>
                 </Box>
               </Paper>
           </Stack>
        </Box>

        <Divider sx={{ my: 3 }} /> {/* Add a divider */} 

        {/* Cross-Layer Insights Section - Use standard Typography variants */}
        <Box sx={{ pt: 1 }}> {/* Reduced top padding */}
          <Typography variant="h5" component="h3" align="center" gutterBottom>
            Cross-Layer Comparative Insights
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            The most revealing findings emerge when comparing these different representation systems:
          </Typography>
          <Box sx={{ pl: 2.5, mb: 2 }}>
             <Typography variant="body2" paragraph><strong>Definition-Visual Alignment Analysis:</strong> Measuring the correlation between semantic and visual clustering reveals emoji categories where visual design effectively communicates intended meaning, versus cases where visual similarity creates potential for misinterpretation.</Typography>
             <Typography variant="body2" paragraph><strong>LLM Fidelity Evaluation:</strong> Comparing definition-based semantic embeddings with LLM token embeddings quantifies how accurately language models capture conventional emoji meanings, identifying systematic biases or distortions in computational understanding.</Typography>
             <Typography variant="body2" paragraph><strong>Contextual Usage Divergence:</strong> Examining cases where LLM embeddings significantly diverge from definition-based embeddings reveals emergent meanings and usage patterns not captured in formal definitions, providing insights into how emoji semantics evolve through social usage.</Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            This multi-dimensional analytical framework advances our understanding of emoji representations across computational systems, with implications for improving human-computer interaction, cultural communication, and the design of more intuitive emoji systems.
          </Typography>
        </Box>
      </DialogContent>
      {/* Optional: Add DialogActions here if needed */}
    </Dialog>
  );
};

export default ExplanationModal; 