local TweenService = game:GetService("TweenService")

local NotificationController = {}

function NotificationController:Init(player)
	self.Player = player
	self.Messages = {}
	self.Container = nil
end

function NotificationController:SetContainer(container)
	self.Container = container
end

function NotificationController:Show(message, kind)
	if not self.Container then
		warn("[FEED THE VOID] Notification UI not ready:", message)
		return
	end
	local label = Instance.new("TextLabel")
	label.Name = "Notice"
	label.BackgroundTransparency = 0.08
	label.BackgroundColor3 = kind == "error" and Color3.fromRGB(95, 35, 48) or Color3.fromRGB(26, 19, 38)
	label.BorderSizePixel = 0
	label.TextColor3 = kind == "success" and Color3.fromRGB(170, 255, 190) or Color3.fromRGB(244, 236, 255)
	label.Font = Enum.Font.GothamBold
	label.TextScaled = true
	label.TextWrapped = true
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.Size = UDim2.fromScale(1, 0.3)
	label.Text = "  " .. tostring(message)
	label.Parent = self.Container
	table.insert(self.Messages, label)
	while #self.Messages > 3 do
		local old = table.remove(self.Messages, 1)
		if old then
			old:Destroy()
		end
	end
	task.delay(4.5, function()
		if label.Parent then
			local tween = TweenService:Create(label, TweenInfo.new(0.25), { TextTransparency = 1, BackgroundTransparency = 1 })
			tween:Play()
			tween.Completed:Wait()
			label:Destroy()
		end
	end)
end

return NotificationController
