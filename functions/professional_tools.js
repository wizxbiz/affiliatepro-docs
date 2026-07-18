/**
 * =====================================================
 * 🛠️ PROFESSIONAL TOOLS MODULE (เครื่องมือทำมาหากิน)
 * =====================================================
 *
 * เปลี่ยนจาก "ถาม-ตอบ" เป็น "เครื่องมือใช้งานจริง"
 * สำหรับช่างฉีดพลาสติกมืออาชีพ
 *
 * พัฒนาโดย: อาจารย์วิทยา
 * Version: 1.0.0
 *
 * เครื่องมือหลัก:
 * 1. 🔢 เครื่องคำนวณ (Calculator Tools)
 * 2. 📋 ใบงาน/เอกสาร (Document Generator)
 * 3. 🔍 วินิจฉัยปัญหา (Diagnostic Tools)
 * 4. 📊 วิเคราะห์ข้อมูล (Analytics Tools)
 * 5. 📚 คู่มือด่วน (Quick Reference)
 */

// =====================================================
// 🔢 CALCULATOR TOOLS (เครื่องคำนวณ)
// =====================================================

const CalculatorTools = {
  /**
   * 📱 เครื่องคิดเลข Web Calculator (wizmobiz.com)
   */
  liffCalculator: {
    name: "เครื่องคิดเลขออนไลน์",
    command: "/calc",
    aliases: ["calc", "app", "calculator", "เครื่องคิดเลข", "คำนวณ", "เปิดเครื่องคิดเลข", "/calculator"],
    calculate: (params) => {
      const calculatorUrl = "https://wizmobiz.com/calculator.html";

      return {
        success: true,
        result: { url: calculatorUrl },
        formatted: `📱 **เครื่องคิดเลขงานฉีดพลาสติก**

🔗 กดลิงก์เพื่อเปิด:
👉 ${calculatorUrl}

✨ **เครื่องมือทั้งหมด:**
🔧 แรงปิดแม่พิมพ์ (Clamping Force)
⏱️ เวลา Cooling Time
💉 ขนาด Shot Size
🌡️ อุณหภูมิแม่พิมพ์ (Mold Temp)
⚡ จุดสลับ V-P Switchover
🏭 เลือกขนาดเครื่อง

🎁 ฟรี 5 ครั้ง! Add LINE เพื่อใช้ไม่จำกัด`,
        flexMessage: createCalculatorMenuFlex(),
      };
    },
  },

  /**
   * 🔧 คำนวณแรงปิดแม่พิมพ์ (Clamping Force)
   * สูตร: F = P × A × Safety Factor
   * รองรับทั้ง projectedArea โดยตรง หรือ width × length
   */
  clampingForce: {
    name: "คำนวณแรงปิดแม่พิมพ์",
    command: "/clamp",
    aliases: ["แรงปิด", "แรงบีบ", "clamping", "tonnage", "แรงปิดล็อค", "คำนวณแรงปิด", "คำนวณแรงปิดล็อค"],
    calculate: (params) => {
      let { projectedArea, width, length, cavityPressure, safetyFactor = 1.1, material } = params;

      // 🆕 Calculate projectedArea from width × length if not provided directly
      if (!projectedArea && width && length) {
        projectedArea = width * length;
        console.log(`📐 Calculated area from dimensions: ${width} × ${length} = ${projectedArea} cm²`);
      }

      // Validate inputs
      if (!projectedArea || projectedArea <= 0) {
        return { error: "กรุณาระบุพื้นที่ฉายภาพ (cm²) หรือขนาด กว้าง×ยาว\n\nตัวอย่าง:\n• /clamp พื้นที่ 1350 cm²\n• คำนวณแรงปิด กว้าง 30cm ยาว 45cm" };
      }

      // 🆕 Set default cavity pressure based on material if not provided
      if (!cavityPressure) {
        const materialPressures = {
          "PP": 30, "PE": 25, "ABS": 40, "PC": 50,
          "PA": 45, "PA6": 45, "PA66": 50, "POM": 45,
          "PS": 35, "PMMA": 45, "PVC": 35, "TPU": 35,
          "PBT": 50, "PET": 45, "PEEK": 70, "PPS": 60,
        };
        const upperMat = (material || "PP").toUpperCase();
        cavityPressure = materialPressures[upperMat] || 30; // Default 30 MPa for general plastic
      }

      // Convert if needed (assume MPa input, convert to kg/cm²)
      const pressureKgCm2 = cavityPressure * 10.197; // 1 MPa = 10.197 kg/cm²

      // Calculate
      const forceKg = projectedArea * pressureKgCm2;
      const forceTon = forceKg / 1000;
      const forceWithSafety = forceTon * safetyFactor;

      // 🆕 Recommend machine size (standard sizes)
      const machineSizes = [50, 80, 100, 120, 150, 180, 200, 250, 300, 350, 400, 450, 500, 550, 650, 850, 1000, 1300, 1600, 2000, 2500, 3000];
      const recommendedMachine = machineSizes.find((size) => size >= forceWithSafety) || "มากกว่า 3000";

      // 🆕 Show dimensions in output if calculated from width × length
      const dimensionInfo = (width && length) ?
        `• ขนาดชิ้นงาน: ${width} × ${length} cm\n` :
        "";

      return {
        success: true,
        result: {
          projectedArea: projectedArea,
          rawForce: forceTon.toFixed(1),
          withSafety: forceWithSafety.toFixed(1),
          recommendedMachine: recommendedMachine,
          unit: "ton",
          safetyFactor,
        },
        formatted: `📊 ผลการคำนวณแรงปิดแม่พิมพ์

📐 ข้อมูลที่ใช้:
${dimensionInfo}• พื้นที่ฉาย: ${projectedArea.toLocaleString()} cm²
• ความดันในโพรง: ${cavityPressure} MPa (${pressureKgCm2.toFixed(1)} kg/cm²)
• Safety Factor: ${safetyFactor}

🎯 ผลลัพธ์:
• แรงปิดขั้นต่ำ: ${forceTon.toFixed(1)} ton
• แนะนำใช้เครื่อง: ${forceWithSafety.toFixed(0)} ton ขึ้นไป
• ขนาดเครื่องมาตรฐาน: ${recommendedMachine} ton ✅

💡 หมายเหตุ:
• ควรเลือกเครื่องที่ใช้แรงปิด 70-80% ของ Max Tonnage
• ถ้าใช้วัสดุแข็ง (PC, PA) ให้เพิ่มความดันอีก 10-20%`,
      };
    },
  },

  /**
   * 🌡️ คำนวณอุณหภูมิแม่พิมพ์ที่เหมาะสม
   */
  moldTemperature: {
    name: "คำนวณอุณหภูมิแม่พิมพ์",
    command: "/moldtemp",
    aliases: ["อุณหภูมิแม่พิมพ์", "mold temp", "moldtemp"],
    calculate: (params) => {
      const { material, wallThickness, surfaceFinish = "standard" } = params;

      // Material database
      const materialDb = {
        "PP": { min: 20, max: 50, recommended: 35, melt: "200-280" },
        "PE": { min: 10, max: 50, recommended: 30, melt: "180-280" },
        "ABS": { min: 40, max: 80, recommended: 60, melt: "200-260" },
        "PC": { min: 80, max: 120, recommended: 100, melt: "280-320" },
        "PA": { min: 60, max: 100, recommended: 80, melt: "250-300" },
        "PA6": { min: 60, max: 90, recommended: 75, melt: "250-280" },
        "PA66": { min: 70, max: 100, recommended: 85, melt: "270-300" },
        "POM": { min: 60, max: 120, recommended: 90, melt: "180-210" },
        "PET": { min: 15, max: 50, recommended: 30, melt: "260-280" },
        "PS": { min: 20, max: 50, recommended: 35, melt: "180-260" },
        "PMMA": { min: 50, max: 80, recommended: 65, melt: "220-260" },
        "PVC": { min: 20, max: 60, recommended: 40, melt: "160-200" },
        "TPU": { min: 20, max: 50, recommended: 35, melt: "180-220" },
        "PBT": { min: 60, max: 100, recommended: 80, melt: "240-270" },
        "PPO": { min: 80, max: 110, recommended: 95, melt: "280-320" },
        "PPS": { min: 120, max: 150, recommended: 135, melt: "300-340" },
        "PEEK": { min: 160, max: 200, recommended: 180, melt: "360-400" },
        "LCP": { min: 80, max: 130, recommended: 100, melt: "280-350" },
      };

      const upperMat = (material || "").toUpperCase();
      const matData = materialDb[upperMat];

      if (!matData) {
        const availableMaterials = Object.keys(materialDb).join(", ");
        return {
          error: `ไม่พบข้อมูลวัสดุ "${material}"\nวัสดุที่รองรับ: ${availableMaterials}`,
        };
      }

      // Adjust for surface finish
      let adjustedMin = matData.min;
      let adjustedMax = matData.max;
      let adjustedRec = matData.recommended;

      if (surfaceFinish === "high-gloss" || surfaceFinish === "glossy") {
        adjustedMin += 10;
        adjustedMax += 10;
        adjustedRec += 10;
      } else if (surfaceFinish === "texture" || surfaceFinish === "matte") {
        adjustedMin -= 5;
        adjustedMax -= 5;
        adjustedRec -= 5;
      }

      // Adjust for wall thickness
      if (wallThickness && wallThickness > 3) {
        adjustedMin -= 5;
        adjustedRec -= 5;
      } else if (wallThickness && wallThickness < 1) {
        adjustedMin += 5;
        adjustedRec += 5;
      }

      return {
        success: true,
        result: {
          material: upperMat,
          minTemp: adjustedMin,
          maxTemp: adjustedMax,
          recommended: adjustedRec,
          meltTemp: matData.melt,
        },
        formatted: `🌡️ อุณหภูมิแม่พิมพ์สำหรับ ${upperMat}

📐 ข้อมูลที่ใช้:
• วัสดุ: ${upperMat}
• ความหนาผนัง: ${wallThickness || "ไม่ระบุ"} mm
• ผิวสำเร็จ: ${surfaceFinish}

🎯 อุณหภูมิแม่พิมพ์แนะนำ:
• ต่ำสุด: ${adjustedMin}°C
• สูงสุด: ${adjustedMax}°C
• แนะนำ: ${adjustedRec}°C ✅

🔥 อุณหภูมิหลอม (Barrel): ${matData.melt}°C

💡 เคล็ดลับ:
• ผิวมันวาว → เพิ่มอุณหภูมิแม่พิมพ์
• ลดรอบเวลา → ลดอุณหภูมิ (แต่ระวัง warpage)`,
      };
    },
  },

  /**
   * ⏱️ คำนวณเวลา Cooling Time
   */
  coolingTime: {
    name: "คำนวณเวลาหล่อเย็น",
    command: "/cooling",
    aliases: ["cooling time", "เวลาหล่อเย็น", "cooling", "คำนวณ cooling", "คำนวณcooling", "คูลลิ่ง", "คูลลิ่งไทม์"],
    calculate: (params) => {
      const { wallThickness, meltTemp, moldTemp, ejectTemp, material = "PP" } = params;

      if (!wallThickness || wallThickness <= 0) {
        return { error: "กรุณาระบุความหนาผนังชิ้นงาน (mm)" };
      }

      // Thermal diffusivity (mm²/s) - approximate values
      const thermalDiffusivity = {
        "PP": 0.096, "PE": 0.11, "ABS": 0.08, "PC": 0.073,
        "PA": 0.09, "POM": 0.085, "PS": 0.075, "PMMA": 0.073,
      };

      const alpha = thermalDiffusivity[(material || "PP").toUpperCase()] || 0.085;

      // Default temperatures if not provided
      const Tm = meltTemp || 230;
      const Tw = moldTemp || 50;
      const Te = ejectTemp || 80;

      // Cooling time formula: t = (s²/π²α) × ln(8(Tm-Tw)/π²(Te-Tw))
      const s = wallThickness;
      const lnTerm = Math.log((8 * (Tm - Tw)) / (Math.PI * Math.PI * (Te - Tw)));
      const coolingTimeSec = (s * s / (Math.PI * Math.PI * alpha)) * lnTerm;

      // Practical adjustments
      const practicalTime = Math.max(coolingTimeSec * 1.2, 3); // min 3 sec

      return {
        success: true,
        result: {
          theoreticalTime: coolingTimeSec.toFixed(1),
          practicalTime: practicalTime.toFixed(1),
          unit: "sec",
        },
        formatted: `⏱️ คำนวณเวลา Cooling Time

📐 ข้อมูลที่ใช้:
• ความหนาผนัง: ${wallThickness} mm
• วัสดุ: ${(material || "PP").toUpperCase()}
• อุณหภูมิหลอม: ${Tm}°C
• อุณหภูมิแม่พิมพ์: ${Tw}°C
• อุณหภูมิปลด: ${Te}°C

🎯 ผลลัพธ์:
• ทางทฤษฎี: ${coolingTimeSec.toFixed(1)} วินาที
• แนะนำใช้: ${practicalTime.toFixed(0)} วินาที ✅

💡 เคล็ดลับ:
• ผนังหนา → เพิ่มเวลา cooling
• อุณหภูมิแม่พิมพ์ต่ำ → ลดเวลาได้
• ระวัง warpage ถ้า cooling ไม่พอ`,
      };
    },
  },

  /**
   * 💉 คำนวณ Shot Size / Dosage
   */
  shotSize: {
    name: "คำนวณปริมาณฉีด",
    command: "/shot",
    aliases: ["shot size", "dosage", "ปริมาณฉีด"],
    calculate: (params) => {
      const { partWeight, cavities = 1, runnerWeight = 0, cushion = 5 } = params;

      if (!partWeight || partWeight <= 0) {
        return { error: "กรุณาระบุน้ำหนักชิ้นงาน (กรัม)" };
      }

      const totalPartWeight = partWeight * cavities;
      const totalShotWeight = totalPartWeight + runnerWeight;
      const shotWithCushion = totalShotWeight * (1 + cushion / 100);

      // Estimate screw position (assuming PP density ~0.9)
      const estimatedVolume = shotWithCushion / 0.9; // cm³

      return {
        success: true,
        result: {
          partWeight: partWeight,
          totalWeight: totalShotWeight.toFixed(1),
          withCushion: shotWithCushion.toFixed(1),
          estimatedVolume: estimatedVolume.toFixed(1),
        },
        formatted: `💉 คำนวณปริมาณฉีด (Shot Size)

📐 ข้อมูลที่ใช้:
• น้ำหนักชิ้นงาน: ${partWeight} g
• จำนวน Cavity: ${cavities}
• น้ำหนัก Runner: ${runnerWeight} g
• Cushion: ${cushion}%

🎯 ผลลัพธ์:
• น้ำหนักชิ้นงานรวม: ${totalPartWeight.toFixed(1)} g
• Shot Weight รวม Runner: ${totalShotWeight.toFixed(1)} g
• ปริมาณฉีดรวม Cushion: ${shotWithCushion.toFixed(1)} g ✅
• ปริมาตรโดยประมาณ: ${estimatedVolume.toFixed(1)} cm³

💡 การตั้งค่าเครื่อง:
• Dosage/Metering: ${shotWithCushion.toFixed(0)} g
• หรือระยะสกรู: คำนวณจากขนาดสกรู`,
      };
    },
  },

  /**
   * 📏 คำนวณขนาดเครื่องที่เหมาะสม
   */
  machineSelection: {
    name: "เลือกขนาดเครื่องฉีด",
    command: "/machine",
    aliases: ["เลือกเครื่อง", "ขนาดเครื่อง", "machine size"],
    calculate: (params) => {
      const {
        projectedArea,
        cavityPressure = 50,
        shotWeight,
        moldWidth,
        moldHeight,
        force, // Allow direct force input
      } = params;

      let clampingForce = 0;

      if (force) {
        clampingForce = force;
      } else if (projectedArea) {
        // Calculate clamping force
        const pressureKgCm2 = cavityPressure * 10.197;
        clampingForce = (projectedArea * pressureKgCm2 / 1000) * 1.15; // with 15% safety
      } else {
        return { error: "กรุณาระบุพื้นที่ฉายภาพ (cm²) หรือแรงปิดแม่พิมพ์ (ton)" };
      }

      // Standard machine sizes
      const machineSizes = [50, 80, 100, 120, 150, 180, 200, 250, 300, 350, 400, 450, 500, 550, 650, 850, 1000, 1300, 1600, 2000];
      const recommendedSize = machineSizes.find((size) => size >= clampingForce) || "มากกว่า 2000";

      // Calculate shot capacity requirement
      let shotCapacity = null;
      if (shotWeight) {
        shotCapacity = shotWeight * 1.3; // 30% margin
      }

      return {
        success: true,
        result: {
          clampingForce: clampingForce.toFixed(0),
          recommendedMachine: recommendedSize,
          shotCapacity,
        },
        formatted: `🏭 เลือกขนาดเครื่องฉีดพลาสติก

📐 ข้อมูลที่ใช้:
${projectedArea ? `• พื้นที่ฉายภาพ: ${projectedArea} cm²` : ""}
${force ? `• แรงปิดที่ระบุ: ${force} ton` : ""}
${!force ? `• ความดันในโพรง: ${cavityPressure} MPa` : ""}
${shotWeight ? `• น้ำหนัก Shot: ${shotWeight} g` : ""}
${moldWidth && moldHeight ? `• ขนาดแม่พิมพ์: ${moldWidth}×${moldHeight} mm` : ""}

🎯 ผลการวิเคราะห์:
• แรงปิดที่ต้องการ: ${clampingForce.toFixed(0)} ton
• ขนาดเครื่องแนะนำ: ${recommendedSize} ton ✅
${shotCapacity ? `• Shot Capacity ขั้นต่ำ: ${shotCapacity.toFixed(0)} g` : ""}

💡 หมายเหตุ:
• ควรเลือกเครื่องที่ใช้แรงปิด 70-80% ของ Max
• ตรวจสอบระยะเปิดแม่พิมพ์ด้วย`,
      };
    },
  },

  /**
   * ⚡ คำนวณ V-P Switchover
   */
  vpSwitchover: {
    name: "คำนวณ V-P Switchover",
    command: "/vp",
    aliases: ["vp switchover", "switchover", "vp"],
    calculate: (params) => {
      const { shotSize, fillPercent = 95 } = params;

      if (!shotSize) {
        return { error: "กรุณาระบุระยะ Shot Size (mm หรือ position)" };
      }

      const vpPosition = shotSize * (1 - fillPercent / 100);
      const cushion = shotSize * 0.05; // 5% cushion

      return {
        success: true,
        result: {
          vpPosition: vpPosition.toFixed(1),
          cushion: cushion.toFixed(1),
          fillPercent,
        },
        formatted: `⚡ คำนวณ V-P Switchover

📐 ข้อมูลที่ใช้:
• Shot Size: ${shotSize} mm
• Fill%: ${fillPercent}%

🎯 ผลลัพธ์:
• V-P Position: ${vpPosition.toFixed(1)} mm ✅
• Cushion แนะนำ: ${cushion.toFixed(1)} mm

💡 วิธีปรับแต่ง:
1. เริ่มที่ 95% fill
2. ถ้าชิ้นงานไม่เต็ม → เพิ่ม fill%
3. ถ้ามี flash → ลด fill%
4. Cushion ควร 3-10 mm`,
      };
    },
  },
};

