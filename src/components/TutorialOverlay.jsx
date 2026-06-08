import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const steps = [
  {
    selector: '.sidebar-header',
    title: 'Welcome to TIMEROI',
    description: 'Track your video editing projects efficiently.',
    position: 'bottom'
  },
  {
    selector: '.plus-btn',
    title: 'Create Project',
    description: 'Click + to create a new project workspace.',
    position: 'left'
  },
  {
    selector: '.timer-start-btn',
    title: 'Start Timer',
    description: 'Press play to start tracking time on any task.',
    position: 'bottom'
  },
  {
    selector: '.analytics-btn',
    title: 'View Analytics',
    description: 'Check detailed insights and statistics.',
    position: 'top'
  },
  {
    selector: '.pomodoro-btn',
    title: 'Pomodoro Focus',
    description: 'Use built-in timer for focused work sessions.',
    position: 'bottom'
  },
  {
    selector: '.export-btn',
    title: 'Export Report',
    description: 'Download CSV or PDF reports of your work.',
    position: 'top'
  }
];

export default function TutorialOverlay({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('tutorial_shown');
    if (!hasShown) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const currentStepData = steps[currentStep];
  const element = document.querySelector(currentStepData.selector);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    sessionStorage.setItem('tutorial_shown', '1');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const completeTutorial = () => {
    sessionStorage.setItem('tutorial_shown', '1');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible || !element) return null;

  const getPositionStyles = () => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (currentStepData.position) {
      case 'top':
        return {
          bottom: `${viewportHeight - rect.top}px`,
          left: `${rect.left + rect.width / 2 - 280}px`,
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 16}px`,
          left: `${rect.left + rect.width / 2 - 280}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          right: `${viewportWidth - rect.left}px`,
          top: `${rect.top + rect.height / 2 - 100}px`,
          transform: 'translateY(-50%)'
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={skipTutorial}
      />

      <div
        style={{
          position: 'fixed',
          ...getPositionStyles(),
          zIndex: 10001,
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-panel)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.3s ease-out, slideIn 0.3s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={skipTutorial}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '0.5rem'
          }}
        >
          <X size={18} />
        </button>

        {/* White arrow pointing to element */}
        <div
          style={{
            position: 'absolute',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            borderWidth: '12px',
            ...(currentStepData.position === 'top' && {
              bottom: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderTopColor: 'var(--bg-panel)',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent'
            }),
            ...(currentStepData.position === 'bottom' && {
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderBottomColor: 'var(--bg-panel)',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: 'transparent'
            }),
            ...(currentStepData.position === 'left' && {
              right: '-24px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderLeftColor: 'var(--bg-panel)',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRightColor: 'transparent'
            })
          }}
        />

        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
          {currentStepData.title}
        </h3>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {currentStepData.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Step {currentStep + 1} of {steps.length}
          </div>
          <button
            onClick={nextStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 16px var(--accent-primary)55'
            }}
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Got it'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translate(-50%, -10px); }
          to { transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}
