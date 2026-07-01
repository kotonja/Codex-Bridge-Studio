local Workspace = game:GetService("Workspace")

local PlotService = {}

local function ensureFolder(parent, name)
	local folder = parent:FindFirstChild(name)
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = name
		folder.Parent = parent
	end
	return folder
end

local function ensurePart(parent, name, size, cframe, color, material)
	local part = parent:FindFirstChild(name)
	if not part then
		part = Instance.new("Part")
		part.Name = name
		part.Parent = parent
	end
	part.Anchored = true
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.Material = material or Enum.Material.SmoothPlastic
	return part
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

function PlotService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.Assigned = {}
	self.Plots = {}
	self:EnsureWorld()
end

function PlotService:EnsureWorld()
	local gameWorld = Workspace:FindFirstChild("GameWorld") or ensureFolder(Workspace, "GameWorld")
	local plotsFolder = ensureFolder(gameWorld, "Plots")
	self.GameWorld = gameWorld
	self.PlotsFolder = plotsFolder

	if #plotsFolder:GetChildren() == 0 then
		local count = math.max(4, math.min(8, self.Config.MaxPlayersPerServerTarget or 4))
		for index = 1, count do
			local model = Instance.new("Model")
			model.Name = "Plot_" .. index
			model.Parent = plotsFolder
			local x = ((index - 1) % 4) * 90 - 135
			local z = math.floor((index - 1) / 4) * 90
			local base = ensurePart(model, "Base", Vector3.new(72, 1, 72), CFrame.new(x, 0, z), Color3.fromRGB(44, 37, 58), Enum.Material.Slate)
			model.PrimaryPart = base
			ensurePart(model, "Spawn", Vector3.new(8, 1, 8), CFrame.new(x, 2, z + 28), Color3.fromRGB(110, 72, 180), Enum.Material.Neon)
			ensurePart(model, "DisplayShelf", Vector3.new(28, 2, 8), CFrame.new(x - 18, 2, z - 20), Color3.fromRGB(75, 53, 100), Enum.Material.Slate)
			ensurePart(model, "ShopStation", Vector3.new(10, 2, 10), CFrame.new(x + 24, 2, z - 20), Color3.fromRGB(60, 130, 160), Enum.Material.Neon)
			ensurePart(model, "SellStation", Vector3.new(10, 2, 10), CFrame.new(x + 24, 2, z), Color3.fromRGB(70, 160, 88), Enum.Material.Neon)
			local plates = ensureFolder(model, "Plates")
			for plateIndex = 1, self.Config.PlateCount or 6 do
				local px = x - 24 + ((plateIndex - 1) % 3) * 18
				local pz = z + 6 + math.floor((plateIndex - 1) / 3) * 14
				ensurePart(plates, "Plate_" .. plateIndex, Vector3.new(10, 1, 10), CFrame.new(px, 2, pz), Color3.fromRGB(100, 83, 130), Enum.Material.SmoothPlastic)
			end
		end
	end

	for _, plot in ipairs(plotsFolder:GetChildren()) do
		if plot:IsA("Model") then
			self:EnsurePlotLayout(plot)
			table.insert(self.Plots, plot)
		end
	end
end

function PlotService:EnsurePlotLayout(plot)
	local base = plot:FindFirstChild("Base") or plot.PrimaryPart or plot:FindFirstChildWhichIsA("BasePart", true)
	if not base then
		base = ensurePart(plot, "Base", Vector3.new(72, 1, 72), CFrame.new(), Color3.fromRGB(44, 37, 58), Enum.Material.Slate)
	end
	plot.PrimaryPart = base
	local runtime = ensureFolder(plot, "Runtime")
	ensureFolder(runtime, "Displayed")
	ensureFolder(runtime, "Voidmites")
	local plates = ensureFolder(plot, "Plates")
	local center = base.CFrame
	for index = 1, self.Config.PlateCount or 6 do
		local plate = plates:FindFirstChild("Plate_" .. index) or plates:FindFirstChild("Plate" .. index)
		if not plate then
			local px = -24 + ((index - 1) % 3) * 18
			local pz = 6 + math.floor((index - 1) / 3) * 14
			plate = ensurePart(plates, "Plate_" .. index, Vector3.new(10, 1, 10), center * CFrame.new(px, 2, pz), Color3.fromRGB(100, 83, 130), Enum.Material.SmoothPlastic)
		end
		ensurePrompt(plate, "PlatePrompt", "Plant Snack", "Snack Plate", 0.2, self.Config.MaxInteractDistance or 18)
	end
	local shelf = plot:FindFirstChild("DisplayShelf") or ensurePart(plot, "DisplayShelf", Vector3.new(28, 2, 8), center * CFrame.new(-18, 2, -20), Color3.fromRGB(75, 53, 100), Enum.Material.Slate)
	ensurePrompt(shelf, "DisplayPrompt", "Display Snack", "Display Shelf", 0.2, self.Config.MaxInteractDistance or 18)
	local shop = plot:FindFirstChild("ShopStation") or ensurePart(plot, "ShopStation", Vector3.new(10, 2, 10), center * CFrame.new(24, 2, -20), Color3.fromRGB(60, 130, 160), Enum.Material.Neon)
	ensurePrompt(shop, "BuySeedPrompt", "Buy Seeds", "Seed Shop", 0.2, self.Config.MaxInteractDistance or 18)
	local sell = plot:FindFirstChild("SellStation") or ensurePart(plot, "SellStation", Vector3.new(10, 2, 10), center * CFrame.new(24, 2, 0), Color3.fromRGB(70, 160, 88), Enum.Material.Neon)
	ensurePrompt(sell, "SellPrompt", "Open Inventory", "Snack Market", 0.2, self.Config.MaxInteractDistance or 18)
