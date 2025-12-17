#!/bin/bash

# Fix all superAdmin boolean checks in server code

# Fix "if (!ctx.user.superAdmin)" pattern
find server -name "*.ts" -type f -exec sed -i 's/if (!ctx\.user\.superAdmin)/if (ctx.user.superAdmin !== 1)/g' {} \;

# Fix "if (ctx.user.superAdmin)" pattern  
find server -name "*.ts" -type f -exec sed -i 's/if (ctx\.user\.superAdmin)/if (ctx.user.superAdmin === 1)/g' {} \;

# Fix "ctx.user.role === "admin" || ctx.user.superAdmin" pattern
find server -name "*.ts" -type f -exec sed -i 's/ctx\.user\.role === "admin" || ctx\.user\.superAdmin/ctx.user.role === "admin" || ctx.user.superAdmin === 1/g' {} \;

# Fix "Boolean(user.superAdmin)" pattern
find server -name "*.ts" -type f -exec sed -i 's/Boolean(user\.superAdmin)/Boolean(user.superAdmin === 1)/g' {} \;

# Fix filter with superAdmin
find server -name "*.ts" -type f -exec sed -i 's/\.filter((user) => user\.superAdmin)/.filter((user) => user.superAdmin === 1)/g' {} \;

echo "Fixed all superAdmin boolean checks"
