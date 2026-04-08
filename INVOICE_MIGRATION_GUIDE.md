# Invoice Migration for Issue #45 - Execution Guide

## Overview

This guide provides step-by-step instructions for executing the invoice migration script that regenerates all PAID bill invoices using the new modular HTML template from issue #45.

**Status**: Ready for production execution  
**Created**: April 8, 2026  
**Related PR/Issue**: #45 (Refactor Invoice Generation: Modularize & Replace Invoice PDF HTML Template)

---

## What This Migration Does

✅ **In Scope**:
- Fetches all bills with `status = 'success'` (PAID bills only)
- Regenerates invoice PDFs using the new modular template (`invoice-template.ts`)
- Replaces old PDFs in the filesystem (`public/bills/{userId}/{invoiceNo}.pdf`)
- Provides detailed logging for each invoice processed
- Includes comprehensive summary report at completion

❌ **Out of Scope**:
- Unpaid bills (status != 'success')
- Canceled or failed bills
- Customer notification (no emails sent during migration)

---

## Pre-Migration Checklist

- [ ] Backup database or create snapshot
- [ ] Backup the `public/bills/` directory (contains all invoice PDFs)
- [ ] Ensure backend API is built: `npm run build` from `api-source/`
- [ ] Verify Node.js version compatibility (16.x or higher)
- [ ] Check available disk space (requirement depends on bill count)
- [ ] Stop any running Puppeteer instances to avoid port conflicts

---

## Execution Methods

### Method 1: Using ts-node (Recommended for Development)

```bash
cd /www/wwwroot/payxpress-solutions.com/api-source
npx ts-node src/scripts/migrate-invoices.ts
```

**Pros**: Runs directly with TypeScript, no compilation step needed  
**Cons**: Slower execution due to JIT compilation

---

### Method 2: Compile & Run with Node (Recommended for Production)

```bash
cd /www/wwwroot/payxpress-solutions.com/api-source

# Build the whole project (includes migration script)
npm run build

# Run the compiled script
node dist/src/scripts/migrate-invoices.js
```

**Pros**: Faster execution, already compiled  
**Cons**: Requires compilation step

---

### Method 3: Using Bun (If Installed)

```bash
cd /www/wwwroot/payxpress-solutions.com/api-source
bun src/scripts/migrate-invoices.ts
```

**Pros**: Fastest execution  
**Cons**: Requires Bun runtime

---

## Running the Migration

### Step-by-Step Execution

1. **Navigate to backend directory**:
   ```bash
   cd /www/wwwroot/payxpress-solutions.com/api-source
   ```

2. **Run the migration script** (using Method 2 recommended):
   ```bash
   npm run build
   node dist/src/scripts/migrate-invoices.js
   ```

3. **Monitor the output**:
   - Watch for `[MIGRATION]` entries indicating start/completion
   - Each bill processes shows `[PROGRESS]` updates
   - Results display `[SUCCESS]` or `[ERROR]` with details

4. **Review the summary report**:
   - Displayed at script completion
   - Shows success count, failure count, and success rate
   - Lists any failed bills with error reasons

### Example Output

```
[2026-04-08T10:30:15.234Z] MIGRATION: Starting invoice migration for all PAID bills...
[2026-04-08T10:30:15.456Z] INFO: Found 47 PAID bills to process
[2026-04-08T10:30:15.500Z] PROGRESS: Processing 1/47...
[2026-04-08T10:30:18.789Z] PROCESSING: Bill ID: order_123, Invoice: INV-001
[2026-04-08T10:30:22.100Z] ✓ SUCCESS: order_123 (Invoice: INV-001) - PDF regenerated and replaced (old PDF updated)
...
[2026-04-08T10:35:45.234Z] MIGRATION: Invoice migration completed

╔════════════════════════════════════════════════════════════╗
║           INVOICE MIGRATION SUMMARY                        ║
╚════════════════════════════════════════════════════════════╝

Total bills processed: 47
✓ Successful: 47
✗ Failed: 0
  Success rate: 100%

```

---

## Understanding the Report

### Summary Section

- **Total bills processed**: Number of PAID bills found and attempted
- **Successful**: PDFs regenerated successfully
- **Failed**: PDFs that encountered errors during migration
- **Success rate**: Percentage calculation (successful / total)

### Details Section

Shows up to 20 detailed entries with format:
```
✓ order_id_here (20 chars) | Invoice: invoice_no (20 chars) | Action taken
```