// =====================================================
// 🔍 DIAGNOSTIC TOOLS (เครื่องมือวินิจฉัย)
// =====================================================

const DiagnosticTools = {
  /**
   * 🔍 วินิจฉัยปัญหาจาก Defect
   */
  defectDiagnosis: {
    name: "วินิจฉัยปัญหาชิ้นงาน",
    command: "/defect",
    // 🔧 aliases ต้องเฉพาะเจาะจง - ใช้ startsWith check ใน parseToolCommand
    aliases: ["วินิจฉัย short", "วินิจฉัย flash", "วินิจฉัย sink", "วินิจฉัย warp", "วินิจฉัย burn", "วินิจฉัย weld", "วินิจฉัย silver", "วินิจฉัย jetting", "วินิจฉัย void", "diagnose defect", "defect diagnosis"],
    // 🔧 startsWith patterns สำหรับตรวจสอบเพิ่มเติม
    startsWithPatterns: ["วินิจฉัย", "/defect"],
    diagnose: (defectType) => {
      const defectDatabase = {
        "short_shot": {
          name: "Short Shot (ชิ้นงานไม่เต็ม)",
          emoji: "⚠️",
          causes: [
            "ความดันฉีดไม่เพียงพอ",
            "อุณหภูมิหลอมต่ำเกินไป",
            "ความเร็วฉีดช้าเกินไป",
            "ขนาด Gate เล็กเกินไป",
            "ระบายอากาศไม่ดี (Venting)",
          ],
          solutions: [
            "เพิ่มความดันฉีด +5-10 MPa",
            "เพิ่มอุณหภูมิหลอม +10-20°C",
            "เพิ่มความเร็วฉีด",
            "ตรวจสอบ/ขยาย Gate",
            "เพิ่มร่องระบายอากาศ",
          ],
          checkFirst: "ตรวจสอบว่าวัสดุเพียงพอใน Hopper หรือไม่",
        },
        "flash": {
          name: "Flash (เกินขอบ/ครีบ)",
          emoji: "🔴",
          causes: [
            "แรงปิดแม่พิมพ์ไม่พอ",
            "ความดันฉีดสูงเกินไป",
            "อุณหภูมิหลอมสูงเกินไป",
            "แม่พิมพ์สึกหรอ/ไม่สนิท",
            "V-P Switchover ช้าเกินไป",
          ],
          solutions: [
            "เพิ่มแรงปิดแม่พิมพ์",
            "ลดความดันฉีด/Holding",
            "ลดอุณหภูมิหลอม",
            "ตรวจสอบ/ซ่อมแม่พิมพ์",
            "ปรับ V-P Switchover ให้เร็วขึ้น",
          ],
          checkFirst: "ตรวจสอบว่าแม่พิมพ์ปิดสนิทหรือไม่",
        },
        "sink_mark": {
          name: "Sink Mark (รอยยุบ)",
          emoji: "🔵",
          causes: [
            "Holding Pressure ไม่พอ",
            "Holding Time สั้นเกินไป",
            "Gate แข็งตัวเร็วเกินไป",
            "ผนังหนาไม่สม่ำเสมอ",
            "Cooling Time ไม่พอ",
          ],
          solutions: [
            "เพิ่ม Holding Pressure",
            "เพิ่ม Holding Time",
            "ขยายขนาด Gate",
            "เพิ่มอุณหภูมิแม่พิมพ์",
            "เพิ่ม Cooling Time",
          ],
          checkFirst: "ตรวจสอบว่า Cushion คงที่หรือไม่",
        },
        "warpage": {
          name: "Warpage (บิด/งอ)",
          emoji: "🟡",
          causes: [
            "การหล่อเย็นไม่สม่ำเสมอ",
            "ความดัน Holding ไม่เหมาะสม",
            "อุณหภูมิแม่พิมพ์ต่างกัน 2 ฝั่ง",
            "ออกแบบชิ้นงานไม่สมมาตร",
            "ปลดชิ้นงานเร็วเกินไป",
          ],
          solutions: [
            "ปรับระบบ Cooling ให้สม่ำเสมอ",
            "ปรับ Holding Pressure",
            "ปรับอุณหภูมิแม่พิมพ์ 2 ฝั่งให้เท่ากัน",
            "เพิ่ม Cooling Time",
            "ใช้ Jig จับชิ้นงานหลังปลด",
          ],
          checkFirst: "วัดอุณหภูมิแม่พิมพ์ Core และ Cavity",
        },
        "burn_mark": {
          name: "Burn Mark (รอยไหม้)",
          emoji: "⚫",
          causes: [
            "ระบายอากาศไม่ดี (Venting)",
            "ความเร็วฉีดเร็วเกินไป",
            "อุณหภูมิหลอมสูงเกินไป",
            "วัสดุค้างนานเกินไป (Residence Time)",
            "สกรูหมุนเร็วเกินไป",
          ],
          solutions: [
            "เพิ่ม/ทำความสะอาดร่องระบายอากาศ",
            "ลดความเร็วฉีดช่วงสุดท้าย",
            "ลดอุณหภูมิหลอม",
            "ลดรอบเวลา หรือลด Shot Size",
            "ลดรอบสกรู",
          ],
          checkFirst: "ตรวจสอบร่องระบายอากาศ (Venting)",
        },
        "weld_line": {
          name: "Weld Line (รอยเชื่อม)",
          emoji: "〰️",
          causes: [
            "อุณหภูมิหลอมต่ำเกินไป",
            "ความเร็วฉีดช้าเกินไป",
            "อุณหภูมิแม่พิมพ์ต่ำเกินไป",
            "ระบายอากาศไม่ดี",
            "ตำแหน่ง Gate ไม่เหมาะสม",
          ],
          solutions: [
            "เพิ่มอุณหภูมิหลอม +10-20°C",
            "เพิ่มความเร็วฉีด",
            "เพิ่มอุณหภูมิแม่พิมพ์",
            "เพิ่มร่องระบายอากาศ",
            "พิจารณาเปลี่ยนตำแหน่ง Gate",
          ],
          checkFirst: "ตำแหน่ง Weld Line อยู่ตรงไหน?",
        },
        "silver_streak": {
          name: "Silver Streak (เส้นเงิน)",
          emoji: "✨",
          causes: [
            "ความชื้นในวัสดุ",
            "อุณหภูมิหลอมสูงเกินไป",
            "Back Pressure ต่ำเกินไป",
            "วัสดุเสื่อมสภาพ",
            "Suck-back มากเกินไป",
          ],
          solutions: [
            "อบวัสดุให้แห้ง (2-4 ชม.)",
            "ลดอุณหภูมิหลอม",
            "เพิ่ม Back Pressure",
            "ตรวจสอบคุณภาพวัสดุ",
            "ลด Suck-back",
          ],
          checkFirst: "วัสดุผ่านการอบแห้งหรือไม่?",
        },
        "jetting": {
          name: "Jetting (รอยพุ่ง)",
          emoji: "💨",
          causes: [
            "ความเร็วฉีดเร็วเกินไป",
            "Gate เล็กเกินไป",
            "อุณหภูมิหลอมต่ำเกินไป",
            "ตำแหน่ง Gate ไม่เหมาะสม",
          ],
          solutions: [
            "ลดความเร็วฉีดช่วงแรก",
            "ขยาย Gate หรือเปลี่ยนชนิด",
            "เพิ่มอุณหภูมิหลอม",
            "เปลี่ยนทิศทางการไหล",
          ],
          checkFirst: "สังเกตรูปแบบการไหลของพลาสติก",
        },
        "void": {
          name: "Void (โพรงอากาศ)",
          emoji: "⭕",
          causes: [
            "Holding Pressure ไม่พอ",
            "ผนังหนาเกินไป",
            "อุณหภูมิหลอมสูงเกินไป",
            "Gate ปิดเร็วเกินไป",
            "Cooling ไม่เหมาะสม",
          ],
          solutions: [
            "เพิ่ม Holding Pressure และ Time",
            "ลดความหนาผนัง หรือทำ Core",
            "ลดอุณหภูมิหลอม",
            "ขยาย Gate",
            "ปรับ Cooling ให้จากในออกนอก",
          ],
          checkFirst: "ตำแหน่ง Void อยู่ตรงไหน?",
        },
      };

      // Normalize defect type
      // 🔧 ตัดคำถามออกก่อน แต่เก็บชื่อ defect ไว้
      const normalizedType = defectType.toLowerCase()
        .replace(/^(แก้ไขปัญหา|แก้ปัญหา|ปัญหา|วิธีแก้|แก้ไข|แก้ยังไง|แก้อย่างไร|ทำยังไง|ทำอย่างไร)\s*/g, "") // ตัดคำนำหน้าออก
        .replace(/\s*(แก้ยังไง|แก้อย่างไร|ทำยังไง|ทำอย่างไร|วิธีแก้)\s*$/g, "") // ตัดคำถามท้ายออก
        .replace(/\?/g, "") // ตัดเครื่องหมาย ? ออก
        .trim() // ตัดช่องว่างหน้า-หลัง
        .replace(/\s+/g, "_") // แทนที่ช่องว่างด้วย _
        .replace(/รอย/g, "")
        .replace(/ไม่เต็ม|งานไม่เต็ม/g, "short_shot")
        .replace(/เกินขอบ|ครีบ/g, "flash")
        .replace(/ยุบ/g, "sink_mark")
        .replace(/บิด|งอ|โก่ง/g, "warpage")
        .replace(/ไหม้/g, "burn_mark")
        .replace(/เชื่อม/g, "weld_line")
        .replace(/เงิน/g, "silver_streak")
        .replace(/พุ่ง/g, "jetting")
        .replace(/โพรง/g, "void");

      const defect = defectDatabase[normalizedType];

      if (!defect) {
        const availableDefects = Object.values(defectDatabase)
          .map((d) => d.name)
          .join("\n• ");
        return {
          error: `ไม่พบข้อมูลปัญหา "${defectType}"\n\n📋 ปัญหาที่รองรับ:\n• ${availableDefects}`,
        };
      }

      return {
        success: true,
        result: defect,
        formatted: `${defect.emoji} ${defect.name}

⚡ ตรวจสอบก่อน:
${defect.checkFirst}

🔍 สาเหตุที่เป็นไปได้:
${defect.causes.map((c, i) => `${i + 1}. ${c}`).join("\n")}

✅ วิธีแก้ไข:
${defect.solutions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

💡 แนะนำ: ลองปรับทีละอย่าง และบันทึกผลลัพธ์`,
      };
    },
  },

  /**
   * 🌡️ ตรวจสอบค่าพารามิเตอร์
   */
  parameterCheck: {
    name: "ตรวจสอบพารามิเตอร์",
    command: "/check",
    aliases: ["ตรวจค่า", "check param", "validate"],
    check: (params) => {
      const { material, meltTemp, moldTemp, pressure, speed } = params;

      const warnings = [];
      const recommendations = [];

      // Material-specific ranges
      const ranges = {
        "PP": { melt: [200, 280], mold: [20, 50], pressure: [30, 80] },
        "ABS": { melt: [200, 260], mold: [40, 80], pressure: [40, 100] },
        "PC": { melt: [280, 320], mold: [80, 120], pressure: [60, 120] },
        "PA": { melt: [250, 300], mold: [60, 100], pressure: [50, 100] },
      };

      const upperMat = (material || "PP").toUpperCase();
      const range = ranges[upperMat] || ranges["PP"];

      // Check melt temperature
      if (meltTemp) {
        if (meltTemp < range.melt[0]) {
          warnings.push(`⚠️ อุณหภูมิหลอมต่ำเกินไป (${meltTemp}°C < ${range.melt[0]}°C)`);
          recommendations.push("→ อาจเกิด Short Shot, Weld Line");
        } else if (meltTemp > range.melt[1]) {
          warnings.push(`⚠️ อุณหภูมิหลอมสูงเกินไป (${meltTemp}°C > ${range.melt[1]}°C)`);
          recommendations.push("→ อาจเกิด Burn Mark, Silver Streak");
        }
      }

      // Check mold temperature
      if (moldTemp) {
        if (moldTemp < range.mold[0]) {
          warnings.push(`⚠️ อุณหภูมิแม่พิมพ์ต่ำเกินไป (${moldTemp}°C < ${range.mold[0]}°C)`);
          recommendations.push("→ อาจเกิด Weld Line, ผิวไม่สวย");
        } else if (moldTemp > range.mold[1]) {
          warnings.push(`⚠️ อุณหภูมิแม่พิมพ์สูงเกินไป (${moldTemp}°C > ${range.mold[1]}°C)`);
          recommendations.push("→ รอบเวลานาน, อาจเกิด Warpage");
        }
      }

      const status = warnings.length === 0 ? "✅ ค่าอยู่ในช่วงปกติ" : "⚠️ พบค่าผิดปกติ";

      return {
        success: true,
        formatted: `🔍 ตรวจสอบพารามิเตอร์ ${upperMat}

📊 ค่าที่ตรวจสอบ:
• อุณหภูมิหลอม: ${meltTemp || "-"}°C (ช่วง: ${range.melt[0]}-${range.melt[1]}°C)
• อุณหภูมิแม่พิมพ์: ${moldTemp || "-"}°C (ช่วง: ${range.mold[0]}-${range.mold[1]}°C)
• ความดัน: ${pressure || "-"} MPa (ช่วง: ${range.pressure[0]}-${range.pressure[1]} MPa)

${status}

${warnings.length > 0 ? warnings.join("\n") + "\n\n" + recommendations.join("\n") : "💚 ทุกค่าอยู่ในเกณฑ์ที่เหมาะสม"}`,
      };
    },
  },
};

