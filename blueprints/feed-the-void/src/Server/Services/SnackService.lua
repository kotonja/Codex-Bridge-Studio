local HttpService = game:GetService("HttpService")

local SnackService = {}

local function cloneColor(color)
	return Color3.new(color.R, color.G, color.B)
end

local function firstBasePart(instance)
	if not instance then
		return nil
	end
	if instance:IsA("BasePart") then
		return instance
	end
	return instance:FindFirstChildWhichIsA("BasePart", true)
end

local function ensurePrompt(parent, name, actionText, objectText, holdDuration, maxDistance)
	local prompt = parent:FindFirstChild(name)
	if not prompt then
		prompt = Instance.new("ProximityPrompt")
		prompt.Name = name
		prompt.Parent = parent
	end
	prompt.ActionText = actionText
	prompt.ObjectText = objectText
	prompt.HoldDuration = holdDuration or 0.2
	prompt.MaxActivationDistance = maxDistance or 12
	prompt.RequiresLineOfSight = false
	return prompt
end

function SnackService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.SnackConfig = context.SnackConfig
	self.MutationConfig = context.MutationConfig
	self.ProfileService = context.Services.ProfileServiceWrapper
	self.InventoryService = context.Services.InventoryService
	self.EconomyService = context.Services.EconomyService
	self.ActiveSnacks = {}
	self.DisplayedByWorldId = {}
end

function SnackService:Start()
	self:BindWorldPrompts()
	task.spawn(function()
		while true do
			task.wait(1)
			self:GrowthTick()
		end
	end)
	task.spawn(function()
		while true do
			task.wait(self.Config.BaseDisplayIncomeInterval or 10)
			self:PassiveIncomeTick()
		end
	end)
end

function SnackService:BindWorldPrompts()
	for _, prompt in ipairs(workspace:GetDescendants()) do
		if prompt:IsA("ProximityPrompt") and not prompt:GetAttribute("FeedTheVoidBound") then
			prompt:SetAttribute("FeedTheVoidBound", true)
			if prompt.Name == "PlatePrompt" then
				prompt.Triggered:Connect(function(player)
					local plate = prompt.Parent
					if plate:GetAttribute("Occupied") and plate:GetAttribute("Stage") == 3 then
						self:HarvestSnack(player, plate)
					elseif not plate:GetAttribute("Occupied") then
						self:PlantSnack(player, plate, "CookieRock")
					else
						self.EconomyService:Notify(player, "That snack is still growing.", "info")
					end
				end)
			elseif prompt.Name == "SellPrompt" or prompt.Name == "DisplayPrompt" then
				prompt.Triggered:Connect(function(player)
					self.EconomyService:Notify(player, "Open Inventory and choose Sell, Feed, or Display.", "info", { OpenPanel = "Inventory" })
				end)
			elseif prompt.Name == "BuySeedPrompt" then
				prompt.Triggered:Connect(function(player)
					self.EconomyService:Notify(player, "Open the Seed Shop to buy seeds.", "info", { OpenPanel = "Shop" })
				end)
			end
		end
	end
end

function SnackService:GetGrowTime(snackId)
	local snack = self.SnackConfig[snackId]
	local growTime = snack and snack.GrowTime or 20
	if self.Config.DebugMode and self.Config.DebugFastGrowth then
		return math.max(4, math.floor(growTime / 6))
	end
	return growTime
end

function SnackService:GetPlate(targetOrSnackId)
	if typeof(targetOrSnackId) == "Instance" then
		return firstBasePart(targetOrSnackId)
	end
	return nil
end

function SnackService:ResolvePlantArgs(player, targetOrSnackId, maybeSnackId)
	local plate = self:GetPlate(targetOrSnackId)
	local snackId = maybeSnackId
	if typeof(targetOrSnackId) == "string" then
		snackId = targetOrSnackId
	end
	snackId = snackId or "CookieRock"
	if not plate then
		plate = self.Context.Services.PlotService:FindNearestPlate(player, false)
	end
	return plate, snackId
end

