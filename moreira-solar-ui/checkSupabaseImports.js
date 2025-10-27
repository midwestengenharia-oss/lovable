import fs from "fs";
import path from "path";

const projectDir = path.resolve("./src"); // ajusta se o código estiver fora de /src

const targetPatterns = [
    "createClient",
    "import { supabase",
    "import supabase",
    "from '@supabase/supabase-js'",
    "from '@/integrations/supabase/client'",
    "from '../../integrations/supabase/client'",
];

function searchFiles(dir) {
    const results = [];

    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            results.push(...searchFiles(fullPath));
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
            const content = fs.readFileSync(fullPath, "utf8");
            for (const pattern of targetPatterns) {
                if (content.includes(pattern)) {
                    results.push({ file: fullPath, pattern });
                }
            }
        }
    }

    return results;
}


const matches = searchFiles(projectDir);

if (matches.length === 0) {
} else {
    const grouped = matches.reduce((acc, m) => {
        acc[m.file] = acc[m.file] || [];
        acc[m.file].push(m.pattern);
        return acc;
    }, {});

    for (const [file, patterns] of Object.entries(grouped)) {
        for (const p of patterns) console.log(`   → ${p}`);
    }
}