end

function PlotService:AssignPlot(player)
	if self.Assigned[player] then
		return self.Assigned[player]
	end
	for _, plot in ipairs(self.Plots) do
		local ownerId = plot:GetAttribute("OwnerUserId")
		if not ownerId or ownerId == 0 then
			plot:SetAttribute("OwnerUserId", player.UserId)
			plot:SetAttribute("OwnerName", player.Name)
			self.Assigned[player] = plot
			self:EnsurePlotLayout(plot)
			self:TeleportToPlot(player)
			return plot
		end
	end
	return nil
end

function PlotService:GetPlot(player)
	return self.Assigned[player]
end

function PlotService:GetPlotOwner(plot)
	local ownerId = plot and plot:GetAttribute("OwnerUserId")
	if not ownerId or ownerId == 0 then
		return nil
	end
	for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
		if player.UserId == ownerId then
			return player
		end
	end
	return nil
end

function PlotService:IsOwner(player, object)
	local plot = self:GetPlot(player)
	return plot and object and object:IsDescendantOf(plot)
end

function PlotService:FindNearestPlate(player, wantGrown)
	local plot = self:GetPlot(player)
	if not plot then
		return nil
	end
	local root = self.Context.Validators.GetRoot(player)
	local plates = plot:FindFirstChild("Plates")
	if not root or not plates then
		return nil
	end
	local best, bestDistance
	for _, plate in ipairs(plates:GetChildren()) do
		if plate:IsA("BasePart") then
			local occupied = plate:GetAttribute("Occupied")
			local grown = plate:GetAttribute("Stage") == 3
			if (wantGrown and occupied and grown) or ((not wantGrown) and not occupied) then
				local distance = (root.Position - plate.Position).Magnitude
				if distance <= (self.Config.MaxInteractDistance or 18) and (not bestDistance or distance < bestDistance) then
					best = plate
					bestDistance = distance
				end
			end
		end
	end
	return best
end

function PlotService:GetDisplayShelf(player)
	local plot = self:GetPlot(player)
	return plot and plot:FindFirstChild("DisplayShelf")
end

function PlotService:TeleportToPlot(player)
	local plot = self:GetPlot(player)
	local character = player.Character
	if not plot or not character then
		return
	end
	local spawn = plot:FindFirstChild("Spawn") or plot.PrimaryPart
	local root = character:FindFirstChild("HumanoidRootPart")
	if spawn and root then
		root.CFrame = spawn.CFrame + Vector3.new(0, 5, 0)
	end
end

function PlotService:ClearRuntime(player)
	local plot = self:GetPlot(player)
	if not plot then
		return
	end
	local runtime = plot:FindFirstChild("Runtime")
	if runtime then
		for _, folderName in ipairs({ "Displayed", "Voidmites" }) do
			local folder = runtime:FindFirstChild(folderName)
			if folder then
				folder:ClearAllChildren()
			end
		end
	end
end

function PlotService:ReleasePlot(player)
	local plot = self.Assigned[player]
	if plot then
		self.Context.Services.SnackService:ClearRuntimeForPlayer(player)
		self.Context.Services.VoidmiteService:CleanupPlot(plot)
		plot:SetAttribute("OwnerUserId", 0)
		plot:SetAttribute("OwnerName", "")
	end
	self.Assigned[player] = nil
end

return PlotService
