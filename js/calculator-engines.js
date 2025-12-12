/**
 * 🧮 WiT AI Calculator Engines
 * ระบบคำนวณเครื่องฉีดพลาสติกครบทั้ง 15+ เครื่องมือ
 */

// =====================================================
// 📊 MATERIALS DATABASE
// =====================================================

const MATERIALS = {
  PP: {
    name: 'Polypropylene (PP)',
    pressure: 500,
    meltTemp: [200, 280],
    moldTemp: [30, 60],
    shrinkage: [1.0, 2.0],
    cycleTime: 25,
    icon: '🔵',
  },
  PE: {
    name: 'Polyethylene (PE)',
    pressure: 600,
    meltTemp: [180, 260],
    moldTemp: [20, 50],
    shrinkage: [1.5, 2.5],
    cycleTime: 20,
    icon: '🟢',
  },
  ABS: {
    name: 'ABS',
    pressure: 700,
    meltTemp: [200, 280],
    moldTemp: [50, 80],
    shrinkage: [0.4, 0.8],
    cycleTime: 30,
    icon: '🔴',
  },
  PC: {
    name: 'Polycarbonate (PC)',
    pressure: 800,
    meltTemp: [280, 320],
    moldTemp: [80, 120],
    shrinkage: [0.5, 0.9],
    cycleTime: 35,
    icon: '🟡',
  },
  PMMA: {
    name: 'PMMA (Acrylic)',
    pressure: 750,
    meltTemp: [200, 250],
    moldTemp: [60, 90],
    shrinkage: [0.3, 0.7],
    cycleTime: 28,
    icon: '🟣',
  },
  PA: {
    name: 'Nylon (PA)',
    pressure: 900,
    meltTemp: [250, 300],
    moldTemp: [70, 110],
    shrinkage: [0.8, 1.5],
    cycleTime: 32,
    icon: '🟠',
  },
  POM: {
    name: 'Acetal (POM)',
    pressure: 850,
    meltTemp: [190, 220],
    moldTemp: [60, 100],
    shrinkage: [1.8, 2.5],
    cycleTime: 30,
    icon: '⚫',
  },
};

// =====================================================
// 1. 🔧 CLAMP FORCE CALCULATOR
// =====================================================

function calculateClampForce(area, pressure, safetyFactor = 1.2) {
  if (!area || !pressure || area <= 0 || pressure <= 0) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const forceKg = area * pressure * safetyFactor;
  const forceTon = forceKg / 1000;

  // Find recommended machine size
  const machineSizes = [50, 75, 100, 150, 200, 300, 400, 500, 650, 800, 1000, 1200, 1500, 2000];
  const recommendedMachine = machineSizes.find((size) => size >= forceTon) || machineSizes[machineSizes.length - 1];

  return {
    forceTon: forceTon.toFixed(1),
    forceKg: forceKg.toFixed(0),
    recommendedMachine,
    safetyFactor,
    area,
    pressure,
  };
}

// =====================================================
// 2. ❄️ COOLING TIME CALCULATOR
// =====================================================

function calculateCoolingTime(thickness, material, moldTemp, ejectTemp) {
  if (!thickness || thickness <= 0) {
    throw new Error('กรุณาระบุความหนา');
  }

  const materialData = MATERIALS[material] || MATERIALS.PP;
  const avgMeltTemp = (materialData.meltTemp[0] + materialData.meltTemp[1]) / 2;

  // Simplified formula: t = (s²/α) * ln[(Tm - Tw)/(Te - Tw)]
  // Where: s = wall thickness, α = thermal diffusivity
  const alpha = 0.00012; // thermal diffusivity (cm²/s) - typical for plastics
  const Tm = avgMeltTemp;
  const Tw = moldTemp || 40;
  const Te = ejectTemp || 60;

  const coolingTime = ((thickness * thickness) / alpha) * Math.log((Tm - Tw) / (Te - Tw));

  return {
    coolingTime: coolingTime.toFixed(1),
    thickness,
    material: materialData.name,
    moldTemp: Tw,
    ejectTemp: Te,
    meltTemp: Tm,
  };
}

// =====================================================
// 3. 💉 SHOT SIZE CALCULATOR
// =====================================================

