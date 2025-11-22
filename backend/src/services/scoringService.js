function computeScores({user, cropConfig, weather, marketPrice, soilTest}) {
  const soilCompatibility = (cropConfig.idealSoil || []).includes(soilTest.type) ? 90 : 40;
  const waterRisk = (() => {
    if (!weather || weather.rainNext7Days==null) return 50;
    if (weather.rainNext7Days > 50) return 30;
    if (weather.rainNext7Days > 10) return 50;
    return 80;
  })();
  const pestRisk = (() => {
    if (!weather || weather.tempAvg==null) return 40;
    return weather.tempAvg > (cropConfig.tempToleranceHigh || 30) ? 70 : 30;
  })();
  const profitability = Math.round(Math.max(0, Math.min(100, ((marketPrice || 0) - (cropConfig.cost || 10)) * 2)));
  const cropSuitability = Math.round((soilCompatibility*0.5 + (100 - waterRisk)*0.3 + (100 - pestRisk)*0.2));
  const overall = Math.round(
    cropSuitability * 0.4 + (100 - waterRisk) * 0.15 + (100 - pestRisk) * 0.15 + profitability * 0.3
  );
  return {
    cropSuitability, waterRisk, soilCompatibility, pestRisk, profitability, overall
  };
}

module.exports = { computeScores };