// =====================================================
// 📋 DOCUMENT GENERATOR (ใบงาน/เอกสาร)
// =====================================================

const DocumentGenerator = {
  /**
   * 📋 สร้างใบตั้งค่าเครื่อง (Setup Sheet)
   */
  setupSheet: {
    name: "สร้างใบตั้งค่าเครื่อง",
    command: "/setup",
    aliases: ["ใบตั้งค่า", "setup sheet", "setting sheet"],
    generate: (params) => {
      const {
        moldName = "N/A",
        material = "PP",
        machine = "N/A",
        cavities = 1,
        cycleTime = 30,
        meltTemp = 230,
        moldTemp = 40,
        injectionPressure = 60,
        holdingPressure = 40,
        injectionSpeed = 50,
        coolingTime = 15,
        createdBy = "System",
      } = params;

      const date = new Date().toLocaleDateString("th-TH");
      const time = new Date().toLocaleTimeString("th-TH");

      return {
        success: true,
        formatted: `📋 ใบตั้งค่าเครื่องฉีดพลาสติก
════════════════════════════
📅 วันที่: ${date} เวลา: ${time}
👤 ผู้บันทึก: ${createdBy}

🏭 ข้อมูลทั่วไป:
• แม่พิมพ์: ${moldName}
• วัสดุ: ${material}
• เครื่องฉีด: ${machine}
• จำนวน Cavity: ${cavities}
• Cycle Time เป้า: ${cycleTime} sec

🌡️ อุณหภูมิ (°C):
• Barrel: ${meltTemp}°C
• แม่พิมพ์: ${moldTemp}°C

💉 การฉีด:
• ความดันฉีด: ${injectionPressure} MPa
• ความเร็วฉีด: ${injectionSpeed}%
• Holding: ${holdingPressure} MPa

⏱️ เวลา:
• Cooling Time: ${coolingTime} sec
• Cycle Time: ${cycleTime} sec

════════════════════════════
✍️ ลงชื่อ: ____________`,
      };
    },
  },

  /**
   * 📊 Digital Logbook (Standard)
   * บันทึกการผลิตแบบดิจิทัล (มาตรฐาน)
   */
  productionReport: {
    name: "Digital Logbook (Standard)",
    command: "/report",
    aliases: ["รายงาน", "report", "production report", "logbook", "บันทึกการผลิต", "digital logbook"],
    generate: (params) => {
      const {
        shift = "เช้า",
        moldName = "N/A",
        totalShots = 0,
        goodParts = 0,
        rejectParts = 0,
        rejectReason = "-",
        downtime = 0,
        downtimeReason = "-",
        operator = "N/A",
        orgCode, // Optional Org Code
      } = params;

      const date = new Date().toLocaleDateString("th-TH");
      const time = new Date().toLocaleTimeString("th-TH");
      const rejectRate = totalShots > 0 ? ((rejectParts / totalShots) * 100).toFixed(2) : 0;
      const efficiency = totalShots > 0 ? ((goodParts / totalShots) * 100).toFixed(1) : 0;

      // Generate a pseudo-hash for verification
      const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const reportData = {
        date,
        time,
        shift,
        operator,
        moldName,
        totalShots,
        goodParts,
        rejectParts,
        rejectRate,
        efficiency,
        rejectReason,
        downtime,
        downtimeReason,
        verificationCode,
        orgCode: orgCode || null, // Include Org Code in data
        timestamp: Date.now(),
      };

      return {
        success: true,
        data: reportData,
        formatted: `📱 Digital Logbook (Standard)
════════════════════════════
✅ บันทึกเข้าระบบถูกต้องและตรวจสอบได้
📅 วันที่: ${date} เวลา: ${time}
🆔 Ref: ${verificationCode}
${orgCode ? `🏢 Org Code: ${orgCode}` : ""}

👤 พนักงาน: ${operator}
🕐 กะ: ${shift}
🏭 แม่พิมพ์: ${moldName}

📈 ผลการผลิต (Production Result):
• Shot ทั้งหมด: ${totalShots} ครั้ง
• ชิ้นงานดี: ${goodParts} ชิ้น
• ของเสีย: ${rejectParts} ชิ้น (${rejectRate}%)
• ประสิทธิภาพ: ${efficiency}% ${efficiency >= 95 ? "⭐" : efficiency >= 90 ? "✅" : "⚠️"}

${rejectParts > 0 ? `❌ สาเหตุของเสีย:\n${rejectReason}` : ""}

${downtime > 0 ? `⏰ Downtime: ${downtime} นาที\nสาเหตุ: ${downtimeReason}` : ""}

════════════════════════════
🔒 Upgrade to Premium for:
• Real-time Dashboard 📊
• Auto-Excel Export 📑
• Deep Analytics 🧠
👉 Contact Admin to Unlock`,
      };
    },
  },

  /**
   * 💎 Digital Logbook (Premium)
   */
  premiumLogbook: {
    name: "Digital Logbook (Premium)",
    command: "/pro-report",
    aliases: ["pro-report", "premium logbook", "dashboard"],
    generate: (params) => {
      return {
        success: false,
        formatted: `💎 Premium Feature Locked

ฟีเจอร์ "Digital Logbook Pro" สำหรับมืออาชีพ
ที่ต้องการยกระดับการจัดการโรงงาน:

1. 📊 Real-time Dashboard: ดูผลผลิตสดๆ ผ่านมือถือ
2. 📑 Auto-Excel: ส่งรายงานเข้า Email อัตโนมัติทุกจบกะ
3. 🧠 AI Analysis: วิเคราะห์แนวโน้มปัญหาและทำนายล่วงหน้า
4. ☁️ Cloud Storage: เก็บข้อมูลย้อนหลังไม่จำกัด

💬 ติดต่อ Admin เพื่อเปิดใช้งานฟีเจอร์นี้
(ค่าบริการรายเดือนคุ้มค่ากว่าจ้างเสมียน)`,
      };
    },
  },

  /**
   * 📊 เรียกดูสรุปรายงาน (Supervisor View) - Digital Logbook
   * ⚠️ ยกเว้น "สรุปบัญชี", "สรุปยอด" ซึ่งเป็นของระบบบัญชี
   */
  logbookSummary: {
    name: "เรียกดูสรุปรายงาน",
    command: "/summary",
    aliases: ["สรุปรายงาน", "summary", "view report", "ดูรายงาน", "สรุปการผลิต"],
    generate: (params) => {
      // This is a placeholder. The actual data fetching happens in index.js
      // But we return a specific flag to tell index.js to fetch data
      return {
        success: true,
        action: "fetch_summary",
        params: params,
        formatted: "กำลังดึงข้อมูลสรุปรายงาน...", // Temporary message
      };
    },
  },

  /**
   * 📝 สร้าง Checklist ก่อนเริ่มงาน
   */
  startupChecklist: {
    name: "Checklist ก่อนเริ่มงาน",
    command: "/checklist",
    aliases: ["checklist", "เช็คลิสต์", "เชคลิสต์", "check list", "ตรวจสอบก่อนเริ่มงาน"],
    generate: (params) => {
      const { machine = "N/A", moldName = "N/A" } = params;
      const date = new Date().toLocaleDateString("th-TH");

      return {
        success: true,
        formatted: `📝 Checklist ก่อนเริ่มงาน
════════════════════════════
📅 วันที่: ${date}
🏭 เครื่อง: ${machine}
🔧 แม่พิมพ์: ${moldName}

✅ ตรวจสอบเครื่องจักร:
☐ น้ำมันไฮดรอลิก (ระดับ/อุณหภูมิ)
☐ ระบบหล่อเย็น (น้ำ/อุณหภูมิ)
☐ ระบบลม (ความดัน)
☐ Safety Device ทำงานปกติ
☐ ปุ่มฉุกเฉินทำงานปกติ

✅ ตรวจสอบแม่พิมพ์:
☐ ทำความสะอาดผิว Cavity
☐ ตรวจ Ejector Pin
☐ ตรวจระบบ Cooling
☐ ตรวจ Sprue/Runner/Gate
☐ ล็อคแม่พิมพ์แน่นหนา

✅ ตรวจสอบวัตถุดิบ:
☐ ชนิด/Grade ถูกต้อง
☐ อบแห้ง (ถ้าจำเป็น)
☐ ปริมาณเพียงพอ

════════════════════════════
✍️ ผู้ตรวจ: ____________`,
      };
    },
  },
};

