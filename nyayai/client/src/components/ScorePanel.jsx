import React from 'react';
import ProgressBar from './ProgressBar';

function ScorePanel({ score = 78, opponentScore = 71, breakdown }) {
  const legalRelevance = Number(breakdown?.legalRelevance ?? 82);
  const logicalStructure = Number(breakdown?.logicalStructure ?? 76);
  const tone = Number(breakdown?.tone ?? 70);
  const persuasiveness = Number(breakdown?.persuasiveness ?? 84);

  return (
    <div className="nyay-card p-3 h-100">
      <h6 className="heading" style={{ color: '#C9A84C' }}>Scoreboard</h6>
      <h3 className="heading" style={{ color: '#F5ECD7' }}>Your Score: {score}</h3>
      <h5 style={{ color: '#8B1A1A' }}>Opponent: {opponentScore}</h5>
      <ProgressBar label="Legal Relevance" value={legalRelevance} />
      <ProgressBar label="Logic" value={logicalStructure} />
      <ProgressBar label="Tone" value={tone} />
      <ProgressBar label="Persuasion" value={persuasiveness} />
    </div>
  );
}

export default ScorePanel;
