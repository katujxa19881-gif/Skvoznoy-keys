import rawDocContent from "../doc-content.txt?raw";

function getStageLines(lines: string[], stageNum: string): string[] {
  let startIndex = -1;
  let endIndex = -1;

  const targetRegex = new RegExp("^Этап\\s+" + stageNum + "\\s*-", "i");

  for (let i = 0; i < lines.length; i++) {
    if (targetRegex.test(lines[i])) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    const stageStarts: Record<string, number> = {
      "0": 0,
      "1": 861,
      "2": 1398,
      "3": 1916,
      "4": 2363,
      "5": 3070,
      "6": 3911,
      "7": 4308,
      "8": 4625,
      "9": 4968,
      "10": 5284,
      "11": 5624,
      "12": 6221,
      "13": 6848
    };
    startIndex = stageStarts[stageNum] !== undefined ? stageStarts[stageNum] : -1;
  }

  if (startIndex !== -1) {
    const nextStageNum = (parseInt(stageNum, 10) + 1).toString();
    const nextRegex = new RegExp("^Этап\\s+" + nextStageNum + "\\s*-", "i");
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (nextRegex.test(lines[i])) {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) {
      endIndex = lines.length;
    }
    return lines.slice(startIndex, endIndex);
  }

  return [];
}

export function getLocalTheory(stageNum: string, stepTitle: string): { stageIntroduction: string; stepTheory: string } {
  try {
    const lines = rawDocContent.split(/\r?\n/);
    const stageLines = getStageLines(lines, stageNum);
    if (stageLines.length === 0) {
      return { 
        stageIntroduction: `Материалы для этапа ${stageNum} временно недоступны.`, 
        stepTheory: "" 
      };
    }

    const stepIndices: number[] = [];
    for (let i = 0; i < stageLines.length; i++) {
      const l = stageLines[i].trim();
      if (l.startsWith("Шаг ") || l.match(/^Шаг\s+\d+/i)) {
        stepIndices.push(i);
      }
    }

    let stageIntroduction = "";
    if (stepIndices.length > 0) {
      stageIntroduction = stageLines.slice(0, stepIndices[0]).join("\n");
    } else {
      stageIntroduction = stageLines.join("\n");
    }

    const matchNum = stepTitle.match(/^(\d+)\./);
    const targetStepNumber = matchNum ? parseInt(matchNum[1], 10) : null;

    let stepTheory = "";
    if (stageNum === "4") {
      let scenariosIdx = -1;
      let screensIdx = -1;
      let modelIdx = -1;
      let stackIdx = -1;
      let securityIdx = -1;
      let criteriaIdx = -1;
      let saveIdx = -1;

      for (let i = 0; i < stageLines.length; i++) {
        const line = stageLines[i];
        if (/Шаг 2 из 9/i.test(line)) scenariosIdx = i;
        else if (/Шаг 4 из 9/i.test(line)) screensIdx = i;
        else if (/Шаг 5 из 9/i.test(line)) modelIdx = i;
        else if (/Шаг 5\s*[·\-\.]\s*часть\s*1/i.test(line)) stackIdx = i;
        else if (/Шаг 7 из 9/i.test(line)) securityIdx = i;
        else if (/Шаг 8 из 9/i.test(line)) criteriaIdx = i;
        else if (/Шаг 9 из 9/i.test(line)) saveIdx = i;
      }

      const stepNum = targetStepNumber;

      if (stepNum === 1) {
        const end = scenariosIdx !== -1 ? scenariosIdx : stageLines.length;
        stepTheory = stageLines.slice(0, end).join("\n");
      } else if (stepNum === 2) {
        const start = scenariosIdx !== -1 ? scenariosIdx : 0;
        const end = screensIdx !== -1 ? screensIdx : stageLines.length;
        stepTheory = stageLines.slice(start, end).join("\n");
      } else if (stepNum === 3) {
        const start = screensIdx !== -1 ? screensIdx : 0;
        const end = modelIdx !== -1 ? modelIdx : stageLines.length;
        stepTheory = stageLines.slice(start, end).join("\n");
      } else if (stepNum === 4) {
        const start = modelIdx !== -1 ? modelIdx : 0;
        const end = stackIdx !== -1 ? stackIdx : stageLines.length;
        stepTheory = stageLines.slice(start, end).join("\n");
      } else if (stepNum === 5) {
        const start = stackIdx !== -1 ? stackIdx : 0;
        const end = securityIdx !== -1 ? securityIdx : stageLines.length;
        stepTheory = stageLines.slice(start, end).join("\n");
      } else if (stepNum === 6) {
        const start = securityIdx !== -1 ? securityIdx : 0;
        const end = saveIdx !== -1 ? saveIdx : stageLines.length;
        stepTheory = stageLines.slice(start, end).join("\n");
      } else if (stepNum === 7) {
        const start = saveIdx !== -1 ? saveIdx : 0;
        stepTheory = stageLines.slice(start).join("\n");
      }
    } else {
      if (targetStepNumber !== null && stepIndices.length > 0) {
        let foundIndex = -1;
        for (let idx = 0; idx < stepIndices.length; idx++) {
          const lineStr = stageLines[stepIndices[idx]].trim();
          const numMatch = lineStr.match(/^Шаг\s+(\d+)/i);
          if (numMatch && parseInt(numMatch[1], 10) === targetStepNumber) {
            foundIndex = idx;
            break;
          }
        }

        if (foundIndex === -1) {
          const cleanTitle = stepTitle.replace(/^\d+\.\s*/, "").toLowerCase().slice(0, 10);
          for (let idx = 0; idx < stepIndices.length; idx++) {
            const lineStr = stageLines[stepIndices[idx]].toLowerCase();
            if (lineStr.includes(cleanTitle)) {
              foundIndex = idx;
              break;
            }
          }
        }

        if (foundIndex === -1 && targetStepNumber - 1 < stepIndices.length) {
          foundIndex = targetStepNumber - 1;
        }

        if (foundIndex !== -1) {
          const startIdx = stepIndices[foundIndex];
          const endIdx = foundIndex < stepIndices.length - 1 ? stepIndices[foundIndex + 1] : stageLines.length;
          stepTheory = stageLines.slice(startIdx, endIdx).join("\n");
        }
      }
    }

    if (!stepTheory) {
      stepTheory = "Подробное описание данного шага и процесса содержится во введении этапа выше.";
    }

    return {
      stageIntroduction,
      stepTheory
    };
  } catch (err) {
    console.error("Local theory parsing failed:", err);
    return {
      stageIntroduction: "Ошибка локального парсинга теории.",
      stepTheory: ""
    };
  }
}
