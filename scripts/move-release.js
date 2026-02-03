const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const version = pkg.version;
const releaseDir = path.join(__dirname, '../release');
const distDir = path.join(__dirname, '../dist');

// 确保 dist 目录存在
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

const filesToMove = [
    'latest.yml',
    `ultraclear-recorder Setup ${version}.exe`
];

filesToMove.forEach(file => {
    const srcPath = path.join(releaseDir, file);
    const destPath = path.join(distDir, file);

    if (fs.existsSync(srcPath)) {
        console.log(`正在移动: ${file} -> ./dist/`);
        fs.copyFileSync(srcPath, destPath);
        console.log(`成功移动: ${file}`);
    } else {
        console.warn(`警告: 未找到文件 ${srcPath}`);
    }
});
