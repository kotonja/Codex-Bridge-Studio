-- V72 transaction/receipt plugin stub.
-- Node owns local transaction storage; Studio receives already-compiled blueprints and rollback plans.

local ExecutionTransactions = {}

ExecutionTransactions.version = "0.75.0"
ExecutionTransactions.storageOwner = "Node StudioBridge"
ExecutionTransactions.studioRole = "apply and rollback supplied receipt-scoped Codex paths"

return ExecutionTransactions