function SnackService:CreateSnackModel(snackId, parent, cframe, stage, mutationId)
	local snack = self.SnackConfig[snackId] or self.SnackConfig.CookieRock
	local mutation = self.MutationConfig[mutationId or "Normal"] or self.MutationConfig.Normal
	local model = Instance.new("Model")
	model.Name = "Growing_" .. snackId
	model.Parent = parent
	local sizeScale = ({ 0.42, 0.72, 1 })[stage] or 1
	sizeScale *= mutation.Scale or 1
	local core = Instance.new("Part")
	core.Name = "SnackCore"
	core.Shape = Enum.PartType.Ball
	core.Size = Vector3.new(3.4, 2.5, 3.4) * sizeScale
	core.Anchored = true
	core.CanCollide = false
	core.Material = mutation.Material or Enum.Material.SmoothPlastic
	core.Color = mutation.Color or cloneColor(snack.Color)
	if stage == 2 and not mutation.Color then
		core.Color = core.Color:Lerp(Color3.new(1, 1, 1), 0.18)
	end
	core.CFrame = cframe + Vector3.new(0, 1.8 + stage * 0.25, 0)
	core.Parent = model
	model.PrimaryPart = core
	if mutationId == "Rainbow" then
		for i = 1, 3 do
			local dot = Instance.new("Part")
			dot.Name = "RainbowDot_" .. i
			dot.Shape = Enum.PartType.Ball
			dot.Size = Vector3.new(0.5, 0.5, 0.5) * sizeScale
			dot.Anchored = true
			dot.CanCollide = false
			dot.Material = Enum.Material.Neon
			dot.Color = ({ Color3.fromRGB(255, 80, 100), Color3.fromRGB(80, 255, 150), Color3.fromRGB(100, 150, 255) })[i]
			dot.CFrame = core.CFrame * CFrame.new((i - 2) * 0.9, 0.55, -0.8)
			dot.Parent = model
		end
	elseif mutationId == "VoidTouched" then
		local light = Instance.new("PointLight")
		light.Name = "VoidGlow"
		light.Color = Color3.fromRGB(145, 78, 255)
		light.Brightness = 1.4
		light.Range = 10
		light.Parent = core
		local particles = Instance.new("ParticleEmitter")
		particles.Name = "VoidMist"
		particles.Rate = 3
		particles.Lifetime = NumberRange.new(0.8, 1.4)
		particles.Speed = NumberRange.new(0.5, 1.2)
		particles.Size = NumberSequence.new(0.45)
		particles.Transparency = NumberSequence.new(0.35, 1)
		particles.Color = ColorSequence.new(Color3.fromRGB(135, 80, 255), Color3.fromRGB(22, 9, 34))
		particles.Parent = core
	end
	return model
end

function SnackService:PlantSnack(player, targetOrSnackId, maybeSnackId)
	local plate, snackId = self:ResolvePlantArgs(player, targetOrSnackId, maybeSnackId)
	local snack = self.Context.Validators.ValidateSnackConfig(snackId)
	if not snack then
		self.EconomyService:Notify(player, "Choose a valid seed.", "error")
		return false
	end
	if not plate or not self.Context.Services.PlotService:IsOwner(player, plate) then
		self.EconomyService:Notify(player, "Stand near one of your empty plates.", "error")
		return false
	end
	if not self.Context.Validators.ValidateDistance(player, plate, self.Config.MaxInteractDistance) then
		self.EconomyService:Notify(player, "Move closer to the plate.", "error")
		return false
	end
	if plate:GetAttribute("Occupied") then
		self.EconomyService:Notify(player, "That plate is already growing a snack.", "error")
		return false
	end
	local profile = self.ProfileService:GetProfile(player)
	if not profile or (profile.Data.Seeds[snackId] or 0) <= 0 then
		self.EconomyService:Notify(player, "You need a " .. snack.DisplayName .. " seed.", "error")
		self.EconomyService:Sync(player, "plantFailed")
		return false
	end
	profile.Data.Seeds[snackId] -= 1
	self.ProfileService:MarkDirty(player)
	local growTime = self:GetGrowTime(snackId)
	local model = self:CreateSnackModel(snackId, plate, plate.CFrame, 1, "Normal")
	plate:SetAttribute("Occupied", true)
	plate:SetAttribute("SnackId", snackId)
	plate:SetAttribute("Stage", 1)
	plate:SetAttribute("PlantedAt", os.clock())
	plate:SetAttribute("GrowTime", growTime)
	plate:SetAttribute("OwnerUserId", player.UserId)
	self.ActiveSnacks[plate] = {
		Player = player,
		SnackId = snackId,
		PlantedAt = os.clock(),
		GrowTime = growTime,
		Stage = 1,
		Model = model,
	}
	local prompt = ensurePrompt(plate, "PlatePrompt", "Growing...", snack.DisplayName, 0.2, self.Config.MaxInteractDistance)
	prompt.Enabled = true
	self.EconomyService:Notify(player, "You planted " .. snack.DisplayName .. "!", "success")
	self.EconomyService:Sync(player, "plant")
	return true
