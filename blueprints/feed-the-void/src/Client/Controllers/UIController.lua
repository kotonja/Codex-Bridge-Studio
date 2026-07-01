local ReplicatedStorage = game:GetService("ReplicatedStorage")

local FormatNumbers = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("FormatNumbers"))
local SnackConfig = require(ReplicatedStorage.Shared:WaitForChild("SnackConfig"))

local UIController = {}

local function make(parent, className, name, props)
	local object = Instance.new(className)
	object.Name = name
	for key, value in pairs(props or {}) do
		object[key] = value
	end
	object.Parent = parent
	return object
end

local function styleButton(button, color)
	button.BackgroundColor3 = color or Color3.fromRGB(48, 35, 76)
	button.BorderSizePixel = 0
	button.TextColor3 = Color3.fromRGB(246, 241, 255)
	button.Font = Enum.Font.GothamBold
	button.TextScaled = true
	button.AutoButtonColor = true
end

local function styleLabel(label)
	label.BackgroundTransparency = 0.08
	label.BackgroundColor3 = Color3.fromRGB(18, 14, 28)
	label.BorderSizePixel = 0
	label.TextColor3 = Color3.fromRGB(246, 241, 255)
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.TextWrapped = true
end

function UIController:Init(player, remotes, notificationController)
	self.Player = player
	self.Remotes = remotes
	self.NotificationController = notificationController
	self.Data = nil
	self.SelectedItemId = nil
	self:Build()
	self:WireRemotes()
end

