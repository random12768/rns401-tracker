#!/usr/bin/env python3
"""Bump the site version (major.minor) in index.html and version.json (run by the pre-commit hook).
Major lives in version.json. To start a new major version: set "major" to the new number and "minor" to 0."""
import re,datetime,json,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
try: cur=json.load(open('version.json'))
except Exception: cur={'major':2,'minor':0}
major=int(cur.get('major',2)); minor=int(cur.get('minor',0))+1
now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
s=open('index.html',encoding='utf-8').read()
new="/*APPVER*/const APP_VERSION = {major: %d, minor: %d, built: '%s'};/*ENDVER*/"%(major,minor,now)
s2=re.sub(r'/\*APPVER\*/.*?/\*ENDVER\*/',new,s,count=1)
if s2!=s: open('index.html','w',encoding='utf-8').write(s2)
json.dump({'major':major,'minor':minor,'built':now},open('version.json','w'))
print('stamped version %d.%d %s'%(major,minor,now))