// =====================================================
// 📚 QUICK REFERENCE (คู่มือด่วน)
// =====================================================

const QuickReference = {
  /**
   * 🌡️ ตารางอุณหภูมิวัสดุ
   */
  materialTemp: {
    name: "ตารางอุณหภูมิวัสดุ",
    command: "/temp",
    aliases: ["อุณหภูมิ", "temp table", "temperature"],
    data: `🌡️ ตารางอุณหภูมิหลอมและแม่พิมพ์

วัสดุ  | หลอม (°C)  | แม่พิมพ์ (°C)
-------|------------|---------------
PP     | 200-280    | 20-50
PE     | 180-280    | 10-50
ABS    | 200-260    | 40-80
PC     | 280-320    | 80-120
PA6    | 250-280    | 60-90
PA66   | 270-300    | 70-100
POM    | 180-210    | 60-120
PET    | 260-280    | 15-50
PS     | 180-260    | 20-50
PMMA   | 220-260    | 50-80

💡 หมายเหตุ:
• วัสดุผสมเส้นใย → +10-20°C
• ผิวมันวาว → เพิ่ม Mold Temp`,
  },

  /**
   * ⚙️ คู่มือ Defect ด่วน
   */
  defectGuide: {
    name: "คู่มือ Defect ด่วน",
    command: "/guide",
    aliases: ["คู่มือ", "คู่มือdefect", "คู่มือ defect", "defect guide", "quick guide", "guide defect"],
    data: `📚 คู่มือแก้ปัญหาด่วน

⚠️ Short Shot (ไม่เต็ม)
→ เพิ่ม Pressure/Temp/Speed

🔴 Flash (เกินขอบ)
→ เพิ่ม Clamp/ลด Pressure

🔵 Sink Mark (ยุบ)
→ เพิ่ม Hold Pressure/Time

🟡 Warpage (บิด)
→ Cooling สม่ำเสมอ/เพิ่ม Time

⚫ Burn Mark (ไหม้)
→ เช็ค Venting/ลด Speed

〰️ Weld Line (รอยเชื่อม)
→ เพิ่ม Temp/Speed

💡 ใช้ /defect [ชื่อปัญหา] เพื่อดูรายละเอียด`,
  },

  /**
   * 📐 สูตรคำนวณพื้นฐาน
   */
  formulas: {
    name: "สูตรคำนวณพื้นฐาน",
    command: "/formula",
    aliases: ["สูตรคำนวณ", "สูตรพลาสติก", "สูตรคำนวณพลาสติก", "formula", "calculation", "formulas"], // 🔧 เพิ่ม aliases ภาษาไทย
    data: `📐 สูตรคำนวณพื้นฐาน

🔧 แรงปิดแม่พิมพ์:
F (ton) = P (MPa) × A (cm²) / 100

⏱️ Cooling Time:
t ≈ s² × 2.5 (วินาที)
s = ความหนาผนัง (mm)

💉 Shot Size:
Shot = (Part + Runner) × 1.05

⚡ V-P Position:
VP = Shot × (1 - Fill%)

📊 Cycle Time:
Cycle = Fill + Hold + Cool + Mold

💡 ใช้ /clamp, /cooling, /shot, /vp
เพื่อคำนวณอัตโนมัติ`,
  },

  /**
   * 🧠 สถิติคลังความรู้ (Knowledge Stats)
   */
  knowledgeStats: {
    name: "สถิติคลังความรู้",
    command: "/knowledge",
    aliases: ["knowledge", "ความรู้", "stat", "สถิติ"],
    generate: (params) => {
      return {
        success: true,
        action: "fetch_knowledge_stats",
        formatted: "กำลังดึงข้อมูลสถิติคลังความรู้...",
      };
    },
  },
};