function UIController:Build()
	local playerGui = self.Player:WaitForChild("PlayerGui")
	local function clearMainUi()
		for _, child in ipairs(playerGui:GetChildren()) do
			if child.Name == "MainUI" and child ~= self.Gui then
				child:Destroy()
			end
		end
	end
	clearMainUi()
	task.wait(0.15)
	clearMainUi()
	local gui = make(playerGui, "ScreenGui", "MainUI", {
		ResetOnSpawn = false,
		IgnoreGuiInset = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	})
	gui:SetAttribute("FeedTheVoidPhase15", true)
	self.Gui = gui
	playerGui.ChildAdded:Connect(function(child)
		if child.Name == "MainUI" and child ~= self.Gui then
			task.defer(function()
				if child.Parent then
					child:Destroy()
				end
			end)
		end
	end)
	task.spawn(function()
		for _ = 1, 20 do
			task.wait(0.25)
			clearMainUi()
		end
	end)

	local top = make(gui, "Frame", "TopStats", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.fromScale(0.5, 0.02),
		Size = UDim2.fromScale(0.96, 0.13),
		BackgroundTransparency = 1,
	})
	local topLayout = make(top, "UIListLayout", "Layout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0.01, 0),
	})
	topLayout.SortOrder = Enum.SortOrder.LayoutOrder
	self.CoinLabel = make(top, "TextLabel", "CoinsLabel", { Size = UDim2.fromScale(0.22, 0.78), LayoutOrder = 1, Text = "Coins: 0" })
	self.TokenLabel = make(top, "TextLabel", "VoidTokensLabel", { Size = UDim2.fromScale(0.22, 0.78), LayoutOrder = 2, Text = "Void: 0" })
	self.RebirthLabel = make(top, "TextLabel", "RebirthLabel", { Size = UDim2.fromScale(0.16, 0.78), LayoutOrder = 3, Text = "Rebirths: 0" })
	self.HungerFrame = make(top, "Frame", "VoidHungerBar", { Size = UDim2.fromScale(0.34, 0.78), LayoutOrder = 4, BackgroundColor3 = Color3.fromRGB(24, 14, 36), BorderSizePixel = 0 })
	self.HungerFill = make(self.HungerFrame, "Frame", "Fill", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = Color3.fromRGB(141, 67, 255), BorderSizePixel = 0 })
	self.HungerText = make(self.HungerFrame, "TextLabel", "Text", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "THE VOID 0 / 100", TextColor3 = Color3.fromRGB(255, 255, 255), Font = Enum.Font.GothamBlack, TextScaled = true })
	for _, label in ipairs({ self.CoinLabel, self.TokenLabel, self.RebirthLabel }) do
		styleLabel(label)
	end

	self.EventBanner = make(gui, "TextLabel", "EventBanner", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.fromScale(0.5, 0.15),
		Size = UDim2.fromScale(0.62, 0.055),
		Text = "",
		Visible = false,
	})
	styleLabel(self.EventBanner)
	self.EventBanner.BackgroundColor3 = Color3.fromRGB(60, 31, 92)

	local bottom = make(gui, "Frame", "BottomBar", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.fromScale(0.5, 0.98),
		Size = UDim2.fromScale(0.96, 0.11),
		BackgroundTransparency = 1,
	})
	local bottomLayout = make(bottom, "UIListLayout", "Layout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0.012, 0),
	})
	bottomLayout.SortOrder = Enum.SortOrder.LayoutOrder
	self.InventoryButton = make(bottom, "TextButton", "InventoryButton", { Size = UDim2.fromScale(0.22, 0.82), Text = "Inventory" })
	self.ShopButton = make(bottom, "TextButton", "ShopButton", { Size = UDim2.fromScale(0.2, 0.82), Text = "Shop" })
	self.SeedsButton = make(bottom, "TextButton", "SeedsButton", { Size = UDim2.fromScale(0.22, 0.82), Text = "Seeds" })
	self.MobileActionButton = make(bottom, "TextButton", "MobileActionButton", { Size = UDim2.fromScale(0.3, 0.82), Text = "Find an action" })
	for _, button in ipairs({ self.InventoryButton, self.ShopButton, self.SeedsButton, self.MobileActionButton }) do
		styleButton(button, Color3.fromRGB(44, 34, 70))
	end

	self.Notifications = make(gui, "Frame", "Notifications", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.fromScale(0.985, 0.22),
		Size = UDim2.fromScale(0.32, 0.22),
		BackgroundTransparency = 1,
	})
	make(self.Notifications, "UIListLayout", "Layout", {
		FillDirection = Enum.FillDirection.Vertical,
		HorizontalAlignment = Enum.HorizontalAlignment.Right,
		VerticalAlignment = Enum.VerticalAlignment.Top,
		Padding = UDim.new(0.03, 0),
	})
	self.NotificationController:SetContainer(self.Notifications)

	self.InventoryPanel = self:BuildPanel("InventoryPanel", UDim2.fromScale(0.03, 0.22), UDim2.fromScale(0.4, 0.56), "Inventory")
	self.ShopPanel = self:BuildPanel("SeedShopPanel", UDim2.fromScale(0.56, 0.22), UDim2.fromScale(0.4, 0.46), "Seed Shop")
	self.InventoryPanel.Visible = false
	self.ShopPanel.Visible = false
	self:BuildInventoryContents()
	self:BuildShopContents()

	self.InventoryButton.Activated:Connect(function()
		self:TogglePanel("Inventory")
	end)
	self.SeedsButton.Activated:Connect(function()
		self:TogglePanel("Inventory")
	end)
	self.ShopButton.Activated:Connect(function()
		self:TogglePanel("Shop")
	end)
end

function UIController:BuildPanel(name, position, size, title)
	local panel = make(self.Gui, "Frame", name, {
		Position = position,
		Size = size,
		BackgroundColor3 = Color3.fromRGB(14, 11, 24),
		BackgroundTransparency = 0.04,
		BorderSizePixel = 0,
	})
	make(panel, "TextLabel", "Title", {
		Size = UDim2.fromScale(1, 0.11),
		BackgroundTransparency = 1,
		Text = title,
		TextColor3 = Color3.fromRGB(245, 235, 255),
		Font = Enum.Font.GothamBlack,
		TextScaled = true,
	})
	return panel
end

function UIController:TogglePanel(panelName)
	self.InventoryPanel.Visible = panelName == "Inventory" and not self.InventoryPanel.Visible or false
	self.ShopPanel.Visible = panelName == "Shop" and not self.ShopPanel.Visible or false
