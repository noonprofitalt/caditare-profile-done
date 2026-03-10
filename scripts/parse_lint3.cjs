const fs = require('fs');
try {
    let raw = fs.readFileSync('real_errors.json', 'utf8');
    const data = JSON.parse(raw);
    data.forEach(f => {
        let errors = f.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
            console.log('--- ' + f.filePath + ' ---');
            errors.forEach(m => console.log('Line ' + m.line + ': ' + m.message + ' (' + m.ruleId + ')'));
        }
    });
} catch (e) {
    console.error(e);
}
