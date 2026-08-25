import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, GripHorizontal } from 'lucide-react';

interface GuidePopupProps {
  onSkip: () => void;
}

export const GuidePopup: React.FC<GuidePopupProps> = ({ onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Calculate new position
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      positionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const steps = [
    {
      title: "Step 1",
      description: "Upload any API URL that contains JSON data.",
    },
    {
      title: "Step 2",
      description: "Click Connect API. Your JSON data will go through our 10-step neural processing pipeline.",
    },
    {
      title: "Step 3",
      description: "You can ask the AI about your data. Relevant embeddings are generated for precise retrieval.",
    },
    {
      title: "Step 4",
      description: "That's how the real processing of a systematic, optimized parser is done. Try it out!",
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSkip(); // Final step closes it
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:bottom-24 md:right-12 md:w-96 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.05)] z-50 flex flex-col ${isDragging ? '' : 'transition-opacity duration-500'} animate-in fade-in slide-in-from-bottom-8`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      
      {/* Animated glowing border wrapper */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-300 via-gray-900 to-gray-300 dark:from-gray-800 dark:via-gray-300 dark:to-gray-800 rounded-xl blur opacity-30 animate-[spin_4s_linear_infinite]" />
      
      <div className="relative bg-white dark:bg-[#0a0a0a] rounded-xl overflow-hidden flex flex-col border border-gray-200/50 dark:border-gray-800/50 h-full w-full">
        <div 
          className={`flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0f0f0f] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 select-none">How to use</h3>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onSkip(); }} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 min-h-[140px]">
          <div className="text-sm font-mono text-gray-500 mb-3 uppercase tracking-wider font-bold">{steps[currentStep].title}</div>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>

        <div className="px-5 py-4 bg-gray-50/50 dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-gray-800 dark:bg-gray-200' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onSkip}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              Skip
            </button>
            <div className="flex gap-2">
              <button 
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`p-2 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNext}
                className="px-4 py-2 rounded-md bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-sm font-medium flex items-center gap-1.5 transition-all shadow-md"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