Legends:
- `✓` = Success
- `✗` = Failure

---

## Logging and Audit Trail

### Log File Locations

Logs are printed to `stdout`. To capture to a file:

```bash
node dist/src/scripts/migrate-invoices.js | tee migration_$(date +%Y%m%d_%H%M%S).log
```

This creates a timestamped log file in the current directory.

### Log Entry Format

```
[ISO_TIMESTAMP] ACTION_TYPE: Details
```

**Action Types**:
- `MIGRATION`: Script start/completion
- `INFO`: General information (bill count, etc)
- `PROGRESS`: Processing progress indicator
- `PROCESSING`: Individual bill being processed
- `SUCCESS`: Bill migrated successfully
- `ERROR`: Bill failed to migrate
- `FATAL ERROR`: Unrecoverable error (script exits)

### Example Log Entries

```
[2026-04-08T10:30:15.234Z] MIGRATION: Starting invoice migration for all PAID bills...
[2026-04-08T10:30:15.456Z] INFO: Found 47 PAID bills to process
[2026-04-08T10:30:22.100Z] ✓ SUCCESS: order_123 (Invoice: INV-001) - PDF regenerated and replaced (old PDF updated)
[2026-04-08T10:30:25.567Z] ✗ ERROR: order_456 (Invoice: INV-002) - Failed to migrate invoice | Error: ENOENT: no such file or directory, open 'public/bills/user-uuid/INV-002.pdf'
```

---

## Error Handling

### Safe Error Handling

✅ **What the script guarantees**:
- No data is deleted from the database
- Old PDFs are retained if new generation fails
- Individual bill failures don't stop the entire migration
- Failed bills are logged with specific error details
- Clear distinction between transient and permanent failures

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOENT: no such file or directory` | public/bills/{userId}/ doesn't exist | Normal first generation; script creates dirs |
| `Failed to migrate invoice` with Puppeteer error | Puppeteer/Chrome not installed | Ensure `npm install` completed; check Chrome availability |
| `Cannot read property 'cart_items'` | Malformed cart data in bill | Data inconsistency; bill skipped with error log |
| `Database connection timeout` | MySQL connection pool exhausted | Check MySQL server status; reduce concurrent connections |

### Recovery From Partial Failures

If the migration is interrupted or some bills fail:

1. **Identify failed bills** from the summary report
2. **Manual Recovery**:
   - Individual failed bills can be re-migrated by running the script again
   - The script idempotently regenerates all PDFs
   - Previously successful bills are regenerated without issue
3. **No data loss** - The script is safe to re-run multiple times

---

## Rollback Procedure

If issues are discovered after migration:

### Complete Rollback (Restore from Backup)

```bash
# Stop the backend API
pm2 stop payxpress-api