end

function SnackService:GrowthTick()
	for plate, state in pairs(self.ActiveSnacks) do
		if not plate.Parent or not state.Player.Parent then
			self.ActiveSnacks[plate] = nil
		else
			local elapsed = os.clock() - state.PlantedAt
			local progress = math.clamp(elapsed / math.max(1, state.GrowTime), 0, 1)
			local stage = progress >= 1 and 3 or (progress >= 0.5 and 2 or 1)
			if stage ~= state.Stage then
				state.Stage = stage
				plate:SetAttribute("Stage", stage)
				if state.Model then
					state.Model:Destroy()
				end
				state.Model = self:CreateSnackModel(state.SnackId, plate, plate.CFrame, stage, "Normal")
				local prompt = plate:FindFirstChild("PlatePrompt")
				if prompt then
					prompt.ActionText = stage == 3 and "Harvest" or "Growing..."
					prompt.ObjectText = self.SnackConfig[state.SnackId].DisplayName
				end
			end
		end
	end
end

function SnackService:RollMutation()
	local multiplier = self.Context.Services.EventService:GetMutationMultiplier()
	local total = 0
	local weighted = {}
	for _, mutationId in ipairs(self.MutationConfig.Order) do
		local mutation = self.MutationConfig[mutationId]
		local weight = mutation.Weight or 0
		if mutationId ~= "Normal" then
			weight *= multiplier
		end
		total += weight
		table.insert(weighted, { Id = mutationId, Weight = weight })
	end
	local roll = math.random() * total
	local running = 0
	for _, item in ipairs(weighted) do
		running += item.Weight
		if roll <= running then
			return item.Id
		end
	end
	return "Normal"
end

function SnackService:HarvestSnack(player, target)
	local plate = self:GetPlate(target) or self.Context.Services.PlotService:FindNearestPlate(player, true)
	local state = plate and self.ActiveSnacks[plate]
	if not plate or not state or state.Player ~= player then
		self.EconomyService:Notify(player, "Stand near your grown snack.", "error")
		return false
	end
	if not self.Context.Validators.ValidateDistance(player, plate, self.Config.MaxInteractDistance) then
		self.EconomyService:Notify(player, "Move closer to harvest.", "error")
		return false
	end
	if state.Stage < 3 then
		self.EconomyService:Notify(player, "That snack is still growing.", "info")
		return false
	end
	local snackId = state.SnackId
	local mutationId = self:RollMutation()
	local snack = self.SnackConfig[snackId]
	local mutation = self.MutationConfig[mutationId]
	local item = {
		UniqueId = HttpService:GenerateGUID(false),
		SnackId = snackId,
		SnackName = snack.DisplayName,
		MutationId = mutationId,
		MutationName = mutation.DisplayName,
		ValueMultiplier = mutation.ValueMultiplier or 1,
		VoidMultiplier = mutation.VoidMultiplier or 1,
	}
	self.InventoryService:AddItem(player, item)
	if state.Model then
		state.Model:Destroy()
	end
	self.ActiveSnacks[plate] = nil
	plate:SetAttribute("Occupied", false)
	plate:SetAttribute("SnackId", nil)
	plate:SetAttribute("Stage", 0)
	local prompt = plate:FindFirstChild("PlatePrompt")
	if prompt then
		prompt.ActionText = "Plant Snack"
		prompt.ObjectText = "Snack Plate"
	end
	self.EconomyService:Notify(player, "You harvested " .. mutation.DisplayName .. " " .. snack.DisplayName .. "!", "success")
	self.EconomyService:Sync(player, "harvest")
	return true
