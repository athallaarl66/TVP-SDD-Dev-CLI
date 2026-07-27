const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { getPaths, ensureDirectories } = require('../utils/file');
const { generatePlaywrightScript, generateUnitTestScript } = require('../utils/template');
const { ensureAIDirectories } = require('../ai-tools');

// Framework detection based on project files
const FRAMEWORK_DETECTORS = [
  { name: 'PHP/Laravel', files: ['composer.json'], check: (content) => content.includes('laravel') },
  { name: '.NET (C#)', files: ['*.csproj', '*.sln', '*.fsproj'], check: () => true },
  { name: 'Java (Spring/Gradle)', files: ['pom.xml', 'build.gradle', 'build.gradle.kts'], check: () => true },
  { name: 'Python (Django/Flask)', files: ['requirements.txt', 'Pipfile', 'pyproject.toml', 'setup.py'], check: () => true },
  { name: 'JavaScript/TypeScript', files: ['package.json'], check: (content) => !content.includes('laravel') }
];

const FRAMEWORKS = {
  playwright: { name: 'Playwright (E2E)', ext: '.spec.ts' },
  jest: { name: 'Jest (JS/TS/JSX/TSX)', ext: '.test.ts' },
  phpunit: { name: 'PHPUnit/Laravel', ext: 'Test.php' },
  xunit: { name: 'xUnit (.NET)', ext: 'Tests.cs' },
  nunit: { name: 'NUnit (.NET)', ext: 'Tests.cs' },
  junit: { name: 'JUnit 5 (Java)', ext: 'Test.java' },
  pytest: { name: 'pytest (Python)', ext: '_test.py' }
};

// Simple file existence check using fs-extra
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Check for .csproj, .sln, .fsproj files
async function hasDotNetFiles(projectDir) {
  const files = await fs.readdir(projectDir);
  return files.some(f => f.endsWith('.csproj') || f.endsWith('.sln') || f.endsWith('.fsproj'));
}

async function detectProjectType(projectDir) {
  const detected = [];
  
  for (const detector of FRAMEWORK_DETECTORS) {
    for (const filePattern of detector.files) {
      // Handle glob patterns for .NET files
      if (filePattern.startsWith('*')) {
        if (await hasDotNetFiles(projectDir)) {
          detected.push(detector.name);
          break;
        }
      } else {
        const filePath = path.join(projectDir, filePattern);
        if (await fileExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
          if (detector.check(content)) {
            detected.push(detector.name);
            break;
          }
        }
      }
    }
  }
  
  return [...new Set(detected)]; // Remove duplicates
}

function getFrameworkChoices(detectedTypes) {
  const choices = [
    { name: '🎭 Playwright (E2E)', value: 'playwright' }
  ];
  
  // Add detected frameworks first
  if (detectedTypes.length > 0) {
    choices.push(new inquirer.Separator('--- Detected frameworks ---'));
    
    for (const type of detectedTypes) {
      if (type.includes('PHP')) choices.push({ name: `🐘 ${type}`, value: 'phpunit' });
      else if (type.includes('.NET')) {
        choices.push({ name: `🔷 ${type} (xUnit)`, value: 'xunit' });
        choices.push({ name: `🔷 ${type} (NUnit)`, value: 'nunit' });
      }
      else if (type.includes('Java')) choices.push({ name: `☕ ${type}`, value: 'junit' });
      else if (type.includes('Python')) choices.push({ name: `🐍 ${type}`, value: 'pytest' });
      else if (type.includes('JavaScript')) choices.push({ name: `🟨 ${type} (Jest)`, value: 'jest' });
    }
  }
  
  // Add other options
  choices.push(new inquirer.Separator('--- Other frameworks ---'));
  
  if (!detectedTypes.some(t => t.includes('PHP'))) choices.push({ name: '🐘 PHP/Laravel (PHPUnit)', value: 'phpunit' });
  if (!detectedTypes.some(t => t.includes('.NET'))) {
    choices.push({ name: '🔷 .NET (xUnit)', value: 'xunit' });
    choices.push({ name: '🔷 .NET (NUnit)', value: 'nunit' });
  }
  if (!detectedTypes.some(t => t.includes('Java'))) choices.push({ name: '☕ Java (JUnit 5)', value: 'junit' });
  if (!detectedTypes.some(t => t.includes('Python'))) choices.push({ name: '🐍 Python (pytest)', value: 'pytest' });
  if (!detectedTypes.some(t => t.includes('JavaScript'))) choices.push({ name: '🟨 JavaScript/TypeScript (Jest)', value: 'jest' });
  
  return choices;
}

