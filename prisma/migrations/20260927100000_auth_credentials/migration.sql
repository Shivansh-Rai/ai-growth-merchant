-- Phase 3.8: credentials for Merchant and Customer.
--
-- Hand-written. Both columns are NULLABLE: the tables are already populated,
-- the seed backfills hashes, and a row with a NULL hash simply cannot log in.
-- Merchant and Customer credentials stay in separate tables (INV-7).

ALTER TABLE "merchants" ADD COLUMN "passwordHash" TEXT;

ALTER TABLE "customers" ADD COLUMN "passwordHash" TEXT;