end

function SnackService:CalculateSellValue(player, item)
	local snack = self.SnackConfig[item.SnackId]
	local mutation = self.MutationConfig[item.MutationId] or self.MutationConfig.Normal
	local base = snack and snack.BaseSellValue or 0
	return math.max(1, math.floor(base * (mutation.ValueMultiplier or 1) * self.EconomyService:GetSellMultiplier(player)))
end

function SnackService:CalculateVoidValue(player, item)
	local snack = self.SnackConfig[item.SnackId]
	local mutation = self.MutationConfig[item.MutationId] or self.MutationConfig.Normal
	local base = snack and snack.BaseVoidValue or 0
	return math.max(1, math.floor(base * (mutation.VoidMultiplier or 1) * self.EconomyService:GetVoidMultiplier(player)))
end

function SnackService:CalculatePassiveIncome(player, record)
	local snack = self.SnackConfig[record.SnackId]
	local mutation = self.MutationConfig[record.MutationId] or self.MutationConfig.Normal
	local base = snack and snack.BaseSellValue or 0
	return math.max(1, math.floor((base * (mutation.ValueMultiplier or 1) * self.EconomyService:GetSellMultiplier(player)) / 10))
end

function SnackService:BuildItemSnapshot(player, item)
	local snapshot = table.clone(item)
	snapshot.SellValue = self:CalculateSellValue(player, item)
	snapshot.VoidValue = self:CalculateVoidValue(player, item)
	return snapshot
end

function SnackService:BuildDisplayedSnapshot(player, record)
	local snapshot = table.clone(record)
	snapshot.PassiveIncome = self:CalculatePassiveIncome(player, record)
	return snapshot
end

function SnackService:SellSnack(player, uniqueId)
	local item = self.InventoryService:RemoveItem(player, uniqueId)
	if not item then
		self.EconomyService:Notify(player, "Select a snack to sell.", "error", { OpenPanel = "Inventory" })
		return false
	end
	local value = self:CalculateSellValue(player, item)
	self.EconomyService:AddCoins(player, value)
	self.EconomyService:Notify(player, "Sold " .. item.MutationName .. " " .. item.SnackName .. " for +" .. value .. " coins!", "success")
	self.EconomyService:Sync(player, "sell")
	return true
end

function SnackService:FeedVoid(player, uniqueId)
	local item = self.InventoryService:RemoveItem(player, uniqueId)
	if not item then
		self.EconomyService:Notify(player, "Select a snack to feed the Void.", "error", { OpenPanel = "Inventory" })
		return false
	end
	local value = self:CalculateVoidValue(player, item)
	self.EconomyService:AddVoidTokens(player, value)
	self.Context.Services.VoidService:AddHunger(player, value, item)
	self.EconomyService:Sync(player, "feedVoid")
	return true
end

function SnackService:DisplaySnack(player, uniqueId, shelf)
	local targetShelf = firstBasePart(shelf) or self.Context.Services.PlotService:GetDisplayShelf(player)
	if not targetShelf or not self.Context.Services.PlotService:IsOwner(player, targetShelf) then
		self.EconomyService:Notify(player, "Stand near your display shelf.", "error")
		return false
	end
	if not self.Context.Validators.ValidateDistance(player, targetShelf, self.Config.MaxInteractDistance) then
		self.EconomyService:Notify(player, "Move closer to the display shelf.", "error")
		return false
	end
	local item = self.InventoryService:RemoveItem(player, uniqueId)
	if not item then
		self.EconomyService:Notify(player, "Select a snack to display.", "error", { OpenPanel = "Inventory" })
		return false
	end
	local record = {
		WorldId = HttpService:GenerateGUID(false),
		SnackId = item.SnackId,
		SnackName = item.SnackName,
		MutationId = item.MutationId,
		MutationName = item.MutationName,
		ValueMultiplier = item.ValueMultiplier,
		VoidMultiplier = item.VoidMultiplier,
	}
	self.InventoryService:AddDisplayed(player, record)
	self:CreateDisplayedModel(player, record)
	self.EconomyService:Notify(player, "Displayed " .. record.MutationName .. " " .. record.SnackName .. "!", "success")
	self.EconomyService:Sync(player, "display")
	return true
