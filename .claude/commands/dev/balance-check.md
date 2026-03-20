Run the data validation suite to check JSON data integrity.

Steps:
1. Import and call `validateData()` from `src/data/dataLoader.ts`
2. Report any errors: duplicate IDs, missing fields, invalid keywords, bad costs/HP, broken starter deck references
3. If errors found, list each one with the affected file and suggest fixes
4. If no errors, confirm all data is valid

You can run this via: `npx vitest run src/data/dataLoader.test.ts`