// =====================================================
// 📢 TEAM COMMUNICATION (สื่อสารในทีม)
// =====================================================

const TeamCommunication = {
  announce: {
    name: "ประกาศข่าวสารในทีม",
    command: "/announce",
    aliases: ["announce", "ประกาศ", "แจ้ง", "notify"],
    generate: (params) => {
      const { orgCode, text } = params;

      if (!orgCode) {
        return { error: "⚠️ ต้องใช้รหัสองค์กรนำหน้าคำสั่ง\nตัวอย่าง: KCTLINE01/announce ประชุม 10 โมง" };
      }

      if (!text) {
        return { error: "⚠️ กรุณาระบุข้อความที่ต้องการประกาศ" };
      }

      return {
        success: true,
        action: "team_broadcast",
        orgCode,
        message: text,
        formatted: "กำลังส่งประกาศ...",
      };
    },
  },
};

// =====================================================
// 👁️ VISION TOOLS (วิเคราะห์ภาพ AI)
// =====================================================

const VisionTools = {
  diagnosis: {
    name: "AI Vision Diagnosis",
    command: "/vision",
    aliases: ["vision", "วิเคราะห์ภาพ", "ai vision"],
    generate: (params) => {
      return {
        success: true,
        action: "request_image",
        formatted: `👁️ **AI Vision Diagnosis** (Beta)
        
กรุณาส่งรูปภาพชิ้นงานที่มีปัญหาเข้ามาได้เลยครับ 📸
ระบบจะทำการวิเคราะห์ Defect เบื้องต้นให้ทันที

⚠️ **ฟีเจอร์นี้สำหรับสมาชิก Premium เท่านั้น**
(รายเดือน / 3 เดือน / รายปี)

---
🛠️ เครื่องมือโดย อาจารย์วิทยา`,
      };
    },
  },
};

// =====================================================
// 🛡️ SUPER ADMIN TOOLS (เครื่องมือผู้ดูแลระบบ)
// =====================================================

const AdminTools = {
  systemStatus: {
    name: "ตรวจสอบสถานะระบบ",
    command: "/admin status",
    aliases: ["admin status", "status"],
    generate: (params) => {
      return {
        success: true,
        action: "admin_status",
        formatted: "🔍 กำลังตรวจสอบสถานะระบบ...",
      };
    },
  },
  testScenario: {
    name: "ทดสอบระบบ (Test Scenario)",
    command: "/admin test",
    aliases: ["admin test", "test"],
    generate: (params) => {
      return {
        success: true,
        action: "admin_test",
        scenario: params.text || "default",
        formatted: "🧪 กำลังรันชุดทดสอบ...",
      };
    },
  },
  userStats: {
    name: "สถิติผู้ใช้งาน",
    command: "/admin stats",
    aliases: ["admin stats", "stats"],
    generate: (params) => {
      return {
        success: true,
        action: "admin_stats",
        formatted: "📊 กำลังดึงสถิติผู้ใช้งาน...",
      };
    },
  },
};

// =====================================================
// 🎯 TOOL COMMAND PARSER
// =====================================================

/**
 * แปลงคำสั่งจากผู้ใช้เป็นการเรียกใช้ Tool
 */
function parseToolCommand(userMessage) {
  let message = userMessage.trim();
  let orgCode = null;

  // 0. Check for Org Code prefix (e.g., KCTLINE01/report)
  // Pattern: Starts with alphanumeric (at least 2 chars), followed by /, followed by command
  const prefixMatch = message.match(/^([a-zA-Z0-9]{2,})\/([a-zA-Z0-9]+)(.*)/s);

  if (prefixMatch) {
    orgCode = prefixMatch[1].toUpperCase();
    const command = prefixMatch[2];
    const rest = prefixMatch[3] || "";

    // Transform to standard format for matching: "/report ..."
    // We add '/' because our tool definitions expect commands to start with '/'
    message = `/${command}${rest}`;
  }

  message = message.toLowerCase();

  // Helper to add orgCode to params
  const addOrgCode = (result) => {
    if (orgCode && result && result.params) {
      result.params.orgCode = orgCode;
    } else if (orgCode && result) {
      result.params = { orgCode };
    }
    return result;
  };

  // 1. Check Calculator Tools
  for (const [key, tool] of Object.entries(CalculatorTools)) {
    if (message.startsWith(tool.command) ||
      tool.aliases.some((alias) => message.includes(alias))) {
      return addOrgCode({
        type: "calculator",
        tool: key,
        toolData: tool,
        params: extractParams(message, tool.command),
      });
    }
  }

  // 1.5 🔧 Special check: "คู่มือ defect" should go to QuickReference, not Diagnostic
  // Check QuickReference FIRST for "คู่มือ" keyword to avoid conflict with defectDiagnosis
  if (message.includes("คู่มือ") || message.startsWith("/guide") || message.includes("defect guide") || message.includes("guide defect")) {
    for (const [key, tool] of Object.entries(QuickReference)) {
      if (message.startsWith(tool.command) ||
        tool.aliases.some((alias) => message.includes(alias))) {
        return addOrgCode({
          type: "reference",
          tool: key,
          toolData: tool,
        });
      }
    }
  }

  // 2. Check Diagnostic Tools
  // 🔧 สำหรับ defectDiagnosis ใช้ startsWithPatterns เพื่อความแม่นยำ
  for (const [key, tool] of Object.entries(DiagnosticTools)) {
    let isMatch = message.startsWith(tool.command);

    // ตรวจสอบ startsWithPatterns ก่อน (ถ้ามี)
    if (!isMatch && tool.startsWithPatterns) {
      isMatch = tool.startsWithPatterns.some((pattern) => message.startsWith(pattern.toLowerCase()));
    }

    // ตรวจสอบ aliases
    if (!isMatch) {
      isMatch = tool.aliases.some((alias) => message.includes(alias.toLowerCase()));
    }

    if (isMatch) {
      return addOrgCode({
        type: "diagnostic",
        tool: key,
        toolData: tool,
        params: extractParams(message, tool.command),
      });
    }
  }

  // 3. Check Document Generator
  for (const [key, tool] of Object.entries(DocumentGenerator)) {
    if (message.startsWith(tool.command) ||
      tool.aliases.some((alias) => message.includes(alias))) {
      return addOrgCode({
        type: "document",
        tool: key,
        toolData: tool,
        params: extractParams(message, tool.command),
      });
    }
  }

  // 4. Check Quick Reference
  for (const [key, tool] of Object.entries(QuickReference)) {
    if (message.startsWith(tool.command) ||
      tool.aliases.some((alias) => message.includes(alias))) {
      return addOrgCode({
        type: "reference",
        tool: key,
        toolData: tool,
      });
    }
  }

  // 5. Check Team Communication
  for (const [key, tool] of Object.entries(TeamCommunication)) {
    if (message.startsWith(tool.command) ||
      tool.aliases.some((alias) => message.includes(alias))) {
      return addOrgCode({
        type: "communication",
        tool: key,
        toolData: tool,
        params: extractParams(message, tool.command),
      });
    }
  }

  // 6. Check Vision Tools
  for (const [key, tool] of Object.entries(VisionTools)) {
    if (message.startsWith(tool.command) ||
      tool.aliases.some((alias) => message.includes(alias))) {
      return addOrgCode({
        type: "vision",
        tool: key,
        toolData: tool,
        params: extractParams(message, tool.command),
      });
    }
  }

  // 7. Check Admin Tools (Check prefix /admin first)
  if (message.startsWith("/admin")) {
    for (const [key, tool] of Object.entries(AdminTools)) {
      if (message.startsWith(tool.command)) {
        return {
          type: "admin",
          tool: key,
          toolData: tool,
          params: extractParams(message, tool.command),
        };
      }
    }
  }

  // 8. Check for tool list request (Note: /help และ help ให้ใช้ createHelpMenuMessage ใน index.js แทน)
  if (message.includes("/tools") || message === "tools" || message.includes("เครื่องมือ") || message.includes("ทูล")) {
    return { type: "toolList" };
  }

  return null;
}

/**
 * แยก Parameters จากคำสั่ง
 * รองรับทั้งภาษาไทยและอังกฤษ
 */
