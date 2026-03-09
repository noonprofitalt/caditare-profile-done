const fs = require('fs');
let c = fs.readFileSync('components/widgets/InterviewWidget.tsx', 'utf8');
c = c.replace(/^[\r\n]+/, '');
fs.writeFileSync('components/widgets/InterviewWidget.tsx', c, 'utf8');
console.log('Fixed. Starts with:', JSON.stringify(c.substring(0, 40)));
