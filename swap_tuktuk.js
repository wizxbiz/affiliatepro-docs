const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'build', 'web');
const dest = path.join(__dirname, 'public', 'tuktuk_new');

console.log(`Renaming ${src} to ${dest}...`);
try {
    // Use a recursive delete if destination exists (though rename typically requires it to not exist)
    if (fs.existsSync(dest)) {
        console.log('Destination exists, removing first...');
        fs.rmSync(dest, { recursive: true, force: true });
    }

    // Try to rename
    fs.renameSync(src, dest);
    console.log('Rename successful!');

    // Now rename the old tuktuk to backup and new one to tuktuk
    const oldTuktuk = path.join(__dirname, 'public', 'tuktuk');
    const backupTuktuk = path.join(__dirname, 'public', 'tuktuk_backup');

    if (fs.existsSync(oldTuktuk)) {
        fs.renameSync(oldTuktuk, backupTuktuk);
    }
    fs.renameSync(dest, oldTuktuk);
    console.log('Final switch successful!');

} catch (err) {
    console.error('Operation failed:', err);
    process.exit(1);
}
