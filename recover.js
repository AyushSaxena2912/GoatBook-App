const fs = require('fs');

const logPath = '/Users/ayushsaxena/.gemini/antigravity-ide/brain/c9f594d6-714f-41cf-9d54-5561b748b38c/.system_generated/logs/transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');

const lines = content.split('\n');
const filesToRecover = ['AnimalIcon.js', 'MatingIcon.js', 'BreedIcon.js', 'BreedingIcon.js'];

for (const line of lines) {
    if (!line) continue;
    try {
        const entry = JSON.parse(line);
        if (entry.tool_calls) {
            for (const call of entry.tool_calls) {
                if (call.name === 'write_to_file' || call.name === 'multi_replace_file_content') {
                    const args = call.args;
                    for (const file of filesToRecover) {
                        if (args && args.TargetFile && args.TargetFile.includes(file)) {
                            if (args.CodeContent) {
                                fs.writeFileSync('./frontend/src/components/' + file, args.CodeContent);
                                console.log('Recovered ' + file);
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
    }
}
