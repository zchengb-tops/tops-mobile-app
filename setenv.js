const fs = require('fs');

const environment = process.argv[2];

if (environment === 'local') {
    fs.copyFileSync('.env.dev', '.env');
    console.log('Local environment set.');
} else if (environment === 'production') {
    fs.copyFileSync('.env.production', '.env');
    console.log('Production environment set.');
} else {
    console.log('No environment set. Defaulting to production.');
    fs.copyFileSync('.env.production', '.env');
}