import React, { useEffect, useState, useRef } from 'react';
import Button from '@mui/material/Button';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import './ScrollamaNarrative.css';

const narrativeSteps = [
  {
    id: 1,
    title: "Three-Layer Approach",
    text: "The semantic layer encodes each emoji's textual definition. The visual layer encodes its image. The LLM layer encodes the emoji as a token in a language model. Comparing these layers lets us see how meaning is captured differently in text, vision, and AI (LLM) contexts.",
    visual: "/scrollama_visuals/step1.jpg"
  },
  {
    id: 2,
    title: "Emoji Inventory",
    text: "There are 5,043 emoji characters in Unicode by 2024.",
    visual: "/scrollama_visuals/step2.jpg"
  },
  {
    id: 3,
    title: "Research Value",
    text: "Most emojis have low research value.",
    visual: "/scrollama_visuals/step3.jpg"
  },
  {
    id: 4,
    title: "Filter Skin-Tone Variants",
    text: "1st step is to filter out skin-tone variants.",
    visual: "/scrollama_visuals/step4.jpg"
  },
  {
    id: 5,
    title: "Frequency & Completeness",
    text: "Next, I ensure each emoji has high social-media frequency—so there's ample usage data and semantic tags—and a complete description.",
    visual: "/scrollama_visuals/step5.jpg"
  },
  {
    id: 6,
    title: "Emojipedia",
    text: "Emojipedia is like Wikipedia for emoji, with the most official, formal information.",
    visual: "/scrollama_visuals/step6.jpg"
  },
  {
    id: 7,
    title: "Data Sources",
    text: "HotEmoji focuses on popularity rankings and fun usage notes. EmojiNet is the largest machine-readable emoji sense inventory, linking 2,389 emojis to 12,904 English sense labels extracted from the Web.",
    visual: "/scrollama_visuals/step7.jpg"
  },
  {
    id: 8,
    title: "Final Selection",
    text: "After the above filtering, I ended up with a list of 1,810 emojis.",
    visual: "/scrollama_visuals/step8.jpg"
  },
  {
    id: 9,
    title: "Dataset",
    text: "Here is the cleaned CSV format; we can briefly review the column names and their meanings.",
    visual: "/scrollama_visuals/step9.jpg"
  },
  {
    id: 10,
    title: "Marked Columns",
    text: "I've annotated the columns relevant for building the visualization and training further models.",
    visual: "/scrollama_visuals/step10.jpg"
  },
  {
    id: 11,
    title: "Visual Embedding",
    text: "In the visual layer, each emoji's image is passed through a convolutional neural network (ResNet-50), taking its 2,048-dimensional penultimate-layer output. Emojis that look alike tend to get closer vectors in this space.",
    visual: "/scrollama_visuals/step11.jpg"
  },
  {
    id: 12,
    title: "Semantic Embedding",
    text: "In the semantic layer, we convert each emoji's definitions from EmojiNet and related text into a vector using OpenAI's text-embedding-3-small model. The resulting vectors cluster emojis by conceptual meaning—this is a common industry practice, often based on millions of tweets.",
    visual: "/scrollama_visuals/step12.jpg"
  },
  {
    id: 13,
    title: "LLM Token Embedding",
    text: "A visualization reveals how Llama3 represents and organizes emojis. By inputting each emoji into the LLM and extracting its embedding, we can observe context-based similarities—i.e. which emojis the model treats as related. Silhouette Score measures the closeness of each data point to its own cluster and its separation from the nearest neighboring clusters, and takes the value in the range of [-1, 1], the larger value means the better the clustering effect.",
    visual: "/scrollama_visuals/step13.jpg"
  },
  {
    id: 14,
    title: "Cross Layer Comparison",
    text: "By computing the Euclidean distance between the same emoji in the two spaces. Larger distances indicate greater mismatch between 'how it looks' and 'how it's used.'",
    visual: "/scrollama_visuals/step14.jpg"
  },
  {
    id: 15,
    title: "Interactive Demo",
    text: "Let's back to play the website!",
    visual: "/scrollama_visuals/step15.jpg"
  },
  {
    id: 16,
    title: "Limitations 1",
    text: "Although we've gathered the most comprehensive emoji data and distinguished entries by layer, our search and user-query features—especially for ML-related metadata—are still limited.",
    visual: "/scrollama_visuals/step16.jpg"
  },
  {
    id: 17,
    title: "Limitations 2",
    text: "Similarly, cross-layer difference comparisons and within-layer similarity calculations have not yet produced clear user insights; these are areas I will continue to optimize.",
    visual: "/scrollama_visuals/step17.jpg"
  }
];

/**
 * ScrollamaNarrative Component
 * 
 * A scrollable narrative with sticky visualizations that change as the user scrolls.
 * Uses Intersection Observer API instead of scrollama library
 */
const ScrollamaNarrative = ({ onExit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const stepsContainerRef = useRef(null);
  const stepRefs = useRef([]);
  
  // 设置步骤的引用数组
  useEffect(() => {
    stepRefs.current = stepRefs.current.slice(0, narrativeSteps.length);
  }, []);
  
  useEffect(() => {
    // 估计顶部导航栏的高度（假设为60px）
    const navBarHeight = 60;
    
    // 调整graphic容器的高度以适应导航栏
    const graphicElement = document.querySelector('.scrollama-graphic-sticky');
    if (graphicElement) {
      graphicElement.style.height = `calc(100vh - ${navBarHeight}px)`;
      graphicElement.style.top = `${navBarHeight}px`;
    }
    
    // 使用Intersection Observer替代scrollama
    const observerOptions = {
      root: stepsContainerRef.current,
      rootMargin: '0px',
      threshold: 0.5, // 当目标元素50%可见时触发回调
    };
    
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 从dataset获取步骤索引
          const index = parseInt(entry.target.dataset.index, 10);
          setActiveStep(index);
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // 观察所有步骤元素
    stepRefs.current.forEach(stepRef => {
      if (stepRef) {
        observer.observe(stepRef);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div className="scrollama-layout-container">
      {/* 左侧：固定位置的图形区域（60%宽度） */}
      <div 
        className="scrollama-graphic-sticky" 
        style={{ 
          width: '60%',
          height: 'calc(100vh - 60px)', // 减去顶部导航栏高度
          top: '60px' // 从导航栏下方开始
        }}
      >
        <img 
          src={process.env.PUBLIC_URL + narrativeSteps[activeStep].visual} 
          alt={`步骤 ${activeStep + 1}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
      
      {/* 右侧：可滚动的文本步骤容器（40%宽度） */}
      <div 
        ref={stepsContainerRef} 
        className="scrollama-steps-container" 
        style={{ 
          width: '40%',
          height: 'calc(100vh - 60px)', // 减去顶部导航栏高度
          paddingTop: '80px' // 给顶部添加一些额外的空间
        }}
      >
        {narrativeSteps.map((step, i) => (
          <div 
            key={i} 
            className={`scrollama-step ${i === activeStep ? 'is-active' : ''}`}
            ref={el => stepRefs.current[i] = el}
            data-index={i}
          >
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        ))}
      </div>
      
      {/* 退出按钮 - 位于右下角 */}
      <Button
        variant="contained"
        color="primary"
        className="exit-button"
        onClick={onExit}
        style={{ 
          minWidth: '40px', 
          width: '40px', 
          height: '40px', 
          borderRadius: '4px', 
          padding: '8px' 
        }}
      >
        <ExitToAppIcon />
      </Button>
    </div>
  );
};

export default ScrollamaNarrative;