function registerQATestScriptCommand(program) {
  program
    .command('/qa-test-script <featureName>')
    .description('Generate test script (Playwright or Unit) from testing.md files')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        // Detect project type
        console.log(chalk.cyan('🔍 Detecting project type...'));
        const detectedTypes = await detectProjectType(paths.PROJECT_DIR);
        
        if (detectedTypes.length > 0) {
          console.log(chalk.green(`✅ Detected: ${detectedTypes.join(', ')}`));
        } else {
          console.log(chalk.yellow('⚠️  No specific framework detected, showing all options'));
        }
        
        // Prompt for test type and framework
        const choices = getFrameworkChoices(detectedTypes);
        
        const { framework } = await inquirer.default.prompt([
          {
            type: 'list',
            name: 'framework',
            message: 'What type of test script do you want to generate?',
            choices: choices
          }
        ]);
        
        // Find testing.md files in docs/production/{feature}/
        const productionDir = path.join(paths.DOCS_PRODUCTION_DIR, featureName);
        
        if (!(await fs.pathExists(productionDir))) {
          console.error(chalk.red(`Error: Production directory not found: ${productionDir}`));
          console.error(chalk.yellow(`Run 'sdd-gen /breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
          process.exit(1);
        }
        
        // Get all testing.md files for this feature
        const files = await fs.readdir(productionDir);
        const testingFiles = files.filter(f => f.endsWith('-testing.md'));
        
        if (testingFiles.length === 0) {
          console.error(chalk.red(`Error: No testing.md files found in ${productionDir}`));
          console.error(chalk.yellow(`Run 'sdd-gen /breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
          process.exit(1);
        }
        
        // Combine all testing.md content
        console.log(chalk.cyan(`📄 Found ${testingFiles.length} testing file(s):`));
        let combinedContent = `# Test Specification for ${featureName}\n\n`;
        
        for (const file of testingFiles) {
          console.log(chalk.gray(`   - ${file}`));
          const content = await fs.readFile(path.join(productionDir, file), 'utf-8');
          combinedContent += `\n---\n\n## ${file.replace('-testing.md', '').replace(featureName + '-', '')}\n\n${content}\n`;
        }
        
        // Set file extension and script path based on framework
        const frameworkInfo = FRAMEWORKS[framework];
        let testFileName;
        let testScriptPath;
        
        if (framework === 'playwright') {
          testFileName = `${featureName}${frameworkInfo.ext}`;
          testScriptPath = path.join(paths.TESTS_DIR, testFileName);
        } else if (framework === 'phpunit') {
          // Laravel convention: tests/Feature/FeatureNameTest.php
          const className = featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          testFileName = `${className}Test.php`;
          testScriptPath = path.join(paths.TESTS_DIR, 'Feature', testFileName);
        } else if (framework === 'xunit' || framework === 'nunit') {
          // .NET convention: Tests/FeatureNameTests.cs
          const className = featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          testFileName = `${className}Tests.cs`;
          testScriptPath = path.join(paths.TESTS_DIR, testFileName);
        } else if (framework === 'junit') {
          // Java convention: src/test/java/FeatureNameTest.java
          const className = featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          testFileName = `${className}Test.java`;
          testScriptPath = path.join(paths.TESTS_DIR, 'src', 'test', 'java', testFileName);
        } else if (framework === 'pytest') {
          // Python convention: tests/test_feature_name.py
          testFileName = `test_${featureName.replace(/-/g, '_')}.py`;
          testScriptPath = path.join(paths.TESTS_DIR, testFileName);
        } else {
          // Jest (JS/TS)
          testFileName = `${featureName}${frameworkInfo.ext}`;
          testScriptPath = path.join(paths.TESTS_DIR, testFileName);
        }
        
        // Generate test script based on framework
        let testScript;
        if (framework === 'playwright') {
          testScript = generatePlaywrightScript(featureName, combinedContent);
        } else {
          testScript = generateUnitTestScript(featureName, combinedContent, framework);
        }
        
        // Ensure directory exists
        await fs.ensureDir(path.dirname(testScriptPath));
        
        // Write test script
        await fs.writeFile(testScriptPath, testScript, 'utf-8');
        
        console.log(chalk.green(`\n✅ ${frameworkInfo.name} test script created: ${testScriptPath}`));
        
        // Show next steps based on framework
        console.log(chalk.bold.cyan('\n📝 Next steps:'));
        
        switch (framework) {
          case 'playwright':
            console.log(chalk.yellow(`1. Run 'sdd-gen /qa-test-run ${featureName}' to set up and run the test`));
            break;
          case 'phpunit':
            console.log(chalk.yellow(`1. Run 'php artisan test --filter=${featureName}' to run the test`));
            break;
          case 'xunit':
          case 'nunit':
            console.log(chalk.yellow(`1. Run 'dotnet test --filter ${featureName}' to run the test`));
            break;
          case 'junit':
            console.log(chalk.yellow(`1. Run 'mvn test -Dtest=${featureName}Test' to run the test`));
            break;
          case 'pytest':
            console.log(chalk.yellow(`1. Run 'pytest ${testFileName}' to run the test`));
            break;
          case 'jest':
            console.log(chalk.yellow(`1. Run 'npx jest ${featureName}' to run the test`));
            break;
        }
        
      } catch (error) {
        console.error(chalk.red('Error generating test script:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQATestScriptCommand };
