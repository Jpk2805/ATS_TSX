import React from 'react'

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  let text = '';
  let textColor = '';

  if (score > 70) {
    textColor = 'bg-badge-green text-green-600';
    text = 'Excellent';
  } else if (score > 40) {
    textColor = 'bg-badge-yellow text-yellow-600';
    text = 'Good';
  } else {
    textColor = 'bg-badge-red text-red-600';
    text = 'Poor';
  }

  return (
    <div className={`px-3 py-1 rounded-full ${textColor}`}>
      <p className='text-sm font-medium'>{text}</p>
    </div>
  )
}
export default ScoreBadge