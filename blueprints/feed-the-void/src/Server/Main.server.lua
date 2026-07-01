local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local serverFolder = ServerScriptService:WaitForChild("Server")
local servicesFolder = serverFolder:WaitForChild("Services")
local sharedFolder = ReplicatedStorage:WaitForChild("Shared")
local remotesFolder = ReplicatedStorage:WaitForChild("Remotes")

local GameConfig = require(sharedFolder:WaitForChild("GameConfig"))
local SnackConfig = require(sharedFolder:WaitForChild("SnackConfig"))
local MutationConfig = require(sharedFolder:WaitForChild("MutationConfig"))
local EventConfig = require(sharedFolder:WaitForChild("EventConfig"))

local remoteNames = {
	"RequestPlantSnack",
	"RequestHarvestSnack",
	"RequestSellSnack",
	"RequestFeedVoid",
	"RequestDisplaySnack",
	"RequestClearVoidmite",
	"RequestBuySeed",
	"RequestRebirth",
	"NotifyClient",
	"SyncPlayerData",
}

local remotes = {}
for _, remoteName in ipairs(remoteNames) do
	local remote = remotesFolder:FindFirstChild(remoteName)
	if not remote then
		remote = Instance.new("RemoteEvent")
		remote.Name = remoteName
		remote.Parent = remotesFolder
	end
	remotes[remoteName] = remote
end

local serviceOrder = {
	"ProfileServiceWrapper",
	"AnalyticsService",
	"InventoryService",
	"EconomyService",
	"PlotService",
	"EventService",
	"VoidService",
	"SnackService",
	"VoidmiteService",
	"ShopService",
	"RebirthService",
	"VisitRewardService",
}

local services = {}
local context = {
	Config = GameConfig,
	SnackConfig = SnackConfig,
	MutationConfig = MutationConfig,
	EventConfig = EventConfig,
	Remotes = remotes,
	Services = services,
}

local Validators = {}
context.Validators = Validators

function Validators.ValidatePlayerProfile(player)
	local profileService = services.ProfileServiceWrapper
	local profile = profileService and profileService:GetProfile(player)
	if not profile then
		return nil, "profileMissing"
	end
	return profile
end

function Validators.ValidatePlayerPlot(player)
	local plotService = services.PlotService
	local plot = plotService and plotService:GetPlot(player)
	if not plot then
		return nil, "plotMissing"
	end
	return plot
end

function Validators.ValidateInventoryItem(player, uniqueId)
	local inventoryService = services.InventoryService
	if not inventoryService then
		return nil, "inventoryServiceMissing"
	end
	local item = inventoryService:FindItem(player, uniqueId)
	if not item then
		return nil, "itemMissing"
	end
	return item
end

function Validators.ValidateSeed(player, snackId)
	local profile, profileError = Validators.ValidatePlayerProfile(player)
	if not profile then
		return nil, profileError
	end
	if typeof(snackId) ~= "string" or not SnackConfig[snackId] then
		return nil, "invalidSeed"
	end
	if (profile.Data.Seeds[snackId] or 0) <= 0 then
		return nil, "seedMissing"
	end
	return true
end

function Validators.ValidateSnackConfig(snackId)
	if typeof(snackId) ~= "string" or not SnackConfig[snackId] then
		return nil, "invalidSnack"
	end
	return SnackConfig[snackId]
end

function Validators.ValidateWorldObject(instance, expectedType)
	if typeof(instance) ~= "Instance" or not instance:IsDescendantOf(workspace) then
		return nil, "invalidWorldObject"
	end
	if expectedType and not instance:IsA(expectedType) then
		return nil, "wrongWorldObjectType"
	end
	return instance
end

function Validators.GetRoot(player)
	local character = player.Character
	return character and character:FindFirstChild("HumanoidRootPart")
end