function calculateShotSize(partWeight, cavities, runnerWeight = 0, sprue = 0) {
  if (!partWeight || partWeight <= 0) {
    throw new Error('กรุณาระบุน้ำหนักชิ้นงาน');
  }

  const totalPartWeight = partWeight * cavities;
  const totalShot = totalPartWeight + runnerWeight + sprue;
  const cushion = totalShot * 0.05; // 5% cushion
  const recommendedBarrelCapacity = totalShot * 3; // ควรใช้ 30-40% ของ barrel

  return {
    shotSize: totalShot.toFixed(2),
    totalPartWeight: totalPartWeight.toFixed(2),
    cushion: cushion.toFixed(2),
    recommendedBarrelCapacity: recommendedBarrelCapacity.toFixed(2),
    partWeight,
    cavities,
    runnerWeight,
    sprue,
  };
}

// =====================================================
// 4. 🌡️ TEMPERATURE CALCULATOR
// =====================================================

function calculateTemperature(material, action = 'recommend') {
  const materialData = MATERIALS[material] || MATERIALS.PP;

  const meltTempMin = materialData.meltTemp[0];
  const meltTempMax = materialData.meltTemp[1];
  const meltTempAvg = (meltTempMin + meltTempMax) / 2;

  const moldTempMin = materialData.moldTemp[0];
  const moldTempMax = materialData.moldTemp[1];
  const moldTempAvg = (moldTempMin + moldTempMax) / 2;

  // Zone temperatures (3-zone barrel typical)
  const zoneTemps = {
    rear: meltTempMin,
    middle: meltTempAvg,
    front: meltTempMax - 10,
    nozzle: meltTempMax,
  };

  return {
    material: materialData.name,
    meltTempRange: `${meltTempMin}-${meltTempMax}°C`,
    meltTempRecommend: meltTempAvg.toFixed(0),
    moldTempRange: `${moldTempMin}-${moldTempMax}°C`,
    moldTempRecommend: moldTempAvg.toFixed(0),
    zoneTemps,
  };
}

// =====================================================
// 5. ⏱️ CYCLE TIME CALCULATOR
// =====================================================

function calculateCycleTime(fillTime, packTime, coolingTime, mouldOpenClose = 3) {
  if (!fillTime || !packTime || !coolingTime) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const totalCycle = parseFloat(fillTime) + parseFloat(packTime) + parseFloat(coolingTime) + parseFloat(mouldOpenClose);
  const partsPerHour = Math.floor(3600 / totalCycle);
  const partsPerDay = partsPerHour * 22; // 22 hrs production

  return {
    totalCycle: totalCycle.toFixed(1),
    fillTime,
    packTime,
    coolingTime,
    mouldOpenClose,
    partsPerHour,
    partsPerDay,
  };
}

// =====================================================
// 6. 🚪 GATE SIZE CALCULATOR
// =====================================================

function calculateGateSize(wallThickness, flowLength, material) {
  if (!wallThickness || wallThickness <= 0) {
    throw new Error('กรุณาระบุความหนาผนัง');
  }

  // Gate size typically 50-80% of wall thickness
  const gateThickness = wallThickness * 0.6;
  const gateWidth = wallThickness * 1.5;

  // Land length (distance from gate to part)
  const landLength = gateThickness * 1.0;

  // Recommended gate types based on wall thickness
  let recommendedGate = '';
  if (wallThickness < 1.0) {
    recommendedGate = 'Pin Gate หรือ Submarine Gate';
  } else if (wallThickness < 3.0) {
    recommendedGate = 'Edge Gate หรือ Tab Gate';
  } else {
    recommendedGate = 'Fan Gate หรือ Film Gate';
  }

  return {
    gateThickness: gateThickness.toFixed(2),
    gateWidth: gateWidth.toFixed(2),
    landLength: landLength.toFixed(2),
    recommendedGate,
    wallThickness,
  };
}

// =====================================================
// 7. 📏 SHRINKAGE CALCULATOR
// =====================================================

function calculateShrinkage(nominalSize, material, wallThickness) {
  if (!nominalSize || nominalSize <= 0) {
    throw new Error('กรุณาระบุขนาดชิ้นงาน');
  }

  const materialData = MATERIALS[material] || MATERIALS.PP;

  // Shrinkage varies with wall thickness
  let shrinkagePercent = materialData.shrinkage[0];
  if (wallThickness > 3) {
    shrinkagePercent = materialData.shrinkage[1]; // Higher shrinkage for thick walls
  }

  const shrinkageAmount = (nominalSize * shrinkagePercent) / 100;
  const moldSize = nominalSize + shrinkageAmount;

  return {
    nominalSize,
    shrinkagePercent: shrinkagePercent.toFixed(2),
    shrinkageAmount: shrinkageAmount.toFixed(3),
    moldSize: moldSize.toFixed(3),
    material: materialData.name,
    wallThickness,
  };
}