# Restore from backup
cp -r /backup/public/bills/* /path/to/payxpress-solutions.com/public/bills/

# Restart the backend API
pm2 start payxpress-api
pm2 restart payxpress-api
```

### Selective Rollback (Individual Bills)

If only specific bills need to be reverted:

1. Restore specific bill PDFs from backup:
   ```bash
   cp /backup/public/bills/{userId}/{invoiceNo}.pdf \
      /www/wwwroot/payxpress-solutions.com/public/bills/{userId}/
   ```

2. Re-migration of that bill:
   - Modify the script to filter by specific `orderid`
   - Or manually re-generate using the applicable template

---

## Performance Notes

### Execution Time

- **Typical speed**: 2-4 seconds per invoice
- **For 47 paid bills**: ~2-3 minutes total execution time
- **Bottleneck**: Puppeteer PDF generation (not database queries)

### Resource Requirements

- **Memory**: ~200-300 MB (Puppeteer browser instance)
- **CPU**: Variable; uses all available cores for Puppeteer
- **Disk**: Need space for temporary files + new PDFs
- **Database connections**: 1 persistent connection

### Optimization Tips

- Run during low-traffic hours if concerned about resource usage
- Script auto-manages database and browser resources
- No manual cleanup needed after successful completion

---

## Post-Migration Verification

### Verify Migration Success

1. **Check the summary report** for 100% success rate
2. **Sample verification**: Download a few invoices from the UI
   - Navigate to Bills → Download Invoice
   - Verify the new template is applied (visual inspection)
3. **Spot-check PDFs**:
   - Open `public/bills/{userId}/{invoiceNo}.pdf` in a PDF viewer
   - Confirm new template styling is present
4. **Database consistency**: Bills remain marked as `status = 'success'`

### Test a Single Bill Manually

To verify the new invoice template works for a specific bill:

1. Get a bill ID from the database
2. Run a single invoice generation (for testing):
   ```sql
   SELECT orderid, uid, data, carts, gst_percent, gst_amount, gateway_fee, total, billing_address, created_at
   FROM bills
   WHERE status = 'success'
   LIMIT 1;
   ```

3. Manually verify the PDF output matches expectations

---

## Troubleshooting

### Script Won't Start

**Problem**: `Command not found: ts-node` or permission denied

**Solution**:
```bash
# Ensure dependencies are installed
npm install

# Make script executable
chmod +x src/scripts/migrate-invoices.ts

# Try again
npx ts-node src/scripts/migrate-invoices.ts
```

### Port Already in Use (Puppeteer)

**Problem**: `Error: connect ECONNREFUSED` when starting Puppeteer

**Solution**:
```bash
# Kill existing Puppeteer/Chrome processes
pkill -f puppeteer
pkill -f chrome

# Wait a moment, then retry
sleep 5
node dist/src/scripts/migrate-invoices.js
```

### Out of Memory

**Problem**: `Fatal JavaScript out-of-memory`

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max_old_space_size=4096" \
  node dist/src/scripts/migrate-invoices.js
```

### Database Connection Errors

**Problem**: `ER_ACCESS_DENIED_FOR_USER` or `ER_LOCK_WAIT_TIMEOUT`

**Solution**:
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in .env
cat api-source/.env | grep DB_

# Restart MySQL if needed
sudo systemctl restart mysql

# Retry migration
```

### Files Not Found After Migration

**Problem**: PDFs exist but can't be downloaded from UI

**Solution**:
1. Check file permissions:
   ```bash
   ls -la public/bills/{userId}/
   chmod 644 public/bills/{userId}/*.pdf
   ```
2. Verify web server can read the directory:
   ```bash
   chown -R www-data:www-data public/bills/
   ```

---

## FAQ

**Q: Will customer emails be sent during migration?**  
A: No, the script only regenerates PDFs. No notifications are sent. (This mirrors the standalone script behavior mentioned in the original code.)

**Q: Can I run the migration multiple times?**  
A: Yes, the script is idempotent. Running it multiple times is safe and regenerates all PDFs.

**Q: What about unpaid bills?**  
A: Only bills with `status = 'success'` are migrated. Unpaid, canceled, or failed bills are skipped entirely.

**Q: How do I know if a bill was successfully migrated?**  
A: Check the summary report. Successful bills show `✓ SUCCESS` in the output.

**Q: Can I migrate a subset of bills?**  
A: Modify the SQL query in the script to filter by specific criteria (e.g., `WHERE uid = ?` for a specific user).

**Q: What if the script crashes mid-migration?**  
A: Bills processed before the crash have their PDFs regenerated. Re-run the script to process remaining bills. The script is safe to re-run.

**Q: How much disk space do I need?**  
A: Temporary space proportional to the number of bills. Puppeteer may use ~50-100 MB per concurrent browser instance.

**Q: What browser does Puppeteer use?**  
A: Chromium (bundled with Puppeteer). The script handles OS-specific sandbox settings automatically.

---

## Support & Documentation

- **Issue Reference**: #45 (Refactor Invoice Generation: Modularize & Replace Invoice PDF HTML Template)
- **Script Location**: `api-source/src/scripts/migrate-invoices.ts`
- **Compiled Location**: `api-source/dist/src/scripts/migrate-invoices.js`
- **Execution Logs**: Printed to `stdout`

---

## Summary

| Aspect | Details |
|--------|---------|
| **Script Name** | `migrate-invoices.ts` |
| **Purpose** | Regenerate all PAID bill invoices with new template |
| **Scope** | Bills with `status = 'success'` only |
| **Execution** | `npm run build && node dist/src/scripts/migrate-invoices.js` |
| **Estimated Time** | ~2-3 minutes for 47 bills |
| **Safety** | Idempotent, no data deletion on error |
| **Rollback** | Restore from backup if needed |
| **Output** | Timestamped logs + summary report |

---

**Last Updated**: April 8, 2026  
**Status**: Ready for Production  
**Tested**: ✅ Build verification complete
