local RebirthService = {}

local function copySeeds(seeds)
	local copy = {}
	for key, value in pairs(seeds or {}) do
		copy[key] = value
	end
	return copy
end

function RebirthService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.ProfileService = context.Services.ProfileServiceWrapper
	self.EconomyService = context.Services.EconomyService
end

function RebirthService:Rebirth(player)
	local profile = self.ProfileService:GetProfile(player)
	if not profile then
		return false
	end
	local cost = self.Config.RebirthCost or 5000
	if (profile.Data.Coins or 0) < cost then
		self.EconomyService:Notify(player, "Rebirth needs " .. tostring(cost) .. " coins.", "error")
		self.EconomyService:Sync(player, "rebirthFailed")
		return false
	end
	profile.Data.Rebirths = (profile.Data.Rebirths or 0) + 1
	profile.Data.Coins = self.Config.StartingCoins or 100
	profile.Data.Seeds = copySeeds(self.Config.StartingSeeds)
	profile.Data.Inventory = {}
	profile.Data.DisplayedSnacks = {}
	profile.Data.Upgrades = profile.Data.Upgrades or {}
	profile.Data.Upgrades.SellMultiplier = 1 + (profile.Data.Rebirths * (self.Config.RebirthSellBonus or 0.1))
	profile.Data.Upgrades.VoidRewardMultiplier = 1 + (profile.Data.Rebirths * (self.Config.RebirthVoidBonus or 0.1))
	self.Context.Services.SnackService:ClearRuntimeForPlayer(player)
	self.Context.Services.VoidmiteService:CleanupPlot(self.Context.Services.PlotService:GetPlot(player))
	self.ProfileService:MarkDirty(player)
	self.EconomyService:Notify(player, "Rebirth complete! Sell and Void rewards are stronger.", "success")
	self.EconomyService:Sync(player, "rebirth")
	return true
end

return RebirthService