end

function UIController:BuildInventoryContents()
	self.InventoryList = make(self.InventoryPanel, "ScrollingFrame", "ItemList", {
		Position = UDim2.fromScale(0.03, 0.13),
		Size = UDim2.fromScale(0.58, 0.83),
		CanvasSize = UDim2.fromScale(0, 0),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollBarThickness = 8,
		BackgroundTransparency = 1,
	})
	make(self.InventoryList, "UIListLayout", "Layout", {
		FillDirection = Enum.FillDirection.Vertical,
		Padding = UDim.new(0, 6),
	})
	self.SelectedLabel = make(self.InventoryPanel, "TextLabel", "SelectedLabel", {
		Position = UDim2.fromScale(0.64, 0.15),
		Size = UDim2.fromScale(0.33, 0.22),
		Text = "Select a snack",
	})
	styleLabel(self.SelectedLabel)
	self.SellButton = make(self.InventoryPanel, "TextButton", "SellButton", { Position = UDim2.fromScale(0.64, 0.42), Size = UDim2.fromScale(0.33, 0.13), Text = "Sell" })
	self.FeedButton = make(self.InventoryPanel, "TextButton", "FeedButton", { Position = UDim2.fromScale(0.64, 0.58), Size = UDim2.fromScale(0.33, 0.13), Text = "Feed Void" })
	self.DisplayButton = make(self.InventoryPanel, "TextButton", "DisplayButton", { Position = UDim2.fromScale(0.64, 0.74), Size = UDim2.fromScale(0.33, 0.13), Text = "Display" })
	for _, button in ipairs({ self.SellButton, self.FeedButton, self.DisplayButton }) do
		styleButton(button, Color3.fromRGB(83, 55, 130))
	end
	self.SellButton.Activated:Connect(function()
		if self.SelectedItemId then
			self.Remotes.RequestSellSnack:FireServer(self.SelectedItemId)
		end
	end)
	self.FeedButton.Activated:Connect(function()
		if self.SelectedItemId then
			self.Remotes.RequestFeedVoid:FireServer(self.SelectedItemId)
		end
	end)
	self.DisplayButton.Activated:Connect(function()
		if self.SelectedItemId then
			self.Remotes.RequestDisplaySnack:FireServer(self.SelectedItemId)
		end
	end)
end

function UIController:BuildShopContents()
	self.ShopList = make(self.ShopPanel, "Frame", "ShopList", {
		Position = UDim2.fromScale(0.04, 0.14),
		Size = UDim2.fromScale(0.92, 0.8),
		BackgroundTransparency = 1,
	})
	make(self.ShopList, "UIListLayout", "Layout", {
		FillDirection = Enum.FillDirection.Vertical,
		Padding = UDim.new(0, 8),
	})
	self.ShopButtons = {}
	for snackId, config in pairs(SnackConfig) do
		local button = make(self.ShopList, "TextButton", snackId, {
			Size = UDim2.fromScale(1, 0.26),
			Text = config.DisplayName .. " - " .. tostring(config.SeedCost) .. " coins",
		})
		styleButton(button, Color3.fromRGB(35, 78, 102))
		button.Activated:Connect(function()
			self.Remotes.RequestBuySeed:FireServer(snackId)
		end)
		self.ShopButtons[snackId] = button
	end
end

function UIController:WireRemotes()
	self.Remotes.SyncPlayerData.OnClientEvent:Connect(function(data)
		self:ApplyData(data)
	end)
	self.Remotes.NotifyClient.OnClientEvent:Connect(function(payload)
		if type(payload) == "table" then
			local nested = payload.Payload or {}
			if nested.OpenPanel == "Inventory" then
				self.InventoryPanel.Visible = true
				self.ShopPanel.Visible = false
			elseif nested.OpenPanel == "Shop" then
				self.ShopPanel.Visible = true
				self.InventoryPanel.Visible = false
			end
			self.NotificationController:Show(payload.Message or "", payload.Kind or "info")
		else
			self.NotificationController:Show(tostring(payload), "info")
		end
	end)
