// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { Box } from '@chakra-ui/react'; // Remove Chakra UI import
import Box from '@mui/material/Box'; // Import Box from Material UI
import CrossLayerComparisonView from './components/Visualization/panel/CrossLayerComparisonView';
import Navbar from './components/common/Navbar';
import ScrollamaNarrative from './components/ScrollamaNarrative'; // Import the new component
import IntroductionSplash from './components/common/IntroductionSplash'; // Import the splash screen
import { processEmojiNetCsvData } from './data/processData'; // Import data processing function
import debounce from 'lodash.debounce'; // Import debounce
import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, CircularProgress, Typography } from '@mui/material';
// import Tour from 'reactour'; // 暂时注释掉有问题的导入
import Button from '@mui/material/Button'; // Import MUI Button

function App() {
  const [view, setView] = useState('Visual');
  const [tourActive, setTourActive] = useState(false); // State to control tour mode
  const [isIntroductionVisible, setIsIntroductionVisible] = useState(true); // State for splash screen
  const [searchQuery, setSearchQuery] = useState(''); // Add search query state
  const [allEmojiData, setAllEmojiData] = useState([]);
  const [filteredEmojiData, setFilteredEmojiData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on initial mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { emojiData } = await processEmojiNetCsvData();
        if (emojiData && emojiData.length > 0) {
          // 归一化 img_pc1/img_pc2 和 word_pc1/word_pc2
          const getMinMax = (arr, key) => {
            let min = Infinity, max = -Infinity;
            arr.forEach(item => {
              const v = parseFloat(item[key]);
              if (!isNaN(v)) {
                if (v < min) min = v;
                if (v > max) max = v;
              }
            });
            return { min, max };
          };
          const imgX = getMinMax(emojiData, 'img_x');
          const imgY = getMinMax(emojiData, 'img_y');
          const wordX = getMinMax(emojiData, 'word_x');
          const wordY = getMinMax(emojiData, 'word_y');

          // 归一化函数
          const norm = (v, min, max) => (max - min === 0 ? 0.5 : (parseFloat(v) - min) / (max - min));

          // 计算 difference 字段
          const withDiff = emojiData.map(item => {
            const img_x_n = norm(item.img_x, imgX.min, imgX.max);
            const img_y_n = norm(item.img_y, imgY.min, imgY.max);
            const word_x_n = norm(item.word_x, wordX.min, wordX.max);
            const word_y_n = norm(item.word_y, wordY.min, wordY.max);
            const difference = Math.sqrt(
              Math.pow(img_x_n - word_x_n, 2) +
              Math.pow(img_y_n - word_y_n, 2)
            );
            return {
              ...item,
              img_x_n, img_y_n, word_x_n, word_y_n, difference
            };
          });

          setAllEmojiData(withDiff);
          setFilteredEmojiData(withDiff);
        } else {
          console.error("Loaded data is invalid or empty.");
          setAllEmojiData([]);
          setFilteredEmojiData([]);
        }
      } catch (error) {
        console.error("Error loading data in App component:", error);
        setAllEmojiData([]);
        setFilteredEmojiData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleViewChange = (newView) => {
    if (!tourActive) { // Only allow view change if not in tour mode
      setView(newView);
    }
  };

  const handleStartTour = () => {
    setTourActive(true);
  };

  const handleExitTour = () => {
    setTourActive(false);
    // Optionally reset view or search when exiting tour
    // setView('Visual');
    // setSearchQuery('');
    // setFilteredEmojiData(allEmojiData);
  };

  const handleStartExploring = () => { // Handler for the splash screen button
    setIsIntroductionVisible(false);
  };

  // Debounced search function - Wrap the inner function directly
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (!query) {
        setFilteredEmojiData(allEmojiData);
        return;
      }
      const lowerCaseQuery = query.toLowerCase();
      const results = allEmojiData.filter(emoji => {
        // 处理 emjpd_aliases
        let aliasesArr = [];
        if (Array.isArray(emoji.emjpd_aliases)) {
          aliasesArr = emoji.emjpd_aliases;
        } else if (typeof emoji.emjpd_aliases === 'string' && emoji.emjpd_aliases.trim() !== '') {
          try {
            // 尝试解析为 JSON 数组
            aliasesArr = JSON.parse(emoji.emjpd_aliases);
            if (!Array.isArray(aliasesArr)) aliasesArr = [emoji.emjpd_aliases];
          } catch {
            // 不是 JSON 数组，按逗号或分号分割
            aliasesArr = emoji.emjpd_aliases.split(/[;,]/).map(s => s.trim()).filter(Boolean);
          }
        }
        // 处理 emjpd_shortcodes
        let shortcodesArr = [];
        if (Array.isArray(emoji.emjpd_shortcodes)) {
          shortcodesArr = emoji.emjpd_shortcodes;
        } else if (typeof emoji.emjpd_shortcodes === 'string' && emoji.emjpd_shortcodes.trim() !== '') {
          try {
            shortcodesArr = JSON.parse(emoji.emjpd_shortcodes);
            if (!Array.isArray(shortcodesArr)) shortcodesArr = [emoji.emjpd_shortcodes];
          } catch {
            shortcodesArr = emoji.emjpd_shortcodes.split(/[;,]/).map(s => s.trim()).filter(Boolean);
          }
        }
        return (
          (emoji.emoji_name && emoji.emoji_name.toLowerCase().includes(lowerCaseQuery)) ||
          (aliasesArr.length > 0 && aliasesArr.some(alias => alias.toLowerCase().includes(lowerCaseQuery))) ||
          (shortcodesArr.length > 0 && shortcodesArr.some(code => code.toLowerCase().includes(lowerCaseQuery))) ||
          (emoji.emjpd_full_description && emoji.emjpd_full_description.toLowerCase().includes(lowerCaseQuery)) ||
          (emoji.char && emoji.char.includes(query))
        );
      });
      setFilteredEmojiData(results);
    }, 300),
    [allEmojiData] // Dependency is correct
  );

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Memoize the props for CrossLayerComparisonView to prevent unnecessary re-renders
  const crossLayerProps = useMemo(() => ({
    currentView: view,
    emojiData: filteredEmojiData, // Pass filtered data
    loading: loading // Pass loading state
    // Pass other necessary cluster data if CrossLayerComparisonView needs it directly
    // e.g., visualClusterData, semanticClusterData, etc., if not derived from emojiData
  }), [view, filteredEmojiData, loading]);

  // Dark theme
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#0d6efd',
      },
      background: {
        default: '#000000', // Black background
        paper: '#333333', // Dark gray cards/surfaces
      },
    },
    typography: {
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Normalize CSS */}
      {isIntroductionVisible ? (
        <IntroductionSplash onStartExploring={handleStartExploring} />
      ) : (
        <Box className="App" sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}> 
          <div className="tour-navbar">
            <Navbar 
              currentView={view} 
              onViewChange={handleViewChange} 
              onStartTour={handleStartTour} 
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              searchResultCount={filteredEmojiData.length}
            />
          </div>
          {/* Conditionally render Tour or Main View */}
          {tourActive ? (
            <ScrollamaNarrative onExit={handleExitTour} />
          ) : (
            // Pass memoized props and loading state
            loading ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                 Loading data...
               </Box>
             ) : (
               <CrossLayerComparisonView {...crossLayerProps} />
             )
          )}
          {/* 暂时注释掉Tour组件
          <Tour
            steps={tourSteps}
            isOpen={tourActive}
            onRequestClose={handleExitTour}
            closeWithMask={false}
            rounded={8}
            accentColor="#0d6efd"
            lastStepNextButton={
              <Button 
                variant="contained" 
                color="primary"
                size="small"
              >
                Finish Tour
              </Button>
            }
          />
          */}
        </Box>
      )}
    </ThemeProvider>
  );
}

export default App;