// =====================================================
// 8. 💪 INJECTION PRESSURE CALCULATOR
// =====================================================

function calculateInjectionPressure(flowLength, wallThickness, material, gateSize) {
  if (!flowLength || !wallThickness) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const materialData = MATERIALS[material] || MATERIALS.PP;

  // Simplified pressure calculation
  const flowRatio = flowLength / wallThickness;
  let basePressure = materialData.pressure;

  // Adjust for flow ratio
  if (flowRatio > 150) {
    basePressure *= 1.3;
  } else if (flowRatio > 100) {
    basePressure *= 1.2;
  }

  // Adjust for gate size
  if (gateSize && gateSize < 0.5) {
    basePressure *= 1.15; // Small gate = higher pressure
  }

  return {
    injectionPressure: basePressure.toFixed(0),
    flowLength,
    wallThickness,
    flowRatio: flowRatio.toFixed(1),
    material: materialData.name,
  };
}

// =====================================================
// 9. 📐 RUNNER SIZING CALCULATOR
// =====================================================

function calculateRunnerSize(shotWeight, flowLength, cavities) {
  if (!shotWeight || shotWeight <= 0) {
    throw new Error('กรุณาระบุน้ำหนัก shot');
  }

  // Runner diameter based on shot weight
  let runnerDiameter = Math.sqrt((shotWeight * 4) / Math.PI);

  // Minimum runner diameter
  if (runnerDiameter < 4) runnerDiameter = 4;
  if (runnerDiameter > 12) runnerDiameter = 12;

  // Runner volume calculation
  const runnerLength = flowLength * cavities;
  const runnerVolume = (Math.PI * Math.pow(runnerDiameter / 2, 2) * runnerLength) / 1000;

  return {
    runnerDiameter: runnerDiameter.toFixed(1),
    runnerLength: runnerLength.toFixed(1),
    runnerVolume: runnerVolume.toFixed(2),
    shotWeight,
    cavities,
  };
}

// =====================================================
// 10. 🎯 PART VOLUME & WEIGHT CALCULATOR
// =====================================================

function calculatePartVolumeWeight(length, width, height, wallThickness, material) {
  if (!length || !width || !height || !wallThickness) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const materialData = MATERIALS[material] || MATERIALS.PP;

  // Simple box approximation
  const outerVolume = length * width * height;
  const innerVolume = (length - 2 * wallThickness) * (width - 2 * wallThickness) * (height - 2 * wallThickness);
  const partVolume = outerVolume - innerVolume;

  // Density of common plastics (g/cm³)
  const densities = {
    PP: 0.905,
    PE: 0.920,
    ABS: 1.050,
    PC: 1.200,
    PMMA: 1.180,
    PA: 1.140,
    POM: 1.420,
  };

  const density = densities[material] || 1.0;
  const partWeight = partVolume * density;

  return {
    partVolume: partVolume.toFixed(2),
    partWeight: partWeight.toFixed(2),
    density: density.toFixed(3),
    material: materialData.name,
    dimensions: {length, width, height, wallThickness},
  };
}

// =====================================================
// 11. ⚡ FILL TIME CALCULATOR
// =====================================================

function calculateFillTime(shotVolume, injectionSpeed) {
  if (!shotVolume || !injectionSpeed) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const fillTime = shotVolume / injectionSpeed;

  // Recommended fill time: 0.5-3 seconds
  let status = 'เหมาะสม';
  if (fillTime < 0.5) status = 'เร็วเกินไป (อาจเกิด jetting)';
  if (fillTime > 3) status = 'ช้าเกินไป (อาจเกิด short shot)';

  return {
    fillTime: fillTime.toFixed(2),
    shotVolume,
    injectionSpeed,
    status,
  };
}

// =====================================================
// 12. 🔥 BARREL CAPACITY CHECK
// =====================================================

