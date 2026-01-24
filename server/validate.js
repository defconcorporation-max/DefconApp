import { exec } from 'child_process';
import fs from 'fs';

console.log('🔍 Running Safety Checks...');

// 1. Syntax Check using Node.js built-in flag
exec('node --check index.js', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ SYNTAX ERROR DETECTED!');
        console.error(stderr);
        process.exit(1);
    }

    // 2. Extra Check: Scan for duplicate imports (common copy-paste error)
    const content = fs.readFileSync('index.js', 'utf8');
    const lines = content.split('\n');
    const imports = new Set();

    let hasDupes = false;
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') && trimmed.includes('from ')) {
            if (imports.has(trimmed)) {
                console.error(`❌ DUPLICATE IMPORT DETECTED at line ${index + 1}: ${trimmed}`);
                hasDupes = true;
            }
            imports.add(trimmed);
        }
    });

    if (hasDupes) {
        process.exit(1);
    }

    console.log('✅ code looks good! Syntax & Imports are clean.');
    process.exit(0);
});
