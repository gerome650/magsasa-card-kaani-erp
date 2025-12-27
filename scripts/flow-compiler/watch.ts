#!/usr/bin/env node
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: pnpm flow:watch <pathToMd>');
    console.error('Example: pnpm flow:watch templates/example_farmer_flow.md');
    process.exit(1);
  }

  const inputPath = args[0];
  const absolutePath = path.resolve(inputPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Watching: ${absolutePath}`);
  console.log('Press Ctrl+C to stop\n');

  // Initial compile
  compileFile();

  // Watch for changes
  fs.watchFile(absolutePath, { interval: 500 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log(`\n[${new Date().toLocaleTimeString()}] File changed, recompiling...`);
      compileFile();
    }
  });

  function compileFile() {
    const compileScript = path.join(__dirname, 'compile.ts');
    const proc = spawn('tsx', [compileScript, absolutePath], {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        console.log('✓ Compilation successful\n');
      } else {
        console.log('✗ Compilation failed\n');
      }
    });
  }
}

main();

