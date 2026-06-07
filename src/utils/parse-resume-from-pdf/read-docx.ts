import mammoth from 'mammoth';
import type { TextItem, TextItems } from './types';

/**
 * Reads a DOCX file and converts it to TextItems format compatible with the PDF parser.
 *
 * Strategy:
 * - Convert DOCX to HTML to preserve structure
 * - Process block-level elements (p, table, li) as separate lines
 * - Handle 4-column tables as 2 label-value pairs per row
 * - Simulate y-coordinates from top to bottom
 *
 * @param file - The DOCX file to read
 * @returns TextItems array compatible with PDF parser
 */
export const readDocx = async (file: File): Promise<TextItems> => {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Convert to HTML to preserve structure
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value;

  console.log('=== DOCX HTML SAMPLE ===');
  console.log(html.substring(0, 1000));

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const textItems: TextItems = [];
  let currentY = 800; // Start from top
  const lineHeight = 12;
  const baseX = 50;

  // Helper to get all text from an element (combining text runs)
  const getFullText = (element: Element): string => {
    return element.textContent?.trim() || '';
  };

  // Helper to check if element is a heading or bold
  const isBold = (element: Element): boolean => {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'h1' || tagName === 'h2' || tagName === 'h3' ||
           tagName === 'strong' || tagName === 'b' ||
           element.querySelector('strong, b') !== null;
  };

  // Process block-level elements
  const processBlock = (element: Element, indent: number = 0) => {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'p') {
      // Paragraph - combine all text in this paragraph as one line
      const text = getFullText(element);
      if (text) {
        textItems.push({
          text,
          x: baseX + (indent * 20),
          y: currentY,
          width: text.length * 6,
          height: lineHeight,
          fontName: isBold(element) ? 'Arial-Bold' : 'Arial',
          hasEOL: true,
        } as TextItem);
        currentY -= lineHeight;
      }
    } else if (tagName === 'table') {
      // Process table rows
      const rows = element.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));

        // Skip rows where all cells are empty or merged headers
        const nonEmptyCells = cells.filter(cell => getFullText(cell).length > 0);
        if (nonEmptyCells.length === 0) {
          return;
        }

        // Check if this is a header row (single cell with colspan)
        if (cells.length === 1 || (cells[0]?.hasAttribute('colspan') && nonEmptyCells.length === 1)) {
          const text = getFullText(cells[0]);
          if (text) {
            textItems.push({
              text,
              x: baseX,
              y: currentY,
              width: text.length * 6,
              height: lineHeight,
              fontName: 'Arial-Bold',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          }
          return;
        }

        // 4-column table: label1 | value1 | label2 | value2
        // Process as two separate lines for better parsing
        if (cells.length === 4) {
          // First pair: label1 value1
          const label1 = getFullText(cells[0]);
          const value1 = getFullText(cells[1]);

          if (label1 && value1) {
            // Combine label and value on same line (like "Full Name as per PAN: Thandra Praveen")
            textItems.push({
              text: `${label1}: ${value1}`,
              x: baseX,
              y: currentY,
              width: (label1.length + value1.length) * 6,
              height: lineHeight,
              fontName: 'Arial',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          } else if (label1) {
            textItems.push({
              text: label1,
              x: baseX,
              y: currentY,
              width: label1.length * 6,
              height: lineHeight,
              fontName: 'Arial',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          }

          // Second pair: label2 value2
          const label2 = getFullText(cells[2]);
          const value2 = getFullText(cells[3]);

          if (label2 && value2) {
            textItems.push({
              text: `${label2}: ${value2}`,
              x: baseX,
              y: currentY,
              width: (label2.length + value2.length) * 6,
              height: lineHeight,
              fontName: 'Arial',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          } else if (label2) {
            textItems.push({
              text: label2,
              x: baseX,
              y: currentY,
              width: label2.length * 6,
              height: lineHeight,
              fontName: 'Arial',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          }
        } else if (cells.length === 2) {
          // 2-column table: label | value
          const label = getFullText(cells[0]);
          const value = getFullText(cells[1]);

          if (label && value) {
            textItems.push({
              text: `${label}: ${value}`,
              x: baseX,
              y: currentY,
              width: (label.length + value.length) * 6,
              height: lineHeight,
              fontName: 'Arial',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          } else if (label) {
            textItems.push({
              text: label,
              x: baseX,
              y: currentY,
              width: label.length * 6,
              height: lineHeight,
              fontName: 'Arial',
              hasEOL: true,
            } as TextItem);
            currentY -= lineHeight;
          }
        } else {
          // Multi-column table - put all cells as separate items on same row
          cells.forEach((cell, index) => {
            const text = getFullText(cell);
            if (text) {
              textItems.push({
                text,
                x: baseX + (index * 150),
                y: currentY,
                width: text.length * 6,
                height: lineHeight,
                fontName: 'Arial',
                hasEOL: index === cells.length - 1,
              } as TextItem);
            }
          });
          if (nonEmptyCells.length > 0) {
            currentY -= lineHeight;
          }
        }
      });
    } else if (tagName === 'li') {
      // List item - combine all text as one line
      const text = getFullText(element);
      if (text) {
        textItems.push({
          text: `• ${text}`, // Add bullet
          x: baseX + (indent * 20),
          y: currentY,
          width: text.length * 6,
          height: lineHeight,
          fontName: 'Arial',
          hasEOL: true,
        } as TextItem);
        currentY -= lineHeight;
      }
    } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      // Heading - combine all text as one line
      const text = getFullText(element);
      if (text) {
        textItems.push({
          text,
          x: baseX,
          y: currentY,
          width: text.length * 6,
          height: lineHeight,
          fontName: 'Arial-Bold',
          hasEOL: true,
        } as TextItem);
        currentY -= lineHeight;
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      // List container - process items with indent
      const items = element.querySelectorAll('li');
      items.forEach(item => processBlock(item, indent + 1));
    } else {
      // Container element - recursively process children
      const children = Array.from(element.children);
      children.forEach(child => processBlock(child, indent));
    }
  };

  // Process all top-level elements in body
  if (doc.body) {
    const children = Array.from(doc.body.children);
    children.forEach(child => processBlock(child));
  }

  console.log('=== DOCX TEXT ITEMS SAMPLE ===');
  console.log('Total items:', textItems.length);
  console.log('First 20:', textItems.slice(0, 20).map(i => i.text));

  return textItems;
};

/**
 * Helper to extract just the raw text from DOCX (for textCV field)
 */
export const extractRawTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};
