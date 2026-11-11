const fs=require('node:fs'),{spawn}=require('node:child_process');
const args=process.argv.slice(2),get=(key,fallback)=>{const i=args.indexOf(key);return i>=0?args[i+1]:fallback;};
let local={};if(fs.existsSync('.sites-runtime/php-preview.json'))local=JSON.parse(fs.readFileSync('.sites-runtime/php-preview.json','utf8'));
const host=get('--host','127.0.0.1'),port=Number(get('--port','8080'));
if(!/^[A-Za-z0-9.:-]+$/.test(host)||!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid preview address');
const server=spawn(process.env.PHP_BINARY||local.php||'php',['-S',host+':'+port,'-t','public','scripts/dev-router.php'],{stdio:'inherit',env:{...process.env,...local.env}});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.kill(signal));server.on('exit',code=>process.exit(code||0));
