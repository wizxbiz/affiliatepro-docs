const fs = require('fs');
fs.copyFileSync('assets/images/logo.png', 'android/app/src/main/res/drawable/launch_image.png');
console.log('Done');
