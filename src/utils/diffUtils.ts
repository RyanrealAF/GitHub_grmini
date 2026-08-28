import * as Diff from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffSummary {
  additions: number;
  deletions: number;
  totalChanges: number;
}

export function computeLineDiff(oldText: string, newText: string): {
  lines: DiffLine[];
  summary: DiffSummary;
} {
  const patch = Diff.diffLines(oldText, newText);
  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  let additions = 0;
  let deletions = 0;

  for (const part of patch) {
    const rawLines = part.value.replace(/\r\n/g, '\n').split('\n');
    // If the last entry is empty because of trailing newline, remove it
    if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
      rawLines.pop();
    }

    if (part.added) {
      additions += rawLines.length;
      for (const line of rawLines) {
        lines.push({
          type: 'added',
          newLineNumber: newLine++,
          content: line,
        });
      }
    } else if (part.removed) {
      deletions += rawLines.length;
      for (const line of rawLines) {
        lines.push({
          type: 'removed',
          oldLineNumber: oldLine++,
          content: line,
        });
      }
    } else {
      for (const line of rawLines) {
        lines.push({
          type: 'unchanged',
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
          content: line,
        });
      }
    }
  }

  return {
    lines,
    summary: {
      additions,
      deletions,
      totalChanges: additions + deletions,
    },
  };
}

export function generateUnifiedDiffPatch(
  fileName: string,
  oldText: string,
  newText: string
): string {
  return Diff.createPatch(
    fileName,
    oldText,
    newText,
    'original',
    'gemini-modified'
  );
}
