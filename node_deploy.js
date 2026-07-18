const { execSync } = require('child_process');
try {
    console.log('Starting Hosting Deployment...');
    const output = execSync('npx -y firebase-tools deploy --only hosting --project appinjproject --non-interactive', { encoding: 'utf8' });
    console.log(output);
} catch (error) {
    console.error('Deployment Failed:', error.stdout || error.message);
}
