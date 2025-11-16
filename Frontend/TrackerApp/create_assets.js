const fs = require('fs');
const path = require('path');

// Minimal transparent 1x1 PNG
const png = Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 248, 15, 0, 0, 1,
  1, 0, 1, 24, 203, 179, 177, 0, 0, 0, 0, 73, 69, 78, 68, 174,
  66, 96, 130
]);

const dir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const files = [
  'icon.png',
  'android-icon-foreground.png',
  'android-icon-background.png',
  'android-icon-monochrome.png',
  'splash-icon.png',
  'favicon.png'
];

files.forEach(f => {
  fs.writeFileSync(path.join(dir, f), png);
  console.log(`Created ${f}`);
});

console.log('All asset files created!');
