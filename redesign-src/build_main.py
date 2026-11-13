# Puts the new (v6) design on the main page: injects the redesign layer into index.html in place.
# Safe to re-run after editing index.html: old injected blocks are removed first, then fresh ones added.
import os,re
here=os.path.dirname(os.path.abspath(__file__)); root=os.path.dirname(here)
p=os.path.join(root,'index.html'); s=open(p,encoding='utf-8').read()
s=re.sub(r'<style id="redesign-(skin|v6)">.*?</style>\n','',s,flags=re.S)
s=re.sub(r'<script id="redesign-(js|v6-js)">.*?</script>\n','',s,flags=re.S)
rd=lambda n:open(os.path.join(here,n),encoding='utf-8').read()
assert s.count('</head>')==1 and s.count('</body>')==1
s=s.replace('</head>','<style id="redesign-skin">\n'+rd('skin.css')+'\n</style>\n<style id="redesign-v6">\n'+rd('v6base.css')+'\n'+rd('v6extra.css')+'\n</style>\n</head>')
s=s.replace('</body>','<script id="redesign-js">\n'+rd('skin.js')+'\n</script>\n<script id="redesign-v6-js">\n'+rd('v6.js')+'\n</script>\n</body>')
open(p,'w',encoding='utf-8').write(s)
open(os.path.join(root,'new.html'),'w',encoding='utf-8').write('<!doctype html><meta charset="utf-8"><title>Windsor Tracker</title><meta http-equiv="refresh" content="0; url=./"><script>location.replace("./"+location.search+location.hash)</script><a href="./">Windsor Tracker</a>\n')
print('index.html now has the new design ('+str(len(s))+' chars); new.html now redirects to the main page')
