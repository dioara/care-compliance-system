#!/usr/bin/env python3
"""
Fix Help Center content:
1. Remove Manus references
2. Fix authentication description (email/password, not OAuth)
3. Convert American spelling to British
4. Use only https://app.ccms.co.uk URL
"""

import re

# Read the file
with open('/home/ubuntu/care-compliance-system/client/src/data/helpContent.ts', 'r') as f:
    content = f.read()

# 1. Fix the authentication section - remove Manus and OAuth references
old_auth = 'Click the "Sign in" button to launch the authentication flow. CCMS uses secure OAuth authentication to protect your account. You\'ll be redirected to the Manus authentication portal where you can sign in with your email address.'
new_auth = 'Enter your email address and password to sign in. CCMS uses secure authentication to protect your account. If you\'ve forgotten your password, click the "Forgot Password" link to reset it.'

content = content.replace(old_auth, new_auth)

# 2. Remove manusvm.computer reference
content = content.replace('- *.manusvm.computer (if applicable)\n', '')

# 3. American to British spelling conversions
spelling_fixes = [
    ('organization', 'organisation'),
    ('Organization', 'Organisation'),
    ('organizations', 'organisations'),
    ('Organizations', 'Organisations'),
    ('organizational', 'organisational'),
    ('color-coded', 'colour-coded'),
    ('color coded', 'colour coded'),
    ('colors', 'colours'),
    ('color', 'colour'),
    ('center', 'centre'),
    ('Center', 'Centre'),
    ('centers', 'centres'),
    ('behavior', 'behaviour'),
    ('behaviors', 'behaviours'),
    ('favor', 'favour'),
    ('favors', 'favours'),
    ('honor', 'honour'),
    ('honors', 'honours'),
    ('license', 'licence'),
    ('licenses', 'licences'),
    ('licensed', 'licenced'),
    ('realize', 'realise'),
    ('realizes', 'realises'),
    ('realized', 'realised'),
    ('recognize', 'recognise'),
    ('recognizes', 'recognises'),
    ('recognized', 'recognised'),
    ('authorize', 'authorise'),
    ('authorizes', 'authorises'),
    ('authorized', 'authorised'),
    ('customize', 'customise'),
    ('customizes', 'customises'),
    ('customized', 'customised'),
    ('customizing', 'customising'),
]

for american, british in spelling_fixes:
    content = content.replace(american, british)

# Write the fixed content
with open('/home/ubuntu/care-compliance-system/client/src/data/helpContent.ts', 'w') as f:
    f.write(content)

print("Help content fixed successfully!")
print("\nChanges made:")
print("1. Fixed authentication description (removed OAuth/Manus, now email/password)")
print("2. Removed manusvm.computer reference")
print("3. Converted American spellings to British")
