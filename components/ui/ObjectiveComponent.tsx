import React from 'react';
import './ObjectiveComponent.css';

interface ObjectiveComponentProps {
  projectOverview?: string;
  userRole?: string;
  userObjective?: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ObjectiveComponent: React.FC<ObjectiveComponentProps> = ({
  projectOverview = "A water duct is a channel or conduit designed to transport water from one location to another. It can be used for various purposes, including irrigation, drainage, or supplying water to residential and commercial areas. Water ducts are essential in managing water flow, preventing flooding, and ensuring that communities have access to clean water. They can be constructed from various materials, including concrete, metal, or plastic, and are often integrated into larger water management systems to enhance efficiency and sustainability.",
  userRole = "You are a renewable energy engineer.",
  userObjective = "Conduct a thorough analysis of the water duct requirements and regulations. Provide a presentation on your suggestions",
  isCollapsible = true,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Don't render anything when collapsed - the collapsed state is handled by the parent
  if (isCollapsed) {
    return null;
  }

  return (
    <div className="objective-component">
      <div className="objective-container">
        <div className="objective-header">
          <h1 className="text-sb-16">Overview & Objective</h1>
          {isCollapsible && (
            <button 
              className="collapse-button"
              onClick={onToggleCollapse}
              aria-label="Collapse section"
            >
              <div className="chevron-icon">
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path 
                    d="M1 1.5L5.5 6L10 1.5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          )}
        </div>
        
        <div className="objective-content">
          <div className="field-section">
            <h2 className="text-sb-14">Project Overview</h2>
            <p className="text-r-14">{projectOverview}</p>
          </div>
          
          <div className="field-section">
            <h2 className="text-sb-14">Your Role</h2>
            <p className="text-r-14">{userRole}</p>
          </div>
          
          <div className="field-section">
            <h2 className="text-sb-14">Your Objective</h2>
            <p className="text-r-14">{userObjective}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveComponent;