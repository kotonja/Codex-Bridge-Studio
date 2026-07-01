local ProximityPromptService = game:GetService("ProximityPromptService")

local PromptController = {}

function PromptController:Init(player, notificationController)
	self.Player = player
	self.NotificationController = notificationController
	self.Button = nil
	task.defer(function()
		local gui = player:WaitForChild("PlayerGui"):FindFirstChild("MainUI")
		self.Button = gui and gui:FindFirstChild("MobileActionButton", true)
	end)
	ProximityPromptService.PromptShown:Connect(function(prompt)
		self:UpdateButton(prompt.ActionText)
	end)
	ProximityPromptService.PromptHidden:Connect(function()
		self:UpdateButton("Find an action")
	end)
end

function PromptController:UpdateButton(text)
	if not self.Button or not self.Button.Parent then
		local gui = self.Player:FindFirstChild("PlayerGui") and self.Player.PlayerGui:FindFirstChild("MainUI")
		self.Button = gui and gui:FindFirstChild("MobileActionButton", true)
	end
	if self.Button then
		self.Button.Text = tostring(text or "Find an action")
	end
end

return PromptController