function extractParams(message, command) {
  const params = {};
  const afterCommand = message.replace(command, "").trim();
  const lowerText = afterCommand.toLowerCase();

  // Pattern: key=value or key:value
  const paramMatches = afterCommand.matchAll(/(\w+)\s*[=:]\s*([\d.]+)/gi);
  for (const match of paramMatches) {
    params[match[1].toLowerCase()] = parseFloat(match[2]);
  }

  // Pattern: material name
  const materialMatch = afterCommand.match(/\b(PP|PE|ABS|PC|PA|POM|PET|PS|TPU|PVC|PMMA|PA6|PA66)\b/i);
  if (materialMatch) {
    params.material = materialMatch[1].toUpperCase();
  }

  // =====================================================
  // 🆕 Pattern: Thai dimensions (กว้าง/ยาว/หนา)
  // =====================================================

  // Pattern: กว้าง X cm/mm
  const widthMatch = afterCommand.match(/(?:กว้าง|width)\s*([\d.]+)\s*(cm|mm|ซม|มม)?/i);
  if (widthMatch) {
    let width = parseFloat(widthMatch[1]);
    const unit = (widthMatch[2] || "cm").toLowerCase();
    // Convert to cm
    if (unit === "mm" || unit === "มม") {
      width = width / 10;
    }
    params.width = width;
  }

  // Pattern: ยาว Y cm/mm
  const lengthMatch = afterCommand.match(/(?:ยาว|length)\s*([\d.]+)\s*(cm|mm|ซม|มม)?/i);
  if (lengthMatch) {
    let length = parseFloat(lengthMatch[1]);
    const unit = (lengthMatch[2] || "cm").toLowerCase();
    // Convert to cm
    if (unit === "mm" || unit === "มม") {
      length = length / 10;
    }
    params.length = length;
  }

  // Pattern: หนา Z mm/cm (wall thickness)
  const thicknessMatch = afterCommand.match(/(?:หนา|thickness|ความหนา)\s*([\d.]+)\s*(mm|cm|มม|ซม|มิล)?/i);
  if (thicknessMatch) {
    let thickness = parseFloat(thicknessMatch[1]);
    const unit = (thicknessMatch[2] || "mm").toLowerCase();
    // Convert to mm
    if (unit === "cm" || unit === "ซม") {
      thickness = thickness * 10;
    }
    params.wallThickness = thickness;
  }

  // Pattern: พื้นที่ A cm²
  const areaMatch = afterCommand.match(/(?:พื้นที่|area)\s*([\d.]+)\s*(cm²|cm2|ตารางเซนติเมตร)?/i);
  if (areaMatch) {
    params.projectedArea = parseFloat(areaMatch[1]);
  }

  // Pattern: WxH หรือ W*H (e.g., 30x45, 30*45)
  const dimensionMatch = afterCommand.match(/([\d.]+)\s*[x*×]\s*([\d.]+)\s*(cm|mm|ซม|มม)?/i);
  if (dimensionMatch && !params.width && !params.length) {
    let w = parseFloat(dimensionMatch[1]);
    let l = parseFloat(dimensionMatch[2]);
    const unit = (dimensionMatch[3] || "cm").toLowerCase();
    // Convert to cm
    if (unit === "mm" || unit === "มม") {
      w = w / 10;
      l = l / 10;
    }
    params.width = w;
    params.length = l;
  }

  // Pattern: ความดัน P MPa/bar
  const pressureMatch = afterCommand.match(/(?:ความดัน|pressure)\s*([\d.]+)\s*(mpa|bar|บาร์)?/i);
  if (pressureMatch) {
    let pressure = parseFloat(pressureMatch[1]);
    const unit = (pressureMatch[2] || "mpa").toLowerCase();
    // Convert bar to MPa (1 bar = 0.1 MPa)
    if (unit === "bar" || unit === "บาร์") {
      pressure = pressure * 0.1;
    }
    params.cavityPressure = pressure;
  }

  // 🔢 Calculate projectedArea from width × length if both provided
  if (params.width && params.length && !params.projectedArea) {
    params.projectedArea = params.width * params.length;
    console.log(`📐 Auto-calculated projectedArea: ${params.width} × ${params.length} = ${params.projectedArea} cm²`);
  }

  // Pattern: numbers (as potential values) - fallback
  const numbers = afterCommand.match(/\d+(?:\.\d+)?/g);
  if (numbers && !Object.keys(params).filter((k) => k !== "text").length) {
    // Assign based on context
    if (numbers[0]) params.value1 = parseFloat(numbers[0]);
    if (numbers[1]) params.value2 = parseFloat(numbers[1]);
    if (numbers[2]) params.value3 = parseFloat(numbers[2]);
  }

  // Add raw text for announcement
  params.text = afterCommand;

  return params;
}

/**
 * สร้างรายการเครื่องมือทั้งหมด
 */
function getToolList(isAdmin = false) {
  let menu = `🛠️ คู่มือการใช้งาน (User Help)

❓ พิมพ์ /help เพื่อดูเมนูนี้ได้ตลอดเวลา

📊 เครื่องคำนวณ:
• /calc - เครื่องคิดเลขแบบกด (App) 🆕
• /clamp - คำนวณแรงปิดแม่พิมพ์
• /moldtemp - อุณหภูมิแม่พิมพ์ที่เหมาะสม
• /cooling - คำนวณเวลา Cooling
• /shot - คำนวณปริมาณฉีด
• /machine - เลือกขนาดเครื่อง
• /vp - คำนวณ V-P Switchover

🔍 วินิจฉัย:
• /defect [ปัญหา] - วินิจฉัยปัญหาชิ้นงาน
• /check - ตรวจสอบพารามิเตอร์

📋 ใบงาน:
• /setup - ใบตั้งค่าเครื่อง
• /report - Digital Logbook (Standard)
• /summary - เรียกดูสรุปรายงาน (Supervisor)
• /pro-report - Digital Logbook (Premium) 🔒
• /checklist - Checklist ก่อนเริ่มงาน

📢 สื่อสารในทีม (Team Pack):
• [รหัสองค์กร]/announce [ข้อความ] - ประกาศข่าวสาร

👁️ AI Vision (Premium):
• /vision - วิเคราะห์ Defect จากรูปภาพ

📚 คู่มือด่วน:
• /temp - ตารางอุณหภูมิวัสดุ
• /guide - คู่มือ Defect ด่วน
• /formula - สูตรคำนวณพื้นฐาน
• /knowledge - สถิติคลังความรู้`;

  if (isAdmin) {
    menu += `

🛡️ Super Admin Tools:
• /admin status - ตรวจสอบสถานะระบบ
• /admin stats - สถิติผู้ใช้งาน
• /admin test - ทดสอบระบบ`;
  }

  menu += `

💡 ตัวอย่างการใช้:
• /clamp area=400 pressure=60
• /machine area=400 (หรือ force=200)
• /defect short shot
• KCTLINE01/announce ประชุม 10 โมง`;

  return menu;
}

// =====================================================
// 🎨 FLEX MESSAGE GENERATORS (งานฉีดพลาสติก)
// =====================================================

/**
 * สร้าง Flex Message สำหรับผลการคำนวณงานฉีด
 * @param {string} title - ชื่อการคำนวณ
 * @param {object} result - ผลลัพธ์การคำนวณ
 * @param {string} toolName - ชื่อเครื่องมือ
 */
