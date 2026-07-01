local Players = game:GetService("Players")

local VoidmiteService = {}

local function firstBasePart(instance)
	if not instance then
		return nil
	end
	if instance:IsA("BasePart") then
		return instance
	end
	return instance:FindFirstChildWhichIsA("BasePart", true)
end

function VoidmiteService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.EconomyService = context.Services.EconomyService
	self.LastSpawnByWorldId = {}
end

function VoidmiteService:Start()
	task.spawn(function()
		while true do
			task.wait(5)
			self:SpawnTick()
		end
	end)
end

function VoidmiteService:CountForPlot(plot)
	local runtime = plot and plot:FindFirstChild("Runtime")
	local folder = runtime and runtime:FindFirstChild("Voidmites")
	return folder and #folder:GetChildren() or 0
end

function VoidmiteService:CleanupPlot(plot)
	local runtime = plot and plot:FindFirstChild("Runtime")
	local folder = runtime and runtime:FindFirstChild("Voidmites")
	if folder then
		folder:ClearAllChildren()
	end
end

function VoidmiteService:SpawnTick()
	for worldId, entry in pairs(self.Context.Services.SnackService:GetDisplayedEntries()) do
		local player = entry.Player
		local model = entry.Model
		if not player.Parent or not model or not model.Parent then
			self.Context.Services.SnackService:GetDisplayedEntries()[worldId] = nil
		else
			local plot = self.Context.Services.PlotService:GetPlot(player)
			if plot and self:CountForPlot(plot) < (self.Config.MaxVoidmitesPerPlot or 8) then
				local passive = self.Context.Services.SnackService:CalculatePassiveIncome(player, entry.Record)
				local interval = math.max(self.Config.MinVoidmiteSpawnInterval or 8, (self.Config.BaseVoidmiteSpawnInterval or 25) - math.clamp(passive / 10, 0, 14))
				local last = self.LastSpawnByWorldId[worldId] or entry.LastVoidmiteAt or 0
				if os.clock() - last >= interval then
					self.LastSpawnByWorldId[worldId] = os.clock()
					self:SpawnVoidmite(player, entry)
				end
			end
		end
	end
end

function VoidmiteService:SpawnInfestation()
	for _, entry in pairs(self.Context.Services.SnackService:GetDisplayedEntries()) do
		self:SpawnVoidmite(entry.Player, entry, true)
	end
end

function VoidmiteService:SpawnVoidmite(owner, displayedEntry, boosted)
	local plot = self.Context.Services.PlotService:GetPlot(owner)
	local runtime = plot and plot:FindFirstChild("Runtime")
	local folder = runtime and runtime:FindFirstChild("Voidmites")
	local snackPart = displayedEntry and displayedEntry.Model and displayedEntry.Model.PrimaryPart
	if not folder or not snackPart then
		return nil
	end
	if self:CountForPlot(plot) >= (self.Config.MaxVoidmitesPerPlot or 8) then
		return nil
	end
	local mite = Instance.new("Part")
	mite.Name = "Voidmite_" .. displayedEntry.Record.WorldId
	mite.Shape = Enum.PartType.Ball
	mite.Size = Vector3.new(2.2, 1.4, 2.2)
	mite.Anchored = true
	mite.CanCollide = false
	mite.Material = Enum.Material.Neon
	mite.Color = Color3.fromRGB(28, 10, 44)
	mite.CFrame = snackPart.CFrame * CFrame.new(math.random(-5, 5), -1, math.random(-5, 5))
	mite:SetAttribute("OwnerUserId", owner.UserId)
	mite:SetAttribute("WorldId", displayedEntry.Record.WorldId)
	mite:SetAttribute("Reward", boosted and 42 or 25)
	mite.Parent = folder
	local light = Instance.new("PointLight")
	light.Color = Color3.fromRGB(150, 75, 255)
	light.Brightness = 0.8
	light.Range = 7
	light.Parent = mite
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "CleanseVoidmitePrompt"
	prompt.ActionText = "Cleanse Voidmite"
	prompt.ObjectText = "Voidmite"
	prompt.HoldDuration = 0.25
	prompt.MaxActivationDistance = self.Config.MaxInteractDistance or 18
	prompt.RequiresLineOfSight = false
	prompt.Parent = mite
	prompt.Triggered:Connect(function(player)
		self:ClearVoidmite(player, mite)
	end)
	return mite
end

function VoidmiteService:ClearVoidmite(player, target)
	local mite = firstBasePart(target)
	if not mite or not mite.Parent or mite:GetAttribute("Cleared") then
		return false
	end
	if not self.Context.Validators.ValidateDistance(player, mite, self.Config.MaxInteractDistance) then
		self.EconomyService:Notify(player, "Move closer to cleanse that Voidmite.", "error")
		return false
	end
	local ownerUserId = mite:GetAttribute("OwnerUserId")
	local reward = math.floor((mite:GetAttribute("Reward") or 25) * self.Context.Services.EventService:GetRewardMultiplier())
	mite:SetAttribute("Cleared", true)
	self.EconomyService:AddCoins(player, reward)
	self.EconomyService:Notify(player, "You cleansed a Voidmite! +" .. reward .. " coins.", "success")
	for _, possibleOwner in ipairs(Players:GetPlayers()) do
		if possibleOwner.UserId == ownerUserId then
			if possibleOwner ~= player then
				local ownerReward = math.max(5, math.floor(reward * 0.6))
				self.EconomyService:AddCoins(possibleOwner, ownerReward)
				self.EconomyService:Notify(possibleOwner, player.Name .. " helped your lab by cleansing a Voidmite! +" .. ownerReward .. " coins.", "success")
				self.EconomyService:Sync(possibleOwner, "voidmiteOwnerReward")
			end
			break
		end
	end
	mite:Destroy()
	self.EconomyService:Sync(player, "voidmiteClear")
	return true
end

return VoidmiteService