function checkBarrelCapacity(shotSize, barrelCapacity) {
  if (!shotSize || !barrelCapacity) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const utilizationPercent = (shotSize / barrelCapacity) * 100;

  let status = '✅ เหมาะสม';
  let recommendation = 'การใช้งานอยู่ในช่วงที่เหมาะสม (30-70%)';

  if (utilizationPercent < 20) {
    status = '⚠️ ต่ำเกินไป';
    recommendation = 'Shot size เล็กเกินไป อาจทำให้พลาสติกเสื่อมสภาพในถัง';
  } else if (utilizationPercent < 30) {
    status = '📊 ค่อนข้างต่ำ';
    recommendation = 'ควรเพิ่ม cavity หรือเปลี่ยนเครื่องเล็กกว่า';
  } else if (utilizationPercent > 70 && utilizationPercent <= 80) {
    status = '📊 ค่อนข้างสูง';
    recommendation = 'ใกล้เต็มกำลัง ควรระวังการ pack';
  } else if (utilizationPercent > 80) {
    status = '❌ สูงเกินไป';
    recommendation = 'Shot size ใหญ่เกินไป ควรเปลี่ยนเครื่องใหญ่กว่า';
  }

  return {
    utilizationPercent: utilizationPercent.toFixed(1),
    status,
    recommendation,
    shotSize,
    barrelCapacity,
  };
}

// =====================================================
// 13. 💰 COST PER PART CALCULATOR
// =====================================================

function calculateCostPerPart(partWeight, materialCost, cycleTime, machineCost, laborCost) {
  if (!partWeight || !materialCost || !cycleTime) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  // Material cost
  const materialCostPart = (partWeight / 1000) * materialCost; // kg

  // Machine cost per part
  const partsPerHour = 3600 / cycleTime;
  const machineCostPart = machineCost / partsPerHour;

  // Labor cost per part
  const laborCostPart = laborCost / partsPerHour;

  // Total
  const totalCost = materialCostPart + machineCostPart + laborCostPart;

  return {
    totalCost: totalCost.toFixed(2),
    materialCost: materialCostPart.toFixed(2),
    machineCost: machineCostPart.toFixed(2),
    laborCost: laborCostPart.toFixed(2),
    partsPerHour: partsPerHour.toFixed(0),
  };
}

// =====================================================
// 14. 🎨 COLOR MIXING CALCULATOR
// =====================================================

function calculateColorMixing(masterBatchPercent, totalWeight) {
  if (!masterBatchPercent || !totalWeight) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const masterBatchWeight = (totalWeight * masterBatchPercent) / 100;
  const virginWeight = totalWeight - masterBatchWeight;

  return {
    masterBatchWeight: masterBatchWeight.toFixed(2),
    virginWeight: virginWeight.toFixed(2),
    totalWeight,
    masterBatchPercent,
  };
}

// =====================================================
// 15. 📊 MOLD FLOW RATIO CALCULATOR
// =====================================================

function calculateFlowRatio(flowLength, wallThickness) {
  if (!flowLength || !wallThickness) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const flowRatio = flowLength / wallThickness;

  let status = '✅ เหมาะสม';
  let recommendation = 'อัตราส่วนการไหลอยู่ในช่วงที่เหมาะสม';

  if (flowRatio > 150) {
    status = '❌ ยาวเกินไป';
    recommendation = 'ควรเพิ่มจำนวน gate หรือเพิ่มความหนาผนัง';
  } else if (flowRatio > 100) {
    status = '⚠️ ค่อนข้างยาว';
    recommendation = 'อาจต้องเพิ่มความดันหรืออุณหภูมิ';
  } else if (flowRatio < 30) {
    status = '📊 สั้นมาก';
    recommendation = 'ชิ้นงานเหมาะสำหรับฉีดง่าย';
  }

  return {
    flowRatio: flowRatio.toFixed(1),
    status,
    recommendation,
    flowLength,
    wallThickness,
  };
}

// =====================================================
// EXPORT ALL CALCULATORS
// =====================================================

window.CalculatorEngines = {
  MATERIALS,
  calculateClampForce,
  calculateCoolingTime,
  calculateShotSize,
  calculateTemperature,
  calculateCycleTime,
  calculateGateSize,
  calculateShrinkage,
  calculateInjectionPressure,
  calculateRunnerSize,
  calculatePartVolumeWeight,
  calculateFillTime,
  checkBarrelCapacity,
  calculateCostPerPart,
  calculateColorMixing,
  calculateFlowRatio,
};
