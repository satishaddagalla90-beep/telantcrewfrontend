import { BULLET_POINTS } from "./extract-resume-from-sections/lib/bullet-points";
import type { TextItems, Line, Lines } from "./types";

/**
 * Step 2: Group text items into lines. This returns an array where each position
 * contains text items in the same line of the pdf file.
 * 
 * IMPORTANT: This function assumes text items have already been sorted by column detection.
 * Items are grouped sequentially - we don't re-sort by Y position to avoid mixing columns.
 */
export const groupTextItemsIntoLines = (textItems: TextItems): Lines => {
  const lines: Lines = [];

  if (textItems.length === 0) return lines;

  // Check if any items have hasEOL set
  const hasEOLMarkers = textItems.some(item => item.hasEOL);

  if (hasEOLMarkers) {
    // Use hasEOL markers to determine line breaks
    let line: Line = [];
    
    for (let item of textItems) {
      if (item.text.trim() !== "") {
        line.push({ ...item });
      }
      
      if (item.hasEOL) {
        if (line.length > 0) {
          lines.push(line);
        }
        line = [];
      }
    }
    
    // Add last line if there are items
    if (line.length > 0) {
      lines.push(line);
    }
  } else {
    // No EOL markers - group by Y position
    // But respect the order from column detection (don't mix columns)
    console.log('Using Y-position based line grouping (no EOL markers found)');
    
    const yTolerance = 5; // Pixels tolerance for same line
    let currentLine: Line = [];
    let currentY: number | null = null;
    let lastX: number = -Infinity; // Track X to detect column jumps

    for (const item of textItems) {
      if (item.text.trim() === "") continue;

      // Detect if we've jumped to a new column (X decreased significantly)
      const jumpedColumn = currentY !== null && item.x < lastX - 100;
      
      // Same line: similar Y position AND didn't jump to new column
      const sameLine = currentY !== null && 
                       Math.abs(item.y - currentY) <= yTolerance && 
                       !jumpedColumn;

      if (sameLine) {
        currentLine.push({ ...item });
      } else {
        // New line
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [{ ...item }];
        currentY = item.y;
      }
      
      lastX = item.x;
    }

    // Add last line
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  // Many pdf docs are not well formatted, e.g. due to converting from other docs.
  // This creates many noises, where a single text item is divided into multiple
  // ones. This step is to merge adjacent text items if their distance is smaller
  // than a typical char width to filter out those noises.
  const typicalCharWidth = getTypicalCharWidth(lines.flat());
  for (let line of lines) {
    // Start from the end of the line to make things easier to merge and delete
    for (let i = line.length - 1; i > 0; i--) {
      const currentItem = line[i];
      const leftItem = line[i - 1];
      const leftItemXEnd = leftItem.x + leftItem.width;
      const distance = currentItem.x - leftItemXEnd;
      if (distance <= typicalCharWidth) {
        if (shouldAddSpaceBetweenText(leftItem.text, currentItem.text)) {
          leftItem.text += " ";
        }
        leftItem.text += currentItem.text;
        // Update leftItem width to include currentItem after merge before deleting current item
        const currentItemXEnd = currentItem.x + currentItem.width;
        leftItem.width = currentItemXEnd - leftItem.x;
        line.splice(i, 1);
      }
    }
  }

  return lines;
};

// Sometimes a space is lost while merging adjacent text items. This accounts for some of those cases
const shouldAddSpaceBetweenText = (leftText: string, rightText: string) => {
  const leftTextEnd = leftText[leftText.length - 1];
  const rightTextStart = rightText[0];
  const conditions = [
    [":", ",", "|", ".", ...BULLET_POINTS].includes(leftTextEnd) &&
      rightTextStart !== " ",
    leftTextEnd !== " " && ["|", ...BULLET_POINTS].includes(rightTextStart),
  ];

  return conditions.some((condition) => condition);
};

/**
 * Return the width of a typical character. (Helper util for groupTextItemsIntoLines)
 *
 * A pdf file uses different characters, each with different width due to different
 * font family and font size. This util first extracts the most typically used font
 * family and font height, and compute the average character width using text items
 * that match the typical font family and height.
 */
const getTypicalCharWidth = (textItems: TextItems): number => {
  // Exclude empty space " " in calculations since its width isn't precise
  textItems = textItems.filter((item) => item.text.trim() !== "");

  const heightToCount: { [height: number]: number } = {};
  let commonHeight = 0;
  let heightMaxCount = 0;

  const fontNameToCount: { [fontName: string]: number } = {};
  let commonFontName = "";
  let fontNameMaxCount = 0;

  for (let item of textItems) {
    const { text, height, fontName } = item;
    // Process height
    if (!heightToCount[height]) {
      heightToCount[height] = 0;
    }
    heightToCount[height]++;
    if (heightToCount[height] > heightMaxCount) {
      commonHeight = height;
      heightMaxCount = heightToCount[height];
    }

    // Process font name
    if (!fontNameToCount[fontName]) {
      fontNameToCount[fontName] = 0;
    }
    fontNameToCount[fontName] += text.length;
    if (fontNameToCount[fontName] > fontNameMaxCount) {
      commonFontName = fontName;
      fontNameMaxCount = fontNameToCount[fontName];
    }
  }

  // Find the text items that match common font family and height
  const commonTextItems = textItems.filter(
    (item) => item.fontName === commonFontName && item.height === commonHeight
  );
  // Aggregate total width and number of characters of all common text items
  const [totalWidth, numChars] = commonTextItems.reduce(
    (acc, cur) => {
      const [preWidth, prevChars] = acc;
      return [preWidth + cur.width, prevChars + cur.text.length];
    },
    [0, 0]
  );
  const typicalCharWidth = totalWidth / numChars;

  return typicalCharWidth;
};
