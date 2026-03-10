const fs = require('fs');
try {
    let raw = fs.readFileSync('lint_errors_new.json', 'utf8');
    let start = raw.indexOf('[');
    let end = raw.lastIndexOf(']') + 1;
    const data = JSON.parse(raw.substring(start, end));
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
