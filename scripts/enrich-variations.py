"""
Enrich lib/orders-data.json with `productName` and `variation` fields
derived from a WooCommerce order CSV export.

Usage:
    python scripts/enrich-variations.py <path-to-order-export.csv>

Joins each order to the CSV by order number and extracts the course
variation (Comprehensive, Extended, Full Package, ...) from the primary
line-item product name.
"""
import csv, re, json, sys, os
from collections import Counter

if len(sys.argv) < 2:
    sys.exit("usage: python scripts/enrich-variations.py <order-export.csv>")

CSV = sys.argv[1]
JSON = os.path.join(os.path.dirname(__file__), '..', 'lib', 'orders-data.json')

def clean(name):
    # strip HTML font tags and entities, collapse whitespace
    name=re.sub(r'<[^>]+>','',name)
    name=re.sub(r'\s+',' ',name).strip()
    return name

# order_number -> cleaned primary product name
name_by_num={}
with open(CSV, encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        v=row.get('line_item_1') or ''
        m=re.match(r'name:(.*?)\|', v)
        name_by_num[row['order_number'].strip()]=clean(m.group(1)) if m else ''

# Ordered variation keyword rules: (regex, label). First match wins.
RULES=[
    (r'comprehensive', 'Comprehensive'),
    (r'extended', 'Extended'),
    (r'mastery', 'Mastery'),
    (r'complete package', 'Complete'),
    (r'core package', 'Core'),
    (r'advanced', 'Advanced'),
    (r'beginner', 'Beginner'),
    (r'crash', 'Crash'),
    (r'\bregular\b', 'Regular'),
    (r'full package|full course', 'Full Package'),
    (r'pre[- ]?recorded|prerecorded', 'Pre-Recorded'),
    (r'bundle', 'Bundle'),
    (r'mock exam', 'Mock Exam'),
    (r'booklet', 'Booklet'),
    (r'lecture only', 'Lecture Only'),
    (r'self[- ]?study', 'Self-Study'),
    (r'payment plan|payments|remaining payment', 'Payment Plan'),
    (r'\bskills\b', 'Skills'),
    (r'work check', 'Work Check'),
    (r'consult', 'Consultation'),
]

def variation(name):
    low=name.lower()
    for pat,label in RULES:
        if re.search(pat, low):
            return label
    return 'Standard'

orders=json.load(open(JSON))
dist=Counter()
for o in orders:
    num=o['orderId'].lstrip('#').strip()
    pname=name_by_num.get(num,'')
    o['productName']=pname
    o['variation']=variation(pname)
    dist[o['variation']]+=1

json.dump(orders, open(JSON,'w'), ensure_ascii=False, indent=None)
print('enriched', len(orders), 'orders')
print('variation distribution:')
for k,c in dist.most_common():
    print(f'{c:5d}  {k}')
# show a few examples
print('\nexamples:')
for o in orders[:6]:
    print(f"  {o['orderId']}  {o['course']:16s} -> {o['variation']:14s} | {o['productName']}")
