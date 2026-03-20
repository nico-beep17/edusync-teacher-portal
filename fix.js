const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.json')) results.push(file);
        }
    });
    return results;
}

walk('.').forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('depaid-logo.svg')) {
        // Only replace exact matches, handling any stray ?v=2
        const regex = /depaid-logo\.svg(\?v=\d+)?/g;
        if (regex.test(content)) {
             content = content.replace(regex, 'depaid-logo-v2.svg');
             fs.writeFileSync(f, content, 'utf8');
             console.log("Updated", f)
        }
    }
});
