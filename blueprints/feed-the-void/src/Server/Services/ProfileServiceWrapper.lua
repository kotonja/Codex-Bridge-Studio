local DataStoreService = game:GetService("DataStoreService")

local ProfileServiceWrapper = {}
ProfileServiceWrapper.Profiles = {}

local DEFAULT_DATA = {
	Coins = 100,
	VoidTokens = 0,
	Rebirths = 0,
	Seeds = {
		CookieRock = 3,
		JellyCube = 0,
		MeteorMuffin = 0,
	},
	Inventory = {},
	DisplayedSnacks = {},
	Upgrades = {
		Plates = 6,
		GrowSpeed = 1,
		SellMultiplier = 1,
		VoidRewardMultiplier = 1,
	},
	TutorialStep = 1,
	LastLogout = 0,
}

local function deepCopy(value)
	if type(value) ~= "table" then
		return value
	end
	local copy = {}
	for key, child in pairs(value) do
		copy[key] = deepCopy(child)
	end
	return copy
end

local function mergeDefaults(data, defaults)
	for key, value in pairs(defaults) do
		if data[key] == nil then
			data[key] = deepCopy(value)
		elseif type(value) == "table" and type(data[key]) == "table" then
			mergeDefaults(data[key], value)
		end
	end
end

function ProfileServiceWrapper:Init(context)
	self.Context = context
	self.Config = context.Config
	DEFAULT_DATA.Coins = self.Config.StartingCoins or DEFAULT_DATA.Coins
	DEFAULT_DATA.Seeds = deepCopy(self.Config.StartingSeeds or DEFAULT_DATA.Seeds)
	self.Store = nil
	local ok, store = pcall(function()
		return DataStoreService:GetDataStore("FeedTheVoid_Phase15")
	end)
	if ok then
		self.Store = store
	end
end

function ProfileServiceWrapper:LoadPlayer(player)
	if self.Profiles[player] then
		return self.Profiles[player]
	end

	local data
	if self.Store then
		local ok, result = pcall(function()
			return self.Store:GetAsync(tostring(player.UserId))
		end)
		if ok and type(result) == "table" then
			data = result
		elseif not ok and self.Config.DebugMode then
			warn("[FEED THE VOID] DataStore load fallback for", player.Name, result)
		end
	end

	data = type(data) == "table" and data or deepCopy(DEFAULT_DATA)
	mergeDefaults(data, DEFAULT_DATA)
	data.Upgrades.SellMultiplier = 1 + ((data.Rebirths or 0) * (self.Config.RebirthSellBonus or 0.1))
	data.Upgrades.VoidRewardMultiplier = 1 + ((data.Rebirths or 0) * (self.Config.RebirthVoidBonus or 0.1))

	local profile = {
		Player = player,
		Data = data,
		Dirty = true,
		LoadedAt = os.time(),
	}
	self.Profiles[player] = profile
	return profile
end

function ProfileServiceWrapper:GetProfile(player)
	return self.Profiles[player]
end

function ProfileServiceWrapper:MarkDirty(player)
	local profile = self:GetProfile(player)
	if profile then
		profile.Dirty = true
	end
end

function ProfileServiceWrapper:SavePlayer(player)
	local profile = self:GetProfile(player)
	if not profile or not profile.Dirty then
		return
	end
	profile.Data.LastLogout = os.time()
	if self.Store then
		local ok, err = pcall(function()
			self.Store:SetAsync(tostring(player.UserId), profile.Data)
		end)
		if not ok and self.Config.DebugMode then
			warn("[FEED THE VOID] DataStore save failed for", player.Name, err)
		end
	end
	profile.Dirty = false
end

function ProfileServiceWrapper:ReleasePlayer(player)
	self:SavePlayer(player)
	self.Profiles[player] = nil
end

function ProfileServiceWrapper:Start()
	task.spawn(function()
		while true do
			task.wait(60)
			for player in pairs(self.Profiles) do
				self:SavePlayer(player)
			end
		end
	end)
end

return ProfileServiceWrapper
