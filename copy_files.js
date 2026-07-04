const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

const buildWeb = path.join(__dirname, 'build', 'web');
const publicTuktuk = path.join(__dirname, 'public', 'tuktuk');

console.log(`Copying from ${buildWeb} to ${publicTuktuk}...`);
try {
    copyRecursiveSync(buildWeb, publicTuktuk);
    console.log('Copy successful!');
} catch (err) {
    console.error('Copy failed:', err);
    process.exit(1);
}
