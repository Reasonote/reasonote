export const getColorForScore = (score: number): string => {
    // Normalize score to 0-1 range if it's not already
    const normalizedScore = score > 1 ? score / 100 : score;
  
    if (isNaN(normalizedScore)) {
      // Gray with question mark
      return 'rgb(200, 200, 200)';
    } else if (normalizedScore <= 0.2) {
      // Red
      return 'rgb(255, 0, 0)';
    } else if (normalizedScore <= 0.4) {
      // Orange
      return 'rgb(255, 110, 0)';
    } else if (normalizedScore <= 0.8) {
      // Slightly Softer Yellow
      return 'rgb(255, 200, 0)';
    } else {
      // Slightly Softer Green
      return 'rgb(100, 255, 0)';
    }
  };
