import React from 'react';
import './Steps.css';

export interface StepData {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'active' | 'pending';
}

interface StepsProps {
  steps: StepData[];
  className?: string;
  onCollapse?: () => void;
}

export default function Steps({ steps, className = '', onCollapse }: StepsProps) {
  return (
    <div className={`steps-container ${className}`}>
      <div className="steps-header">
        <h2 className="text-sb-16">Steps</h2>
        {onCollapse && (
          <button 
            className="steps-collapse-btn" 
            onClick={onCollapse} 
            aria-label="Collapse steps"
          >
            ▴
          </button>
        )}
      </div>
      
      <div className="steps-list">
        {/* Single continuous timeline line */}
        <div className="timeline-line" />
        
        {steps.map((step, index) => (
          <div key={step.id} className={`step-item ${step.status}`}>
            <div className="step-timeline">
              <div className={`step-circle ${step.status}`} />
            </div>
            <div className="step-content">
              <div className="step-title-row">
                <h3 className={`step-title text-sb-14 ${step.status === 'completed' ? 'completed-text' : ''}`}>
                  {step.title} ({step.duration})
                </h3>
              </div>
              <p className={`step-description text-r-14 ${step.status === 'completed' ? 'completed-text' : ''}`}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}