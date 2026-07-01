local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local EventService = {}

local function ensureFolder(parent, name)
	local folder = parent:FindFirstChild(name)
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = name
		folder.Parent = parent
	end
	return folder
end

function EventService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.EventConfig = context.EventConfig
	self.ActiveEventName = nil
	self.ActiveEventEndsAt = nil
	self.EventFolder = ensureFolder(Workspace:FindFirstChild("GameWorld") or Workspace, "VoidEventObjects")
end

function EventService:GetActiveEventName()
	return self.ActiveEventName
end

function EventService:GetActiveEventEndsAt()
	return self.ActiveEventEndsAt
end

function EventService:IsActive(name)
	return self.ActiveEventName == name and self.ActiveEventEndsAt and os.time() < self.ActiveEventEndsAt
end

function EventService:GetMutationMultiplier()
	if self:IsActive("MutationSurge") then
		return self.EventConfig.MutationSurge.MutationWeightMultiplier or 3
	end
	return 1
end

function EventService:GetRewardMultiplier()
	if self:IsActive("VoidInfestation") then
		return self.EventConfig.VoidInfestation.RewardMultiplier or 1.35
	end
	return 1
end

function EventService:StartRandomEvent(reason)
	local options = { "SnackRain", "MutationSurge", "VoidInfestation" }
	return self:StartEvent(options[math.random(1, #options)], reason)
end

function EventService:StartEvent(name, reason)
	if self.ActiveEventName then
		return false, "eventAlreadyActive"
	end
	local config = self.EventConfig[name]
	if not config then
		return false, "unknownEvent"
	end
	self.ActiveEventName = name
	self.ActiveEventEndsAt = os.time() + (config.Duration or 45)
	self.EventFolder:ClearAllChildren()
	self.Context.Services.EconomyService:NotifyAll(config.DisplayName .. " has started!", "event", {
		EventName = name,
		EndsAt = self.ActiveEventEndsAt,
		Reason = reason,
	})
	self.Context.Services.EconomyService:SyncAll("eventStart")

	if name == "SnackRain" then
		self:StartSnackRain()
	elseif name == "VoidInfestation" then
		self.Context.Services.VoidmiteService:SpawnInfestation()
	end

	task.delay(config.Duration or 45, function()
		if self.ActiveEventName == name then
			self:EndEvent(name)
		end
	end)
	return true
end

function EventService:StartSnackRain()
	local central = self.Context.Services.VoidService and self.Context.Services.VoidService:GetVoidPart()
	local origin = central and central.Position or Vector3.new(0, 5, 0)
	local count = math.min(self.Config.EventObjectLimit or 24, 18)
	for index = 1, count do
		local crumb = Instance.new("Part")
		crumb.Name = "SnackRainCrumb_" .. index
		crumb.Shape = Enum.PartType.Ball
		crumb.Size = Vector3.new(1.6, 1.6, 1.6)
		crumb.Anchored = true
		crumb.CanCollide = false
		crumb.Material = Enum.Material.Neon
		crumb.Color = Color3.fromRGB(255, 170 + math.random(0, 60), 80)
		local angle = (math.pi * 2) * (index / count)
		local radius = 16 + math.random(0, 30)
		crumb.Position = origin + Vector3.new(math.cos(angle) * radius, 2 + math.random(), math.sin(angle) * radius)
		crumb.Parent = self.EventFolder
		local prompt = Instance.new("ProximityPrompt")
		prompt.Name = "CollectSnackRainPrompt"
		prompt.ActionText = "Collect Snack"
		prompt.ObjectText = "Snack Rain"
		prompt.MaxActivationDistance = 12
		prompt.HoldDuration = 0
		prompt.RequiresLineOfSight = false
		prompt.Parent = crumb
		local collected = false
		local function collect(player)
			if collected or not player or not player.Parent then
				return
			end
			collected = true
			local reward = math.random(12, 28)
			self.Context.Services.EconomyService:AddCoins(player, reward)
			if math.random() < 0.2 then
				local profile = self.Context.Services.ProfileServiceWrapper:GetProfile(player)
				if profile then
					profile.Data.Seeds.CookieRock = (profile.Data.Seeds.CookieRock or 0) + 1
					self.Context.Services.ProfileServiceWrapper:MarkDirty(player)
				end
			end
			self.Context.Services.EconomyService:Notify(player, "Collected Snack Rain for +" .. reward .. " coins!", "success")
			self.Context.Services.EconomyService:Sync(player, "snackRainCollect")
			crumb:Destroy()
		end
		prompt.Triggered:Connect(collect)
	end
end

function EventService:EndEvent(name)
	if self.ActiveEventName ~= name then
		return
	end
	local config = self.EventConfig[name] or { DisplayName = name }
	self.ActiveEventName = nil
	self.ActiveEventEndsAt = nil
	self.EventFolder:ClearAllChildren()
	self.Context.Services.EconomyService:NotifyAll(config.DisplayName .. " has ended.", "event")
	self.Context.Services.EconomyService:SyncAll("eventEnd")
end

return EventService
