local HttpService = game:GetService("HttpService")

local InventoryService = {}

function InventoryService:Init(context)
	self.Context = context
	self.ProfileService = context.Services.ProfileServiceWrapper
end

function InventoryService:GetData(player)
	local profile = self.ProfileService:GetProfile(player)
	return profile and profile.Data
end

function InventoryService:AddItem(player, item)
	local data = self:GetData(player)
	if not data then
		return nil
	end
	item.UniqueId = item.UniqueId or HttpService:GenerateGUID(false)
	item.CreatedAt = item.CreatedAt or os.time()
	table.insert(data.Inventory, item)
	self.ProfileService:MarkDirty(player)
	return item
end

function InventoryService:FindItem(player, uniqueId)
	local data = self:GetData(player)
	if not data or #data.Inventory == 0 then
		return nil
	end
	if uniqueId == nil or uniqueId == "" then
		return data.Inventory[1], 1
	end
	for index, item in ipairs(data.Inventory) do
		if item.UniqueId == uniqueId then
			return item, index
		end
	end
	return nil
end

function InventoryService:RemoveItem(player, uniqueId)
	local data = self:GetData(player)
	if not data then
		return nil
	end
	local item, index = self:FindItem(player, uniqueId)
	if not item or not index then
		return nil
	end
	table.remove(data.Inventory, index)
	self.ProfileService:MarkDirty(player)
	return item
end

function InventoryService:AddDisplayed(player, record)
	local data = self:GetData(player)
	if not data then
		return nil
	end
	record.WorldId = record.WorldId or HttpService:GenerateGUID(false)
	record.DisplayedAt = record.DisplayedAt or os.time()
	table.insert(data.DisplayedSnacks, record)
	self.ProfileService:MarkDirty(player)
	return record
end

function InventoryService:ClearDisplayed(player)
	local data = self:GetData(player)
	if data then
		data.DisplayedSnacks = {}
		self.ProfileService:MarkDirty(player)
	end
end

return InventoryService
