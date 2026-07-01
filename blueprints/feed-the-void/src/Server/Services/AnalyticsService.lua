local AnalyticsService = {}

function AnalyticsService:Init(context)
	self.Context = context
	self.Config = context.Config
end

function AnalyticsService:Track(player, eventName, data)
	if self.Config and self.Config.DebugMode then
		print(("[FEED THE VOID][Analytics] %s %s"):format(player and player.Name or "server", tostring(eventName)), data or "")
	end
end

return AnalyticsService