function createInjectionCalculationFlex(title, result, toolName = "calculator") {
  const iconMap = {
    "clampingForce": "🔧",
    "moldTemperature": "🌡️",
    "coolingTime": "⏱️",
    "shotSize": "💉",
    "machineSelection": "🏭",
    "vpSwitchover": "⚡",
  };

  const colorMap = {
    "clampingForce": "#27ae60",
    "moldTemperature": "#e74c3c",
    "coolingTime": "#3498db",
    "shotSize": "#9b59b6",
    "machineSelection": "#f39c12",
    "vpSwitchover": "#1abc9c",
  };

  const icon = iconMap[toolName] || "📊";
  const headerColor = colorMap[toolName] || "#06c755";

  // สร้าง content rows จาก result
  const contentRows = [];

  if (result.projectedArea) {
    contentRows.push(createFlexRow("พื้นที่ฉาย", `${result.projectedArea.toLocaleString()} cm²`));
  }
  if (result.rawForce) {
    contentRows.push(createFlexRow("แรงปิดขั้นต่ำ", `${result.rawForce} ton`));
  }
  if (result.withSafety) {
    contentRows.push(createFlexRow("รวม Safety", `${result.withSafety} ton`, "#27ae60"));
  }
  if (result.recommendedMachine) {
    contentRows.push(createFlexRow("เครื่องแนะนำ", `${result.recommendedMachine} ton`, "#e74c3c"));
  }
  if (result.theoreticalTime) {
    contentRows.push(createFlexRow("ทางทฤษฎี", `${result.theoreticalTime} วินาที`));
  }
  if (result.practicalTime) {
    contentRows.push(createFlexRow("แนะนำใช้", `${result.practicalTime} วินาที`, "#27ae60"));
  }
  if (result.minTemp !== undefined) {
    contentRows.push(createFlexRow("อุณหภูมิต่ำสุด", `${result.minTemp}°C`));
  }
  if (result.maxTemp !== undefined) {
    contentRows.push(createFlexRow("อุณหภูมิสูงสุด", `${result.maxTemp}°C`));
  }
  if (result.recommended !== undefined) {
    contentRows.push(createFlexRow("แนะนำ", `${result.recommended}°C`, "#27ae60"));
  }
  if (result.meltTemp) {
    contentRows.push(createFlexRow("อุณหภูมิหลอม", result.meltTemp));
  }
  if (result.totalWeight) {
    contentRows.push(createFlexRow("น้ำหนักรวม", `${result.totalWeight} g`));
  }
  if (result.withCushion) {
    contentRows.push(createFlexRow("รวม Cushion", `${result.withCushion} g`, "#27ae60"));
  }
  if (result.vpPosition) {
    contentRows.push(createFlexRow("V-P Position", `${result.vpPosition} mm`, "#27ae60"));
  }
  if (result.cushion) {
    contentRows.push(createFlexRow("Cushion", `${result.cushion} mm`));
  }
  if (result.clampingForce) {
    contentRows.push(createFlexRow("แรงปิดที่ต้องการ", `${result.clampingForce} ton`));
  }
  if (result.shotCapacity) {
    contentRows.push(createFlexRow("Shot Capacity ขั้นต่ำ", `${result.shotCapacity} g`));
  }

  return {
    type: "flex",
    altText: `${icon} ${title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: icon, size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: title, weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: "INJECTION MOLDING", color: "#ffffff99", size: "xxs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: headerColor,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          ...contentRows,
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "💡", flex: 0, size: "sm" },
              { type: "text", text: "กดปุ่มด้านล่างเพื่อคำนวณอื่น", color: "#888888", size: "xs", margin: "sm", wrap: true },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔧 แรงปิด", text: "คำนวณแรงปิด" },
            style: "secondary",
            height: "sm",
            flex: 1,
          },
          {
            type: "button",
            action: { type: "message", label: "⏱️ Cooling", text: "คำนวณ cooling" },
            style: "secondary",
            height: "sm",
            flex: 1,
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับวินิจฉัยปัญหา Defect
 * @param {object} defect - ข้อมูล Defect
 */
function createDefectDiagnosisFlex(defect) {
  const severityColor = {
    "critical": "#e74c3c",
    "major": "#f39c12",
    "minor": "#3498db",
  };

  // กำหนด severity จากชนิด defect
  const criticalDefects = ["burn_mark", "flash", "void"];
  const majorDefects = ["short_shot", "warpage", "silver_streak"];
  const severity = criticalDefects.includes(defect.name?.toLowerCase().replace(/ /g, "_")) ? "critical" :
    majorDefects.some((d) => defect.name?.toLowerCase().includes(d)) ? "major" : "minor";

  const headerColor = severityColor[severity] || "#27ae60";

  // สร้าง causes list
  const causesList = (defect.causes || []).slice(0, 5).map((cause, i) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: `${i + 1}.`, flex: 0, size: "sm", color: "#888888" },
      { type: "text", text: cause, size: "sm", color: "#333333", margin: "sm", wrap: true },
    ],
    margin: i === 0 ? "none" : "sm",
  }));

  // สร้าง solutions list
  const solutionsList = (defect.solutions || []).slice(0, 5).map((solution, i) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: "✓", flex: 0, size: "sm", color: "#27ae60" },
      { type: "text", text: solution, size: "sm", color: "#333333", margin: "sm", wrap: true },
    ],
    margin: i === 0 ? "none" : "sm",
  }));

  return {
    type: "flex",
    altText: `${defect.emoji || "🔍"} ${defect.name} - วินิจฉัยปัญหา`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: defect.emoji || "🔍", size: "xxl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: defect.name || "Defect", weight: "bold", color: "#ffffff", size: "lg", wrap: true },
                  { type: "text", text: "DEFECT DIAGNOSIS", color: "#ffffff99", size: "xxs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: headerColor,
        paddingAll: "18px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Check First Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "⚡ ตรวจสอบก่อน", weight: "bold", color: "#e74c3c", size: "sm" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: defect.checkFirst || "-", size: "sm", color: "#333333", wrap: true },
                ],
                backgroundColor: "#fff3cd",
                paddingAll: "10px",
                cornerRadius: "8px",
                margin: "sm",
              },
            ],
          },
          { type: "separator", margin: "lg" },
          // Causes Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🔍 สาเหตุที่เป็นไปได้", weight: "bold", color: "#333333", size: "sm" },
              {
                type: "box",
                layout: "vertical",
                contents: causesList,
                margin: "md",
              },
            ],
            margin: "lg",
          },
          { type: "separator", margin: "lg" },
          // Solutions Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "✅ วิธีแก้ไข", weight: "bold", color: "#27ae60", size: "sm" },
              {
                type: "box",
                layout: "vertical",
                contents: solutionsList,
                margin: "md",
              },
            ],
            margin: "lg",
          },
        ],
        paddingAll: "18px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📋 ปัญหาอื่น", text: "คู่มือ defect" },
                style: "secondary",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "🌡️ ตารางอุณหภูมิ", text: "ตารางอุณหภูมิวัสดุ" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message ตารางอุณหภูมิวัสดุ
 */
function createMaterialTempFlex() {
  const materials = [
    { name: "PP", melt: "200-280", mold: "20-50", color: "#3498db" },
    { name: "PE", melt: "180-280", mold: "10-50", color: "#2ecc71" },
    { name: "ABS", melt: "200-260", mold: "40-80", color: "#e74c3c" },
    { name: "PC", melt: "280-320", mold: "80-120", color: "#9b59b6" },
    { name: "PA6", melt: "250-280", mold: "60-90", color: "#f39c12" },
    { name: "PA66", melt: "270-300", mold: "70-100", color: "#e67e22" },
    { name: "POM", melt: "180-210", mold: "60-120", color: "#1abc9c" },
    { name: "PET", melt: "260-280", mold: "15-50", color: "#34495e" },
  ];

  const materialRows = materials.map((mat) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: mat.name, weight: "bold", color: mat.color, size: "sm", align: "center" }],
        flex: 1,
        backgroundColor: "#f8f9fa",
        paddingAll: "5px",
        cornerRadius: "4px",
      },
      { type: "text", text: mat.melt, size: "sm", color: "#333333", align: "center", flex: 2 },
      { type: "text", text: mat.mold, size: "sm", color: "#333333", align: "center", flex: 2 },
    ],
    margin: "sm",
    paddingAll: "3px",
  }));

  return {
    type: "flex",
    altText: "🌡️ ตารางอุณหภูมิวัสดุ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🌡️", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "ตารางอุณหภูมิวัสดุ", weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: "MATERIAL TEMPERATURE GUIDE", color: "#ffffff99", size: "xxs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#e74c3c",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Table Header
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "วัสดุ", weight: "bold", color: "#666666", size: "xs", align: "center", flex: 1 },
              { type: "text", text: "หลอม (°C)", weight: "bold", color: "#666666", size: "xs", align: "center", flex: 2 },
              { type: "text", text: "แม่พิมพ์ (°C)", weight: "bold", color: "#666666", size: "xs", align: "center", flex: 2 },
            ],
            backgroundColor: "#ecf0f1",
            paddingAll: "8px",
            cornerRadius: "8px",
          },
          // Table Rows
          ...materialRows,
          { type: "separator", margin: "lg" },
          // Tips
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "💡 หมายเหตุ:", weight: "bold", color: "#333333", size: "xs" },
              { type: "text", text: "• วัสดุผสมเส้นใย → +10-20°C", color: "#666666", size: "xs", margin: "sm" },
              { type: "text", text: "• ผิวมันวาว → เพิ่ม Mold Temp", color: "#666666", size: "xs", margin: "xs" },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔧 คำนวณแรงปิด", text: "คำนวณแรงปิด" },
            style: "secondary",
            height: "sm",
            flex: 1,
          },
          {
            type: "button",
            action: { type: "message", label: "📐 สูตรคำนวณ", text: "สูตรคำนวณพลาสติก" },
            style: "secondary",
            height: "sm",
            flex: 1,
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message คู่มือ Defect ด่วน
 */
function createDefectGuideFlex() {
  const defects = [
    { emoji: "⚠️", name: "Short Shot", hint: "เพิ่ม Pressure/Temp/Speed", cmd: "วินิจฉัย short shot" },
    { emoji: "🔴", name: "Flash", hint: "เพิ่ม Clamp/ลด Pressure", cmd: "วินิจฉัย flash" },
    { emoji: "🔵", name: "Sink Mark", hint: "เพิ่ม Hold Pressure/Time", cmd: "วินิจฉัย sink mark" },
    { emoji: "🟡", name: "Warpage", hint: "Cooling สม่ำเสมอ", cmd: "วินิจฉัย warpage" },
    { emoji: "⚫", name: "Burn Mark", hint: "เช็ค Venting/ลด Speed", cmd: "วินิจฉัย burn mark" },
    { emoji: "〰️", name: "Weld Line", hint: "เพิ่ม Temp/Speed", cmd: "วินิจฉัย weld line" },
  ];

  const defectRows = defects.map((d) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: d.emoji, flex: 0, size: "lg" },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: d.name, weight: "bold", size: "sm", color: "#333333" },
          { type: "text", text: `→ ${d.hint}`, size: "xs", color: "#888888" },
        ],
        flex: 3,
        margin: "sm",
      },
      {
        type: "button",
        action: { type: "message", label: "ดู", text: d.cmd },
        style: "link",
        height: "sm",
        flex: 1,
      },
    ],
    margin: "md",
    paddingAll: "5px",
    backgroundColor: "#f8f9fa",
    cornerRadius: "8px",
  }));

  return {
    type: "flex",
    altText: "📚 คู่มือ Defect ด่วน",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📚", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "คู่มือ Defect ด่วน", weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: "QUICK DEFECT GUIDE", color: "#ffffff99", size: "xxs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#9b59b6",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "กดปุ่ม \"ดู\" เพื่อดูรายละเอียดแต่ละปัญหา", color: "#888888", size: "xs", margin: "none" },
          { type: "separator", margin: "md" },
          ...defectRows,
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🌡️ ตารางอุณหภูมิ", text: "ตารางอุณหภูมิวัสดุ" },
            style: "secondary",
            height: "sm",
            flex: 1,
          },
          {
            type: "button",
            action: { type: "message", label: "📐 สูตรคำนวณ", text: "สูตรคำนวณพลาสติก" },
            style: "secondary",
            height: "sm",
            flex: 1,
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สูตรคำนวณพื้นฐาน
 */
function createFormulasFlex() {
  const formulas = [
    { icon: "🔧", title: "แรงปิดแม่พิมพ์", formula: "F = P × A / 100", unit: "(ton)" },
    { icon: "⏱️", title: "Cooling Time", formula: "t ≈ s² × 2.5", unit: "(วินาที)" },
    { icon: "💉", title: "Shot Size", formula: "Shot = (Part + Runner) × 1.05", unit: "" },
    { icon: "⚡", title: "V-P Position", formula: "VP = Shot × (1 - Fill%)", unit: "" },
  ];

  const formulaRows = formulas.map((f) => ({
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: f.icon, flex: 0, size: "lg" },
          { type: "text", text: f.title, weight: "bold", size: "sm", color: "#333333", margin: "sm" },
        ],
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: f.formula, size: "sm", color: "#27ae60", weight: "bold" },
          { type: "text", text: f.unit, size: "xs", color: "#888888", margin: "sm" },
        ],
        margin: "sm",
        backgroundColor: "#e8f5e9",
        paddingAll: "8px",
        cornerRadius: "6px",
      },
    ],
    margin: "lg",
    paddingAll: "5px",
  }));

  return {
    type: "flex",
    altText: "📐 สูตรคำนวณพื้นฐาน",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📐", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "สูตรคำนวณพื้นฐาน", weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: "BASIC FORMULAS", color: "#ffffff99", size: "xxs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#3498db",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: formulaRows,
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔧 คำนวณแรงปิด", text: "คำนวณแรงปิด" },
            style: "primary",
            height: "sm",
            flex: 1,
            color: "#27ae60",
          },
          {
            type: "button",
            action: { type: "message", label: "⏱️ Cooling", text: "คำนวณ cooling" },
            style: "primary",
            height: "sm",
            flex: 1,
            margin: "sm",
            color: "#3498db",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message ใบตั้งค่าเครื่อง
 * @param {object} params - พารามิเตอร์การตั้งค่า
 */
function createSetupSheetFlex(params) {
  const {
    moldName = "N/A",
    material = "PP",
    machine = "N/A",
    cavities = 1,
    cycleTime = 30,
    meltTemp = 230,
    moldTemp = 40,
    injectionPressure = 60,
    holdingPressure = 40,
    injectionSpeed = 50,
    coolingTime = 15,
    createdBy = "System",
  } = params;

  const date = new Date().toLocaleDateString("th-TH");
  const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  return {
    type: "flex",
    altText: `📋 ใบตั้งค่าเครื่อง - ${moldName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📋", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "ใบตั้งค่าเครื่องฉีด", weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: `${date} ${time}`, color: "#ffffff99", size: "xs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#2c3e50",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Info Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🏭 ข้อมูลทั่วไป", weight: "bold", color: "#333333", size: "sm" },
              createFlexRow("แม่พิมพ์", moldName),
              createFlexRow("วัสดุ", material),
              createFlexRow("เครื่องฉีด", machine),
              createFlexRow("Cavity", `${cavities} cav`),
              createFlexRow("Cycle Time เป้า", `${cycleTime} sec`),
            ],
            backgroundColor: "#f8f9fa",
            paddingAll: "12px",
            cornerRadius: "8px",
          },
          { type: "separator", margin: "lg" },
          // Temperature Section
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🌡️ อุณหภูมิ", weight: "bold", color: "#e74c3c", size: "xs", align: "center" },
                  { type: "text", text: `${meltTemp}°C`, weight: "bold", size: "lg", align: "center", color: "#e74c3c" },
                  { type: "text", text: "Barrel", size: "xxs", color: "#888888", align: "center" },
                ],
                flex: 1,
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🧊 แม่พิมพ์", weight: "bold", color: "#3498db", size: "xs", align: "center" },
                  { type: "text", text: `${moldTemp}°C`, weight: "bold", size: "lg", align: "center", color: "#3498db" },
                  { type: "text", text: "Mold", size: "xxs", color: "#888888", align: "center" },
                ],
                flex: 1,
              },
            ],
            margin: "lg",
            paddingAll: "10px",
            backgroundColor: "#fafafa",
            cornerRadius: "8px",
          },
          { type: "separator", margin: "lg" },
          // Injection Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "💉 การฉีด", weight: "bold", color: "#333333", size: "sm" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  createFlexCol("ความดันฉีด", `${injectionPressure} MPa`),
                  createFlexCol("Holding", `${holdingPressure} MPa`),
                  createFlexCol("Speed", `${injectionSpeed}%`),
                ],
                margin: "sm",
              },
            ],
            margin: "lg",
          },
          // Cooling Section
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createFlexCol("⏱️ Cooling", `${coolingTime} sec`),
              createFlexCol("🔄 Cycle", `${cycleTime} sec`),
            ],
            margin: "lg",
            backgroundColor: "#e8f5e9",
            paddingAll: "10px",
            cornerRadius: "8px",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `👤 ผู้บันทึก: ${createdBy}`, size: "xs", color: "#888888", align: "center" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📊 รายงาน", text: "/report" },
                style: "primary",
                height: "sm",
                flex: 1,
                color: "#27ae60",
              },
              {
                type: "button",
                action: { type: "message", label: "✅ Checklist", text: "/checklist" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "md",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message เมนูเครื่องมืองานฉีด
 */
function createInjectionToolsMenuFlex() {
  return {
    type: "flex",
    altText: "🛠️ เครื่องมืองานฉีดพลาสติก",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🛠️", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "เครื่องมืองานฉีดพลาสติก", weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: "INJECTION MOLDING TOOLS", color: "#ffffff99", size: "xxs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#2c3e50",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Calculator Section
          { type: "text", text: "📊 เครื่องคำนวณ", weight: "bold", color: "#333333", size: "sm" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createToolButton("🔧", "แรงปิด", "คำนวณแรงปิด"),
              createToolButton("🌡️", "อุณหภูมิ", "อุณหภูมิแม่พิมพ์ PP"),
              createToolButton("⏱️", "Cooling", "คำนวณ cooling"),
            ],
            margin: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createToolButton("💉", "Shot", "คำนวณ shot"),
              createToolButton("🏭", "เครื่อง", "เลือกขนาดเครื่อง"),
              createToolButton("⚡", "V-P", "คำนวณ vp"),
            ],
            margin: "sm",
          },
          { type: "separator", margin: "lg" },
          // Diagnostic Section
          { type: "text", text: "🔍 วินิจฉัยปัญหา", weight: "bold", color: "#333333", size: "sm", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createToolButton("⚠️", "Short Shot", "วินิจฉัย short shot"),
              createToolButton("🔴", "Flash", "วินิจฉัย flash"),
              createToolButton("🔵", "Sink", "วินิจฉัย sink mark"),
            ],
            margin: "md",
          },
          { type: "separator", margin: "lg" },
          // Reference Section
          { type: "text", text: "📚 คู่มือด่วน", weight: "bold", color: "#333333", size: "sm", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createToolButton("🌡️", "อุณหภูมิ", "ตารางอุณหภูมิวัสดุ"),
              createToolButton("📋", "Defect", "คู่มือ defect"),
              createToolButton("📐", "สูตร", "สูตรคำนวณพลาสติก"),
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "📋 ใบตั้งค่า", text: "/setup" },
            style: "primary",
            height: "sm",
            flex: 1,
            color: "#27ae60",
          },
          {
            type: "button",
            action: { type: "message", label: "📊 รายงาน", text: "/report" },
            style: "primary",
            height: "sm",
            flex: 1,
            margin: "sm",
            color: "#3498db",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับ Web Calculator Menu
 * เชื่อมไปยัง wizmobiz.com/calculator.html
 * 🔥 VERSION 2.0 - POWERFUL DESIGN
 */
function createCalculatorMenuFlex() {
  const calculatorUrl = "https://wizmobiz.com/calculator";

  return {
    type: "flex",
    altText: "🧮 เครื่องคิดเลขงานฉีดพลาสติก - WiT Pro Calculator",
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          // Main Title Row
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🧮", size: "4xl", align: "center" },
                ],
                width: "70px",
                height: "70px",
                backgroundColor: "#FFFFFF20",
                cornerRadius: "20px",
                justifyContent: "center",
                alignItems: "center",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "WiT Calculator", weight: "bold", color: "#ffffff", size: "xl" },
                  { type: "text", text: "เครื่องคำนวณงานฉีดพลาสติก", color: "#E0E7FF", size: "sm", margin: "xs" },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "⭐ PRO", size: "xxs", color: "#FFD700", weight: "bold" },
                      { type: "text", text: " • ", size: "xxs", color: "#FFFFFF80" },
                      { type: "text", text: "v2.0", size: "xxs", color: "#FFFFFF80" },
                    ],
                    margin: "sm",
                  },
                ],
                margin: "lg",
                flex: 1,
              },
            ],
          },
          // Promo Banner
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🎁", size: "md", flex: 0 },
              { type: "text", text: "ฟรี 5 ครั้ง • Add LINE ใช้ไม่จำกัด", color: "#FFFFFF", size: "sm", weight: "bold", margin: "sm", flex: 1 },
              { type: "text", text: "👉", size: "md", flex: 0 },
            ],
            backgroundColor: "#00000030",
            cornerRadius: "25px",
            paddingAll: "12px",
            margin: "lg",
          },
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#667eea",
          endColor: "#764ba2",
        },
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Section: เครื่องมือคำนวณ
          { type: "text", text: "🔧 เครื่องมือคำนวณ", weight: "bold", size: "md", color: "#1F2937" },
          // Row 1: Main Tools
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createCalcToolBoxV2("💪", "แรงปิด", "Clamping Force", "#EF4444"),
              createCalcToolBoxV2("❄️", "Cooling", "Time", "#3B82F6"),
              createCalcToolBoxV2("💉", "Shot Size", "Volume", "#10B981"),
            ],
            margin: "md",
            spacing: "md",
          },
          // Row 2: Secondary Tools
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createCalcToolBoxV2("🌡️", "Mold Temp", "Settings", "#F59E0B"),
              createCalcToolBoxV2("⚡", "V-P Switch", "Position", "#8B5CF6"),
              createCalcToolBoxV2("🏭", "เลือกเครื่อง", "Selector", "#EC4899"),
            ],
            margin: "md",
            spacing: "md",
          },
          { type: "separator", margin: "lg" },
          // Features Section
          { type: "text", text: "✨ ฟีเจอร์พิเศษ", weight: "bold", size: "md", color: "#1F2937", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              createFeatureRowV2("🎯", "คำนวณแม่นยำ", "สูตรมาตรฐานอุตสาหกรรม"),
              createFeatureRowV2("📊", "ฐานข้อมูลวัสดุ", "PP, PE, ABS, PA และอื่นๆ 20+ ชนิด"),
              createFeatureRowV2("🤖", "AI แนะนำ", "เลือกเครื่องให้อัตโนมัติ"),
              createFeatureRowV2("📱", "ใช้งานง่าย", "ไม่ต้องลงแอป เปิดเว็บใช้ได้เลย"),
            ],
            margin: "md",
            backgroundColor: "#F3F4F6",
            cornerRadius: "12px",
            paddingAll: "12px",
          },
        ],
        paddingAll: "18px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          // Main CTA Button
          {
            type: "button",
            action: {
              type: "uri",
              label: "🚀 เปิดเครื่องคิดเลข PRO",
              uri: calculatorUrl,
            },
            style: "primary",
            height: "md",
            color: "#667eea",
          },
          // Secondary Buttons
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📚 สูตรทั้งหมด", text: "/formulas" },
                style: "secondary",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "🛠️ เครื่องมือ", text: "/tools" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "sm",
          },
          // Credit Line
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📱 LINE: @wit365", size: "xxs", color: "#9CA3AF", flex: 1 },
              { type: "text", text: "🌐 wizmobiz.com", size: "xxs", color: "#9CA3AF", flex: 1, align: "end" },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F9FAFB",
      },
    },
  };
}

