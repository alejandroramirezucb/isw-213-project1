#!/usr/bin/env node

import { ESLint } from 'eslint';
import fs from 'fs';

async function generateReport() {
  try {
    console.log('🔍 Analizando código con ESLint...');

    const eslint = new ESLint();
    const results = await eslint.lintFiles(['cliente/**/*.js', 'servidor/**/*.js']);

    const totalIssues = results.reduce((sum, r) => sum + r.messages.length, 0);
    console.log(`📊 Encontrados ${totalIssues} issues`);

    const htmlFormatter = await eslint.loadFormatter('html');
    const html = await htmlFormatter.format(results);

    fs.writeFileSync('eslint-reporter.html', html);
    console.log('✅ Reporte HTML generado: eslint-reporter.html');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

generateReport();
