#!/bin/bash

# Fix all boolean to tinyint field conversions in server code

echo "Fixing boolean fields in server code..."

# Fix isActive fields
find server -name "*.ts" -type f -exec sed -i 's/isActive: true/isActive: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/isActive: false/isActive: 0/g' {} \;

# Fix isDefault fields
find server -name "*.ts" -type f -exec sed -i 's/isDefault: true/isDefault: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/isDefault: false/isDefault: 0/g' {} \;

# Fix receiveComplianceAlerts fields
find server -name "*.ts" -type f -exec sed -i 's/receiveComplianceAlerts: true/receiveComplianceAlerts: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/receiveComplianceAlerts: false/receiveComplianceAlerts: 0/g' {} \;

# Fix receiveAuditReminders fields
find server -name "*.ts" -type f -exec sed -i 's/receiveAuditReminders: true/receiveAuditReminders: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/receiveAuditReminders: false/receiveAuditReminders: 0/g' {} \;

# Fix receiveIncidentAlerts fields
find server -name "*.ts" -type f -exec sed -i 's/receiveIncidentAlerts: true/receiveIncidentAlerts: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/receiveIncidentAlerts: false/receiveIncidentAlerts: 0/g' {} \;

# Fix resolved fields
find server -name "*.ts" -type f -exec sed -i 's/resolved: true/resolved: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/resolved: false/resolved: 0/g' {} \;

# Fix reported* fields
find server -name "*.ts" -type f -exec sed -i 's/reportedToCouncil: true/reportedToCouncil: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToCouncil: false/reportedToCouncil: 0/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToCqc: true/reportedToCqc: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToCqc: false/reportedToCqc: 0/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToIco: true/reportedToIco: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToIco: false/reportedToIco: 0/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToPolice: true/reportedToPolice: 1/g' {} \;
find server -name "*.ts" -type f -exec sed -i 's/reportedToPolice: false/reportedToPolice: 0/g' {} \;

echo "Fixed all boolean to tinyint conversions"