/**
 * Helper: สร้าง Tool Box V2 สำหรับ Calculator Menu (Modern Design)
 */
function createCalcToolBoxV2(icon, line1, line2, accentColor) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: icon, size: "xl", align: "center" },
        ],
        backgroundColor: accentColor + "15",
        cornerRadius: "12px",
        paddingAll: "10px",
        width: "50px",
        height: "50px",
        justifyContent: "center",
        alignItems: "center",
      },
      { type: "text", text: line1, size: "sm", align: "center", color: "#1F2937", weight: "bold", margin: "md" },
      { type: "text", text: line2, size: "xxs", align: "center", color: "#6B7280" },
    ],
    flex: 1,
    paddingAll: "12px",
    backgroundColor: "#FFFFFF",
    cornerRadius: "16px",
    borderWidth: "1px",
    borderColor: "#E5E7EB",
    alignItems: "center",
  };
}

/**
 * Helper: สร้าง Feature Row V2 สำหรับ Calculator Menu
 */
function createFeatureRowV2(icon, title, desc) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: icon, flex: 0, size: "lg" },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: title, size: "sm", color: "#1F2937", weight: "bold" },
          { type: "text", text: desc, size: "xs", color: "#6B7280", wrap: true },
        ],
        margin: "md",
        flex: 1,
      },
    ],
    margin: "md",
  };
}

// =====================================================
// 🔧 FLEX HELPER FUNCTIONS
// =====================================================

/**
 * สร้าง Row สำหรับ Flex Message
 */
function createFlexRow(label, value, valueColor = "#333333") {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, color: "#888888", size: "sm", flex: 2 },
      { type: "text", text: String(value), color: valueColor, size: "sm", flex: 3, align: "end", weight: "bold" },
    ],
    margin: "sm",
  };
}

/**
 * สร้าง Column สำหรับ Flex Message
 */
function createFlexCol(label, value) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: label, size: "xs", color: "#888888", align: "center" },
      { type: "text", text: String(value), size: "sm", color: "#333333", align: "center", weight: "bold" },
    ],
    flex: 1,
  };
}

/**
 * สร้าง Tool Button สำหรับ Menu
 */
function createToolButton(icon, label, text) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: icon, size: "xl", align: "center" },
      { type: "text", text: label, size: "xxs", align: "center", color: "#666666", margin: "xs" },
    ],
    flex: 1,
    action: { type: "message", text: text },
    paddingAll: "8px",
    backgroundColor: "#f8f9fa",
    cornerRadius: "8px",
    margin: "sm",
  };
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  CalculatorTools,
  DiagnosticTools,
  DocumentGenerator,
  QuickReference,
  TeamCommunication,
  VisionTools,
  AdminTools,
  parseToolCommand,
  extractParams,
  getToolList,
  // Flex Message Generators
  createInjectionCalculationFlex,
  createDefectDiagnosisFlex,
  createMaterialTempFlex,
  createDefectGuideFlex,
  createFormulasFlex,
  createSetupSheetFlex,
  createInjectionToolsMenuFlex,
  createCalculatorMenuFlex,
  createFlexRow,
  createFlexCol,
  createToolButton,
  createCalcToolBoxV2,
  createFeatureRowV2,
};
