local ShopService = {}

function ShopService:Init(context)
	self.Context = context
	self.Config = context.Config
	self.SnackConfig = context.SnackConfig
	self.ProfileService = context.Services.ProfileServiceWrapper
	self.EconomyService = context.Services.EconomyService
end

function ShopService:BuySeed(player, snackId)
	local snack = self.Context.Validators.ValidateSnackConfig(snackId)
	if not snack then
		self.EconomyService:Notify(player, "That seed is not available yet.", "error")
		return false
	end
	local profile = self.ProfileService:GetProfile(player)
	if not profile then
		return false
	end
	local cost = snack.SeedCost or 0
	if not self.EconomyService:SpendCoins(player, cost) then
		self.EconomyService:Notify(player, "Not enough coins for " .. snack.DisplayName .. ".", "error")
		self.EconomyService:Sync(player, "buySeedFailed")
		return false
	end
	profile.Data.Seeds[snackId] = (profile.Data.Seeds[snackId] or 0) + 1
	self.ProfileService:MarkDirty(player)
	self.EconomyService:Notify(player, "Bought " .. snack.DisplayName .. " seed!", "success")
	self.EconomyService:Sync(player, "buySeed")
	return true
end

return ShopService
