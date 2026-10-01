#!/usr/bin/env python3
"""Stamp the site version into index.html and version.json (run by the pre-commit hook)."""
import re,subprocess,datetime,json,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
n=int(subprocess.check_output(['git','rev-list','--count','HEAD']).decode().strip())+1
now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
s=open('index.html',encoding='utf-8').read()
new="/*APPVER*/const APP_VERSION = {n: %d, built: '%s'};/*ENDVER*/"%(n,now)
s2=re.sub(r'/\*APPVER\*/.*?/\*ENDVER\*/',new,s,count=1)
if s2!=s: open('index.html','w',encoding='utf-8').write(s2)
json.dump({'n':n,'built':now},open('version.json','w'))
print('stamped version',n,now)
