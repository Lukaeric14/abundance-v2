import React from 'react';
import Steps, { StepData } from './ui/Steps';

// Example data matching the Figma design exactly
const sampleSteps: StepData[] = [
  {
    id: '1',
    title: 'Research Phase',
    description: '1. Conduct a thorough analysis of the water duct requirements and regulations.',
    duration: '5mins',
    status: 'completed'
  },
  {
    id: '2',
    title: 'Discovery Phase',
    description: '2. Develop a comprehensive design plan that meets all necessary specifications.',
    duration: '10mins',
    status: 'active'
  },
  {
    id: '3',
    title: 'Planning Phase',
    description: '3. Assign team members specific tasks related to the design and implementation.',
    duration: '3mins',
    status: 'pending'
  },
  {
    id: '4',
    title: 'Design Phase',
    description: '4. Create a detailed presentation to showcase the design to government representatives.',
    duration: '10mins',
    status: 'pending'
  },
  {
    id: '5',
    title: 'Testing Phase',
    description: '5. Arrange meetings with local authorities to discuss project approvals.',
    duration: '8mins',
    status: 'pending'
  },
  {
    id: '6',
    title: 'Presentation Phase',
    description: '6. Finalize all contracts and ensure compliance with legal standards.',
    duration: '10mins',
    status: 'pending'
  }
];

export default function StepsExample() {
  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <Steps steps={sampleSteps} />
    </div>
  );
}