function Validators.ValidateDistance(player, target, maxDistance)
	local root = Validators.GetRoot(player)
	if not root then
		return nil, "characterMissing"
	end

	local position
	if typeof(target) == "Instance" then
		if target:IsA("BasePart") then
			position = target.Position
		elseif target:IsA("Model") then
			position = target:GetPivot().Position
		elseif target:IsA("Attachment") then
			position = target.WorldPosition
		else
			local part = target:FindFirstChildWhichIsA("BasePart", true)
			position = part and part.Position
		end
	elseif typeof(target) == "Vector3" then
		position = target
	end

	if not position then
		return nil, "targetPositionMissing"
	end

	local distance = (root.Position - position).Magnitude
	if distance > (maxDistance or GameConfig.MaxInteractDistance or 18) then
		return nil, "tooFar"
	end
	return true
end

local lastRemoteUse = {}
local function passesCooldown(player, remoteName)
	local now = os.clock()
	local userBucket = lastRemoteUse[player.UserId]
	if not userBucket then
		userBucket = {}
		lastRemoteUse[player.UserId] = userBucket
	end
	local cooldown = (GameConfig.RemoteCooldowns and GameConfig.RemoteCooldowns[remoteName]) or GameConfig.RemoteCooldown or 0.25
	local previous = userBucket[remoteName] or 0
	if now - previous < cooldown then
		return false
	end
	userBucket[remoteName] = now
	return true
end

local function bindRemote(remoteName, callback)
	remotes[remoteName].OnServerEvent:Connect(function(player, ...)
		if not passesCooldown(player, remoteName) then
			return
		end
		local ok, err = pcall(callback, player, ...)
		if not ok then
			warn(("[FEED THE VOID] %s failed for %s: %s"):format(remoteName, player.Name, tostring(err)))
			local economy = services.EconomyService
			if economy then
				economy:Notify(player, "That action failed. Try again nearby.", "error")
			end
		end
	end)
end

for _, serviceName in ipairs(serviceOrder) do
	local moduleScript = servicesFolder:WaitForChild(serviceName)
	services[serviceName] = require(moduleScript)
end

for _, serviceName in ipairs(serviceOrder) do
	local service = services[serviceName]
	if service.Init then
		service:Init(context)
	end
end

bindRemote("RequestPlantSnack", function(player, targetOrSnackId, maybeSnackId)
	services.SnackService:PlantSnack(player, targetOrSnackId, maybeSnackId)
end)

bindRemote("RequestHarvestSnack", function(player, target)
	services.SnackService:HarvestSnack(player, target)
end)

bindRemote("RequestSellSnack", function(player, uniqueId)
	services.SnackService:SellSnack(player, uniqueId)
end)

bindRemote("RequestFeedVoid", function(player, uniqueId)
	services.SnackService:FeedVoid(player, uniqueId)
end)

bindRemote("RequestDisplaySnack", function(player, uniqueId, shelf)
	services.SnackService:DisplaySnack(player, uniqueId, shelf)
end)

bindRemote("RequestClearVoidmite", function(player, voidmite)
	services.VoidmiteService:ClearVoidmite(player, voidmite)
end)

bindRemote("RequestBuySeed", function(player, snackId)
	services.ShopService:BuySeed(player, snackId)
end)

bindRemote("RequestRebirth", function(player)
	services.RebirthService:Rebirth(player)
end)

for _, serviceName in ipairs(serviceOrder) do
	local service = services[serviceName]
	if service.Start then
		service:Start()
	end
end

Players.PlayerAdded:Connect(function(player)
	services.ProfileServiceWrapper:LoadPlayer(player)
	services.AnalyticsService:Track(player, "join")
	services.PlotService:AssignPlot(player)
	services.SnackService:RestoreDisplayedSnacks(player)
	services.VisitRewardService:MaybeGrant(player)
	services.EconomyService:Sync(player, "join")

	player.CharacterAdded:Connect(function()
		task.wait(0.2)
		services.PlotService:TeleportToPlot(player)
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	services.AnalyticsService:Track(player, "leave")
	services.PlotService:ReleasePlot(player)
	services.ProfileServiceWrapper:ReleasePlayer(player)
	lastRemoteUse[player.UserId] = nil
end)

for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(function()
		services.ProfileServiceWrapper:LoadPlayer(player)
		services.PlotService:AssignPlot(player)
		services.SnackService:RestoreDisplayedSnacks(player)
		services.EconomyService:Sync(player, "bootstrap")
	end)
end

print("[FEED THE VOID] Phase 1.5 server loaded.")
