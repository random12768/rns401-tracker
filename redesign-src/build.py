# Regenerates ../new.html from ../index.html + skin.css + skin.js. Run: python3 redesign-src/build.py
import os
here=os.path.dirname(os.path.abspath(__file__)); root=os.path.dirname(here)
src=open(os.path.join(root,'index.html'),encoding='utf-8').read()
css=open(os.path.join(here,'skin.css'),encoding='utf-8').read()
js=open(os.path.join(here,'skin.js'),encoding='utf-8').read()
v6css=open(os.path.join(here,'v6base.css'),encoding='utf-8').read()+'\n'+open(os.path.join(here,'v6extra.css'),encoding='utf-8').read()
v6js=open(os.path.join(here,'v6.js'),encoding='utf-8').read()
assert src.count('</head>')==1 and src.count('</body>')==1
out=src.replace('</head>','<style id="redesign-skin">\n'+css+'\n</style>\n<style id="redesign-v6">\n'+v6css+'\n</style>\n</head>')
out=out.replace('</body>','<script id="redesign-js">\n'+js+'\n</script>\n<script id="redesign-v6-js">\n'+v6js+'\n</script>\n</body>')
out=out.replace('<title>Tracker for Windsor University School of Medicine</title>','<title>Windsor Tracker (new design)</title>',1)
open(os.path.join(root,'new.html'),'w',encoding='utf-8').write(out)
print('wrote new.html',len(out))
