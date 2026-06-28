-- V72 Production Execution Kernel schema stub.
-- Runtime behavior remains in legacy until the modular extraction pass moves it here.

local ExecutionSchema = {}

ExecutionSchema.version = "0.73.0"
ExecutionSchema.workspaceRoots = {
	"Workspace.CodexProduction",
	"Workspace.CodexWorldgen",
	"Workspace.CodexAssetForge",
	"Workspace.CodexCinematicDirector",
	"Workspace.CodexQaSwarm",
	"Workspace.CodexAutopilot",
	"Workspace.CodexExecutionKernel",
}

ExecutionSchema.replicatedRoots = {
	"ReplicatedStorage.CodexExecutionKernel",
	"ReplicatedStorage.CodexProductionManifests",
}

return ExecutionSchema
