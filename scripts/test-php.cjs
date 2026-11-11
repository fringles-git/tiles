const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
for(const file of fs.readdirSync('tests/php').filter(f=>f.endsWith('.test.php'))){const r=spawnSync(process.env.PHP_BINARY||'php',[path.join('tests/php',file)],{stdio:'inherit'});if(r.status!==0)process.exit(1);}
