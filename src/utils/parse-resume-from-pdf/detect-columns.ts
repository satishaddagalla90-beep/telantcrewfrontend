import type { TextItems } from "./types";

export interface Column {
  minX: number;
  maxX: number;
  items: TextItems;
}

/**
 * Detect if resume has multiple columns and split text items accordingly
 * 
 * For multi-page resumes, we must sort by PAGE FIRST, then by Y position within each page.
 * Y coordinates restart on each page, so without page-aware sorting, page 2 items
 * would get mixed with page 1 items.
 */
export const detectAndSplitColumns = (textItems: TextItems): TextItems => {
  if (textItems.length === 0) return textItems;

  console.log('=== COLUMN DETECTION DEBUG ===');
  console.log('Total items:', textItems.length);

  // Check how many pages we have
  const pages = new Set(textItems.map(item => item.page));
  console.log('Pages found:', Array.from(pages).sort());

  // CRITICAL: Sort by page first, then by Y position (top to bottom within each page)
  // In PDF coordinates, higher Y = higher on page, so we sort Y descending
  const sortedByPageAndY = [...textItems].sort((a, b) => {
    // First sort by page (ascending - page 1 before page 2)
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    // Within same page, sort by Y descending (top to bottom)
    return b.y - a.y;
  });

  // Debug: Show first items from each page
  const page1Items = sortedByPageAndY.filter(i => i.page === 1).slice(0, 10);
  const page2Items = sortedByPageAndY.filter(i => i.page === 2).slice(0, 5);
  
  console.log('Page 1 - First 10 items:');
  page1Items.forEach((item, i) => {
    console.log(`  ${i + 1}. Y=${item.y.toFixed(0)} X=${item.x.toFixed(0)} "${item.text.substring(0, 40)}"`);
  });
  
  if (page2Items.length > 0) {
    console.log('Page 2 - First 5 items:');
    page2Items.forEach((item, i) => {
      console.log(`  ${i + 1}. Y=${item.y.toFixed(0)} X=${item.x.toFixed(0)} "${item.text.substring(0, 40)}"`);
    });
  }

  // For single-column resumes, just return sorted by page then Y
  // Check if this looks like a single column layout by analyzing X positions on page 1
  const page1 = sortedByPageAndY.filter(i => i.page === 1);
  
  if (page1.length === 0) {
    console.log('No page 1 items found, returning as-is');
    return sortedByPageAndY;
  }

  const allX = page1.map(item => item.x);
  const minX = Math.min(...allX);
  const maxX = Math.max(...page1.map(item => item.x + item.width));
  const pageWidth = maxX - minX;

  console.log('Page 1 bounds: X[', minX.toFixed(0), '-', maxX.toFixed(0), '] Width:', pageWidth.toFixed(0));

  // Build histogram of X positions to detect columns
  const bucketWidth = 20;
  const histogram: Map<number, number> = new Map();
  
  page1.forEach(item => {
    const bucket = Math.floor(item.x / bucketWidth) * bucketWidth;
    histogram.set(bucket, (histogram.get(bucket) || 0) + 1);
  });

  const sortedBuckets = Array.from(histogram.entries()).sort((a, b) => a[0] - b[0]);
  console.log('X histogram:', sortedBuckets.slice(0, 10).map(([x, count]) => `${x}:${count}`).join(' '));

  // Find if there's a significant gap in X positions (column separator)
  let columnSplitX: number | null = null;
  let maxGap = 0;
  
  for (let i = 1; i < sortedBuckets.length; i++) {
    const gap = sortedBuckets[i][0] - sortedBuckets[i - 1][0];
    const gapCenter = sortedBuckets[i - 1][0] + gap / 2;
    const relativePosition = (gapCenter - minX) / pageWidth;
    
    // Only consider gaps > 50px in the middle portion of the page
    if (gap > 50 && gap > maxGap && relativePosition > 0.2 && relativePosition < 0.6) {
      maxGap = gap;
      columnSplitX = gapCenter;
    }
  }

  // If no clear column gap, treat as single column
  if (!columnSplitX) {
    console.log('Single column layout detected - returning page-sorted items');
    console.log('First 5 final items:', sortedByPageAndY.slice(0, 5).map(i => `P${i.page} "${i.text.substring(0, 30)}"`));
    console.log('=== END COLUMN DETECTION ===');
    return sortedByPageAndY;
  }

  console.log('Two-column layout detected, split at X:', columnSplitX.toFixed(0));

  // Split into columns and process each page separately
  const result: TextItems = [];
  
  for (const pageNum of Array.from(pages).sort()) {
    const pageItems = sortedByPageAndY.filter(i => i.page === pageNum);
    const leftColumn = pageItems.filter(i => i.x < columnSplitX!);
    const rightColumn = pageItems.filter(i => i.x >= columnSplitX!);
    
    // Determine which is main content (more text = main)
    const leftTextLength = leftColumn.reduce((sum, i) => sum + i.text.length, 0);
    const rightTextLength = rightColumn.reduce((sum, i) => sum + i.text.length, 0);
    
    if (leftTextLength < rightTextLength * 0.7) {
      // Left is sidebar, process right first
      result.push(...rightColumn, ...leftColumn);
    } else {
      // Standard left to right
      result.push(...leftColumn, ...rightColumn);
    }
  }

  console.log('Final order first 5:', result.slice(0, 5).map(i => `P${i.page} "${i.text.substring(0, 30)}"`));
  console.log('=== END COLUMN DETECTION ===');

  return result;
};
