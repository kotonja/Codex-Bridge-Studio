local Players = game:GetService("Players")

local EconomyService = {}

function EconomyService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.ProfileService = context.Services.ProfileServiceWrapper
	self.Remotes = context.Remotes
end

function EconomyService:GetData(player)
	local profile = self.ProfileService:GetProfile(player)
	return profile and profile.Data
end

function EconomyService:GetSellMultiplier(player)
	local data = self:GetData(player)
	return data and data.Upgrades and data.Upgrades.SellMultiplier or 1
end

function EconomyService:GetVoidMultiplier(player)
	local data = self:GetData(player)
	return data and data.Upgrades and data.Upgrades.VoidRewardMultiplier or 1
end

function EconomyService:AddCoins(player, amount)
	local data = self:GetData(player)
	if not data then
		return 0
	end
	local rounded = math.max(0, math.floor((tonumber(amount) or 0) + 0.5))
	data.Coins += rounded
	self.ProfileService:MarkDirty(player)
	return rounded
end

function EconomyService:SpendCoins(player, amount)
	local data = self:GetData(player)
	local cost = math.max(0, math.floor((tonumber(amount) or 0) + 0.5))
	if not data or data.Coins < cost then
		return false
	end
	data.Coins -= cost
	self.ProfileService:MarkDirty(player)
	return true
end

function EconomyService:AddVoidTokens(player, amount)
	local data = self:GetData(player)
	if not data then
		return 0
	end
	local rounded = math.max(0, math.floor((tonumber(amount) or 0) + 0.5))
	data.VoidTokens += rounded
	self.ProfileService:MarkDirty(player)
	return rounded
end

function EconomyService:BuildSnapshot(player)
	local data = self:GetData(player)
	if not data then
		return nil
	end
	local snackService = self.Context.Services.SnackService
	local eventService = self.Context.Services.EventService
	local snapshot = {
		Coins = data.Coins or 0,
		VoidTokens = data.VoidTokens or 0,
		Rebirths = data.Rebirths or 0,
		Seeds = data.Seeds or {},
		Inventory = {},
		DisplayedSnacks = {},
		Upgrades = data.Upgrades or {},
		VoidHunger = self.Context.Services.VoidService and self.Context.Services.VoidService:GetHunger() or 0,
		VoidHungerRequired = self.Context.Services.VoidService and self.Context.Services.VoidService:GetRequiredHunger() or self.Config.VoidHungerRequired,
		ActiveEventName = eventService and eventService:GetActiveEventName() or nil,
		ActiveEventEndsAt = eventService and eventService:GetActiveEventEndsAt() or nil,
	}
	for _, item in ipairs(data.Inventory or {}) do
		table.insert(snapshot.Inventory, snackService and snackService:BuildItemSnapshot(player, item) or item)
	end
	for _, record in ipairs(data.DisplayedSnacks or {}) do
		table.insert(snapshot.DisplayedSnacks, snackService and snackService:BuildDisplayedSnapshot(player, record) or record)
	end
	return snapshot
end

function EconomyService:Sync(player, reason)
	local snapshot = self:BuildSnapshot(player)
	if snapshot then
		snapshot.Reason = reason or "sync"
		self.Remotes.SyncPlayerData:FireClient(player, snapshot)
	end
end

function EconomyService:SyncAll(reason)
	for _, player in ipairs(Players:GetPlayers()) do
		self:Sync(player, reason)
	end
end

function EconomyService:Notify(player, message, kind, payload)
	self.Remotes.NotifyClient:FireClient(player, {
		Message = tostring(message or ""),
		Kind = kind or "info",
		Payload = payload or {},
	})
end

function EconomyService:NotifyAll(message, kind, payload)
	for _, player in ipairs(Players:GetPlayers()) do
		self:Notify(player, message, kind, payload)
	end
end

return EconomyService