end

function SnackService:CreateDisplayedModel(player, record)
	local plot = self.Context.Services.PlotService:GetPlot(player)
	if not plot then
		return nil
	end
	local runtime = plot:FindFirstChild("Runtime")
	local folder = runtime and runtime:FindFirstChild("Displayed")
	local shelf = plot:FindFirstChild("DisplayShelf")
	if not folder or not shelf then
		return nil
	end
	local count = #folder:GetChildren()
	local offset = Vector3.new(-11 + (count % 4) * 7, 3 + math.floor(count / 4) * 4, 0)
	local model = self:CreateSnackModel(record.SnackId, folder, shelf.CFrame + offset, 3, record.MutationId)
	model.Name = "Displayed_" .. record.WorldId
	model:SetAttribute("OwnerUserId", player.UserId)
	model:SetAttribute("WorldId", record.WorldId)
	model:SetAttribute("SnackId", record.SnackId)
	model:SetAttribute("MutationId", record.MutationId)
	local core = model.PrimaryPart
	if core then
		local billboard = Instance.new("BillboardGui")
		billboard.Name = "SnackLabel"
		billboard.Size = UDim2.fromOffset(180, 52)
		billboard.StudsOffset = Vector3.new(0, 3, 0)
		billboard.AlwaysOnTop = true
		billboard.Parent = core
		local label = Instance.new("TextLabel")
		label.BackgroundTransparency = 0.25
		label.BackgroundColor3 = Color3.fromRGB(16, 10, 24)
		label.TextColor3 = Color3.fromRGB(240, 232, 255)
		label.Font = Enum.Font.GothamBold
		label.TextScaled = true
		label.Size = UDim2.fromScale(1, 1)
		label.Text = ("%s %s\n+%d coins/tick"):format(record.MutationName, record.SnackName, self:CalculatePassiveIncome(player, record))
		label.Parent = billboard
	end
	self.DisplayedByWorldId[record.WorldId] = { Player = player, Record = record, Model = model, LastVoidmiteAt = os.clock() }
	return model
end

function SnackService:RestoreDisplayedSnacks(player)
	local profile = self.ProfileService:GetProfile(player)
	if not profile then
		return
	end
	self:ClearRuntimeForPlayer(player)
	for _, record in ipairs(profile.Data.DisplayedSnacks or {}) do
		self:CreateDisplayedModel(player, record)
	end
end

function SnackService:ClearRuntimeForPlayer(player)
	for worldId, entry in pairs(self.DisplayedByWorldId) do
		if entry.Player == player then
			if entry.Model then
				entry.Model:Destroy()
			end
			self.DisplayedByWorldId[worldId] = nil
		end
	end
	local plot = self.Context.Services.PlotService:GetPlot(player)
	if plot then
		local runtime = plot:FindFirstChild("Runtime")
		if runtime then
			local displayed = runtime:FindFirstChild("Displayed")
			if displayed then
				displayed:ClearAllChildren()
			end
		end
	end
end

function SnackService:GetDisplayedEntries()
	return self.DisplayedByWorldId
end

function SnackService:PassiveIncomeTick()
	for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
		local profile = self.ProfileService:GetProfile(player)
		if profile then
			local total = 0
			for _, record in ipairs(profile.Data.DisplayedSnacks or {}) do
				total += self:CalculatePassiveIncome(player, record)
			end
			if total > 0 then
				self.EconomyService:AddCoins(player, total)
				profile.PassiveIncomeTicks = (profile.PassiveIncomeTicks or 0) + 1
				if profile.PassiveIncomeTicks % (self.Config.PassiveIncomeNotifyEvery or 3) == 0 then
					self.EconomyService:Notify(player, "Displayed snacks earned +" .. total .. " coins.", "coins")
				end
				self.EconomyService:Sync(player, "passiveIncome")
			end
		end
	end
end

return SnackService
