// Run with: node --test tests/portfolio.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8');
new vm.Script(source);
const prefix=source.slice(0,source.indexOf('const CATS'));
const {T,hasCaseStudy}=vm.runInNewContext(prefix+'return {T,hasCaseStudy};})();',{document:{}});
test('legacy projects retain direct-link behavior and original spacing',()=>{
 assert.equal(T.project.interactive({title:'Legacy'}),false);
 assert.equal(T.project.href({url:'https://example.com'}),'https://example.com');
 const html=T.project.render({title:'Legacy',url:'https://example.com',tags:''},{id:'legacy'});
 assert.ok(!html.includes('data-project="legacy"'));
 assert.equal(hasCaseStudy({problem:'  ',outcome:''}),false);
});
test('proof adds separate accessible actions and escapes untrusted text',()=>{
 const html=T.project.render({title:'<script>alert(1)</script>',problem:'Need',url:'https://example.com',tags:'Web',image:''},{id:'demo'});
 assert.match(html,/data-project="demo"/);
 assert.match(html,/href="https:\/\/example.com"/);
 assert.match(html,/aria-label="Étude de cas : &lt;script&gt;/);
 assert.ok(!html.includes('<script>'));
});
test('invalid external links never appear in case-study actions',()=>{
 const html=T.project.render({title:'Safe',solution:'Done',url:'javascript:alert(1)',tags:''},{id:'demo'});
 assert.ok(!html.includes('href='));
});
test('project and photo images have alt text and lazy loading',()=>{
 const data={title:'Cover',caption:'Automobile',image:'uploads/car-0.jpg',tags:''};
 assert.match(T.project.render(data,{id:'demo'}),/alt="Cover"/);
 assert.match(T.image.render(data),/alt="Automobile"/);
 assert.match(T.image.render(data),/loading="lazy"/);
 assert.ok(!T.image.render({...data,image:'javascript:alert(1)'}).includes('<img'));
});