end

function UIController:ApplyData(data)
	self.Data = data or {}
	self.CoinLabel.Text = "Coins: " .. FormatNumbers.Compact(self.Data.Coins or 0)
	self.TokenLabel.Text = "Void: " .. FormatNumbers.Compact(self.Data.VoidTokens or 0)
	self.RebirthLabel.Text = "Rebirths: " .. tostring(self.Data.Rebirths or 0)
	local hunger = tonumber(self.Data.VoidHunger) or 0
	local required = math.max(1, tonumber(self.Data.VoidHungerRequired) or 100)
	self.HungerFill.Size = UDim2.fromScale(math.clamp(hunger / required, 0, 1), 1)
	self.HungerText.Text = ("THE VOID %d / %d"):format(hunger, required)
	if self.Data.ActiveEventName then
		local remaining = math.max(0, (self.Data.ActiveEventEndsAt or os.time()) - os.time())
		self.EventBanner.Visible = true
		self.EventBanner.Text = ("%s active - %ds"):format(self.Data.ActiveEventName, remaining)
	else
		self.EventBanner.Visible = false
	end
	self.SeedsButton.Text = "Seeds: " .. self:SeedSummary()
	self:RefreshInventory()
	self:RefreshShop()
end

function UIController:SeedSummary()
	local seeds = self.Data and self.Data.Seeds or {}
	return ("Cookie %d | Jelly %d | Meteor %d"):format(seeds.CookieRock or 0, seeds.JellyCube or 0, seeds.MeteorMuffin or 0)
end

function UIController:RefreshInventory()
	for _, child in ipairs(self.InventoryList:GetChildren()) do
		if child:IsA("TextButton") then
			child:Destroy()
		end
	end
	local items = self.Data and self.Data.Inventory or {}
	if #items == 0 then
		self.SelectedItemId = nil
		self.SelectedLabel.Text = "Inventory empty"
		return
	end
	local selectedStillExists = false
	for _, item in ipairs(items) do
		if item.UniqueId == self.SelectedItemId then
			selectedStillExists = true
		end
		local button = make(self.InventoryList, "TextButton", "Item_" .. tostring(item.UniqueId), {
			Size = UDim2.fromScale(0.96, 0.18),
			Text = ("%s %s\nSell %s | Void %s"):format(item.MutationName or item.MutationId or "Normal", item.SnackName or item.SnackId or "Snack", FormatNumbers.Compact(item.SellValue or 0), FormatNumbers.Compact(item.VoidValue or 0)),
		})
		styleButton(button, item.UniqueId == self.SelectedItemId and Color3.fromRGB(112, 75, 170) or Color3.fromRGB(37, 29, 58))
		button.Activated:Connect(function()
			self.SelectedItemId = item.UniqueId
			self.SelectedLabel.Text = ("%s %s\nSell %s\nVoid %s"):format(item.MutationName or "", item.SnackName or "", FormatNumbers.Compact(item.SellValue or 0), FormatNumbers.Compact(item.VoidValue or 0))
			self:RefreshInventory()
		end)
	end
	if not selectedStillExists then
		self.SelectedItemId = items[1].UniqueId
		local item = items[1]
		self.SelectedLabel.Text = ("%s %s\nSell %s\nVoid %s"):format(item.MutationName or "", item.SnackName or "", FormatNumbers.Compact(item.SellValue or 0), FormatNumbers.Compact(item.VoidValue or 0))
	end
end

function UIController:RefreshShop()
	local seeds = self.Data and self.Data.Seeds or {}
	for snackId, button in pairs(self.ShopButtons or {}) do
		local config = SnackConfig[snackId]
		button.Text = ("%s - %s coins | Owned %d"):format(config.DisplayName, FormatNumbers.Compact(config.SeedCost), seeds[snackId] or 0)
	end
end

return UIController
