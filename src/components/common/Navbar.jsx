import React from 'react';
// import { Flex, Heading, Spacer, ButtonGroup, Button } from '@chakra-ui/react'; // Remove Chakra UI imports
import { AppBar, Toolbar, Typography, Box, ButtonGroup, Button, TextField, InputAdornment } from '@mui/material'; // Import MUI components
import SearchIcon from '@mui/icons-material/Search'; // Import SearchIcon

const Navbar = ({ currentView, onViewChange, onStartTour, searchQuery, onSearchChange, searchResultCount }) => {
  // Define styles for mode buttons
  const modeButtonStyle = (isActive) => ({
    backgroundColor: isActive ? '#fff' : '#333', // White if active, dark gray if inactive
    color: isActive ? '#0D47A1' : '#ccc', // Dark blue text if active, light gray if inactive
    borderColor: 'transparent', // Remove border
    boxShadow: 'none', // Remove shadow for flat look
    '&:hover': {
      backgroundColor: isActive ? '#eee' : '#444', // Slightly change bg on hover
      borderColor: 'transparent',
      boxShadow: 'none',
    },
    // Add padding for better spacing if needed
    // padding: '6px 16px',
  });

  return (
    // Use MUI AppBar and Toolbar for structure and sticky positioning
    <AppBar 
      position="sticky" 
      elevation={0} // Remove AppBar shadow for flat look
      sx={{
        backgroundColor: '#111', // Black background
      }}
    >
      <Toolbar>
        {/* Title - Left Aligned, Bold, Black Text */}
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{
            // flexGrow: 1, // Remove flexGrow to allow alignment to left
            // textAlign: 'center', // Change alignment to left
            fontWeight: 'bold', // Add bold font weight
            color: '#eee', // Set text color to black
            mr: 2 // Add some margin to the right of the title
          }}
        >
          TriEmojiMap
        </Typography>

        {/* Search Input */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#aaa' }} />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#333', // Darker background
              borderRadius: '6px', // Consistent round corners
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              color: '#eee', // Light text
              '& fieldset': { borderColor: '#555' }, // Border color
              '&:hover fieldset': { borderColor: '#777' },
              mr: 2
            }
          }}
          sx={{
            minWidth: '200px', // Set a minimum width
            display: { xs: 'none', sm: 'block' } // Hide on extra small screens, show on small and up
          }}
        />

        {/* 搜索结果数量反馈 */}
        <Box sx={{ minWidth: 100, mr: 2, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', color: '#ccc' }}>
          {searchQuery ? (
            searchResultCount > 0 ? `${searchResultCount} results` : 'No results found'
          ) : null}
        </Box>

        {/* Spacer to push buttons to the right */}
        <Box sx={{ flexGrow: 1 }} /> 

        {/* View selection buttons */}
        <ButtonGroup variant="contained" aria-label="view selection button group" disableElevation>
          <Button 
            sx={modeButtonStyle(currentView === 'Visual')} 
            onClick={() => onViewChange('Visual')}
          >
            VISUAL VIEW
          </Button>
          <Button sx={modeButtonStyle(currentView === 'semantic')} onClick={() => onViewChange('semantic')}>SEMANTIC VIEW</Button>
          <Button sx={modeButtonStyle(currentView === 'token')} onClick={() => onViewChange('token')}>TOKEN VIEW</Button>
        </ButtonGroup>
        
        {/* Add the Guided Tour Button */}
        <Button 
          variant="contained"
          onClick={onStartTour} 
          sx={{ 
            ml: 2, 
            backgroundColor: '#0d6efd', // Blue background
            color: '#fff',
            borderRadius: '6px', // Consistent round corners
             boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
             '&:hover': { backgroundColor: '#0a58ca' }
             }}
        >
          Start Guided Tour
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 