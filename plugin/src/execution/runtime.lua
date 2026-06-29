-- V72 Production Execution Kernel runtime stub.
-- The active one-file plugin still delegates to the legacy V72 table.

local ExecutionRuntime = {}

ExecutionRuntime.version = "0.75.0"
ExecutionRuntime.capabilities = {
	"codexOwnedBlueprintApply",
	"receiptScopedRollback",
	"verificationReports",
}

return ExecutionRuntime
