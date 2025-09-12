#!/usr/bin/env node

/**
 * 发布脚本 - 自动创建标签并触发 GitHub Actions 发布流程
 * 
 * 使用方法：
 * npm run release patch  # 1.0.0 -> 1.0.1
 * npm run release minor  # 1.0.0 -> 1.1.0  
 * npm run release major  # 1.0.0 -> 2.0.0
 * npm run release 1.2.3  # 直接指定版本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  return packageJson.version;
}

function updateVersion(newVersion) {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`✓ 已更新 package.json 版本到 ${newVersion}`, 'green');
}

function calculateNewVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  
  switch (type) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      // 假设是直接指定的版本号
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(`不支持的版本类型: ${type}`);
  }
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✓ ${description}完成`, 'green');
    return output.trim();
  } catch (error) {
    log(`✗ ${description}失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('使用方法:', 'yellow');
    log('  npm run release patch  # 补丁版本 (1.0.0 -> 1.0.1)', 'yellow');
    log('  npm run release minor  # 次要版本 (1.0.0 -> 1.1.0)', 'yellow');
    log('  npm run release major  # 主要版本 (1.0.0 -> 2.0.0)', 'yellow');
    log('  npm run release 1.2.3  # 指定版本', 'yellow');
    process.exit(1);
  }

  const versionType = args[0];
  const currentVersion = getCurrentVersion();
  
  log(`当前版本: ${currentVersion}`, 'blue');
  
  let newVersion;
  try {
    newVersion = calculateNewVersion(currentVersion, versionType);
  } catch (error) {
    log(error.message, 'red');
    process.exit(1);
  }
  
  log(`新版本: ${newVersion}`, 'green');
  
  // 确认发布
  if (!process.env.CI) {
    log('\n确认要发布新版本吗? 这将:', 'yellow');
    log(`  1. 更新 package.json 版本到 ${newVersion}`, 'yellow');
    log('  2. 提交更改到 git', 'yellow');
    log(`  3. 创建标签 v${newVersion}`, 'yellow');
    log('  4. 推送到远程仓库，触发自动发布', 'yellow');
    log('\n按 Ctrl+C 取消，或按 Enter 继续...', 'yellow');
    
    // 简单的暂停等待用户确认
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync('pause', { stdio: 'inherit' });
      } else {
        require('child_process').execSync('read -p ""', { stdio: 'inherit' });
      }
    } catch (error) {
      // 如果命令失败，跳过确认步骤
    }
  }
  
  // 检查工作目录是否干净
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
  } catch (error) {
    log('⚠️  工作目录有未提交的更改，请先提交或暂存', 'yellow');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    console.log(status);
    log('\n继续发布会包含这些更改', 'yellow');
  }
  
  // 更新版本
  updateVersion(newVersion);
  
  // 提交更改
  runCommand('git add package.json', '添加 package.json 到暂存');
  runCommand(`git commit -m "chore: bump version to ${newVersion}"`, '提交版本更新');
  
  // 创建标签
  const tagName = `v${newVersion}`;
  runCommand(`git tag -a ${tagName} -m "Release ${tagName}"`, `创建标签 ${tagName}`);
  
  // 推送到远程
  runCommand('git push origin main', '推送主分支');
  runCommand(`git push origin ${tagName}`, '推送标签');
  
  log('\n🎉 发布流程已启动!', 'green');
  log(`📋 GitHub Actions 将自动构建并发布 ${tagName}`, 'green');
  log(`🔗 查看发布进度: https://github.com/your-username/cocos-creator-extensions/actions`, 'blue');
  log(`🚀 发布完成后可在此查看: https://github.com/your-username/cocos-creator-extensions/releases`, 'blue');
}

if (require.main === module) {
  main();
}
