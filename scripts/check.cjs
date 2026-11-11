const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const php=process.env.PHP_BINARY||'php';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=['public','src','scripts','tests','config'].flatMap(walk).filter(f=>f.endsWith('.php')&&!f.endsWith('config/config.php')||/\.(?:js|cjs)$/.test(f));
for(const file of files){const phpFile=file.endsWith('.php');const r=spawnSync(phpFile?php:process.execPath,[phpFile?'-l':'--check',file],{encoding:'utf8'});if(r.status!==0){console.error(r.stderr||r.stdout||r.error?.message);process.exit(1);}}
console.log('Syntax checks passed for '+files.length+' PHP/JS files.');
