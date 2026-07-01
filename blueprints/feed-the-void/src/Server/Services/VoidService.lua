local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local VoidService = {}

local function ensureFolder(parent, name)
	local folder = parent:FindFirstChild(name)
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = name
		folder.Parent = parent
	end
	return folder
end

function VoidService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.Hunger = 0
	self.Required = (self.Config.DebugMode and self.Config.DebugFastVoid) and 35 or (self.Config.VoidHungerRequired or 100)
	self:EnsureVoidPart()
end

function VoidService:EnsureVoidPart()
	local gameWorld = Workspace:FindFirstChild("GameWorld") or ensureFolder(Workspace, "GameWorld")
	local part = gameWorld:FindFirstChild("CentralVoid")
	if not part then
		part = Instance.new("Part")
		part.Name = "CentralVoid"
		part.Shape = Enum.PartType.Ball
		part.Size = Vector3.new(13, 13, 13)
		part.Position = Vector3.new(0, 10, 0)
		part.Anchored = true
		part.CanCollide = false
		part.Material = Enum.Material.Neon
		part.Color = Color3.fromRGB(75, 24, 130)
		part.Parent = gameWorld
	end
	self.VoidPart = part

	local prompt = part:FindFirstChild("FeedVoidPrompt")
	if not prompt then
		prompt = Instance.new("ProximityPrompt")
		prompt.Name = "FeedVoidPrompt"
		prompt.Parent = part
	end
	prompt.ActionText = "Feed Void"
	prompt.ObjectText = "THE VOID"
	prompt.HoldDuration = 0.2
	prompt.MaxActivationDistance = self.Config.MaxInteractDistance or 18
	prompt.RequiresLineOfSight = false
	prompt.Triggered:Connect(function(player)
		self.Context.Services.SnackService:FeedVoid(player)
	end)

	local billboard = part:FindFirstChild("VoidBillboard")
	if not billboard then
		billboard = Instance.new("BillboardGui")
		billboard.Name = "VoidBillboard"
		billboard.Size = UDim2.fromOffset(220, 80)
		billboard.StudsOffset = Vector3.new(0, 10, 0)
		billboard.AlwaysOnTop = true
		billboard.Parent = part
		local text = Instance.new("TextLabel")
		text.Name = "Text"
		text.BackgroundTransparency = 0.25
		text.BackgroundColor3 = Color3.fromRGB(20, 10, 30)
		text.TextColor3 = Color3.fromRGB(222, 190, 255)
		text.Font = Enum.Font.GothamBlack
		text.TextScaled = true
		text.Size = UDim2.fromScale(1, 1)
		text.Parent = billboard
	end
	self:UpdateBillboard()
end

function VoidService:GetVoidPart()
	return self.VoidPart
end

function VoidService:GetHunger()
	return self.Hunger
end

function VoidService:GetRequiredHunger()
	return self.Required
end

function VoidService:UpdateBillboard()
	local text = self.VoidPart and self.VoidPart:FindFirstChild("VoidBillboard") and self.VoidPart.VoidBillboard:FindFirstChild("Text")
	if text then
		text.Text = ("THE VOID\n%d / %d"):format(self.Hunger, self.Required)
	end
end

function VoidService:Pulse()
	if not self.VoidPart then
		return
	end
	local baseSize = Vector3.new(13, 13, 13)
	self.VoidPart.Size = baseSize
	local grow = TweenService:Create(self.VoidPart, TweenInfo.new(0.18, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Size = baseSize * 1.18 })
	local shrink = TweenService:Create(self.VoidPart, TweenInfo.new(0.22), { Size = baseSize })
	grow:Play()
	grow.Completed:Once(function()
		shrink:Play()
	end)
end

function VoidService:AddHunger(player, amount, item)
	local gain = math.max(1, math.floor((tonumber(amount) or 0) + 0.5))
	self.Hunger += gain
	self:Pulse()
	self:UpdateBillboard()
	local economy = self.Context.Services.EconomyService
	if item and (gain >= 60 or item.MutationId == "VoidTouched" or item.MutationId == "Rainbow") then
		economy:NotifyAll(("%s fed the Void a %s %s!"):format(player.Name, item.MutationName or item.MutationId or "strange", item.SnackName or item.SnackId or "snack"), "void")
	else
		economy:Notify(player, "You fed the Void! Hunger +" .. gain .. ".", "void")
	end
	economy:SyncAll("voidHunger")
	if self.Hunger >= self.Required then
		self.Hunger = math.max(0, self.Hunger - self.Required)
		self:UpdateBillboard()
		self.Context.Services.EventService:StartRandomEvent("voidFilled")
	end
end

return VoidService
