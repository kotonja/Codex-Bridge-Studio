local VisitRewardService = {}

function VisitRewardService:Init(context)
	self.Context = context
	self.ProfileService = context.Services.ProfileServiceWrapper
	self.EconomyService = context.Services.EconomyService
end

function VisitRewardService:MaybeGrant(player)
	local profile = self.ProfileService:GetProfile(player)
	if not profile then
		return
	end
	local hints = {
		"Welcome to FEED THE VOID!",
		"Buy or plant a snack seed on your plates.",
		"Harvest snacks when they finish growing.",
		"Sell snacks, display them, or feed them to the Void.",
		"Displayed snacks attract Voidmites. Cleanse them for rewards!",
	}
	if (profile.Data.TutorialStep or 1) <= 1 then
		for index, message in ipairs(hints) do
			task.delay((index - 1) * 3, function()
				if player.Parent then
					self.EconomyService:Notify(player, message, "tutorial")
				end
			end)
		end
		profile.Data.TutorialStep = 2
		self.ProfileService:MarkDirty(player)
	end
end

return VisitRewardService
