const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'LogBox', 'UI', 'LogBoxImages');
try {
  fs.mkdirSync(dir, { recursive: true });
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buf = Buffer.from(b64, 'base64');
  const files = ['chevron-left.png', 'chevron-right.png', 'close.png', 'alert-triangle.png', 'loader.png'];
  for (const f of files) {
    const filePath = path.join(dir, f);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buf);
    }
  }
} catch (e) {
  // ignore if node_modules is not yet present
}
